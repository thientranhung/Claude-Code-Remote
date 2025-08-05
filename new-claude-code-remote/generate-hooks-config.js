#!/usr/bin/env node

/**
 * Generate claude-hooks.json with correct paths for the current environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HooksConfigGenerator {
    constructor() {
        this.projectPath = process.cwd();
        this.notifyScriptPath = path.join(this.projectPath, 'notify.js');
    }

    /**
     * Detect the Node.js executable path
     * @returns {string} The path to node executable
     */
    getNodePath() {
        try {
            // First try to get node from PATH
            const nodePath = execSync('which node', { encoding: 'utf8' }).trim();
            console.log(`✅ Found node at: ${nodePath}`);
            return nodePath;
        } catch (error) {
            // Fallback to 'node' command if which fails
            console.log('⚠️  Could not find node with "which", using "node" command');
            return 'node';
        }
    }

    /**
     * Generate the hooks configuration
     * @returns {object} The hooks configuration object
     */
    generateConfig() {
        const nodePath = this.getNodePath();
        
        const config = {
            hooks: {
                "Stop": [
                    {
                        "matcher": "*",
                        "hooks": [
                            {
                                "type": "command",
                                "command": `${nodePath} ${this.notifyScriptPath} completed`,
                                "timeout": 5
                            }
                        ]
                    }
                ],
                "SubagentStop": [
                    {
                        "matcher": "*",
                        "hooks": [
                            {
                                "type": "command",
                                "command": `${nodePath} ${this.notifyScriptPath} completed`,
                                "timeout": 5
                            }
                        ]
                    }
                ],
                "Decision": [
                    {
                        "matcher": "*",
                        "hooks": [
                            {
                                "type": "command",
                                "command": `${nodePath} ${this.notifyScriptPath} decision`,
                                "timeout": 5
                            }
                        ]
                    }
                ],
                "UserPromptSubmit": [
                    {
                        "matcher": "*",
                        "hooks": [
                            {
                                "type": "command",
                                "command": `${nodePath} ${this.notifyScriptPath} prompt`,
                                "timeout": 5
                            }
                        ]
                    }
                ]
            }
        };

        // Optionally add PreToolUse if requested
        if (process.argv.includes('--include-pretool')) {
            config.hooks["PreToolUse"] = [
                {
                    "matcher": "*",
                    "hooks": [
                        {
                            "type": "command",
                            "command": `${nodePath} ${this.notifyScriptPath} pretool`,
                            "timeout": 5
                        }
                    ]
                }
            ];
        }

        // Add permissions if requested
        if (process.argv.includes('--with-permissions')) {
            config.permissions = {
                "allow": ["Bash(rm:*)"],
                "deny": []
            };
        }

        return config;
    }

    /**
     * Write the configuration to file
     * @param {string} outputPath - Path to write the config file
     */
    writeConfig(outputPath = 'claude-hooks.json') {
        const config = this.generateConfig();
        const fullPath = path.join(this.projectPath, outputPath);
        
        try {
            fs.writeFileSync(fullPath, JSON.stringify(config, null, 2));
            console.log(`\n✅ Generated ${outputPath} successfully!`);
            console.log(`\n📋 Configuration details:`);
            console.log(`   Project path: ${this.projectPath}`);
            console.log(`   Notify script: ${this.notifyScriptPath}`);
            console.log(`   Output file: ${fullPath}`);
            console.log(`\n🎯 Next steps:`);
            console.log(`   1. Copy this file to your-project/.claude/settings.local.json`);
            console.log(`   2. Or let setup.sh handle it automatically`);
        } catch (error) {
            console.error(`❌ Failed to write config: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Show usage information
     */
    showUsage() {
        console.log(`
📖 Claude Hooks Config Generator

Usage: node generate-hooks-config.js [options] [output-file]

Options:
  --include-pretool    Include PreToolUse hook (warning: may cause spam)
  --with-permissions   Include permissions section
  --help              Show this help message

Examples:
  node generate-hooks-config.js                    # Generate claude-hooks.json
  node generate-hooks-config.js my-hooks.json      # Generate my-hooks.json
  node generate-hooks-config.js --include-pretool  # Include all hooks
  node generate-hooks-config.js --with-permissions # Include permissions
        `);
    }
}

// Main execution
if (require.main === module) {
    const generator = new HooksConfigGenerator();
    
    if (process.argv.includes('--help')) {
        generator.showUsage();
        process.exit(0);
    }
    
    // Get output filename from args (excluding flags)
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    const outputFile = args[0] || 'claude-hooks.json';
    
    generator.writeConfig(outputFile);
}

module.exports = HooksConfigGenerator;