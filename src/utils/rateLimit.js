import logger from './logger.js';

class RateLimiter {
    constructor() {
        this.userLimits = new Map();
        this.globalLimit = {
            count: 0,
            resetTime: Date.now() + 60000
        };
        this.verificationQueue = [];
        this.isProcessingQueue = false;
        
        this.config = {
            maxPerUser: 3,
            userWindow: 60000,
            maxGlobal: 20,
            globalWindow: 60000,
            queueDelay: 1000,
            maxQueueSize: 100
        };
    }

    checkUserLimit(userId) {
        const now = Date.now();
        const userLimit = this.userLimits.get(userId);

        if (userLimit && now > userLimit.resetTime) {
            this.userLimits.delete(userId);
            return { limited: false, remainingTime: 0 };
        }

        if (userLimit && userLimit.count >= this.config.maxPerUser) {
            const remainingTime = Math.ceil((userLimit.resetTime - now) / 1000);
            return { limited: true, remainingTime };
        }

        return { limited: false, remainingTime: 0 };
    }

    checkGlobalLimit() {
        const now = Date.now();

        if (now > this.globalLimit.resetTime) {
            this.globalLimit.count = 0;
            this.globalLimit.resetTime = now + this.config.globalWindow;
            return { limited: false, remainingTime: 0 };
        }

        if (this.globalLimit.count >= this.config.maxGlobal) {
            const remainingTime = Math.ceil((this.globalLimit.resetTime - now) / 1000);
            logger.warn(`⚠️ Global rate limit (${this.globalLimit.count}/${this.config.maxGlobal})`);
            return { limited: true, remainingTime };
        }

        return { limited: false, remainingTime: 0 };
    }

    incrementLimit(userId) {
        const now = Date.now();
        const userLimit = this.userLimits.get(userId);

        if (!userLimit || now > userLimit.resetTime) {
            this.userLimits.set(userId, {
                count: 1,
                resetTime: now + this.config.userWindow
            });
        } else {
            userLimit.count++;
        }

        this.globalLimit.count++;
    }

    addToQueue(verificationFunc, context) {
        if (this.verificationQueue.length >= this.config.maxQueueSize) {
            logger.warn('⚠️ Queue full');
            return false;
        }

        this.verificationQueue.push({ func: verificationFunc, context });

        if (!this.isProcessingQueue) {
            this.processQueue();
        }

        return true;
    }

    async processQueue() {
        if (this.isProcessingQueue) return;
        
        this.isProcessingQueue = true;

        while (this.verificationQueue.length > 0) {
            const item = this.verificationQueue.shift();
            
            try {
                await item.func(item.context);
            } catch (error) {
                logger.error('Queue processing error:', error);
            }

            if (this.verificationQueue.length > 0) {
                await this.sleep(this.config.queueDelay);
            }
        }

        this.isProcessingQueue = false;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getQueueStatus() {
        return {
            size: this.verificationQueue.length,
            isProcessing: this.isProcessingQueue,
            maxSize: this.config.maxQueueSize
        };
    }

    clearLimits() {
        this.userLimits.clear();
        this.globalLimit.count = 0;
        this.globalLimit.resetTime = Date.now() + this.config.globalWindow;
    }

    getStats() {
        return {
            activeUsers: this.userLimits.size,
            globalCount: this.globalLimit.count,
            queueSize: this.verificationQueue.length,
            config: this.config
        };
    }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter;