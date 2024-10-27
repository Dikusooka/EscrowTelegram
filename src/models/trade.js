const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    seller: {
        type: String,
        required: true
    },
    buyer: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: [
            'INITIATED',
            'PENDING',
            'INVOICE_CREATED',
            'PENDING_PAYMENT',
            'PAID',
            'PAYMENT_CONFIRMED',
            'PAYMENT_COMPLETED',
            'PAYMENT_FAILED',
            'COMPLETED',
            'DISPUTED',
            'DISPUTE_RESOLVED',
            'CANCELLED',
            'REFUNDED',
            'EXPIRED'
        ],
        default: 'INITIATED'
    },
    btcpayInvoiceId: {
        type: String,
        sparse: true
    },
    paymentUrl: {
        type: String,
        sparse: true
    },
    btcAmount: {
        type: Number,
        sparse: true
    },
    paymentMethod: {
        type: String,
        sparse: true
    },
    exchangeRate: {
        type: Number,
        sparse: true
    },
    expirationTime: {
        type: Date,
        sparse: true
    },
    fee: {
        type: Number,
        default: function() {
            return this.amount * 0.01; // 1% fee
        }
    },
    disputeReason: {
        type: String,
        sparse: true
    },
    disputeWinner: {
        type: String,
        enum: ['buyer', 'seller'],
        sparse: true
    },
    disputeResolution: {
        type: String,
        sparse: true
    },
    cancellationReason: {
        type: String,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    disputedAt: {
        type: Date,
        sparse: true
    },
    resolvedAt: {
        type: Date,
        sparse: true
    },
    cancelledAt: {
        type: Date,
        sparse: true
    }
});

// Add instance methods
tradeSchema.methods = {
    getTotalAmount() {
        return this.amount + this.fee;
    },

    isExpired() {
        return this.expirationTime && new Date() > this.expirationTime;
    },

    canBeCancelled() {
        return ['INITIATED', 'PENDING', 'INVOICE_CREATED', 'PENDING_PAYMENT'].includes(this.status);
    },

    canBeDisputed() {
        return ['PAID', 'PAYMENT_CONFIRMED', 'PAYMENT_COMPLETED'].includes(this.status);
    },

    isCompleted() {
        return this.status === 'COMPLETED';
    },

    isActive() {
        return ['INITIATED', 'PENDING', 'INVOICE_CREATED', 'PENDING_PAYMENT', 'PAID', 'PAYMENT_CONFIRMED'].includes(this.status);
    },

    getDetails() {
        return {
            id: this._id,
            seller: this.seller,
            buyer: this.buyer,
            amount: this.amount,
            fee: this.fee,
            totalAmount: this.getTotalAmount(),
            description: this.description,
            status: this.status,
            btcpayInvoiceId: this.btcpayInvoiceId,
            paymentUrl: this.paymentUrl,
            btcAmount: this.btcAmount,
            paymentMethod: this.paymentMethod,
            exchangeRate: this.exchangeRate,
            expirationTime: this.expirationTime,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            disputeReason: this.disputeReason,
            disputeWinner: this.disputeWinner,
            disputeResolution: this.disputeResolution,
            cancellationReason: this.cancellationReason,
            disputedAt: this.disputedAt,
            resolvedAt: this.resolvedAt,
            cancelledAt: this.cancelledAt
        };
    }
};

// Add pre-save middleware to update the updatedAt timestamp
tradeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Create and export the model
const Trade = mongoose.model('Trade', tradeSchema);
module.exports = Trade;
