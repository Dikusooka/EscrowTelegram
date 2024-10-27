const User = require('../models/user');

async function authMiddleware(ctx, next) {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id.toString() });
    if (!user) {
      return await ctx.reply('Please start the bot with /start first.');
    }
    ctx.state.user = user;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    await ctx.reply('Authentication error. Please try again.');
  }
}

module.exports = authMiddleware;
