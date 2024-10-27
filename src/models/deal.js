const mongoose = require('mongoose');
const { Schema } = mongoose;

const dealSchema = new Schema({
  seller: {
    type: String,  // Telegram ID of the seller
    required: true,
    ref: 'User'
  },
  buyer: {
    type: String,  // Telegram ID of the buyer
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['CREATED', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
    default: 'CREATED'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'RELEASED', 'REFUNDED'],
    default: 'PENDING'
  },
  escrowFee: {
    type: Number,
    default: 0
  },
  paymentId: {
    type: String,
    sparse: true
  },
  disputeReason: {
    type: String
  },
  disputeResolution: {
    type: String
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
dealSchema.index({ seller: 1 });
dealSchema.index({ buyer: 1 });
dealSchema.index({ status: 1 });
dealSchema.index({ paymentStatus: 1 });
dealSchema.index({ createdAt: 1 });

// Instance methods
dealSchema.methods.canBeCancelled = function() {
  return ['CREATED', 'FUNDED'].includes(this.status) && this.paymentStatus !== 'RELEASED';
};

dealSchema.methods.canBeDisputed = function() {
  return this.status === 'IN_PROGRESS';
};

dealSchema.methods.isActive = function() {
  return !['COMPLETED', 'CANCELLED'].includes(this.status);
};

// Static methods
dealSchema.statics.findActiveDealsBySeller = function(sellerId) {
  return this.find({
    seller: sellerId,
    status: { $nin: ['COMPLETED', 'CANCELLED'] }
  });
};

dealSchema.statics.findActiveDealsByBuyer = function(buyerId) {
  return this.find({
    buyer: buyerId,
    status: { $nin: ['COMPLETED', 'CANCELLED'] }
  });
};

// Pre-save middleware
dealSchema.pre('save', function(next) {
  if (this.isNew) {
    // Set expiration date for new deals (e.g., 24 hours)
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Don't overwrite if model exists
module.exports = mongoose.models.Deal || mongoose.model('Deal', dealSchema);
