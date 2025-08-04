# Changelog

## [2.0.0] - 2025-01-XX

### 🚀 Major Changes - Session Name System

#### ✨ New Features
- **Simplified Session Management**: Replaced complex token-based system with direct tmux session names
- **Environment Configuration**: Added `TMUX_SESSION_NAME` environment variable for centralized session management
- **Backward Compatibility**: Maintained support for old token format in email notifications

#### 🔧 Technical Improvements
- **Telegram Webhook**: Updated command format from `/cmd <TOKEN> <command>` to `/cmd <tmux_session_name> <command>`
- **LINE Webhook**: Updated command format from `Token <TOKEN> <command>` to `<tmux_session_name> <command>`
- **Email Webhook**: Enhanced to support both old token format and new session name format
- **Controller Injector**: Updated to use `TMUX_SESSION_NAME` environment variable

#### 🛠️ Configuration Changes
- **Required**: Add `TMUX_SESSION_NAME=claude-session` to your `.env` file
- **Optional**: Remove `SESSION_MAP_PATH` from webhook configurations (no longer needed)
- **Migration**: Run `npm run migrate` to automatically configure the new system

#### 📝 Usage Examples
```bash
# Telegram
/cmd claude-session analyze this code

# LINE  
claude-session analyze this code

# Email (reply to notification)
claude-session analyze this code
```

#### 🧪 Testing
- Added `npm run test:session` to test the new session name system
- Added `npm run migrate` to help migrate from old token system

#### 🔒 Security Improvements
- **Reduced Complexity**: Eliminated token expiration and session management overhead
- **Direct Access**: Commands are injected directly into specified tmux sessions
- **Simplified Architecture**: Fewer failure points and easier debugging

### 🐛 Bug Fixes
- Fixed token expiration issues that caused command injection failures
- Resolved session map file corruption problems
- Improved error handling for invalid session names

### 📚 Documentation Updates
- Updated README.md with new configuration requirements
- Added migration guide for existing users
- Updated command format examples for all platforms

---

## [1.x.x] - Previous Versions

### Token-based System (Deprecated)
- Complex 8-character token generation and management
- Session map file for token-to-session mapping
- Token expiration after 24 hours
- Multiple failure points in session management

---

## Migration Guide

### From Token System to Session Name System

1. **Update Environment Variables**:
   ```bash
   # Add to your .env file
   TMUX_SESSION_NAME=claude-session
   ```

2. **Create Tmux Session**:
   ```bash
   tmux new-session -d -s claude-session
   ```

3. **Test New System**:
   ```bash
   npm run test:session
   ```

4. **Update Command Formats**:
   - **Telegram**: `/cmd claude-session your command`
   - **LINE**: `claude-session your command`
   - **Email**: Reply with `claude-session your command`

5. **Optional Cleanup**:
   - Backup `src/data/session-map.json` if needed
   - Remove old token-based session files

### Backward Compatibility
- Email notifications still support old token format for existing users
- Gradual migration path available
- No breaking changes for existing email workflows 