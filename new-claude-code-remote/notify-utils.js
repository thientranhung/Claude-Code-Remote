#!/usr/bin/env node

/**
 * Utility functions for notification system
 */

const { execSync } = require('child_process');

class NotifyUtils {
    /**
     * Get the most recent user prompt using efficient grep method
     * @param {string} sessionName - Tmux session name
     * @returns {object} { prompt: string, context: string }
     */
    static getRecentPromptEfficient(sessionName = 'claude-session') {
        try {
            // Get all prompts with line numbers
            const prompts = execSync(
                `tmux capture-pane -t ${sessionName} -p -S - | grep -n "^> " | tail -5`,
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
            ).trim();

            if (!prompts) {
                return { prompt: '', context: '' };
            }

            // Parse the last prompt line number
            const lastPromptLine = prompts.split('\n').pop();
            const lineNumber = parseInt(lastPromptLine.split(':')[0]);
            
            // Get the prompt and surrounding context
            const contextLines = 10; // Lines after prompt to capture
            const fullCapture = execSync(
                `tmux capture-pane -t ${sessionName} -p -S - | tail -n +${lineNumber} | head -n ${contextLines + 1}`,
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
            );

            const lines = fullCapture.split('\n');
            let prompt = lines[0].substring(2).trim(); // Remove "> " prefix
            
            // Collect multi-line prompt
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                // Stop at Claude's response markers
                if (line.startsWith('⏺') || line.startsWith('╭') || 
                    line.startsWith('│') || line.includes('Assistant:')) {
                    break;
                }
                if (line.trim()) {
                    prompt += ' ' + line.trim();
                }
            }

            // Get last 20 lines of context before the prompt
            const contextBefore = execSync(
                `tmux capture-pane -t ${sessionName} -p -S - | head -n $((${lineNumber} - 1)) | tail -n 20`,
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
            );

            return {
                prompt: prompt.trim(),
                context: contextBefore.trim()
            };
        } catch (error) {
            console.error('Failed to get prompt efficiently:', error.message);
            return { prompt: '', context: '' };
        }
    }

    /**
     * Get Claude's last response summary
     * @param {string} sessionName - Tmux session name
     * @returns {string} Summary of last response
     */
    static getLastResponseSummary(sessionName = 'claude-session') {
        try {
            // Look for Claude's response markers
            const responseMarkers = execSync(
                `tmux capture-pane -t ${sessionName} -p -S - | grep -n "^⏺" | tail -10`,
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
            ).trim();

            if (!responseMarkers) {
                return '';
            }

            // Get the last few response lines
            const lines = responseMarkers.split('\n');
            const summary = lines.slice(-3).map(line => {
                const content = line.split(':').slice(1).join(':').trim();
                return content.substring(2); // Remove "⏺ " prefix
            }).join(' | ');

            return summary;
        } catch (error) {
            return '';
        }
    }

    /**
     * Get notification content with full context
     * @param {string} sessionName - Tmux session name
     * @returns {object} Full notification context
     */
    static getNotificationContext(sessionName = 'claude-session') {
        const { prompt, context } = this.getRecentPromptEfficient(sessionName);
        const responseSummary = this.getLastResponseSummary(sessionName);
        
        // Get current activity (last 10 lines)
        let currentActivity = '';
        try {
            currentActivity = execSync(
                `tmux capture-pane -t ${sessionName} -p -S -10`,
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
            ).trim();
        } catch (error) {
            // Ignore errors
        }

        return {
            userPrompt: prompt,
            priorContext: context,
            lastResponse: responseSummary,
            currentActivity: currentActivity,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = NotifyUtils;

// CLI usage
if (require.main === module) {
    const sessionName = process.argv[2] || 'claude-session';
    const context = NotifyUtils.getNotificationContext(sessionName);
    
    console.log('📝 User Prompt:', context.userPrompt);
    console.log('📋 Last Response:', context.lastResponse);
    console.log('🖥️ Current Activity:', context.currentActivity.split('\n').slice(-3).join(' | '));
}