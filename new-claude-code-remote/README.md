# New Claude Code Remote

Hệ thống thông báo đơn giản cho Claude Code với hỗ trợ Email và Telegram.

## Tính năng

- ✅ Thông báo khi hoàn thành task
- ✅ Thông báo khi cần quyết định
- ✅ Hỗ trợ Email (SMTP)
- ✅ Hỗ trợ Telegram Bot
- ✅ Thông tin chi tiết: tên project, tmux session, folder
- ✅ Đơn giản và dễ cấu hình

## Cài đặt

### 1. Clone và cài đặt dependencies

```bash
cd new-claude-code-remote
npm install
```

### 2. Cấu hình môi trường

```bash
# Copy file cấu hình mẫu
cp env.example .env

# Chỉnh sửa file .env
nano .env
```

### 3. Cấu hình Email (Tùy chọn)

Thêm vào file `.env`:

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=Claude Code Remote
EMAIL_TO=your-notification-email@gmail.com
```

**Lưu ý cho Gmail:** Sử dụng [App Passwords](https://myaccount.google.com/security), không phải mật khẩu thường.

### 4. Cấu hình Telegram (Tùy chọn)

#### Tạo Telegram Bot:
1. Chat với [@BotFather](https://t.me/BotFather)
2. Tạo bot mới: `/newbot`
3. Lấy bot token

#### Lấy Chat ID:
1. Chat với bot của bạn
2. Truy cập: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Tìm `chat.id` trong response

#### Cấu hình trong `.env`:

```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_CHAT_ID=your-chat-id-here
TELEGRAM_WEBHOOK_PORT=3001
TELEGRAM_FORCE_IPV4=false
```

### 5. Cấu hình TMUX Session

```env
TMUX_SESSION_NAME=claude-session
```

## Cấu hình Claude Code

### 1. Tạo file cấu hình Claude Code

#### Cách 1: Sử dụng script tự động (Khuyến nghị)
```bash
npm run configure
```

#### Cách 2: Thủ công
Tạo file `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /path/to/new-claude-code-remote/notify.js completed",
        "timeout": 5
      }]
    }],
    "SubagentStop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /path/to/new-claude-code-remote/notify.js completed",
        "timeout": 5
      }]
    }],
    "Decision": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /path/to/new-claude-code-remote/notify.js decision",
        "timeout": 5
      }]
    }]
  }
}
```

**Thay thế `/path/to/new-claude-code-remote/` bằng đường dẫn thực tế đến thư mục dự án.**

### 2. Khởi động Claude Code trong TMUX

#### Cách 1: Sử dụng script tự động (Khuyến nghị)
```bash
npm run start-claude
```

#### Cách 2: Thủ công
```bash
# Tạo tmux session
tmux new-session -d -s claude-session

# Attach vào session
tmux attach-session -t claude-session

# Trong tmux session, khởi động Claude Code
claude-code
```

## Sử dụng

### Test hệ thống

```bash
npm test
```

### Gửi thông báo thủ công

```bash
# Thông báo hoàn thành
node notify.js completed "Task completed successfully"

# Thông báo cần quyết định
node notify.js decision "Need your input for next step"

# Thông báo tùy chỉnh
node notify.js custom "Custom message here"
```

## Cấu trúc thông báo

### Email
- Tiêu đề: "Claude Code Notification - [Type]"
- Nội dung HTML với thông tin chi tiết
- Bao gồm: Project name, TMUX session, Folder path

### Telegram
- Format HTML với emoji
- Thông tin chi tiết: Project, TMUX session, Folder
- Timestamp

## Troubleshooting

### Email không gửi được
- Kiểm tra SMTP credentials
- Đảm bảo sử dụng App Password cho Gmail
- Kiểm tra firewall/antivirus

### Telegram không gửi được
- Kiểm tra bot token và chat ID
- Đảm bảo bot đã được start
- Kiểm tra kết nối internet

### Claude Code hooks không hoạt động
- Kiểm tra đường dẫn trong settings.json
- Đảm bảo Claude Code chạy trong tmux session
- Kiểm tra quyền thực thi của notify.js

## License

MIT License 