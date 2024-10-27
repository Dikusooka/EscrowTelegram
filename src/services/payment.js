const { Markup } = require('telegraf');
const Trade = require('../models/trade');
const btcpayService = require('../services/btcpay');

async function initiatePayment(ctx, trade) {
  try {
    const invoice = await btcpayService.createInvoice(trade.amount, {
      tradeId: trade.tradeId,
      buyerId: trade.buyer.toString(),
      sellerId: trade.seller.toString(),
      botUsername: ctx.botInfo.username
    });

    // Update trade with BTCPay invoice details
    trade.btcpayInvoiceId = invoice.id;
    trade.paymentUrl = invoice.checkoutLink;
    await trade.save();

    const message = `Payment invoice created!\n\n`
      + `Amount: $${trade.amount}\n`
      + `Trade ID: ${trade.tradeId}\n\n`
      + `Click the button below to make payment:`;

    const keyboard = Markup.inlineKeyboard([
      Markup.button.url('Pay Now', invoice.checkoutLink),
      Markup.button.callback('Check Payment Status', `check_payment_${trade.tradeId}`)
    ]);

    await ctx.reply(message, keyboard);
  } catch (error) {
    console.error('Payment initiation error:', error);
    await ctx.reply('Sorry, there was an error creating the payment invoice.');
  }
}

async function checkPaymentStatus(ctx) {
  try {
    const tradeId = ctx.callbackQuery.data.split('_')[2];
    const trade = await Trade.findOne({ tradeId });

    if (!trade || !trade.btcpayInvoiceId) {
      return await ctx.reply('Trade not found or payment not initiated.');
    }

    const invoice = await btcpayService.getInvoice(trade.btcpayInvoiceId);
    
    let message;
    switch (invoice.status) {
      case 'New':
      case 'Unpaid':
        message = 'Payment not received yet. Please complete the payment.';
        break;
      case 'Processing':
        message = 'Payment is being processed. Please wait.';
        break;
      case 'Settled':
        trade.status = 'paid';
        await trade.save();
        message = 'Payment confirmed! The seller will be notified.';
        // Notify seller
        await ctx.telegram.sendMessage(trade.seller.telegramId,
          `Payment received for trade ${trade.tradeId}!`);
        break;
      case 'Invalid':
        message = 'Payment invalid. Please contact support.';
        break;
      default:
        message = 'Unknown payment status. Please contact support.';
    }

    await ctx.reply(message);
  } catch (error) {
    console.error('Payment status check error:', error);
    await ctx.reply('Sorry, there was an error checking the payment status.');
  }
}

// webhook handler for BTCPay callbacks
async function handleBTCPayWebhook(req, res) {
  try {
    const { invoiceId, status } = req.body;
    
    const trade = await Trade.findOne({ btcpayInvoiceId: invoiceId });
    if (!trade) {
      return res.status(404).send('Trade not found');
    }

    if (status === 'Settled' && trade.status !== 'paid') {
      trade.status = 'paid';
      await trade.save();
      
      // Notify both parties
      const bot = req.app.get('bot');
      await bot.telegram.sendMessage(trade.buyer.telegramId,
        `Payment confirmed for trade ${trade.tradeId}!`);
      await bot.telegram.sendMessage(trade.seller.telegramId,
        `Payment received for trade ${trade.tradeId}!`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('BTCPay webhook error:', error);
    res.status(500).send('Internal server error');
  }
}

module.exports = {
  initiatePayment,
  checkPaymentStatus,
  handleBTCPayWebhook
};
