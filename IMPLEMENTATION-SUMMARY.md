# 編碼轉換功能實作總結

## 完成的修改

### 1. extension.ts 修改內容

#### 新增引入
```typescript
import { TextDecoder, TextEncoder } from 'util';
```

#### 新增函式

##### `handleEncodingConversion(target: 'utf8' | 'big5')`
- 處理手動編碼轉換的核心函式
- 支援 UTF-8 ↔ Big5 雙向轉換
- 包含錯誤處理和使用者提示

##### `isUtf8(buffer: Buffer): boolean`
- 偵測檔案是否為 UTF-8 編碼
- 使用 TextDecoder 的 fatal 模式進行嚴格檢查

#### 修改函式

##### `activate(context: vscode.ExtensionContext)`
- 註冊兩個新命令：
  - `cpp-smart-runner.convertToUtf8`
  - `cpp-smart-runner.convertToBig5`

##### `compileCurrentFile(): Promise<boolean>`
- 在編譯前加入自動編碼偵測邏輯
- 檢查 `autoConvertEncoding` 設定
- 若偵測到 Big5/ANSI，自動轉為 UTF-8
- 編譯命令加入 `-finput-charset=utf-8 -fexec-charset=utf-8` 參數

### 2. package.json 修改內容

#### 新增命令
```json
{
  "command": "cpp-smart-runner.convertToUtf8",
  "title": "轉換編碼為 UTF-8 (相容AI)",
  "category": "C/C++ Smart Runner"
},
{
  "command": "cpp-smart-runner.convertToBig5",
  "title": "轉換編碼為 Big5 (相容Dev-C++)",
  "category": "C/C++ Smart Runner"
}
```

#### 新增右鍵選單
在 `editor/context` 加入兩個新選項（group navigation@93 和 @94）

#### 新增設定選項
```json
"cpp-smart-runner.autoConvertEncoding": {
  "type": "boolean",
  "default": true,
  "description": "編譯前自動偵測並轉換 ANSI/Big5 檔案為 UTF-8"
}
```

#### 新增依賴
```json
"dependencies": {
  "iconv-lite": "^0.6.3"
}
```

### 3. 新增文件

- **ENCODING-FEATURE.md**：詳細功能說明文件
- **INSTALL.md**：安裝與編譯指南
- **install-deps.bat**：Windows 批次安裝腳本

## 功能特點

### ✅ 自動化
- 編譯前自動偵測檔案編碼
- 無需手動干預即可處理 Big5 檔案
- 智慧判斷是否需要轉換

### ✅ 使用者友善
- 右鍵選單直接操作
- 清楚的中文提示訊息
- 支援雙向轉換（UTF-8 ↔ Big5）

### ✅ 相容性
- 相容 Dev-C++（Big5）環境
- 相容 VS Code/Copilot（UTF-8）環境
- Windows 終端機 UTF-8 支援（chcp 65001）

### ✅ 安全性
- 轉換前檢查檔案是否已是目標編碼
- 錯誤處理機制完善
- 避免重複轉換造成問題

## 使用流程

### 流程 1：Dev-C++ → VS Code
```
Big5 檔案 → 開啟 → 點擊編譯
    ↓
自動偵測為 Big5
    ↓
自動轉換為 UTF-8
    ↓
正常編譯執行
```

### 流程 2：VS Code → Dev-C++
```
UTF-8 檔案 → 右鍵選單 → 轉換編碼為 Big5
    ↓
檔案轉為 Big5
    ↓
可在 Dev-C++ 開啟
```

## 待辦事項

### 安裝依賴
由於 PowerShell 權限問題，請使用以下方式安裝：

```cmd
cd c:\cpp-smart-runner
npm install
```

### 編譯擴充套件
```cmd
npm run compile
```

### 測試功能
1. 按 F5 啟動除錯
2. 開啟測試 C 檔案
3. 測試右鍵選單功能
4. 測試自動編碼轉換

## 技術細節

### 編碼偵測原理
使用 TextDecoder 的 `fatal: true` 選項，嘗試以 UTF-8 解碼檔案。如果失敗則判定為非 UTF-8 編碼。

### Big5 轉換
使用 `iconv-lite` 套件進行 Big5 編碼轉換，這是 Node.js 生態系中最穩定的編碼轉換工具。

### 編譯器設定
- `-finput-charset=utf-8`：告訴 GCC/G++ 原始檔為 UTF-8
- `-fexec-charset=utf-8`：輸出也使用 UTF-8
- 搭配 `chcp 65001`：Windows 終端機使用 UTF-8

## 版本資訊

建議將 package.json 中的版本號更新為：
```json
"version": "1.0.6"
```

並在 README.md 中加入新功能說明。

## 注意事項

1. **備份重要檔案**：編碼轉換會直接修改原始檔案
2. **使用版本控制**：建議使用 Git 保護程式碼
3. **測試後發布**：確保所有功能都正常運作再發布到 Marketplace
4. **文件更新**：記得更新 README.md 和 CHANGELOG.md

## 聯絡資訊

如有問題，請參考：
- ENCODING-FEATURE.md - 功能詳細說明
- INSTALL.md - 安裝指南
- GitHub Issues - 回報問題
