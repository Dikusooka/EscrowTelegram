class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
        this.max = options.max || 20; // 20 requests per window default
        this.requests = new Map(); // Store user requests
    }

    cleanup() {
        const now = Date.now();
        for (const [userId, data] of this.requests.entries()) {
            if (now - data.windowStart > this.windowMs) {
                this.requests.delete(userId);
            }
        }
    }

    middleware() {
        return async (ctx, next) => {
            const userId = ctx.from?.id;
            if (!userId) return next();

            const now = Date.now();
            this.cleanup();

            const userData = this.requests.get(userId) || {
                windowStart: now,
                count: 0
            };

            // Reset window if enough time has passed
            if (now - userData.windowStart > this.windowMs) {
                userData.windowStart = now;
                userData.count = 0;
            }

            // Check rate limit
            if (userData.count >= this.max) {
                const timeLeft = Math.ceil((userData.windowStart + this.windowMs - now) / 1000);
                await ctx.reply(`Please wait ${timeLeft} seconds before sending more requests.`);
                return;
            }

            // Update request count
            userData.count++;
            this.requests.set(userId, userData);

            return next();
        };
    }
}

// Create limiter instance with default settings
const rateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 20 // 20 requests per minute
});

module.exports = rateLimiter.middleware();
