const formatTradeDetails = (trade) => {
  return `Trade ID: ${trade.tradeId}\n`
    + `Amount: $${trade.amount}\n`
    + `Status: ${trade.status}\n`
    + `Description: ${trade.description}\n`
    + `Created: ${trade.createdAt.toLocaleDateString()}`;
};

const formatError = (error) => {
  if (process.env.NODE_ENV === 'development') {
    return `Error: ${error.message}\n${error.stack}`;
  }
  return 'An error occurred. Please try again later.';
};

module.exports = {
  formatTradeDetails,
  formatError
};
