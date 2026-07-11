---
description: Build và deploy toàn bộ Bookify tự động không cần approve
---

// turbo-all

## Bookify - Auto Build & Deploy Workflow
> Mọi bước đều AUTO-RUN, không cần approve. Antigravity sẽ tự fix lỗi nếu có.

---

### Bước 1: Kiểm tra môi trường

// turbo
1. Kiểm tra git status:
```bash
cd /Users/nguyenhoang/Downloads/Bookify && git status && git log --oneline -3
```

// turbo
2. Cài frontend dependencies:
```bash
cd /Users/nguyenhoang/Downloads/Bookify/frontend && npm install 2>&1 | tail -3 && echo "=== FRONTEND DEPS OK ==="
```

// turbo
3. Cài backend dependencies:
```bash
cd /Users/nguyenhoang/Downloads/Bookify/backend && npm install 2>&1 | tail -3 && echo "=== BACKEND DEPS OK ==="
```

---

### Bước 2: TypeScript Check (chạy trước build để phát hiện lỗi sớm)

// turbo
4. Chạy TypeScript check:
```bash
cd /Users/nguyenhoang/Downloads/Bookify/frontend && npx tsc --noEmit 2>&1 && echo "=== TS OK ===" || echo "=== TS ERRORS - ANTIGRAVITY SẼ TỰ FIX ==="
```

---

### Bước 3: Build frontend

// turbo
5. Build production bundle:
```bash
cd /Users/nguyenhoang/Downloads/Bookify/frontend && npm run build 2>&1 && echo "=== BUILD OK ===" || echo "=== BUILD FAILED ==="
```

---

### Bước 4: Kiểm tra backend

// turbo
6. Kiểm tra backend syntax:
```bash
cd /Users/nguyenhoang/Downloads/Bookify/backend && node --check src/server.js 2>&1 && echo "=== BACKEND SYNTAX OK ===" || echo "=== BACKEND SYNTAX ERROR ==="
```

// turbo
7. Chạy backend tests:
```bash
cd /Users/nguyenhoang/Downloads/Bookify/backend && npm test 2>&1 | tail -5 && echo "=== TESTS DONE ==="
```

---

### Bước 5: Git commit & push

// turbo
8. Stage tất cả thay đổi:
```bash
cd /Users/nguyenhoang/Downloads/Bookify && git add -A && git diff --staged --stat
```

// turbo
9. Commit với timestamp:
```bash
cd /Users/nguyenhoang/Downloads/Bookify && git diff --staged --quiet || git commit -m "auto: build & fixes $(date '+%Y-%m-%d %H:%M')" && echo "=== COMMITTED ==="
```

// turbo
10. Push lên GitHub (kích hoạt CI/CD tự động):
```bash
cd /Users/nguyenhoang/Downloads/Bookify && git push origin main 2>&1 && echo "=== PUSHED TO GITHUB - CI/CD TRIGGERED ===" || echo "=== PUSH FAILED (check remote) ==="
```

---

### Bước 6: Dev server health check

// turbo
11. Kiểm tra dev server có thể khởi động:
```bash
cd /Users/nguyenhoang/Downloads/Bookify/frontend && timeout 10 npm run dev 2>&1 | head -20 || echo "=== DEV SERVER CHECK DONE ==="
```

