const admin = require('./adminHandlers');
const adminHandlers = require('./adminHandlers');
const commands = require('./commands');
const Trades = require('./trades');
const messages = require('./messageHandlers');
const payments = require('./paymentHandlers');
const commandHandlers = require('./commandHandlers');
const messageHandlers = require('./messageHandlers');
const paymentHandlers = require('./paymentHandlers');

module.exports = {
    admin,
    Trades,
    commands,
    messages,
    payments,
    adminHandlers,
    commandHandlers,
    messageHandlers,
    paymentHandlers
};
