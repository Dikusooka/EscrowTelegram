const mongoose = require('mongoose');
const BTCPayClient = require('btcpay');
const { Trade } = require('./models/trade');

class TradeService {
    constructor(btcpayConfig) {
        this.btcpayClient = new BTCPayClient({
            host: btcpayConfig.host,
            token: btcpayConfig.token,
            port: btcpayConfig.port || 443,
            merchant: btcpayConfig.merchant
        });
    }

    // Create a new trade and generate BTCPay invoice
    async createTrade(sellerId, buyerId, amount, description) {
        try {
            // Create BTCPay invoice
            const invoice = await this.btcpayClient.createInvoice({
                price: amount,
                currency: 'USD', // or your preferred currency
                orderId: `ESCROW-${Date.now()}`,
                itemDesc: description,
                notificationURL: process.env.BTCPAY_NOTIFICATION_URL,
                redirectURL: process.env.BTCPAY_REDIRECT_URL
            });

            // Create trade record
            const trade = new Trade({
                seller: sellerId,
                buyer: buyerId,
                amount: amount,
                description: description,
                status: 'PENDING',
                btcpayInvoiceId: invoice.id,
                paymentUrl: invoice.url,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await trade.save();
            return {
                trade,
                paymentUrl: invoice.url,
                invoiceId: invoice.id
            };
        } catch (error) {
            console.error('Error creating trade:', error);
            throw error;
        }
    }

    // Check payment status from BTCPay
    async checkPaymentStatus(tradeId) {
        try {
            const trade = await Trade.findById(tradeId);
            if (!trade) {
                throw new Error('Trade not found');
            }

            const invoice = await this.btcpayClient.getInvoice(trade.btcpayInvoiceId);
            return {
                trade,
                btcPayStatus: invoice.status,
                paidAmount: invoice.btcPaid
            };
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw error;
        }
    }

    // Handle BTCPay webhook notification
    async handlePaymentNotification(invoiceId, status) {
        try {
            const trade = await Trade.findOne({ btcpayInvoiceId: invoiceId });
            if (!trade) {
                throw new Error('Trade not found for invoice');
            }

            switch (status) {
                case 'paid':
                    await this.updateTradeStatus(trade._id, 'PAID');
                    break;
                case 'confirmed':
                    await this.updateTradeStatus(trade._id, 'PAYMENT_CONFIRMED');
                    break;
                case 'complete':
                    await this.updateTradeStatus(trade._id, 'PAYMENT_COMPLETED');
                    break;
                case 'expired':
                case 'invalid':
                    await this.updateTradeStatus(trade._id, 'PAYMENT_FAILED');
                    break;
            }

            return trade;
        } catch (error) {
            console.error('Error handling payment notification:', error);
            throw error;
        }
    }

    // Release funds to seller
    async releaseFunds(tradeId) {
        try {
            const trade = await Trade.findById(tradeId);
            if (!trade) {
                throw new Error('Trade not found');
            }

            // Here you would implement the logic to send the funds to the seller's address
            // This could involve creating a BTCPay payout or using another method
            // For security, this should include proper verification and authentication

            await this.updateTradeStatus(tradeId, 'COMPLETED');
            return trade;
        } catch (error) {
            console.error('Error releasing funds:', error);
            throw error;
        }
    }

    // Get trade by ID
    async getTradeById(tradeId) {
        try {
            const trade = await Trade.findById(tradeId).exec();
            if (!trade) {
                throw new Error('Trade not found');
            }
            return trade;
        } catch (error) {
            console.error('Error fetching trade:', error);
            throw error;
        }
    }

    // Get all trades for a user
    async getUserTrades(userId) {
        try {
            const trades = await Trade.find({
                $or: [{ seller: userId }, { buyer: userId }]
            }).sort({ createdAt: -1 });
            return trades;
        } catch (error) {
            console.error('Error fetching user trades:', error);
            throw error;
        }
    }

    // Update trade status
    async updateTradeStatus(tradeId, newStatus) {
        try {
            const trade = await Trade.findByIdAndUpdate(
                tradeId,
                {
                    status: newStatus,
                    updatedAt: new Date()
                },
                { new: true }
            );
            return trade;
        } catch (error) {
            console.error('Error updating trade status:', error);
            throw error;
        }
    }

    // Cancel trade
    async cancelTrade(tradeId, reason) {
        try {
            const trade = await Trade.findById(tradeId);
            if (!trade) {
                throw new Error('Trade not found');
            }

            // If payment was made, initiate refund through BTCPay
            if (trade.status === 'PAID' || trade.status === 'PAYMENT_CONFIRMED') {
                // Implement refund logic here
                // This would depend on your BTCPay setup and requirements
            }

            const updatedTrade = await Trade.findByIdAndUpdate(
                tradeId,
                {
                    status: 'CANCELLED',
                    cancellationReason: reason,
                    cancelledAt: new Date(),
                    updatedAt: new Date()
                },
                { new: true }
            );
            return updatedTrade;
        } catch (error) {
            console.error('Error canceling trade:', error);
            throw error;
        }
    }

    // Initiate dispute
    async disputeTrade(tradeId, reason) {
        try {
            const trade = await Trade.findByIdAndUpdate(
                tradeId,
                {
                    status: 'DISPUTED',
                    disputeReason: reason,
                    disputedAt: new Date(),
                    updatedAt: new Date()
                },
                { new: true }
            );
            return trade;
        } catch (error) {
            console.error('Error disputing trade:', error);
            throw error;
        }
    }

    // Resolve dispute
    async resolveDispute(tradeId, resolution, winningParty) {
        try {
            const trade = await Trade.findByIdAndUpdate(
                tradeId,
                {
                    status: 'DISPUTE_RESOLVED',
                    disputeResolution: resolution,
                    disputeWinner: winningParty,
                    resolvedAt: new Date(),
                    updatedAt: new Date()
                },
                { new: true }
            );

            // If the buyer wins, initiate refund
            if (winningParty === 'buyer') {
                // Implement refund logic here
            }
            // If the seller wins, release funds
            else if (winningParty === 'seller') {
                await this.releaseFunds(tradeId);
            }

            return trade;
        } catch (error) {
            console.error('Error resolving dispute:', error);
            throw error;
        }
    }
}

module.exports = TradeService;
