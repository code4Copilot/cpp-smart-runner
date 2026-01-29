# PowerShell 執行與中文顯示修正

## 📋 問題描述

### 問題 1：PowerShell 執行命令格式
在 PowerShell 終端機中執行程式時，直接使用 `ch4-1-1.exe` 會出現錯誤：
```
Suggestion [3,General]: 找不到 ch4-1-1.exe 命令，但它確實存在於目前位置。
Windows PowerShell 預設不會從目前位置載入命令。
如果您信任這個命令，請改為輸入 ".\ch4-1-1.exe"。
```

### 問題 2：中文亂碼
即使手動執行 `.\ch4-1-1.exe`，中文輸出仍然顯示為亂碼：
```
蝬國ch1 = B      (應該是：繁國ch1 = B)
蝬國ch1 ASCII = 66
蝬國ch2 = C
蝬國ch2 ASCII = 67
```

## ✅ 解決方案

### 1. PowerShell 執行命令格式修正

**檢測邏輯**：
```typescript
const shellPath = (vscode.env.shell || '').toLowerCase();
const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
```

**執行命令調整**：
- **絕對路徑**：使用 `& "C:\path\to\file.exe"`
- **相對路徑**：使用 `.\file.exe`（當前目錄）

```typescript
if (isWindows && isPowerShell && !config.get<boolean>('useCustomCommand', false)) {
    const isAbsolutePath = path.isAbsolute(outputFile);
    
    if (isAbsolutePath) {
        execCommand = `& "${outputFile}"`;
    } else {
        const fileName = path.basename(outputFile);
        execCommand = `.\\${fileName}`;
    }
}
```

### 2. 中文編碼修正

**PowerShell 特殊處理**：
除了設定 `chcp 65001`，還需要設定 `Console.OutputEncoding`：

```typescript
if (isPowerShell) {
    // 設定控制台代碼頁為 UTF-8
    terminal.sendText('chcp 65001 2>&1 | Out-Null', true);
    // 設定 Console 輸出編碼為 UTF-8
    terminal.sendText('[Console]::OutputEncoding = [System.Text.Encoding]::UTF8', true);
} else {
    // CMD 只需要 chcp
    terminal.sendText('chcp 65001 >nul 2>&1', true);
}
```

**為什麼需要雙重設定？**
- `chcp 65001`：設定控制台代碼頁
- `[Console]::OutputEncoding`：設定 .NET Console 類的輸出編碼
- C 程式的 `printf` 輸出需要兩者都正確設定

## 🔍 技術細節

### PowerShell vs CMD 差異

| 特性 | CMD | PowerShell |
|-----|-----|-----------|
| 執行當前目錄程式 | `file.exe` | `.\file.exe` |
| 執行絕對路徑 | `"C:\path\file.exe"` | `& "C:\path\file.exe"` |
| 編碼設定 | `chcp 65001` | `chcp 65001` + `[Console]::OutputEncoding` |
| 靜音輸出 | `>nul 2>&1` | `2>&1 \| Out-Null` |

### 絕對路徑 vs 相對路徑處理

**絕對路徑範例**：
```
C:\Users\User\Project\program.exe
→ & "C:\Users\User\Project\program.exe"
```

**相對路徑範例**：
```
.\program.exe  或  program.exe
→ .\program.exe
```

## 🧪 測試驗證

### 測試案例 1：PowerShell 執行相對路徑
```c
// test.c
#include <stdio.h>
int main() {
    printf("測試中文輸出\n");
    return 0;
}
```

**期望行為**：
1. 編譯：`gcc test.c -o test.exe`
2. 執行命令：`.\test.exe`
3. 輸出：正確顯示「測試中文輸出」

### 測試案例 2：PowerShell 執行絕對路徑
使用自訂輸出目錄時：
```json
{
    "cpp-smart-runner.outputDir": "C:\\output"
}
```

**期望行為**：
1. 執行命令：`& "C:\output\test.exe"`
2. 輸出：正確顯示中文

### 測試案例 3：CMD 執行（確保不影響）
切換到 CMD 終端機：
```
test.exe
```

**期望行為**：
1. 執行命令：`"C:\path\test.exe"`
2. 輸出：正確顯示中文

## 📊 改進前後對比

### 改進前

**PowerShell**：
```powershell
PS C:\project> "C:\project\ch4-1-1.exe"
# ❌ PowerShell 不會執行
# 顯示錯誤或找不到命令
```

**中文輸出**：
```
蝬國ch1 = B      # ❌ 亂碼
蝬國ch1 ASCII = 66
```

### 改進後

**PowerShell**：
```powershell
PS C:\project> .\ch4-1-1.exe
# ✅ 正確執行
```

**中文輸出**：
```
繁國ch1 = B      # ✅ 正確顯示
繁國ch1 ASCII = 66
```

## 🎯 Output Channel 訊息

執行時會在 Output Channel 顯示：
```
==================== 執行程式 ====================
終端機類型: PowerShell
執行命令: .\ch4-1-1.exe
```

或（絕對路徑）：
```
==================== 執行程式 ====================
終端機類型: PowerShell
執行命令: & "C:\project\ch4-1-1.exe"
```

## 🔧 相關配置

此修正自動偵測終端機類型，無需額外配置。但可以透過以下設定調整行為：

```json
{
    // 是否顯示執行訊息（包含終端機類型）
    "cpp-smart-runner.showExecutionMessage": true,
    
    // 是否在執行前清除終端機
    "cpp-smart-runner.clearTerminal": true,
    
    // 使用自訂執行命令（會跳過自動調整）
    "cpp-smart-runner.useCustomCommand": false
}
```

## ⚠️ 注意事項

1. **自訂命令模式**：
   - 如果啟用 `useCustomCommand`，不會自動添加 `.\` 前綴
   - 需要自行處理 PowerShell 格式

2. **編碼設定順序**：
   - 必須先執行編碼設定命令
   - 再執行程式
   - Extension 已自動處理順序

3. **終端機偵測**：
   - 基於 `vscode.env.shell` 路徑
   - 支援 `powershell.exe` 和 `pwsh.exe`（PowerShell Core）

## 🐛 已知限制

1. 如果使用者手動在終端機輸入命令，仍需自行處理 `.\` 前綴
2. 極少數特殊終端機可能無法正確偵測

## 📝 程式碼位置

- **主要邏輯**：[extension.ts](src/extension.ts) `runCurrentFile` 函數
- **行數範圍**：約 577-625 行
- **相關函數**：終端機類型偵測與命令調整

---

**修正版本**：1.1.2+
**修正日期**：2026-01-29
**測試狀態**：✅ 待驗證
