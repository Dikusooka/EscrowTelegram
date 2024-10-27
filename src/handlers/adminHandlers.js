const { ADMIN_IDS } = require('../config/config');

const adminHandlers = {
    async handleStats(ctx) {
        if (!ADMIN_IDS.includes(ctx.from.id.toString())) {
            return ctx.reply('Unauthorized access');
        }
        // Add admin statistics logic
    },
    
    async handleBan(ctx) {
        if (!ADMIN_IDS.includes(ctx.from.id.toString())) {
            return ctx.reply('Unauthorized access');
        }
        // Add user ban logic
    }
};

module.exports = adminHandlers;
