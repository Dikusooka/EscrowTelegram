const validateTradeAmount = (amount) => {
  const parsedAmount = parseFloat(amount);
  return !isNaN(parsedAmount) && parsedAmount > 0;
};

const validateUsername = (username) => {
  return /^[a-zA-Z0-9_]{5,32}$/.test(username);
};

const validateTradeId = (tradeId) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(tradeId);
};

module.exports = {
  validateTradeAmount,
  validateUsername,
  validateTradeId
};
