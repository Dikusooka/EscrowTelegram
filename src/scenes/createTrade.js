const { Scenes } = require('telegraf');
const { Markup } = require('telegraf');
const Trade = require('../models/trade');
const { initiatePayment } = require('../handlers/paymentHandlers');
const { v4: uuidv4 } = require('uuid');

const createTradeScene = new Scenes.WizardScene(
  'create_trade',
  // Step 1: Ask for seller's username
  async (ctx) => {
    await ctx.reply('Please enter the seller\'s Telegram username (without @):');
    return ctx.wizard.next();
  },
  // Step 2: Ask for amount
  async (ctx) => {
    const sellerUsername = ctx.message.text;
    const seller = await User.findOne({ username: sellerUsername });
    
    if (!seller) {
      await ctx.reply('Seller not found. Please try again or /cancel');
      return;
    }
    
    ctx.wizard.state.seller = seller;
    await ctx.reply('Enter the trade amount in USD:');
    return ctx.wizard.next();
  },
  // Step 3: Ask for description
  async (ctx) => {
    const amount = parseFloat(ctx.message.text);
    
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Please enter a valid amount or /cancel');
      return;
    }
    
    ctx.wizard.state.amount = amount;
    await ctx.reply('Enter a description for this trade:');
    return ctx.wizard.next();
  },
  // Step 4: Confirm and create trade
  async (ctx) => {
    const description = ctx.message.text;
    const { seller, amount } = ctx.wizard.state;
    
    const confirmMessage = `Please confirm the trade details:\n\n`
      + `Seller: @${seller.username}\n`
      + `Amount: $${amount}\n`
      + `Description: ${description}\n\n`
      + `Is this correct?`;
    
    ctx.wizard.state.description = description;
    
    await ctx.reply(confirmMessage, Markup.inlineKeyboard([
      Markup.button.callback('Confirm', 'confirm_trade'),
      Markup.button.callback('Cancel', 'cancel_trade')
    ]));
    
    return ctx.wizard.next();
  },
  // Step 5: Handle confirmation
  async (ctx) => {
    if (!ctx.callbackQuery) return;
    
    const { data } = ctx.callbackQuery;
    if (data === 'cancel_trade') {
      await ctx.reply('Trade creation cancelled.');
      return ctx.scene.leave();
    }
    
    if (data === 'confirm_trade') {
      try {
        const { seller, amount, description } = ctx.wizard.state;
        const trade = new Trade({
          tradeId: uuidv4(),
          seller: seller._id,
          buyer: ctx.state.user._id,
          amount,
          description
        });
        
        await trade.save();
        
        // Initialize payment
        await initiatePayment(ctx, trade);
        
        await ctx.reply('Trade created successfully!');
        return ctx.scene.leave();
      } catch (error) {
        console.error('Trade creation error:', error);
        await ctx.reply('Error creating trade. Please try again.');
        return ctx.scene.leave();
      }
    }
  }
);

createTradeScene.command('cancel', (ctx) => {
  ctx.reply('Trade creation cancelled.');
  return ctx.scene.leave();
});

module.exports = createTradeScene;
