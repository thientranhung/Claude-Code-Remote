# Enhanced Notification System with TMUX Scan

## Vấn đề đã giải quyết

**Vấn đề cũ:** Thông báo Telegram của Hook Stop không hiển thị câu hỏi của task hiện tại, nên không biết task nào vừa completed.

**Giải pháp:** Scan tmux buffer để lấy câu hỏi gần nhất và hiển thị trong thông báo Telegram.

## Tính năng mới

### 1. TMUX Scan Integration
- Tự động scan tmux buffer khi gửi notification
- Lấy câu hỏi gần nhất từ user input (line bắt đầu với "> ")
- Hỗ trợ multi-line questions
- Thêm câu hỏi vào metadata để Telegram sử dụng

### 2. Enhanced Telegram Notifications
- **Completion Notification:** Hiển thị "📝 Your Question:" với câu hỏi gần nhất
- **Decision Notification:** Hiển thị "📝 Your Question:" với câu hỏi gần nhất
- **Custom Notification:** Format chung cho các notification khác

### 3. Tách riêng các hàm Telegram
- `sendCompletionNotification()` - Cho Hook Stop (completed)
- `sendDecisionNotification()` - Cho Hook Stop (waiting)
- `sendCustomNotification()` - Cho các notification khác
- Mỗi hàm có format riêng, dễ bố trí sau này

## Cách sử dụng

### Test notification
```bash
# Test completion notification
node notify.js completed

# Test decision notification  
node notify.js decision

# Test với message tùy chỉnh
node notify.js completed "Task completed successfully"
```

### Format Telegram message

**Completion Notification:**
```
✅ Claude Task Completed

💬 Message: ✅ Task completed in project "project-name" (TMUX: claude-session)
📁 Project: project-name
🖥️ TMUX Session: claude-session

📝 Your Question:
[Your recent question here...]

⏰ Sent at [timestamp]
```

**Decision Notification:**
```
⏳ Claude Waiting for Input

💬 Message: ❓ Claude needs input in "project-name" (TMUX: claude-session)
📁 Project: project-name
🖥️ TMUX Session: claude-session

📝 Your Question:
[Your recent question here...]

⏰ Sent at [timestamp]
```

## Cấu trúc code

### notify.js
- `getRecentQuestion()` - Scan tmux buffer và lấy câu hỏi gần nhất
- `extractRecentQuestion()` - Parse text để tìm câu hỏi user
- `handleCompleted()` - Gọi scan tmux và gửi completion notification
- `handleDecision()` - Gọi scan tmux và gửi decision notification

### src/telegram.js
- `sendCompletionNotification()` - Gửi notification cho completed
- `sendDecisionNotification()` - Gửi notification cho waiting
- `sendCustomNotification()` - Gửi notification chung
- `formatCompletionMessage()` - Format riêng cho completed
- `formatDecisionMessage()` - Format riêng cho waiting

### src/notifier.js
- Cập nhật để sử dụng các hàm riêng của TelegramNotifier
- Đảm bảo backward compatibility

## Lợi ích

1. **Chính xác:** Luôn hiển thị câu hỏi của task hiện tại
2. **Rõ ràng:** Biết task nào vừa completed/waiting
3. **Linh hoạt:** Dễ dàng thêm format mới cho từng loại notification
4. **Tương thích:** Không ảnh hưởng đến các notification khác

## Troubleshooting

### Không lấy được câu hỏi
- Kiểm tra tmux session name
- Đảm bảo đang trong tmux session
- Kiểm tra format user input (phải bắt đầu với "> ")

### Notification không gửi được
- Kiểm tra Telegram bot token và chat ID
- Kiểm tra environment variables
- Xem log để debug

### Format message không đúng
- Kiểm tra hàm format trong telegram.js
- Đảm bảo metadata có recentQuestion 