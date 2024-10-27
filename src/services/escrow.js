const { ValidationError } = require('../utils/errors');
const { Deal, User } = require('../models'); // Fixed import path
const { btcPayService } = require('./btcpay');

class EscrowService {
  async createDeal({ amount, description, userId }) {
    try {
      const seller = await User.findByTelegramId(userId);
      if (!seller) {
        throw new ValidationError('Seller not found');
      }

      const deal = new Deal({
        seller: userId,
        amount,
        description,
      });

      await deal.save();
      return deal;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error('Error creating deal:', error);
      throw new Error('Failed to create deal');
    }
  }

  async getDeal(dealId) {
    const deal = await Deal.findById(dealId);
    if (!deal) {
      throw new ValidationError('Deal not found');
    }
    return deal;
  }

  async acceptDeal(dealId, buyerId) {
    const deal = await this.getDeal(dealId);
    
    if (deal.status !== 'CREATED') {
      throw new ValidationError('Deal cannot be accepted in current status');
    }

    if (deal.seller === buyerId) {
      throw new ValidationError('Cannot accept your own deal');
    }

    deal.buyer = buyerId;
    deal.status = 'IN_PROGRESS';
    await deal.save();

    return deal;
  }

  async fundDeal(dealId) {
    const deal = await this.getDeal(dealId);
    
    if (deal.status !== 'CREATED') {
      throw new ValidationError('Deal cannot be funded in current status');
    }

    // Create payment invoice using btcpay service
    const invoice = await btcPayService.createInvoice({
      amount: deal.amount,
      orderId: dealId
    });

    deal.paymentId = invoice.id;
    deal.status = 'FUNDED';
    await deal.save();

    return {
      deal,
      paymentUrl: invoice.checkoutUrl
    };
  }

  async completeDeal(dealId, userId) {
    const deal = await this.getDeal(dealId);
    
    if (deal.status !== 'IN_PROGRESS') {
      throw new ValidationError('Deal cannot be completed in current status');
    }

    if (deal.seller !== userId && deal.buyer !== userId) {
      throw new ValidationError('Not authorized to complete this deal');
    }

    deal.status = 'COMPLETED';
    deal.completedAt = new Date();
    await deal.save();

    return deal;
  }

  async cancelDeal(dealId, userId) {
    const deal = await this.getDeal(dealId);
    
    if (!deal.canBeCancelled()) {
      throw new ValidationError('Deal cannot be cancelled in current status');
    }

    if (deal.seller !== userId) {
      throw new ValidationError('Only seller can cancel the deal');
    }

    deal.status = 'CANCELLED';
    await deal.save();

    return deal;
  }

  async createDispute(dealId, userId, reason) {
    const deal = await this.getDeal(dealId);
    
    if (!deal.canBeDisputed()) {
      throw new ValidationError('Deal cannot be disputed in current status');
    }

    if (deal.seller !== userId && deal.buyer !== userId) {
      throw new ValidationError('Not authorized to dispute this deal');
    }

    deal.status = 'DISPUTED';
    deal.disputeReason = reason;
    await deal.save();

    return deal;
  }
}

module.exports = new EscrowService();
