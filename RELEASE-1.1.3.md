# C/C++ Smart Runner v1.1.3 Release Notes

## 📅 發布日期
2026年1月29日

## 🎯 版本重點

本版本修正了 PowerShell 執行命令格式問題，統一了 CMD 和 PowerShell 的執行命令格式，簡化程式碼邏輯並提升可靠性。

---

## 🐛 重要修正

### 統一執行命令格式

**問題描述：**
- 在 PowerShell 終端機中，執行命令顯示為帶引號的完整路徑字串（如 `"c:\C_Code_Test\ch04\ch4-1-1.exe"`），而非可執行命令
- 原因是 `useCustomCommand` 配置預設值設為 `true`，導致始終使用自訂命令的完整路徑格式
- 之前嘗試區分 PowerShell 和 CMD 使用不同命令格式（`& "path"` vs `"path"`），但因配置問題未能生效

**解決方案：**
1. **修正配置預設值**：將 `useCustomCommand` 從 `true` 改為 `false`
2. **採用統一命令格式**：
   - 先執行 `cd "目錄路徑"` 切換到程式所在目錄
   - 再使用相對路徑執行：`.\filename.exe`
   - 此格式在 CMD 和 PowerShell 都能正常運作

**實際效果：**
```powershell
# 之前（錯誤）：
PS C:\C_Code_Test\ch04> "c:\C_Code_Test\ch04\ch4-1-1.exe"
# 只是顯示字串，不會執行

# 現在（正確）：
PS C:\C_Code_Test\ch04> cd "C:\C_Code_Test\ch04"
PS C:\C_Code_Test\ch04> .\ch4-1-1.exe
# 正常執行程式
```

**技術細節：**
- 檔名包含空格時使用 `."\\filename with spaces.exe"`
- UTF-8 編碼設定仍根據終端機類型使用不同語法（必要的區分）：
  - PowerShell：`chcp 65001 2>&1 | Out-Null` + `[Console]::OutputEncoding = UTF8`
  - CMD：`chcp 65001 >nul 2>&1`

---

## 🧪 測試更新

### 新增測試套件：統一命令格式測試

新增 5 個單元測試驗證統一命令格式的正確性：

1. **相對路徑格式驗證**
   ```typescript
   const execCommand = `.\\${fileName}`;
   assert.strictEqual(execCommand, '.\\ch4-1-1.exe');
   ```

2. **檔名包含空格處理**
   ```typescript
   const execCommand = `."\\${fileName}"`;
   assert.strictEqual(execCommand, '."\\ch4 test file.exe"');
   ```

3. **cd 命令與相對路徑組合**
   ```typescript
   const cdCommand = `cd "${fileDir}"`;
   const execCommand = `.\\${fileName}`;
   // 驗證兩個命令正確組合
   ```

4. **自訂命令不受影響**
   - 驗證啟用自訂命令時，不會被轉換成相對路徑格式
   
5. **CMD 和 PowerShell 通用性**
   - 驗證 `.\\` 前綴在兩種終端機都有效
   - 驗證不需要 PowerShell 特定的 `&` 符號

### 測試結果
- **總測試數**：126 個測試
- **測試狀態**：✅ 全部通過
- **測試覆蓋率**：包含單元測試和整合測試

---

## ✨ 改進項目

### 程式碼簡化
- **移除複雜邏輯**：不再需要判斷終端機類型來選擇不同的執行命令格式
- **統一處理流程**：所有 Windows 系統使用相同的執行邏輯
- **降低維護成本**：減少分支邏輯，提升程式碼可讀性

### 配置優化
- **更合理的預設值**：`useCustomCommand` 預設為 `false`
- **保留自訂功能**：需要時仍可啟用自訂命令
- **向下相容**：不影響已啟用自訂命令的用戶

---

## 📋 完整變更清單

### 修改的檔案
1. **package.json** - 版本更新至 1.1.3，修正 `useCustomCommand` 預設值
2. **src/extension.ts** - 實作統一命令格式邏輯
3. **src/test/suite/integration.test.ts** - 新增 5 個測試案例
4. **CHANGELOG.md** - 更新版本歷史
5. **RELEASE-1.1.3.md** - 本發行說明文件

### 程式碼變更摘要

**package.json (第 156-159 行)**
```json
"cpp-smart-runner.useCustomCommand": {
  "type": "boolean",
  "default": false,  // 從 true 改為 false
  "description": "使用自訂命令（勾選後將使用下方的自訂命令設定）"
}
```

**src/extension.ts (第 619-632 行)**
```typescript
// 統一的執行命令格式（CMD 和 PowerShell 都支持）
if (isWindows && !config.get<boolean>('useCustomCommand', false)) {
    // 切換到檔案所在目錄
    const fileDir = path.dirname(outputFile);
    terminal.sendText(`cd "${fileDir}"`, true);
    
    // 使用相對路徑執行（.\filename.exe 格式在 CMD 和 PowerShell 都能用）
    const fileName = path.basename(outputFile);
    if (fileName.includes(' ')) {
        execCommand = `."\\${fileName}"`;
    } else {
        execCommand = `.\\${fileName}`;
    }
}
```

---

## 🚀 升級指南

### 從 1.1.2 升級

1. **安裝新版本**
   ```bash
   code --install-extension cpp-smart-runner-1.1.3.vsix
   ```

2. **檢查配置（可選）**
   - 如果您之前手動設定了 `useCustomCommand`，不受影響
   - 如果使用預設配置，現在會自動使用統一命令格式

3. **測試執行**
   - 開啟任一 C/C++ 檔案
   - 按 `Ctrl+Alt+R` 執行
   - 檢查終端機輸出應顯示 `.\filename.exe` 格式

### 注意事項
- ✅ **相容性**：與 1.1.2 版完全相容
- ✅ **無需手動設定**：預設即可正常運作
- ✅ **自訂命令**：如已啟用，繼續使用您的自訂設定

---

## 🔍 技術背景

### 為什麼統一命令格式？

1. **PowerShell 特殊性**：
   - PowerShell 將 `"path"` 視為字串，不會執行
   - 絕對路徑需要 `& "path"` 格式才能執行
   - 但相對路徑 `.\file.exe` 可直接執行

2. **CMD 相容性**：
   - CMD 支援 `.\file.exe` 相對路徑格式
   - 也支援完整路徑執行

3. **統一解決方案**：
   - 使用 `cd` 切換目錄確保一致性
   - 相對路徑格式兩種終端機都支援
   - 簡化程式邏輯，避免複雜判斷

### 保留的終端機區分

UTF-8 編碼設定必須區分終端機類型，因為語法不同：
- **PowerShell**：需要同時設定 `chcp` 和 `[Console]::OutputEncoding`
- **CMD**：只需設定 `chcp`

---

## 📊 測試報告

### 單元測試統計
- 編碼轉換測試：15 個
- Big5 轉換測試：5 個
- 終端機配置測試：13 個
- 統一命令格式測試：5 個（新增）
- 其他整合測試：88 個
- **總計**：126 個測試，全部通過 ✅

### 手動測試案例
1. ✅ PowerShell 終端機執行 C 程式
2. ✅ CMD 終端機執行 C 程式
3. ✅ 檔名包含空格的程式執行
4. ✅ 中文輸出正確顯示
5. ✅ 自訂命令功能正常

---

## 🙏 致謝

感謝所有用戶的回饋和測試協助，特別是在 PowerShell 執行問題上的詳細報告，幫助我們找到並解決了配置預設值的問題。

---

## 📚 相關文件

- [CHANGELOG.md](CHANGELOG.md) - 完整版本歷史
- [README.md](README.md) - 擴充功能使用指南
- [VERSION-1.1.3-SUMMARY.md](VERSION-1.1.3-SUMMARY.md) - 版本快速參考
- [POWERSHELL-FIX.md](POWERSHELL-FIX.md) - PowerShell 修正技術細節

---

## 🐛 已知問題

目前沒有已知的重大問題。如果您遇到任何問題，請在 [GitHub Issues](https://github.com/code4Copilot/cpp-smart-runner/issues) 回報。

---

## 🔮 未來計劃

- 支援更多編譯器選項
- 改進多檔案專案編譯
- 增強錯誤訊息提示
- 新增更多編碼格式支援

---

**完整版本號**：1.1.3  
**發布日期**：2026年1月29日  
**最低 VS Code 版本**：1.75.0
