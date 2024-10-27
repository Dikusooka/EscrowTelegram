const User = require('../models/user');
const Trade = require('../models/trade');

// Start command handler
async function handleStart(ctx) {
    try {
        const telegramId = ctx.from.id.toString();
        const username = ctx.from.username;

        let user = await User.findOne({ telegramId });

        if (!user) {
            user = new User({
                telegramId,
                username,
                isAdmin: telegramId === process.env.ADMIN_ID
            });
            await user.save();
        }

        const welcomeMessage = `Welcome to the Escrow Service Bot! 🤝\n\n`
            + `I'll help you make secure trades with other users.\n`
            + `Choose an option to get started:`;

        await ctx.reply(welcomeMessage, {
            reply_markup: {
                keyboard: [
                    ['📝 New Trade', '👀 My Trades'],
                    ['🔍 Check Trade Status', '⚠️ Open Dispute'],
                    ['ℹ️ Help', '📊 Statistics']
                ],
                resize_keyboard: true
            }
        });
    } catch (error) {
        console.error('Start command error:', error);
        await ctx.reply('Sorry, there was an error. Please try again.');
    }
}

// Help command handler
async function handleHelp(ctx) {
    const helpMessage = `🤖 Escrow Bot Commands:\n\n`
        + `📝 New Trade - Start a new trade\n`
        + `👀 My Trades - View your trades\n`
        + `🔍 Check Trade Status - Check status by ID\n`
        + `⚠️ Open Dispute - Open dispute for trade\n`
        + `📊 Statistics - View your statistics\n\n`
        + `Need more help? Contact @${process.env.ADMIN_USERNAME}`;

    await ctx.reply(helpMessage);
}

// Statistics handler
async function handleStats(ctx) {
    try {
        const userId = ctx.state.user._id;
        const [buyerTrades, sellerTrades] = await Promise.all([
            Trade.find({ buyer: userId }),
            Trade.find({ seller: userId })
        ]);

        const stats = {
            totalTrades: buyerTrades.length + sellerTrades.length,
            asBuyer: buyerTrades.length,
            asSeller: sellerTrades.length,
            completedTrades: [...buyerTrades, ...sellerTrades]
                .filter(t => t.status === 'completed').length,
            totalVolume: [...buyerTrades, ...sellerTrades]
                .reduce((sum, t) => sum + t.amount, 0)
        };

        const message = `📊 Your Statistics:\n\n`
            + `Total Trades: ${stats.totalTrades}\n`
            + `As Buyer: ${stats.asBuyer}\n`
            + `As Seller: ${stats.asSeller}\n`
            + `Completed: ${stats.completedTrades}\n`
            + `Total Volume: $${stats.totalVolume.toFixed(2)}`;

        await ctx.reply(message);
    } catch (error) {
        console.error('Statistics error:', error);
        await ctx.reply('Sorry, there was an error fetching your statistics.');
    }
}

// Admin statistics handler
async function handleAdminStats(ctx) {
    if (!ctx.state.user.isAdmin) {
        return ctx.reply('This command is only available to administrators.');
    }

    try {
        const [totalUsers, totalTrades, activeTrades] = await Promise.all([
            User.countDocuments(),
            Trade.countDocuments(),
            Trade.countDocuments({ status: { $in: ['pending', 'paid'] } })
        ]);

        const message = `👑 Admin Statistics:\n\n`
            + `Total Users: ${totalUsers}\n`
            + `Total Trades: ${totalTrades}\n`
            + `Active Trades: ${activeTrades}`;

        await ctx.reply(message);
    } catch (error) {
        console.error('Admin statistics error:', error);
        await ctx.reply('Sorry, there was an error fetching admin statistics.');
    }
}

module.exports = {
    handleStart,
    handleHelp,
    handleStats,
    handleAdminStats
};
