const { Scenes } = require('telegraf');
const { ADMIN_IDS } = require('../config/config');

const support = new Scenes.WizardScene(
    'SUPPORT',
    // Step 1: Select support category
    async (ctx) => {
        await ctx.reply('Please select your support category:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Payment Issues', callback_data: 'PAYMENT' }],
                    [{ text: 'Technical Problems', callback_data: 'TECHNICAL' }],
                    [{ text: 'General Questions', callback_data: 'GENERAL' }]
                ]
            }
        });
        return ctx.wizard.next();
    },
    // Step 2: Describe issue
    async (ctx) => {
        const category = ctx.callbackQuery.data;
        ctx.wizard.state.category = category;
        await ctx.reply('Please describe your issue in detail:');
        return ctx.wizard.next();
    },
    // Step 3: Submit ticket
    async (ctx) => {
        const description = ctx.message.text;
        const ticketId = Date.now().toString();
        
        // Notify admins
        for (const adminId of ADMIN_IDS) {
            try {
                await ctx.telegram.sendMessage(adminId, `
New Support Ticket #${ticketId}
Category: ${ctx.wizard.state.category}
From: @${ctx.from.username || 'Unknown'}
Issue: ${description}
                `);
            } catch (error) {
                console.error(`Failed to notify admin ${adminId}:`, error);
            }
        }
        
        await ctx.reply(`Your support ticket #${ticketId} has been created. An admin will contact you shortly.`);
        return ctx.scene.leave();
    }
);

module.exports = support;
