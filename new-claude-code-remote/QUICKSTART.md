# Quick Start Guide

## Cài đặt nhanh

### 1. Setup dự án
```bash
cd new-claude-code-remote
npm run setup
```

### 2. Cấu hình thông báo
```bash
# Chỉnh sửa file .env với thông tin email/telegram của bạn
nano .env
```

### 3. Test hệ thống
```bash
npm test
```

### 4. Cấu hình Claude Code
```bash
npm run configure
```

### 5. Khởi động Claude Code
```bash
npm run start-claude
```

## Cấu hình .env

### Email (Gmail)
```env
EMAIL_ENABLED=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_TO=your-notification-email@gmail.com
```

### Telegram
```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### TMUX Session
```env
TMUX_SESSION_NAME=claude-session
```

## Sử dụng

### Test thủ công
```bash
# Thông báo hoàn thành
node notify.js completed "Task completed successfully"

# Thông báo cần quyết định
node notify.js decision "Need your input"
```

### Kiểm tra cấu hình
```bash
npm run configure:show
```

## Troubleshooting

### Email không gửi được
- Kiểm tra App Password cho Gmail
- Đảm bảo 2FA đã bật
- Kiểm tra firewall

### Telegram không gửi được
- Kiểm tra bot token
- Kiểm tra chat ID
- Đảm bảo bot đã start

### Claude Code không khởi động được
- Đảm bảo đã cài đặt Claude Code mới nhất
- Sử dụng lệnh `claude` thay vì `claude-code`

### Claude Code hooks không hoạt động
- Chạy `npm run configure` để cấu hình
- Đảm bảo Claude Code chạy trong tmux
- Kiểm tra đường dẫn trong settings.json 