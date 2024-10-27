const { Scenes } = require('telegraf');
const { escrowService } = require('../services');
const { ValidationError } = require('../utils/errors');
const { validateAmount, validateDescription } = require('../utils/validation');

const createDeal = new Scenes.WizardScene(
  'create-deal',
  async (ctx) => {
    try {
      await ctx.reply('Please enter the deal amount in BTC:');
      ctx.wizard.state.dealData = {};
      return ctx.wizard.next();
    } catch (error) {
      console.error('Error in step 1:', error);
      await ctx.reply('Sorry, something went wrong. Please try again later.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      const amount = ctx.message.text;
      
      try {
        validateAmount(amount);
        ctx.wizard.state.dealData.amount = amount;
      } catch (error) {
        await ctx.reply('Invalid amount. Please enter a valid BTC amount (e.g., 0.001):');
        return;
      }

      await ctx.reply('Please enter a description for the deal:');
      return ctx.wizard.next();
    } catch (error) {
      console.error('Error in step 2:', error);
      await ctx.reply('Sorry, something went wrong. Please try again later.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      const description = ctx.message.text;
      
      try {
        validateDescription(description);
        ctx.wizard.state.dealData.description = description;
      } catch (error) {
        await ctx.reply('Invalid description. Please enter a valid description (5-200 characters):');
        return;
      }

      // Confirm deal details
      const confirmMessage = `Please confirm your deal details:\n\n` +
        `Amount: ${ctx.wizard.state.dealData.amount} BTC\n` +
        `Description: ${ctx.wizard.state.dealData.description}\n\n` +
        `Is this correct? (Yes/No)`;
      
      await ctx.reply(confirmMessage);
      return ctx.wizard.next();
    } catch (error) {
      console.error('Error in step 3:', error);
      await ctx.reply('Sorry, something went wrong. Please try again later.');
      return ctx.scene.leave();
    }
  },
  async (ctx) => {
    try {
      const answer = ctx.message.text.toLowerCase();
      
      if (answer === 'yes') {
        try {
          const deal = await escrowService.createDeal({
            amount: ctx.wizard.state.dealData.amount,
            description: ctx.wizard.state.dealData.description,
            userId: ctx.from.id
          });

          await ctx.reply(`Deal created successfully!\nDeal ID: ${deal.id}`);
        } catch (error) {
          if (error instanceof ValidationError) {
            await ctx.reply(`Error creating deal: ${error.message}`);
          } else {
            console.error('Error creating deal:', error);
            await ctx.reply('Sorry, something went wrong while creating the deal. Please try again later.');
          }
        }
      } else {
        await ctx.reply('Deal creation cancelled. You can start over with /createdeal');
      }
      
      return ctx.scene.leave();
    } catch (error) {
      console.error('Error in step 4:', error);
      await ctx.reply('Sorry, something went wrong. Please try again later.');
      return ctx.scene.leave();
    }
  }
);

// Add middleware to handle interruptions
createDeal.command('cancel', async (ctx) => {
  await ctx.reply('Deal creation cancelled.');
  return ctx.scene.leave();
});

module.exports = createDeal;
