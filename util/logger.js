const pino = require('pino');

const levels = {
    success: 35,
    fail: 45
};

module.exports = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
    customLevels: levels,
    useOnlyCustomLevels: false,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
}, pino.destination({ sync: false }));