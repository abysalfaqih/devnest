const logger = {
    info: (message) => {
        console.log(`[INFO] ${message}`);
    },
    error: (message, error = null) => {
        console.error(`[ERROR] ${message}`);
        if (error) console.error(error);
    },
    success: (message) => {
        console.log(`[SUCCESS] ${message}`);
    },
    warn: (message) => {
        console.warn(`[WARN] ${message}`);
    }
};

export default logger;