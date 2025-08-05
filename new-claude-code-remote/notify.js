#!/usr/bin/env node

/**
 * Claude Code Remote Notification Script
 * This script is called by Claude Code hooks to send notifications
 */

require('dotenv').config();
const Notifier = require('./src/notifier');
const NotifyUtils = require('./notify-utils');
const { execSync } = require('child_process');

class NotificationScript {
    constructor() {
        this.notifier = new Notifier();
    }

    /**
     * Scan tmux buffer to get the most recent user question
     * @param {string} sessionName - Tmux session name
     * @returns {string} The most recent user question
     */
    getRecentQuestion(sessionName = 'claude-session') {
        try {
            // First, try to capture the entire pane content to search for prompts
            // Using -S - captures from the beginning of the history
            const fullBuffer = execSync(`tmux capture-pane -t ${sessionName} -p -S -`, {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
            });

            // Find all lines that start with "> " (user prompts)
            const lines = fullBuffer.split('\n');
            const promptIndices = [];
            
            lines.forEach((line, index) => {
                if (line.startsWith('> ') && line.length > 2) {
                    promptIndices.push(index);
                }
            });

            if (promptIndices.length === 0) {
                // Fallback: try last 500 lines if full buffer fails
                const recentBuffer = execSync(`tmux capture-pane -t ${sessionName} -p -S -500`, {
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'ignore']
                });
                return this.extractRecentQuestion(recentBuffer);
            }

            // Get the last prompt index
            const lastPromptIndex = promptIndices[promptIndices.length - 1];
            
            // Extract the full question (including multi-line)
            let fullQuestion = lines[lastPromptIndex].substring(2).trim();
            let j = lastPromptIndex + 1;
            
            // Continue collecting lines until we hit Claude's response or another prompt
            while (j < lines.length) {
                const nextLine = lines[j];
                
                // Stop if we hit Claude's response markers or another prompt
                if (nextLine.startsWith('⏺') || 
                    nextLine.startsWith('╭') || 
                    nextLine.startsWith('│') ||
                    nextLine.startsWith('> ') ||
                    nextLine.includes('Assistant:') ||
                    nextLine.includes('Human:')) {
                    break;
                }
                
                // Add non-empty lines to the question
                if (nextLine.trim().length > 0) {
                    fullQuestion += ' ' + nextLine.trim();
                }
                
                j++;
            }
            
            return fullQuestion.trim();
        } catch (error) {
            console.error(`Failed to get tmux buffer for session ${sessionName}:`, error.message);
            
            // Last resort: use grep to find prompts
            try {
                const grepResult = execSync(
                    `tmux capture-pane -t ${sessionName} -p -S - | grep -E "^> " | tail -1`,
                    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
                );
                
                if (grepResult && grepResult.startsWith('> ')) {
                    return grepResult.substring(2).trim();
                }
            } catch (grepError) {
                console.error('Grep fallback also failed:', grepError.message);
            }
            
            return '';
        }
    }

    /**
     * Extract the most recent user question from text
     * @param {string} text - Text from tmux buffer
     * @returns {string} The most recent user question
     */
    extractRecentQuestion(text) {
        const lines = text.split('\n');
        
        // Look for the LAST user input (line starting with "> " followed by content)
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            
            // Detect user input (line starting with "> " followed by content)
            if (line.startsWith('> ') && line.length > 2) {
                const question = line.substring(2).trim();
                
                // If it's a multi-line question, collect all lines
                let fullQuestion = question;
                let j = i + 1;
                
                // Continue collecting lines until we hit a response or empty line
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    
                    // Stop if we hit Claude's response or empty line
                    if (nextLine.startsWith('⏺') || nextLine === '' || 
                        nextLine.startsWith('╭') || nextLine.startsWith('│')) {
                        break;
                    }
                    
                    // Add to question if it's not a system line
                    if (nextLine.length > 0 && !nextLine.startsWith('[') && !nextLine.startsWith('$')) {
                        fullQuestion += ' ' + nextLine;
                    }
                    
                    j++;
                }
                
                return fullQuestion.trim();
            }
        }
        
        return '';
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];
        const message = args.slice(1).join(' ');

        try {
            await this.notifier.initialize();

            if (!this.notifier.initialized) {
                console.error('No notification channels available');
                process.exit(1);
            }

            const metadata = this.notifier.getMetadata();

            switch (command) {
                case 'completed':
                    await this.handleCompleted(message, metadata);
                    break;
                case 'decision':
                    await this.handleDecision(message, metadata);
                    break;
                case 'pretool':
                    await this.handlePreToolUse(message, metadata);
                    break;
                case 'custom':
                    await this.handleCustom(message, metadata);
                    break;
                case 'userprompt':
                    await this.handleUserPrompt(message, metadata);
                    break;
                case 'notify':
                    await this.handleNotify(message, metadata);
                    break;
                default:
                    console.error(`Unknown command: ${command}`);
                    console.log('Available commands: completed, decision, pretool, custom');
                    process.exit(1);
            }
        } catch (error) {
            console.error('Notification error:', error.message);
            process.exit(1);
        }
    }

    async handleCompleted(summary, metadata) {
        // Get comprehensive context using the utility
        const context = NotifyUtils.getNotificationContext(metadata.tmuxSession);
        
        console.log(`📝 Recent question found: "${(context.userPrompt || '').substring(0, 50)}..."`);
        console.log(`📋 Last response: "${(context.lastResponse || '').substring(0, 50)}..."`);
        
        // If no summary provided, create one with the recent question
        if (!summary) {
            const projectName = metadata.projectName || 'Unknown Project';
            const tmuxSession = metadata.tmuxSession || 'claude-session';
            
            if (context.userPrompt) {
                summary = `✅ Task completed in project "${projectName}" (TMUX: ${tmuxSession})`;
            } else {
                summary = `✅ Task completed in project "${projectName}" (TMUX: ${tmuxSession})`;
            }
        }

        // Add rich context to summary
        if (context.userPrompt) {
            summary += `\n\n📝 Your Question:\n${context.userPrompt}`;
        }
        
        if (context.lastResponse) {
            summary += `\n\n⏺ Claude's Actions:\n${context.lastResponse}`;
        }

        // Add conversation context to metadata
        const enhancedMetadata = {
            ...metadata,
            recentQuestion: context.userPrompt,
            lastResponse: context.lastResponse,
            notificationContext: context
        };

        const success = await this.notifier.sendCompletionNotification(summary, enhancedMetadata);
        console.log('Completion summary:\n', summary);
        if (success) {
            console.log('Completion notification sent successfully');
        } else {
            console.error('Failed to send completion notification');
            process.exit(1);
        }
    }

    async handleDecision(message, metadata) {
        // Get comprehensive context using the utility
        const context = NotifyUtils.getNotificationContext(metadata.tmuxSession);
        
        console.log(`📝 Recent question found: "${(context.userPrompt || '').substring(0, 50)}..."`);
        
        // If no message provided, create a simple default one with project info
        if (!message) {
            const projectName = metadata.projectName || 'Unknown Project';
            const tmuxSession = metadata.tmuxSession || 'claude-session';
            message = `❓ Claude needs input in "${projectName}" (TMUX: ${tmuxSession})`;
        }
        
        // Add context to message
        if (context.userPrompt) {
            message += `\n\n📝 Your Question:\n${context.userPrompt}`;
        }
        
        if (context.currentActivity) {
            const lastLines = context.currentActivity.split('\n').slice(-5).join('\n');
            message += `\n\n🖥️ Current Status:\n\`\`\`\n${lastLines}\n\`\`\``;
        }

        // Add conversation context to metadata
        const enhancedMetadata = {
            ...metadata,
            recentQuestion: context.userPrompt,
            notificationContext: context
        };

        const success = await this.notifier.sendDecisionNotification(message, enhancedMetadata);
        if (success) {
            console.log('Decision notification sent successfully');
        } else {
            console.error('Failed to send decision notification');
            process.exit(1);
        }
    }

    async handlePreToolUse(message, metadata) {
        // If no message provided, create a default one with project info
        if (!message) {
            const projectName = metadata.projectName || 'Unknown Project';
            const tmuxSession = metadata.tmuxSession || 'claude-session';
            message = `Claude Code is about to use a tool in project "${projectName}" (TMUX: ${tmuxSession}). This may take some time.`;
        }

        // --- Begin TMUX pane snippet logic ---
        const { execSync } = require('child_process');
        const path = require('path');
        const fs = require('fs');

        function getActivePaneId(session) {
            try {
                const out = execSync(
                    `tmux list-panes -t ${session} -F '#{session_name}:#{window_index}.#{pane_index} #{pane_active}'`,
                    { stdio: ['ignore', 'pipe', 'ignore'] }
                ).toString();
                const line = out.split('\n').find(l => l.trim().endsWith('1'));
                return line ? line.split(/\s+/)[0] : null;
            } catch {
                return null;
            }
        }

        function capturePaneTail(paneId, lines = 80) {
            try {
                const raw = execSync(
                    `tmux capture-pane -p -t ${paneId} -S -${lines}`,
                    { stdio: ['ignore', 'pipe', 'ignore'] }
                ).toString();
                return raw.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, ''); // remove ANSI
            } catch {
                return '';
            }
        }

        function extractConfirmSnippet(text) {
            const tail = text.trim().split('\n').slice(-20);
            const idx = tail.findIndex(l =>
                /(y\/N|Y\/n|\(y\/N\)|\?\s*$|continue\?|confirm|Are you sure)/i.test(l)
            );
            if (idx >= 0) return tail.slice(Math.max(0, idx - 3)).join('\n');
            return tail.join('\n');
        }

        const session = metadata.tmuxSession || 'claude-session';
        const paneId = getActivePaneId(session);
        let snippet = '';
        if (paneId) {
            const paneText = capturePaneTail(paneId, 120);
            snippet = extractConfirmSnippet(paneText);
        }
        // --- End TMUX pane snippet logic ---

        const notification = {
            type: 'Tool Usage Started',
            message: message,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            },
            snippet: snippet
        };

        // Simple formatting for notification
        const { type, metadata: meta, snippet: snip } = notification;

        let fullMessage = `🛠️ ${type}: ${message}`;

        if (snip) {
            fullMessage += `\n\n📋 Context:\n\`\`\`\n${snip}\n\`\`\``;
        }

        const success = await this.notifier.sendNotification({
            ...notification,
            message: fullMessage
        });
        if (success) {
            console.log('PreToolUse notification sent successfully');
        } else {
            console.error('Failed to send PreToolUse notification');
            process.exit(1);
        }
    }

    async handleCustom(message, metadata) {
        if (!message) {
            console.error('Message is required for custom command');
            process.exit(1);
        }

        const notification = {
            type: 'Custom Notification',
            message: message,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            }
        };

        const success = await this.notifier.sendNotification(notification);
        if (success) {
            console.log('Custom notification sent successfully');
        } else {
            console.error('Failed to send custom notification');
            process.exit(1);
        }
    }

    async handleUserPrompt(message, metadata) {
        const { execSync } = require('child_process');

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        function getActivePaneId(session) {
            try {
                const out = execSync(
                    `tmux list-panes -t ${session} -F '#{session_name}:#{window_index}.#{pane_index} #{pane_active}'`,
                    { stdio: ['ignore', 'pipe', 'ignore'] }
                ).toString();
                const line = out.split('\n').find(l => l.trim().endsWith('1'));
                return line ? line.split(/\s+/)[0] : null;
            } catch {
                return null;
            }
        }

        function capturePaneTail(paneId, lines = 80) {
            try {
                const raw = execSync(
                    `tmux capture-pane -p -t ${paneId} -S -${lines}`,
                    { stdio: ['ignore', 'pipe', 'ignore'] }
                ).toString();
                return raw.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
            } catch {
                return '';
            }
        }

        function extractConfirmSnippet(text) {
            const tail = text.trim().split('\n').slice(-20);
            const idx = tail.findIndex(l =>
                /(y\/N|Y\/n|\(y\/N\)|\?\s*$|continue\?|confirm|Are you sure)/i.test(l)
            );
            if (idx >= 0) return tail.slice(Math.max(0, idx - 3)).join('\n');
            return tail.join('\n');
        }

        const session = metadata.tmuxSession || 'claude-session';
        const paneId = getActivePaneId(session);
        let snippet = '';

        if (paneId) {
            await sleep(1000);
            const paneText = capturePaneTail(paneId, 100);
            snippet = extractConfirmSnippet(paneText);
        }

        const fullMessage = `⚠️ Claude needs confirmation in "${metadata.projectName}" (TMUX: ${metadata.tmuxSession})

\`\`\`
${snippet}
\`\`\``;

        const success = await this.notifier.sendNotification({
            type: 'Prompt Confirmation',
            message: fullMessage,
            metadata
        });

        if (success) {
            console.log('UserPrompt notification sent');
        } else {
            console.error('Failed to send UserPrompt notification');
            process.exit(1);
        }
    }

    async handleNotify(message, metadata) {
        const projectName = metadata.projectName || 'Unknown Project';
        const tmuxSession = metadata.tmuxSession || 'claude-session';
        const cwd = metadata.cwd || 'unknown';

        // Capture tmux buffer content for context
        const { execSync } = require('child_process');
        let tmuxContext = '';
        
        try {
            // Capture last 30 lines of tmux buffer
            const buffer = execSync(`tmux capture-pane -t ${tmuxSession} -p -S -30`, {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore']
            });
            
            if (buffer) {
                // Clean up the buffer and get the last meaningful lines
                const lines = buffer.split('\n').filter(line => line.trim());
                tmuxContext = lines.slice(-20).join('\n');
            }
        } catch (error) {
            console.error(`Failed to capture tmux buffer: ${error.message}`);
        }

        let summary = message || `📣 Notification from "${projectName}" (TMUX: ${tmuxSession})`;
        
        // Add tmux context to the message if available
        if (tmuxContext) {
            summary += `\n\n📋 Recent Activity:\n\`\`\`\n${tmuxContext}\n\`\`\``;
        }

        // Also try to get the recent question like other handlers
        const recentQuestion = this.getRecentQuestion(metadata.tmuxSession);
        
        // Add conversation context to metadata
        const enhancedMetadata = {
            ...metadata,
            recentQuestion: recentQuestion,
            tmuxContext: tmuxContext
        };

        const success = await this.notifier.sendNotification({
            type: 'General Notification',
            message: summary,
            metadata: enhancedMetadata
        });

        if (success) {
            console.log('General notification sent successfully');
        } else {
            console.error('Failed to send general notification');
            process.exit(1);
        }
    }
}

// Run the script
const script = new NotificationScript();
script.run().catch(error => {
    console.error('Script error:', error.message);
    process.exit(1);
});