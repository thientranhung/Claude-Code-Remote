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

    /**
     * Send completion notification (Hook Stop - completed)
     * @param {Object} notification - Notification object with recentQuestion in metadata
     * @returns {boolean} Success status
     */
    async sendCompletionNotification(notification) {
        if (!this.initialized) {
            this.logger.warn('Telegram notifier not initialized');
            return false;
        }

        try {
            const message = this.formatCompletionMessage(notification);
            const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML'
            });

            if (response.data.ok) {
                this.logger.info('Telegram completion notification sent successfully');
                return true;
            } else {
                this.logger.error('Failed to send Telegram completion notification:', response.data);
                return false;
            }
        } catch (error) {
            this.logger.error('Failed to send Telegram completion notification:', error.message);
            return false;
        }
    }

    /**
     * Send decision notification (Hook Stop - waiting)
     * @param {Object} notification - Notification object
     * @returns {boolean} Success status
     */
    async sendDecisionNotification(notification) {
        if (!this.initialized) {
            this.logger.warn('Telegram notifier not initialized');
            return false;
        }

        try {
            const message = this.formatDecisionMessage(notification);
            const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML'
            });

            if (response.data.ok) {
                this.logger.info('Telegram decision notification sent successfully');
                return true;
            } else {
                this.logger.error('Failed to send Telegram decision notification:', response.data);
                return false;
            }
        } catch (error) {
            this.logger.error('Failed to send Telegram decision notification:', error.message);
            return false;
        }
    }

    /**
     * Send custom notification (general purpose)
     * @param {Object} notification - Notification object
     * @returns {boolean} Success status
     */
    async sendCustomNotification(notification) {
        if (!this.initialized) {
            this.logger.warn('Telegram notifier not initialized');
            return false;
        }

        try {
            const message = this.formatCustomMessage(notification);
            const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML'
            });

            if (response.data.ok) {
                this.logger.info('Telegram custom notification sent successfully');
                return true;
            } else {
                this.logger.error('Failed to send Telegram custom notification:', JSON.stringify(response.data));
                return false;
            }
        } catch (error) {
            this.logger.error('Failed to send Telegram custom notification:', error.message);
            if (error.response && error.response.data) {
                this.logger.error('Telegram API error:', JSON.stringify(error.response.data));
            }
            return false;
        }
    }

    /**
     * Legacy method for backward compatibility
     * @param {Object} notification - Notification object
     * @returns {boolean} Success status
     */
    async sendNotification(notification) {
        // Route to appropriate method based on notification type
        if (notification.type === 'Task Completed') {
            return await this.sendCompletionNotification(notification);
        } else if (notification.type === 'Decision Required') {
            return await this.sendDecisionNotification(notification);
        } else {
            return await this.sendCustomNotification(notification);
        }
    }

    /**
     * Format completion notification message
     * @param {Object} notification - Notification object
     * @returns {string} Formatted message
     */
    formatCompletionMessage(notification) {
        const { message, metadata } = notification;
        
        // Check if message already contains the full formatted content from notify.js
        const hasFormattedContent = message.includes('📝 Your Question:') || message.includes('⏺ Claude\'s Actions:');
        
        if (hasFormattedContent) {
            // Message is already fully formatted in notify.js, just add timestamp
            return `${message}\n\n⏰ <i>Sent at ${new Date().toLocaleString()}</i>`;
        }
        
        // Fallback: original formatting for simple messages
        let formattedMessage = `✅ <b>Claude Task Completed</b>\n\n`;
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

    /**
     * Format decision notification message
     * @param {Object} notification - Notification object
     * @returns {string} Formatted message
     */
    formatDecisionMessage(notification) {
        const { message, metadata } = notification;
        
        // Check if message already contains the full formatted content from notify.js
        const hasFormattedContent = message.includes('📝 Your Question:') || message.includes('🖥️ Current Status:');
        
        if (hasFormattedContent) {
            // Message is already fully formatted in notify.js, just add header and timestamp
            return `⏳ <b>Claude Waiting for Input</b>\n\n${message}\n\n⏰ <i>Sent at ${new Date().toLocaleString()}</i>`;
        }
        
        // Fallback: original formatting for simple messages
        let formattedMessage = `⏳ <b>Claude Waiting for Input</b>\n\n`;
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
            
            // Add recent question if available
            if (metadata.recentQuestion && metadata.recentQuestion.trim()) {
                formattedMessage += `\n📝 <b>Your Question:</b>\n`;
                const question = metadata.recentQuestion.length > 200 
                    ? metadata.recentQuestion.substring(0, 197) + '...'
                    : metadata.recentQuestion;
                formattedMessage += `${question}\n`;
            }
        }

        formattedMessage += `\n⏰ <i>Sent at ${new Date().toLocaleString()}</i>`;
        
        return formattedMessage;
    }

    /**
     * Format custom notification message
     * @param {Object} notification - Notification object
     * @returns {string} Formatted message
     */
    formatCustomMessage(notification) {
        const { type, message, metadata } = notification;
        
        // Check if message already contains formatting (backticks for code blocks)
        const hasFormatting = message.includes('```');
        
        if (hasFormatting) {
            // Message is already formatted, convert markdown code blocks to HTML properly
            let formattedMessage = message;
            // Replace opening ``` with <pre>
            formattedMessage = formattedMessage.replace(/```/g, (match, offset, string) => {
                // Count previous occurrences to determine if this is opening or closing
                const previousMatches = string.substring(0, offset).match(/```/g);
                const count = previousMatches ? previousMatches.length : 0;
                return count % 2 === 0 ? '<pre>' : '</pre>';
            });
            
            // Add timestamp at the end
            formattedMessage += `\n\n⏰ <i>Sent at ${new Date().toLocaleString()}</i>`;
            return formattedMessage;
        }
        
        // Original formatting for simple messages
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
            
            // Add tmux context if available
            if (metadata.tmuxContext && metadata.tmuxContext.trim()) {
                formattedMessage += `\n📋 <b>Recent Activity:</b>\n<pre>${metadata.tmuxContext}</pre>\n`;
            }
            
            // Add recent question if available
            if (metadata.recentQuestion && metadata.recentQuestion.trim()) {
                formattedMessage += `\n📝 <b>Your Question:</b>\n`;
                const question = metadata.recentQuestion.length > 200 
                    ? metadata.recentQuestion.substring(0, 200) + '...' 
                    : metadata.recentQuestion;
                formattedMessage += `<i>${question}</i>\n`;
            }
        }

        formattedMessage += `\n⏰ <i>Sent at ${new Date().toLocaleString()}</i>`;
        
        return formattedMessage;
    }
}

module.exports = TelegramNotifier; 