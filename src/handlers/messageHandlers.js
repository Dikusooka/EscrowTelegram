const messageHandlers = {
    async handleText(ctx) {
        // Handle regular text messages
        await ctx.reply('Please use commands to interact with the bot.');
    },

    async handleCallback(ctx) {
        // Handle callback queries
        const data = ctx.callbackQuery.data;
        // Add callback handling logic
    }
};

module.exports = messageHandlers;
