const Logger = require('./logger');
const EmailNotifier = require('./email');
const TelegramNotifier = require('./telegram');

class Notifier {
    constructor() {
        this.logger = new Logger('Notifier');
        this.emailNotifier = new EmailNotifier();
        this.telegramNotifier = new TelegramNotifier();
        this.initialized = false;
    }

    async initialize() {
        this.logger.info('Initializing notification system...');
        
        const emailInitialized = await this.emailNotifier.initialize();
        const telegramInitialized = await this.telegramNotifier.initialize();

        if (emailInitialized || telegramInitialized) {
            this.initialized = true;
            this.logger.info('Notification system initialized successfully');
        } else {
            this.logger.warn('No notification channels initialized');
        }

        return this.initialized;
    }

    async sendNotification(notification) {
        if (!this.initialized) {
            this.logger.warn('Notifier not initialized');
            return false;
        }

        const results = [];

        // Send email notification
        if (this.emailNotifier.initialized) {
            const emailResult = await this.emailNotifier.sendNotification(notification);
            results.push({ channel: 'email', success: emailResult });
        }

        // Send telegram notification
        if (this.telegramNotifier.initialized) {
            const telegramResult = await this.telegramNotifier.sendNotification(notification);
            results.push({ channel: 'telegram', success: telegramResult });
        }

        const successCount = results.filter(r => r.success).length;
        this.logger.info(`Notification sent to ${successCount}/${results.length} channels`);

        return successCount > 0;
    }

    async sendCompletionNotification(summary, metadata = {}) {
        const notification = {
            type: 'Task Completed',
            message: summary,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            }
        };

        return await this.sendNotification(notification);
    }

    async sendDecisionNotification(message, metadata = {}) {
        const notification = {
            type: 'Decision Required',
            message: message,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            }
        };

        return await this.sendNotification(notification);
    }

    getMetadata() {
        const metadata = {};

        // Get current directory as project name
        const path = require('path');
        const currentDir = process.cwd();
        metadata.projectName = path.basename(currentDir);

        // Get TMUX session name
        metadata.tmuxSession = process.env.TMUX_SESSION_NAME || 'claude-session';

        // Get current folder path
        metadata.folder = currentDir;

        return metadata;
    }
}

module.exports = Notifier; 