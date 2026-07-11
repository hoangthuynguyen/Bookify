# Bookify Add-on — Google Docs Integration Guide

## Tổng Quan

Đây là **Google Docs Add-on**, hoạt động tương tự Bookify/Vellum nhưng tích hợp ngay trong Google Docs.

```
Google Docs Sidebar
    ↕ postMessage
React App (bookify.pages.dev)
    ↕ REST API
Node.js Backend (bookify-ixxa.onrender.com)
```

---

## Deploy Add-on Vào Google Docs

### Yêu cầu
- Node.js 18+
- Google account
- Script ID (lấy từ script.google.com)

### Bước 1: Cài clasp

```bash
npm install -g @google/clasp
clasp login
# → Mở browser, đăng nhập Google
```

### Bước 2: Tạo Apps Script Project

```bash
cd addon/

# Option A: Tạo project mới
clasp create --type standalone --title "Bookify"

# Option B: Link vào project có sẵn
cp .clasp.json.example .clasp.json
# Sửa .clasp.json: thay YOUR_SCRIPT_ID_HERE bằng script ID thật
```

**Lấy Script ID:**
1. Vào script.google.com
2. New project → Settings (⚙️) → Script ID

### Bước 3: Push Code

```bash
cd addon/
clasp push --force
```

### Bước 4: Test Trong Google Docs

```bash
clasp open
# → Mở Apps Script IDE

# Trong IDE: Run → Run function → onOpen
# Sau đó mở Google Doc → Menu "Bookify" xuất hiện
```

### Bước 5 (Optional): Deploy Cho User Khác

```
Trong Apps Script IDE:
Deploy → New Deployment
Type: Editor Add-on
Add description → Deploy

→ Lấy Add-on URL để share với users
```

---

## Cấu Hình Google OAuth (Bắt Buộc)

Backend cần Google OAuth để xác thực user.

### 1. Tạo OAuth Credentials

```
1. Vào console.cloud.google.com
2. Tạo project (hoặc dùng project có sẵn)
3. APIs & Services → Enable APIs:
   - Google Docs API
   - Google Drive API
4. APIs & Services → Credentials → Create OAuth 2.0 Client
   - Type: Web Application
   - Name: Bookify Backend
   - Authorized redirect URIs:
     https://bookify-ixxa.onrender.com/auth/google/callback
5. Download credentials
```

### 2. Cập Nhật .env

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### 3. Redeploy Backend

Push lên Render.com và set environment variables trong Render Dashboard.

---

## Cách Hoạt Động (Kỹ Thuật)

### Flow đầy đủ:

```
1. User click "Bookify → Open Formatter" trong Google Docs
2. Apps Script chạy openSidebar() → tạo HTML panel
3. Sidebar.html load → tạo iframe → load bookify.pages.dev
4. React app hiện UI với 7 tabs
5. User click action (ví dụ: "Apply Theme"):
   a. React gọi callGas('applyTheme', themeConfig)
   b. postMessage → Sidebar.html nhận
   c. Sidebar.html gọi google.script.run.applyTheme(themeConfig)
   d. Apps Script chạy StyleService.gs → applyTheme()
   e. Chỉnh sửa Google Doc trực tiếp
   f. Trả kết quả về React
6. User click "Export EPUB":
   a. Apps Script chạy ExportService.gs → getDocumentContent()
   b. Gọi UrlFetchApp → bookify-ixxa.onrender.com/export/epub
   c. Backend generate EPUB → upload lên R2
   d. Trả signed URL về
   e. React hiện download link
```

### Authentication Flow:

```
Apps Script → ScriptApp.getOAuthToken()
    → Google OAuth token (tự động, không cần config thêm)
    → Gửi token trong Authorization header
    → Backend verify với googleClient.getTokenInfo()
    → Lấy email → tìm/tạo user trong Supabase
```

**Lưu ý quan trọng:** `GOOGLE_CLIENT_ID` trong `.env` chỉ cần để backend verify token với Google. Không cần OAuth flow phức tạp vì Apps Script đã handle login tự động.

---

## Checklist Trước Khi Launch

- [ ] `GOOGLE_CLIENT_ID` đã set trong Render.com env vars
- [ ] `GOOGLE_CLIENT_SECRET` đã set  
- [ ] `.clasp.json` có script ID thật
- [ ] `clasp push` thành công
- [ ] Test `onOpen()` chạy được trong Apps Script IDE
- [ ] Menu "Bookify" hiện trong Google Docs
- [ ] Sidebar load được React app
- [ ] Export EPUB test thành công
- [ ] Supabase migrations đã apply (kiểm tra trong Supabase Dashboard)

---

## Troubleshooting

### Sidebar không load được
- Kiểm tra `FRONTEND_URL` trong `Sidebar.html` đúng chưa
- Mở DevTools trong sidebar (click phải → Inspect trong Google Docs)
- Kiểm tra CORS: backend có allow `*.pages.dev` không

### Export không hoạt động
- Kiểm tra backend đang chạy: `curl https://bookify-ixxa.onrender.com/health`
- Kiểm tra auth token: Apps Script log → `Logger.log(ScriptApp.getOAuthToken())`
- Kiểm tra R2 credentials trong Render.com env vars

### clasp push lỗi
- Chạy `clasp login` lại
- Kiểm tra `.clasp.json` có script ID đúng không
- Kiểm tra quota: Google có limit 30 push/ngày
