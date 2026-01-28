# 安裝與編譯指南

## 快速開始

由於 PowerShell 執行權限限制，請使用以下方式安裝依賴和編譯：

### 方法 1：使用命令提示字元 (推薦)

1. 開啟命令提示字元（不是 PowerShell）
2. 執行以下命令：

```cmd
cd c:\cpp-smart-runner
npm install
npm run compile
```

### 方法 2：使用批次檔

直接執行專案中的 `install-deps.bat` 批次檔，它會自動安裝 iconv-lite。

### 方法 3：在 VS Code 終端機中執行

按 `` Ctrl+` `` 開啟終端機，選擇「命令提示字元」（而非 PowerShell），然後執行：

```cmd
npm install
npm run compile
```

## 驗證安裝

安裝完成後，檢查以下檔案是否存在：

- `node_modules/iconv-lite/` 目錄
- `out/extension.js` 檔案（編譯後產生）

## 測試擴充套件

按 `F5` 在 VS Code 中啟動擴充套件開發主機，測試以下功能：

1. 開啟一個 C/C++ 檔案
2. 右鍵查看是否有「轉換編碼」選項
3. 測試編譯功能是否正常運作

## 故障排除

### 問題：npm 無法執行（PowerShell 權限錯誤）

**解決方案**：使用命令提示字元而非 PowerShell

### 問題：找不到 iconv-lite 模組

**解決方案**：
```cmd
cd c:\cpp-smart-runner
npm install iconv-lite --save
```

### 問題：TypeScript 編譯失敗

**解決方案**：
```cmd
npm install
npm run compile
```

## 發布前準備

在發布到 VS Code Marketplace 前，確保：

1. ✅ 所有依賴都已安裝
2. ✅ TypeScript 編譯成功
3. ✅ package.json 版本號已更新
4. ✅ README.md 已更新功能說明

執行發布命令：

```cmd
npm run vscode:prepublish
vsce package
```
