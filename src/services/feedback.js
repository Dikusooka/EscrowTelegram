const User = require('../models/user');

const feedbackService = {
    async leaveFeedback(fromUserId, toUserId, rating, comment) {
        try {
            const toUser = await User.findOne({ telegramId: toUserId });
            if (!toUser) {
                throw new Error('User not found');
            }

            // Update user's rating
            const newRating = ((toUser.rating * toUser.totalDeals) + rating) / (toUser.totalDeals + 1);
            
            await User.findOneAndUpdate(
                { telegramId: toUserId },
                { 
                    $inc: { totalDeals: 1 },
                    $set: { rating: newRating }
                }
            );

            return true;
        } catch (error) {
            console.error('Feedback error:', error);
            return false;
        }
    },

    async getFeedback(userId) {
        try {
            const user = await User.findOne({ telegramId: userId });
            if (!user) {
                throw new Error('User not found');
            }

            return {
                rating: user.rating,
                totalDeals: user.totalDeals
            };
        } catch (error) {
            console.error('Get feedback error:', error);
            return null;
        }
    }
};

module.exports = feedbackService;
