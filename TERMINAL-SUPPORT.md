# 終端機支援說明

## 概述

C/C++ Smart Runner 完全支援 Windows 的兩種主要終端機環境，確保中文輸出在任何環境下都能正確顯示。

## 支援的終端機

### ✅ Windows PowerShell
- Windows 內建的 PowerShell 5.1
- PowerShell Core (pwsh) 7.x
- VS Code 預設終端機

### ✅ Command Prompt (CMD)
- Windows 傳統命令提示字元
- 相容 Windows XP 到 Windows 11

### ✅ 其他終端機
- Windows Terminal
- ConEmu
- Cmder
- 其他使用 Windows Console API 的終端機

## UTF-8 自動設定

### 工作原理

當您執行 C/C++ 程式時，擴充套件會自動執行以下步驟：

1. **清除終端機**（如果啟用）
   ```bash
   cls  # Windows
   ```

2. **設定 UTF-8 代碼頁**
   ```bash
   chcp 65001 >nul 2>&1
   ```
   - `chcp 65001`: 將代碼頁設為 UTF-8 (Code Page 65001)
   - `>nul`: 隱藏標準輸出
   - `2>&1`: 同時隱藏錯誤輸出（PowerShell/CMD 通用）

3. **執行程式**
   ```bash
   "C:\path\to\program.exe"
   ```

### 為什麼需要這個設定？

即使您的原始碼已經轉換為 UTF-8，並使用 `-fexec-charset=utf-8` 編譯，Windows 終端機預設仍使用系統代碼頁（通常是 Big5 或 GBK），導致中文輸出亂碼。

`chcp 65001` 命令會將終端機切換到 UTF-8 模式，確保程式輸出的 UTF-8 字元能正確顯示。

## 設定選項

### clearTerminal

控制執行前是否清除終端機。

```json
{
  "cpp-smart-runner.clearTerminal": true
}
```

- **預設值**: `true`
- **類型**: `boolean`
- **說明**: 啟用後，執行程式前會先清除終端機畫面

### showExecutionMessage

控制是否在輸出頻道顯示執行訊息。

```json
{
  "cpp-smart-runner.showExecutionMessage": true
}
```

- **預設值**: `true`
- **類型**: `boolean`
- **說明**: 啟用後，會在輸出頻道顯示執行命令等資訊

## 使用者自訂終端機

### 方法 1: VS Code 設定

在 `settings.json` 中設定預設終端機：

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

或

```json
{
  "terminal.integrated.defaultProfile.windows": "Command Prompt"
}
```

### 方法 2: 自訂終端機設定檔

```json
{
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    },
    "Command Prompt": {
      "path": ["${env:windir}\\System32\\cmd.exe"],
      "icon": "terminal-cmd"
    },
    "Git Bash": {
      "source": "Git Bash"
    }
  }
}
```

### C/C++ Smart Runner 的行為

**重要**：擴充套件會**自動使用您設定的預設終端機**，不會強制指定特定終端機。

```typescript
// 擴充套件內部實作
const terminal = vscode.window.createTerminal({
    name: 'C/C++ Runner'
    // 注意：沒有 shellPath 參數
    // 使用 VS Code 的預設終端機設定
});
```

## 跨平台支援

### Windows
```bash
chcp 65001 >nul 2>&1
"program.exe"
```

### Linux / macOS
```bash
./program
```

在 Unix-like 系統上，終端機預設使用 UTF-8，不需要額外設定。

## 常見問題

### Q1: 為什麼還是有亂碼？

**可能原因**：
1. 終端機字型不支援中文
2. 系統區域設定問題
3. 檔案編碼未正確轉換

**解決方案**：
1. 設定支援中文的終端機字型（如 Microsoft YaHei, Consolas 等）
   ```json
   {
     "terminal.integrated.fontFamily": "Microsoft YaHei, Consolas"
   }
   ```

2. 手動執行編碼轉換：
   - 右鍵點選 C/C++ 檔案
   - 選擇「轉換編碼為 UTF-8 (相容AI)」

3. 檢查編譯輸出頻道的訊息

### Q2: PowerShell 和 CMD 有什麼差異？

**對於 C/C++ Smart Runner**：
- 兩者都完全支援
- UTF-8 設定方式相同（`chcp 65001`）
- 執行結果一致

**一般差異**：
- PowerShell: 功能更強大，物件導向
- CMD: 傳統命令列，簡單直接

### Q3: 可以使用其他終端機嗎？

可以！只要該終端機：
1. 支援 Windows Console API
2. 支援 `chcp` 命令
3. 能在 VS Code 中配置

常見支援的終端機：
- Windows Terminal
- ConEmu
- Cmder
- Git Bash (with winpty)

### Q4: 為什麼不使用 PowerShell 的 $OutputEncoding？

**原因**：
- `chcp 65001` 是 Windows 系統層級命令
- 在 PowerShell 和 CMD 中都有效
- 更簡單、更通用

PowerShell 特定方法（**不推薦**）：
```powershell
$OutputEncoding = [System.Text.Encoding]::UTF8
```
這只在 PowerShell 中有效，在 CMD 中會出錯。

### Q5: 如何驗證 UTF-8 設定是否成功？

在終端機執行：
```bash
chcp
```

應該顯示：
```
使用中字碼頁: 65001
```

## 技術實作

### 終端機建立代碼

```typescript
// 建立終端機（使用使用者的預設終端機）
const terminal = vscode.window.createTerminal({
    name: 'C/C++ Runner'
});
terminal.show();

const isWindows = process.platform === 'win32';

// 清除終端機
if (config.get<boolean>('clearTerminal', true)) {
    const clearCommand = isWindows ? 'cls' : 'clear';
    terminal.sendText(clearCommand, true);
}

// Windows 環境設定 UTF-8（同時支援 CMD 和 PowerShell）
if (isWindows) {
    terminal.sendText('chcp 65001 >nul 2>&1', true);
}

// 執行程式
terminal.sendText(execCommand);
```

### 測試覆蓋

相關測試位於 `src/test/suite/integration.test.ts`：

```typescript
suite('Terminal Configuration Test Suite', () => {
    test('Should support clearTerminal configuration', () => {
        // 測試配置
    });

    test('Should verify UTF-8 terminal setup for Windows', () => {
        // 測試 Windows UTF-8 設定
    });

    test('Should support both PowerShell and CMD terminals', () => {
        // 測試終端機相容性
    });
});
```

## 最佳實踐

### 1. 使用統一的終端機
在團隊開發中，建議統一使用同一種終端機以確保一致性。

### 2. 設定合適的字型
```json
{
  "terminal.integrated.fontFamily": "Courier New, Microsoft YaHei"
}
```

### 3. 啟用清除終端機
```json
{
  "cpp-smart-runner.clearTerminal": true
}
```

這樣每次執行都有清爽的畫面。

### 4. 檢查編碼轉換
編譯前檢查輸出頻道，確認是否正確轉換為 UTF-8：
```
>>> 偵測到 BIG5 編碼，已自動轉換為 UTF-8
```

## 相關文件

- [編碼功能說明](ENCODING-FEATURE.md)
- [編碼偵測改進](ENCODING-DETECTION-IMPROVEMENTS.md)
- [測試文檔](TESTING.md)
- [README](README.md)

## 問題回報

如果遇到終端機相關問題，請提供：
1. VS Code 版本
2. 終端機類型（PowerShell/CMD/其他）
3. `terminal.integrated.*` 設定
4. 錯誤訊息截圖

在 [GitHub Issues](https://github.com/hueyanchen/cpp-smart-runner/issues) 回報問題。
