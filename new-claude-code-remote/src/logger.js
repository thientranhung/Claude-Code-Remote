const pino = require('pino');

class Logger {
    constructor(name = 'ClaudeCodeRemote') {
        this.logger = pino({
            name,
            level: process.env.LOG_LEVEL || 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname'
                }
            }
        });
    }

    info(message, ...args) {
        this.logger.info(message, ...args);
    }

    error(message, ...args) {
        this.logger.error(message, ...args);
    }

    warn(message, ...args) {
        this.logger.warn(message, ...args);
    }

    debug(message, ...args) {
        this.logger.debug(message, ...args);
    }
}

module.exports = Logger; 