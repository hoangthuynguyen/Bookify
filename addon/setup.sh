#!/bin/bash
# =============================================================================
# BOOKIFY ADDON SETUP SCRIPT
# Chạy file này để deploy add-on lên Google Docs
# =============================================================================

echo "🚀 Bookify Add-on Setup"
echo "========================"

# 1. Kiểm tra clasp đã cài chưa
if ! command -v clasp &> /dev/null; then
    echo "📦 Cài clasp..."
    npm install -g @google/clasp
fi

# 2. Login Google
echo ""
echo "🔑 Bước 1: Login Google (sẽ mở browser)"
echo "   Hãy đăng nhập bằng Google account của bạn"
clasp login

# 3. Tạo Apps Script project
echo ""
echo "📝 Bước 2: Tạo hoặc link Apps Script project"
echo ""
echo "Chọn một trong hai:"
echo "  [A] Tạo project MỚI (add-on standalone)"  
echo "  [B] Link vào script ID có sẵn"
read -p "Nhập A hoặc B: " choice

if [ "$choice" = "A" ] || [ "$choice" = "a" ]; then
    clasp create --type standalone --title "Bookify"
    echo "✅ Project mới được tạo, .clasp.json đã được cập nhật"
else
    read -p "Nhập Script ID của bạn: " scriptId
    echo "{\"scriptId\": \"$scriptId\", \"rootDir\": \".\"}" > .clasp.json
    echo "✅ .clasp.json đã được cập nhật"
fi

# 4. Push code
echo ""
echo "📤 Bước 3: Push code lên Apps Script..."
clasp push --force

echo ""
echo "✅ XONG! Add-on đã được push lên Google Apps Script"
echo ""
echo "📋 Bước tiếp theo:"
echo "  1. Chạy: clasp open"
echo "  2. Trong Apps Script IDE: chạy function onOpen()"
echo "  3. Mở Google Doc bất kỳ"
echo "  4. Menu 'Bookify' sẽ xuất hiện → Open Formatter"
echo ""
echo "🔗 Script URL: https://script.google.com"
