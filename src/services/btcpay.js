// src/services/btcpay.js
const axios = require('axios');
const { BTCPAY_HOST, BTCPAY_API_KEY } = require('../config/config');

class BTCPayService {
    constructor() {
        this.api = axios.create({
            baseURL: BTCPAY_HOST,
            headers: {
                'Authorization': `token ${BTCPAY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async createInvoice(amount, currency = 'USD', orderId = null) {
        try {
            const response = await this.api.post('/api/v1/stores/current/invoices', {
                amount,
                currency,
                orderId,
                checkout: {
                    speedPolicy: 'HighSpeed',
                    paymentMethods: ['BTC', 'BTC-LightningNetwork'],
                    expirationMinutes: 60,
                    monitoringMinutes: 60,
                    redirectURL: `${BTCPAY_HOST}/payment/success`,
                    defaultPaymentMethod: 'BTC'
                }
            });
            return response.data;
        } catch (error) {
            console.error('BTCPay create invoice error:', error.response?.data || error.message);
            throw new Error('Failed to create payment invoice');
        }
    }

    async getInvoice(invoiceId) {
        try {
            const response = await this.api.get(`/api/v1/stores/current/invoices/${invoiceId}`);
            return response.data;
        } catch (error) {
            console.error('BTCPay get invoice error:', error.response?.data || error.message);
            throw new Error('Failed to fetch invoice');
        }
    }

    async createPayout(destination, amount, currency = 'USD', description = '') {
        try {
            const response = await this.api.post('/api/v1/stores/current/payouts', {
                destination,
                amount,
                currency,
                description,
                paymentMethod: 'BTC'
            });
            return response.data;
        } catch (error) {
            console.error('BTCPay create payout error:', error.response?.data || error.message);
            throw new Error('Failed to create payout');
        }
    }

    async createRefund(invoiceId, amount, currency = 'USD') {
        try {
            const response = await this.api.post(`/api/v1/stores/current/invoices/${invoiceId}/refund`, {
                amount,
                currency,
                paymentMethod: 'BTC'
            });
            return response.data;
        } catch (error) {
            console.error('BTCPay create refund error:', error.response?.data || error.message);
            throw new Error('Failed to create refund');
        }
    }

    async getPaymentMethods() {
        try {
            const response = await this.api.get('/api/v1/stores/current/payment-methods');
            return response.data;
        } catch (error) {
            console.error('BTCPay get payment methods error:', error.response?.data || error.message);
            throw new Error('Failed to fetch payment methods');
        }
    }

    async getWalletBalance() {
        try {
            const response = await this.api.get('/api/v1/stores/current/payment-methods/BTC/wallet');
            return response.data;
        } catch (error) {
            console.error('BTCPay get wallet balance error:', error.response?.data || error.message);
            throw new Error('Failed to fetch wallet balance');
        }
    }

    // Webhook handler for payment notifications
    async handleWebhook(payload) {
        const { invoiceId, eventType } = payload;
        
        try {
            const invoice = await this.getInvoice(invoiceId);
            
            switch (eventType) {
                case 'InvoicePaymentSettled':
                    // Payment confirmed
                    return {
                        status: 'confirmed',
                        invoice
                    };
                    
                case 'InvoiceExpired':
                    // Invoice expired
                    return {
                        status: 'expired',
                        invoice
                    };
                    
                case 'InvoiceInvalid':
                    // Invoice became invalid
                    return {
                        status: 'invalid',
                        invoice
                    };
                    
                default:
                    return {
                        status: 'unknown',
                        invoice
                    };
            }
        } catch (error) {
            console.error('BTCPay webhook handling error:', error);
            throw new Error('Failed to process payment notification');
        }
    }
}

// Create and export a singleton instance
const btcPayService = new BTCPayService();
module.exports = btcPayService;

// Usage example:
/*
const payment = await btcPayService.createInvoice(100, 'USD', 'order123');
console.log('Payment URL:', payment.checkoutLink);

// Later, check payment status
const status = await btcPayService.getInvoice(payment.id);
console.log('Payment status:', status.status);
*/
