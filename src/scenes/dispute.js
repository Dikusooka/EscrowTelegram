const { Scenes } = require('telegraf');
const Deal = require('../models/deal');

const dispute = new Scenes.WizardScene(
    'DISPUTE',
    // Step 1: Enter deal ID
    async (ctx) => {
        await ctx.reply('Please enter the Deal ID for the disputed transaction:');
        return ctx.wizard.next();
    },
    // Step 2: Describe issue
    async (ctx) => {
        const dealId = ctx.message.text;
        const deal = await Deal.findOne({ dealId });
        
        if (!deal) {
            await ctx.reply('Deal not found. Please check the ID and try again.');
            return ctx.scene.leave();
        }
        
        ctx.wizard.state.dealId = dealId;
        await ctx.reply('Please describe the issue you are experiencing:');
        return ctx.wizard.next();
    },
    // Step 3: Submit dispute
    async (ctx) => {
        const description = ctx.message.text;
        try {
            await Deal.findOneAndUpdate(
                { dealId: ctx.wizard.state.dealId },
                { 
                    status: 'DISPUTED',
                    disputeDescription: description,
                    disputedBy: ctx.from.id.toString()
                }
            );
            await ctx.reply('Dispute submitted successfully. An admin will review your case shortly.');
        } catch (error) {
            await ctx.reply('Failed to submit dispute. Please try again.');
        }
        return ctx.scene.leave();
    }
);

module.exports = dispute;
