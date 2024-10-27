const { Markup } = require('telegraf');
const Deal = require('../models/deal');
const User = require('../models/user');
const config = require('../config');
const { generateDealId } = require('../utils/helpers');

const commandHandlers = {
    async startHandler(ctx) {
        const userId = ctx.from.id.toString();
        const username = ctx.from.username;

        try {
            // Create or update user
            await User.findOneAndUpdate(
                { userId },
                { userId, username },
                { upsert: true }
            );

            const welcomeMessage = `
🤝 Welcome to Escrow Service Bot!

I help facilitate secure transactions between buyers and sellers.

Available commands:
/start - Start the bot
/newdeal - Create a new escrow deal
/mydeals - View your active deals
/support - Contact support
/feedback - Leave feedback
/help - Get help and information

Our escrow fee is ${config.ESCROW_FEE * 100}%
`;

            return ctx.reply(welcomeMessage, {
                parse_mode: 'HTML',
                ...Markup.keyboard([
                    ['💰 New Deal', '📊 My Deals'],
                    ['ℹ️ Help', '📞 Support']
                ]).resize()
            });
        } catch (error) {
            console.error('Start handler error:', error);
            return ctx.reply('Sorry, something went wrong. Please try again.');
        }
    },

    async newDealHandler(ctx) {
        try {
            ctx.scene.enter('create_deal');
        } catch (error) {
            console.error('New deal handler error:', error);
            ctx.reply('Sorry, there was an error creating your deal. Please try again.');
        }
    },

    async myDealsHandler(ctx) {
        const userId = ctx.from.id.toString();

        try {
            const deals = await Deal.find({
                $or: [{ buyer: userId }, { seller: userId }]
            }).sort({ createdAt: -1 });

            if (!deals.length) {
                return ctx.reply('You have no active deals.');
            }

            let message = '🔖 Your Deals:\n\n';
            deals.forEach((deal, index) => {
                message += `Deal #${deal.dealId}\n`;
                message += `Amount: $${deal.amount}\n`;
                message += `Status: ${deal.status}\n`;
                message += `Role: ${deal.buyer === userId ? 'Buyer' : 'Seller'}\n\n`;
            });

            return ctx.reply(message);
        } catch (error) {
            console.error('My deals handler error:', error);
            return ctx.reply('Sorry, there was an error fetching your deals.');
        }
    }
};

module.exports = commandHandlers;
