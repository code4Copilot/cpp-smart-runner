# 版本 1.0.8 更新檢查清單

## ✅ 已完成項目

### 核心功能
- [x] 實作動態語言標準判斷（extension.ts）
- [x] 更新 compilerFlags 預設值為通用參數（package.json）
- [x] 新增編譯器參數測試套件（10 個新測試）
- [x] 所有測試通過（98/98）

### 版本號更新
- [x] package.json - 版本更新到 1.0.8
- [x] CHANGELOG.md - 新增 1.0.8 版本記錄
- [x] README.md - 更新版本徽章和新功能說明

### 文件更新
- [x] README.md - 更新預設編譯命令說明
- [x] README.md - 更新 compilerFlags 設定說明
- [x] README.md - 更新自訂命令範例
- [x] CHANGELOG.md - 詳細記錄改進和測試
- [x] RELEASE-1.0.8.md - 建立發布說明文件

### 程式碼編譯
- [x] TypeScript 編譯無錯誤
- [x] 所有測試通過

## 📋 版本發布前檢查

### 功能驗證
- [x] C 檔案使用 gcc + -std=c11
- [x] C++ 檔案使用 g++ + -std=c++17
- [x] UTF-8 編碼參數正確加入
- [x] 通用參數（-Wall -O2）正確應用
- [x] 自訂命令仍然正常運作

### 測試驗證
- [x] 語言標準判斷測試
- [x] 編譯器選擇測試
- [x] 編譯命令組合測試
- [x] 參數順序驗證測試
- [x] 自訂參數處理測試
- [x] 所有既有測試仍然通過

### 文件驗證
- [x] 版本號一致性（package.json、README、CHANGELOG）
- [x] 更新日期正確（2026-01-28）
- [x] 範例程式碼正確
- [x] 連結路徑正確

## 🚀 發布步驟

### 1. 本地驗證
```bash
# 編譯
npm run compile

# 執行測試
npm test

# 檢查 lint
npm run lint
```

### 2. Git 提交
```bash
git add .
git commit -m "chore: release version 1.0.8

- Implement dynamic language standard detection
- Update compilerFlags to generic parameters
- Add compiler flags test suite (10 new tests)
- Update documentation for 1.0.8 release"
git tag v1.0.8
```

### 3. 打包擴充套件
```bash
npx vsce package
```

### 4. 發布
```bash
# 發布到 VS Code Marketplace
npx vsce publish

# 或推送到 GitHub
git push origin main --tags
```

## 📝 發布訊息範本

### GitHub Release
```markdown
## C/C++ Smart Runner v1.0.8

### 🎯 主要改進
- 動態語言標準判斷：C 檔案自動使用 C11，C++ 檔案自動使用 C++17
- 編譯器參數架構優化：通用參數和語言特定參數分離
- 新增 10 個編譯器參數測試，總測試數達 98 個

### 📦 安裝方式
從 VS Code 擴充套件市場搜尋 "C/C++ Smart Runner" 並安裝，或使用命令：
\`\`\`
code --install-extension hueyanchen.cpp-smart-runner
\`\`\`

### 📚 詳細資訊
- [完整變更記錄](CHANGELOG.md)
- [發布說明](RELEASE-1.0.8.md)
- [使用文件](README.md)
```

### VS Code Marketplace
```
動態語言標準判斷，C/C++ 自動使用正確的編譯標準。
新增完整的編譯器參數測試，確保編譯正確性。
詳見：https://github.com/code4Copilot/cpp-smart-runner/blob/main/CHANGELOG.md
```

## 🔍 檢查項目總覽

- ✅ 核心功能實作完成
- ✅ 測試覆蓋完整
- ✅ 文件更新完整
- ✅ 版本號一致
- ✅ 編譯無錯誤
- ✅ 所有測試通過

## 🎉 準備就緒！

版本 1.0.8 已經準備好發布！
