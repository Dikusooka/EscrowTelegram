const { processPayment } = require('../services/payment');

const paymentHandlers = {
    async handlePayment(ctx) {
        // Handle incoming payments
        await processPayment(ctx);
    },

    async handleRefund(ctx) {
        // Handle refund requests
    }
};

module.exports = paymentHandlers;
