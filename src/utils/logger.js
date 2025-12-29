const logger = {
    info: (message) => {
        console.log(`[INFO] [${new Date().toLocaleString()}] ${message}`);
    },
    error: (message, error = null) => {
        console.error(`[ERROR] [${new Date().toLocaleString()}] ${message}`);
        if (error) console.error(error);
    },
    success: (message) => {
        console.log(`[SUCCESS] [${new Date().toLocaleString()}] ${message}`);
    },
    warn: (message) => {
        console.warn(`[WARN] [${new Date().toLocaleString()}] ${message}`);
    }
};

export default logger;