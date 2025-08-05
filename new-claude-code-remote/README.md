# Claude Code Remote Notification System

Nhận thông báo Email/Telegram khi Claude Code hoàn thành task hoặc cần sự trợ giúp của bạn.

## 🎯 Dùng để làm gì?

- ✅ Nhận thông báo khi Claude Code hoàn thành task
- ❓ Nhận alert khi Claude cần bạn quyết định
- 📱 Gửi qua Telegram hoặc Email
- 💬 Xem lại câu hỏi bạn đã hỏi và tóm tắt kết quả

## 📦 Cài đặt

### Bước 1: Clone và đổi tên

```bash
# Clone repository
git clone https://github.com/yourusername/claude-code-remote.git

# Đổi tên thành cc_notifications (khuyến nghị)
mv claude-code-remote/new-claude-code-remote cc_notifications
```

### Bước 2: Đặt đúng vị trí

Di chuyển `cc_notifications` **cùng cấp** với project của bạn:

```
your-workspace/
├── your-project/           # Project của bạn
│   └── .claude/           # Sẽ được tạo bởi setup
│       └── settings.local.json
└── cc_notifications/       # Folder notification
    ├── notify.js
    ├── setup.sh
    └── .env
```

### Bước 3: Cấu hình Email/Telegram

```bash
cd cc_notifications

# Copy file mẫu
cp env.example .env

# Mở và chỉnh sửa
nano .env
```

**Cho Email (Gmail):**
- `EMAIL_ENABLED=true`
- `SMTP_USER=your-email@gmail.com`
- `SMTP_PASS=your-app-password` ([Tạo App Password](https://myaccount.google.com/security))
- `EMAIL_TO=notification-email@gmail.com`

**Cho Telegram:**
- `TELEGRAM_ENABLED=true`  
- `TELEGRAM_BOT_TOKEN=123456:ABC-DEF...` (từ [@BotFather](https://t.me/BotFather))
- `TELEGRAM_CHAT_ID=-1234567890`

### Bước 4: Chạy setup

```bash
./setup.sh
```

Setup sẽ:
- Kiểm tra Node.js, tmux, Claude Code
- Tự động tạo file config hooks
- Tạo tmux session theo tên project
- Kiểm tra và cảnh báo nếu đã có hooks

### Bước 5: Test thử

```bash
npm test
```

### Bước 6: Dùng với Claude Code

```bash
# Mở tmux session (tên tự động theo project)
tmux attach -t your-project-claude

# Chạy Claude Code
claude
```

## 🔧 Cấu hình Telegram Bot

1. Chat với [@BotFather](https://t.me/BotFather) trên Telegram
2. Gửi `/newbot` và làm theo hướng dẫn
3. Copy bot token
4. Chat với bot của bạn (bất kỳ tin nhắn nào)
5. Mở link: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
6. Tìm `"chat":{"id":123456}` - đó là chat ID của bạn

## ⚙️ Cấu trúc file hooks

Setup sẽ tạo file `claude-hooks.json`. Copy nội dung vào `your-project/.claude/settings.local.json`:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /full/path/to/cc_notifications/notify.js completed",
        "timeout": 5
      }]
    }],
    "SubagentStop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /full/path/to/cc_notifications/notify.js completed",
        "timeout": 5
      }]
    }],
    "Notification": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /full/path/to/cc_notifications/notify.js notify",
        "timeout": 5
      }]
    }],
    "UserPromptSubmit": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node /full/path/to/cc_notifications/notify.js prompt",
        "timeout": 5
      }]
    }]
  }
}
```

**Lưu ý:** 
- Setup tự động điền đúng path cho bạn
- Nếu đã có hooks khác, merge thủ công để không mất

## 📱 Kết quả

Khi Claude Code hoàn thành task, bạn sẽ nhận được:

**Telegram:**
```
✅ Claude Task Completed

📝 Your Question:
Giúp tôi fix bug login không được

⏺ Claude's Actions:
Fixed authentication issue | Updated login validation | Added error handling
```

## ❓ Câu hỏi thường gặp

**Q: Có cần cài global không?**  
A: Không. Mỗi project nên có notification riêng.

**Q: Email không gửi được?**  
A: Dùng [App Password](https://myaccount.google.com/security) cho Gmail, không dùng mật khẩu thường.

**Q: Telegram không nhận được?**  
A: Kiểm tra đã chat với bot chưa, và chat ID có đúng không.

**Q: Có bao nhiêu project thì copy bao nhiêu lần?**  
A: Đúng vậy. Mỗi project = 1 notification system riêng.

## 🚀 Commands hữu ích

```bash
npm test                    # Test gửi thông báo
npm run generate-hooks      # Tạo lại file config
tmux ls                     # Xem các tmux sessions
tmux kill-session -t name   # Xóa tmux session
```

## 📝 Lưu ý

- Thêm folder notification vào `.gitignore` của project
- File `.env` chứa thông tin nhạy cảm - không commit
- Mỗi project dùng tmux session riêng
- Claude Code phải chạy trong tmux để capture được context

---

Cần giúp? Xem [CLAUDE.md](./CLAUDE.md) cho technical details.