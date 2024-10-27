const crypto = require('crypto');

module.exports = {
    generateDealId() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    },
    
    formatMoney(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
};
