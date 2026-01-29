# Version 1.1.2 發布檢查清單

## 📋 發布前檢查

### 版本號更新
- [x] package.json 版本更新為 1.1.2
- [x] CHANGELOG.md 新增 1.1.2 條目
- [x] 創建 RELEASE-1.1.2.md
- [x] 創建 VERSION-1.1.2-SUMMARY.md

### 代碼品質
- [x] TypeScript 編譯無錯誤
- [x] ESLint 檢查通過
- [x] 所有測試通過 (119 個測試)

### 測試覆蓋
- [x] Big5 轉換單向寫入測試 (5 個新測試)
- [x] 手動測試文檔已創建
- [x] 測試總結文檔已創建

### 文檔完整性
- [x] README.md 功能說明完整
- [x] CHANGELOG.md 記錄詳細
- [x] Release Notes 說明清楚
- [x] 手動測試清單完整

## 📦 打包步驟

### 1. 確認依賴已安裝
```bash
npm install
```

### 2. 編譯代碼
```bash
npm run compile
```

### 3. 執行測試
```bash
npm test
```

### 4. 打包 VSIX
```bash
npx vsce package
```

預期輸出: `cpp-smart-runner-1.1.2.vsix`

### 5. 驗證 VSIX
```bash
# 檢查檔案大小（應該合理，約 50-200KB）
ls -lh cpp-smart-runner-1.1.2.vsix

# 測試安裝（可選）
code --install-extension cpp-smart-runner-1.1.2.vsix
```

## 🚀 發布到 GitHub

### 1. 提交所有變更
```bash
git add .
git commit -m "Release v1.1.2 - Big5 Conversion Fix"
```

### 2. 建立標籤
```bash
git tag -a v1.1.2 -m "Release v1.1.2"
```

### 3. 推送到 GitHub
```bash
git push origin main
git push origin v1.1.2
```

### 4. 建立 GitHub Release
1. 前往 GitHub Repository
2. 點擊 "Releases" → "Create a new release"
3. 選擇標籤: `v1.1.2`
4. Release title: `v1.1.2 - Big5 Conversion Fix`
5. 貼上 RELEASE-1.1.2.md 的內容
6. 上傳 `cpp-smart-runner-1.1.2.vsix`
7. 點擊 "Publish release"

## 📝 發布到 VS Code Marketplace

### 方式 1: 使用 vsce
```bash
npx vsce publish
```

### 方式 2: 手動上傳
1. 登入 [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. 選擇 C/C++ Smart Runner
3. 點擊 "Update"
4. 上傳 `cpp-smart-runner-1.1.2.vsix`
5. 確認並發布

## ✅ 發布後驗證

### GitHub Release
- [ ] Release 頁面顯示正確
- [ ] VSIX 檔案可以下載
- [ ] Release Notes 格式正確
- [ ] 標籤正確指向最新 commit

### VS Code Marketplace
- [ ] 版本號顯示為 1.1.2
- [ ] 可以從 Marketplace 安裝
- [ ] 描述和截圖正確
- [ ] 下載數開始累積

### 功能測試
- [ ] 安裝後擴展正常啟動
- [ ] Big5 轉換功能正常
- [ ] UTF-8 轉換功能正常
- [ ] 對話框顯示正確
- [ ] 編譯和執行功能正常

## 📢 發布公告

### 建議發布管道
1. **GitHub Release Notes** - 自動通知 watchers
2. **VS Code Marketplace** - 用戶會收到更新通知
3. **專案 README** - 確保最新版本資訊可見

### 公告重點
- 🐛 修正 Big5 轉換亂碼問題
- ✨ 新增雙重確認機制
- 🧪 增加 5 個自動化測試
- 📝 提供完整的手動測試文檔

## 🔄 回滾計畫

如果發現重大問題需要回滾：

### GitHub
```bash
# 刪除標籤
git tag -d v1.1.2
git push origin :refs/tags/v1.1.2

# 刪除 Release（在 GitHub 網頁上操作）
```

### VS Code Marketplace
- 無法直接回滾
- 需要發布新版本 1.1.3 修正問題
- 或在 Marketplace 頁面標註已知問題

## 📊 監控指標

發布後需要監控：
- 下載次數
- 安裝數量
- Issue 數量（特別是 Big5 相關）
- 用戶評分和評論

## 🎯 成功標準

本次發布被視為成功，如果：
- ✅ 無新的 critical bug 報告
- ✅ Big5 轉換不再產生亂碼
- ✅ 用戶反饋正面
- ✅ 下載和安裝數穩定增長

---

**檢查清單版本**: 1.0  
**適用於**: Release 1.1.2  
**最後更新**: 2026-01-29
