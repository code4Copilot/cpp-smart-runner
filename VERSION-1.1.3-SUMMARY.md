# C/C++ Smart Runner v1.1.3 - 快速參考

## 版本資訊
- **版本號**：1.1.3
- **發布日期**：2026年1月29日
- **類型**：Bug 修正版本

---

## 核心修正

### 🔧 統一執行命令格式
修正了 PowerShell 執行命令顯示為字串而非可執行命令的問題。

**改變對比：**
| 項目 | 之前 (1.1.2) | 現在 (1.1.3) |
|------|-------------|-------------|
| useCustomCommand 預設值 | `true` | `false` |
| PowerShell 執行格式 | `"完整路徑"` (字串) | `cd "目錄"` + `.\file.exe` |
| CMD 執行格式 | `"完整路徑"` | `cd "目錄"` + `.\file.exe` |
| 終端機格式區分 | 是（未生效） | 否（統一格式） |

---

## 主要變更

### 1. 配置預設值調整
```json
{
  "cpp-smart-runner.useCustomCommand": false  // 從 true 改為 false
}
```

### 2. 執行命令邏輯
```typescript
// 統一使用相對路徑格式
terminal.sendText(`cd "${fileDir}"`, true);
execCommand = `.\\${fileName}`;  // 或 ."\\filename with spaces.exe"
```

### 3. UTF-8 設定保持區分
- PowerShell：`chcp 65001 2>&1 | Out-Null` + `[Console]::OutputEncoding = UTF8`
- CMD：`chcp 65001 >nul 2>&1`

---

## 測試更新

### 新增測試（5 個）
1. ✅ 相對路徑格式驗證
2. ✅ 檔名空格處理
3. ✅ cd + 相對路徑組合
4. ✅ 自訂命令不受影響
5. ✅ CMD/PowerShell 通用性

### 測試統計
- 總測試數：126 個
- 新增測試：5 個
- 測試結果：全部通過 ✅

---

## 使用者影響

### ✅ 正面影響
- PowerShell 執行命令現在正確顯示並執行
- 中文輸出正常顯示（無亂碼）
- 程式碼更簡潔，維護性更好
- 預設配置即可正常使用

### ⚠️ 需要注意
- 如果您已啟用 `useCustomCommand`，不受此次更新影響
- 首次使用新版本建議測試執行功能

---

## 快速測試

### 驗證步驟
1. 開啟任一 C/C++ 檔案
2. 按 `Ctrl+Alt+B` 編譯並執行
3. 檢查終端機輸出：
   - ✅ 應顯示 `cd "目錄路徑"`
   - ✅ 應顯示 `.\filename.exe`
   - ✅ 程式正常執行
   - ✅ 中文輸出無亂碼

### 預期輸出範例
```powershell
PS C:\C_Code_Test\ch04> cls
PS C:\C_Code_Test\ch04> chcp 65001 2>&1 | Out-Null
PS C:\C_Code_Test\ch04> [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
PS C:\C_Code_Test\ch04> cd "C:\C_Code_Test\ch04"
PS C:\C_Code_Test\ch04> .\ch4-1-1.exe
你好，世界！
```

---

## 技術摘要

### 根本原因
`useCustomCommand` 預設值為 `true` 導致統一命令格式邏輯被跳過。

### 解決方案
1. 修正預設值為 `false`
2. 使用 `cd` + 相對路徑統一格式
3. 避免終端機類型判斷的複雜性

### 程式碼位置
- **package.json** 第 156-159 行：配置預設值
- **src/extension.ts** 第 531 行：清空初始 execCommand
- **src/extension.ts** 第 619-632 行：統一命令格式邏輯

---

## 升級建議

### 建議升級對象
- ✅ 使用 PowerShell 終端機的用戶（必須升級）
- ✅ 遇到執行命令問題的用戶
- ✅ 想要更穩定版本的用戶

### 可延後升級
- ⏸️ 已啟用自訂命令且運作正常
- ⏸️ 僅使用 CMD 終端機且無問題

---

## 檔案清單

### 修改的檔案
- ✏️ `package.json` - 版本號和配置預設值
- ✏️ `src/extension.ts` - 執行命令邏輯
- ✏️ `src/test/suite/integration.test.ts` - 新增測試
- ✏️ `CHANGELOG.md` - 版本記錄
- ➕ `RELEASE-1.1.3.md` - 發行說明
- ➕ `VERSION-1.1.3-SUMMARY.md` - 本文件

---

## 相關連結

- 📄 [完整發行說明](RELEASE-1.1.3.md)
- 📝 [版本歷史](CHANGELOG.md)
- 🐛 [回報問題](https://github.com/code4Copilot/cpp-smart-runner/issues)
- 📖 [使用指南](README.md)

---

**版本**：1.1.3  
**日期**：2026-01-29  
**狀態**：穩定版 ✅
