# 編碼轉換功能說明

## 功能概述

此擴充套件現在支援 ANSI/Big5 與 UTF-8 之間的編碼自動轉換，完美解決 C 語言初學者在不同環境間的亂碼問題。

## 主要功能

### 1. 自動編碼偵測與轉換
- **自動觸發**：編譯前自動偵測檔案編碼
- **智慧轉換**：若偵測到 Big5/ANSI 編碼，自動轉換為 UTF-8
- **無感體驗**：學生無需手動操作，直接編譯即可

### 2. 手動編碼轉換
在 C/C++ 檔案中按右鍵，可看到以下選項：

- **轉換編碼為 UTF-8 (相容AI)**：將 Big5 檔案轉為 UTF-8
  - 適用於：使用 GitHub Copilot、VS Code 開發
  - 避免：AI 產生的中文註解亂碼

- **轉換編碼為 Big5 (相容Dev-C++)**：將 UTF-8 檔案轉回 Big5
  - 適用於：需要在 Dev-C++ 開啟的檔案
  - 確保：在傳統環境中正常顯示

## 安裝步驟

### 1. 安裝 iconv-lite 套件

在專案目錄執行：

```bash
npm install iconv-lite
```

或在命令提示字元 (cmd) 中執行：

```cmd
cd c:\cpp-smart-runner
npm install iconv-lite
```

### 2. 編譯擴充套件

```bash
npm run compile
```

## 設定選項

在 VS Code 設定中新增以下選項：

- **cpp-smart-runner.autoConvertEncoding**
  - 類型：布林值
  - 預設：`true`
  - 說明：編譯前自動偵測並轉換 ANSI/Big5 檔案為 UTF-8

## 使用情境

### 情境 1：從 Dev-C++ 匯入的專案
1. 學生在 Dev-C++ 撰寫程式（Big5 編碼）
2. 複製到 VS Code 開啟
3. **自動偵測**：編譯時自動轉為 UTF-8
4. 正常編譯執行，中文不再亂碼

### 情境 2：使用 AI 產生的程式碼
1. 使用 GitHub Copilot 產生含中文註解的程式碼（UTF-8）
2. 直接儲存並執行
3. 搭配 `chcp 65001` 設定，終端機正確顯示中文

### 情境 3：需要回到 Dev-C++
1. 在 VS Code 完成開發（UTF-8）
2. 右鍵選單 → **轉換編碼為 Big5 (相容Dev-C++)**
3. 檔案轉為 Big5 編碼
4. 可在 Dev-C++ 正常開啟和編輯

## 技術細節

### 編碼偵測邏輯
```typescript
function isUtf8(buffer: Buffer): boolean {
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        return true;
    } catch {
        return false;
    }
}
```

### 編譯器 UTF-8 支援
編譯命令自動加入：
```
-finput-charset=utf-8 -fexec-charset=utf-8
```

### Windows 終端機 UTF-8 設定
執行前自動執行：
```
chcp 65001
```

## 注意事項

1. **iconv-lite 必須安裝**：Big5 轉換功能需要此套件
2. **檔案會被修改**：編碼轉換會直接寫入原始檔案
3. **建議使用版本控制**：使用 Git 等工具保護原始碼
4. **Dev-C++ 限制**：Dev-C++ 僅支援 Big5，無法直接開啟 UTF-8 檔案

## 常見問題

### Q: 為什麼需要轉換編碼？
A: 因為 Dev-C++ 使用 Big5（ANSI）編碼，而現代工具（VS Code、GitHub Copilot）使用 UTF-8。兩者不相容會導致中文亂碼。

### Q: 自動轉換會影響效能嗎？
A: 不會。編碼偵測非常快速，僅在編譯時執行一次。

### Q: 可以關閉自動轉換嗎？
A: 可以。在設定中將 `cpp-smart-runner.autoConvertEncoding` 設為 `false`。

### Q: 如果沒有安裝 iconv-lite 會怎樣？
A: UTF-8 → Big5 轉換會失敗並顯示錯誤訊息。Big5 → UTF-8 轉換仍可正常運作。

## 版本更新

- **v1.0.6**（即將發布）
  - ✅ 新增自動編碼偵測與轉換
  - ✅ 新增右鍵選單手動轉換功能
  - ✅ 編譯器加入 UTF-8 支援參數
  - ✅ 完整的 Big5/UTF-8 雙向轉換

## 授權

與主擴充套件相同授權。
