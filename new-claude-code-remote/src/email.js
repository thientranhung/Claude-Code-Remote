const nodemailer = require('nodemailer');
const Logger = require('./logger');

class EmailNotifier {
    constructor() {
        this.logger = new Logger('EmailNotifier');
        this.transporter = null;
        this.initialized = false;
    }

    async initialize() {
        if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
            this.logger.warn('Email notifications are disabled');
            return false;
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            this.logger.error('SMTP credentials not configured');
            return false;
        }

        try {
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            // Verify connection
            await this.transporter.verify();
            this.initialized = true;
            this.logger.info('Email notifier initialized successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize email notifier:', error.message);
            return false;
        }
    }

    async sendNotification(notification) {
        if (!this.initialized) {
            this.logger.warn('Email notifier not initialized');
            return false;
        }

        try {
            const mailOptions = {
                from: `${process.env.EMAIL_FROM_NAME || 'Claude Code Remote'} <${process.env.SMTP_USER}>`,
                to: process.env.EMAIL_TO,
                subject: `Claude Code Notification - ${notification.type}`,
                html: this.formatEmailContent(notification)
            };

            const result = await this.transporter.sendMail(mailOptions);
            this.logger.info('Email notification sent successfully');
            return true;
        } catch (error) {
            this.logger.error('Failed to send email notification:', error.message);
            return false;
        }
    }

    formatEmailContent(notification) {
        const { type, message, metadata } = notification;
        
        let content = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Claude Code Notification</h2>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <h3 style="margin-top: 0; color: #666;">${type}</h3>
                    <p style="margin: 10px 0;"><strong>Message:</strong> ${message}</p>
        `;

        if (metadata) {
            if (metadata.projectName) {
                content += `<p><strong>Project:</strong> ${metadata.projectName}</p>`;
            }
            if (metadata.tmuxSession) {
                content += `<p><strong>TMUX Session:</strong> ${metadata.tmuxSession}</p>`;
            }
            if (metadata.folder) {
                content += `<p><strong>Folder:</strong> ${metadata.folder}</p>`;
            }
        }

        content += `
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    Sent by Claude Code Remote Notification System
                </p>
            </div>
        `;

        return content;
    }
}

module.exports = EmailNotifier; 