const { Telegraf, Scenes, session } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
const { commands, messages, admin, payments } = require('./handlers');
const { authMiddleware, rateLimit } = require('./middlewares');
const { createDeal, disputeScene } = require('./scenes');
const { handleBTCPayWebhook } = require('./handlers/paymentHandlers');
const { User, Trade } = require('./models/');



// Initialize Express app with security middleware
const app = express();
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(require('helmet')()); // Add basic security headers

// Initialize bot with error handling
const bot = new Telegraf(process.env.BOT_TOKEN);

// Separate command handlers into their own files
const { handleStart, handleHelp, handleStats, handleAdminStats } = require('./handlers/commands');
const { handleTradeList, handleTradeStatus, handleTradeCheck } = require('./handlers/trades');

// Register scenes with error boundaries
const stage = new Scenes.Stage([createDeal, disputeScene]);

// Middlewares
bot.use(session());
bot.use(stage.middleware());
bot.use(rateLimit);
bot.use(async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        console.error(`Error processing update ${ctx.update.update_id}:`, error);
        await ctx.reply('An error occurred. Please try again or contact support.');
    }
});

// Make bot instance available to webhook handler
app.set('bot', bot);

// Command handlers with input validation
bot.command('start', handleStart);
bot.hears('📝 New Trade', authMiddleware, ctx => ctx.scene.enter('create-deal'));
bot.hears('👀 My Trades', authMiddleware, handleTradeList);
bot.hears('🔍 Check Trade Status', authMiddleware, handleTradeCheck);
bot.hears('⚠️ Open Dispute', authMiddleware, ctx => ctx.scene.enter('dispute'));
bot.command('help', handleHelp);
bot.hears('📊 Statistics', authMiddleware, handleStats);
bot.command('admin', authMiddleware, handleAdminStats);

// Secure webhook endpoint
app.post('/btcpay-webhook', 
    express.json({ limit: '10kb' }),
    require('./middlewares/validateWebhook'),
    handleBTCPayWebhook
);

// Graceful shutdown handler
async function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    try {
        await bot.stop(signal);
        await mongoose.connection.close();
        console.log('Gracefully shut down bot and database connection');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Connect to MongoDB with retry logic
async function connectDB(retries = 5) {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.DATABASE_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('Connected to MongoDB');
            return true;
        } catch (error) {
            console.error(`Failed to connect to MongoDB (attempt ${i + 1}/${retries}):`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Start servers with proper error handling
async function startServer() {
    try {
        await connectDB();

        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`Express server is running on port ${PORT}`);
        });

        // Set timeouts
        server.timeout = 30000;
        server.keepAliveTimeout = 65000;
        
        await bot.launch();
        console.log('Telegram bot is running');

        // Handle graceful shutdown
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (error) => {
            console.error('Unhandled Rejection:', error);
            gracefulShutdown('UNHANDLED_REJECTION');
        });

    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
}

startServer();
