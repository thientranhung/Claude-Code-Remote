const axios = require('axios');
const Logger = require('./logger');

class TelegramNotifier {
    constructor() {
        this.logger = new Logger('TelegramNotifier');
        this.botToken = null;
        this.chatId = null;
        this.initialized = false;
    }

    async initialize() {
        if (!process.env.TELEGRAM_ENABLED || process.env.TELEGRAM_ENABLED !== 'true') {
            this.logger.warn('Telegram notifications are disabled');
            return false;
        }

        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;

        if (!this.botToken || !this.chatId) {
            this.logger.error('Telegram bot token or chat ID not configured');
            return false;
        }

        try {
            // Test bot connection
            const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getMe`);
            if (response.data.ok) {
                this.initialized = true;
                this.logger.info('Telegram notifier initialized successfully');
                return true;
            } else {
                this.logger.error('Failed to verify Telegram bot');
                return false;
            }
        } catch (error) {
            this.logger.error('Failed to initialize Telegram notifier:', error.message);
            return false;
        }
    }

    async sendNotification(notification) {
        if (!this.initialized) {
            this.logger.warn('Telegram notifier not initialized');
            return false;
        }

        try {
            const message = this.formatTelegramMessage(notification);
            const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML'
            });

            if (response.data.ok) {
                this.logger.info('Telegram notification sent successfully');
                return true;
            } else {
                this.logger.error('Failed to send Telegram notification:', response.data);
                return false;
            }
        } catch (error) {
            this.logger.error('Failed to send Telegram notification:', error.message);
            return false;
        }
    }

    formatTelegramMessage(notification) {
        const { type, message, metadata } = notification;
        
        let formattedMessage = `🤖 <b>Claude Code Notification</b>\n\n`;
        formattedMessage += `📋 <b>Type:</b> ${type}\n`;
        formattedMessage += `💬 <b>Message:</b> ${message}\n`;

        if (metadata) {
            if (metadata.projectName) {
                formattedMessage += `📁 <b>Project:</b> ${metadata.projectName}\n`;
            }
            if (metadata.tmuxSession) {
                formattedMessage += `🖥️ <b>TMUX Session:</b> ${metadata.tmuxSession}\n`;
            }
            if (metadata.folder) {
                formattedMessage += `📂 <b>Folder:</b> ${metadata.folder}\n`;
            }
        }

        formattedMessage += `\n⏰ <i>Sent at ${new Date().toLocaleString()}</i>`;
        
        return formattedMessage;
    }
}

module.exports = TelegramNotifier; 