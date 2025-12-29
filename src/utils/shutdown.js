import logger from './logger.js';
import rateLimiter from './rateLimit.js';

class ShutdownHandler {
    constructor() {
        this.isShuttingDown = false;
        this.client = null;
        this.shutdownTasks = [];
    }

    initialize(client) {
        this.client = client;

        process.on('SIGINT', () => this.shutdown('SIGINT'));
        process.on('SIGTERM', () => this.shutdown('SIGTERM'));
        process.on('SIGUSR2', () => this.shutdown('SIGUSR2'));

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            this.shutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection:', reason);
            this.shutdown('UNHANDLED_REJECTION');
        });
    }

    registerTask(task, name = 'Unknown Task') {
        this.shutdownTasks.push({ task, name });
    }

    async shutdown(signal) {
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;
        logger.warn(`\n🛑 Shutting down (${signal})...`);

        try {
            const queueStatus = rateLimiter.getQueueStatus();
            if (queueStatus.size > 0) {
                logger.info(`⏳ Waiting for ${queueStatus.size} tasks...`);
                await this.waitForQueue(30000);
            }

            if (this.shutdownTasks.length > 0) {
                await this.runCleanupTasks();
            }

            if (this.client) {
                await this.client.destroy();
            }

            rateLimiter.clearLimits();

            logger.success('✓ Shutdown complete');
            process.exit(0);

        } catch (error) {
            logger.error('Shutdown error:', error);
            process.exit(1);
        }
    }

    async waitForQueue(timeout = 30000) {
        const startTime = Date.now();
        
        while (rateLimiter.getQueueStatus().size > 0) {
            if (Date.now() - startTime > timeout) {
                logger.warn('⚠️ Queue timeout');
                break;
            }
            await this.sleep(500);
        }
    }

    async runCleanupTasks() {
        for (const { task, name } of this.shutdownTasks) {
            try {
                await Promise.race([
                    task(),
                    this.timeout(5000, `Task ${name} timeout`)
                ]);
            } catch (error) {
                logger.error(`Cleanup error (${name}):`, error);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    timeout(ms, message) {
        return new Promise((_, reject) => 
            setTimeout(() => reject(new Error(message)), ms)
        );
    }

    getStatus() {
        return {
            isShuttingDown: this.isShuttingDown,
            registeredTasks: this.shutdownTasks.length
        };
    }
}

export const shutdownHandler = new ShutdownHandler();
export default shutdownHandler;