# Release 1.1.2 - Big5 Conversion & PowerShell Fix

**發布日期**: 2026-01-29

## 🎯 核心改進

本版本修正了 Big5 轉換功能的關鍵問題，以及 PowerShell 終端機執行和中文顯示問題，確保轉換後的檔案能正確以 ANSI Big5 格式儲存，並在 PowerShell 中正確執行和顯示中文。

## 🐛 修正的重大問題

### 1. Big5 轉換後亂碼問題

**問題描述**：
- 舊版本將內容轉換為 Big5 後重新載入檔案
- VS Code 預設以 UTF-8 解讀 Big5 字節，導致顯示為亂碼
- 使用者無法繼續編輯，必須關閉檔案
- 一經儲存，檔案內容就真正變成亂碼

**解決方案**：
改為單向寫入並關閉檔案的流程：

1. **雙重確認機制**
   - 第一次警告：未儲存修改時提示「儲存並轉換」或「取消」
   - 第二次確認：模態對話框清楚說明轉換後果
   - 告知使用者：VS Code 將無法正確顯示此檔案
   - 說明用途：檔案將以 ANSI Big5 儲存，供 Dev-C++ 使用

2. **轉換流程**
   ```
   UTF-8 內容 → Big5 編碼 → 寫入 ANSI 格式 → 關閉編輯器 → 顯示成功訊息
   ```

3. **使用者引導**
   - 成功訊息說明檔案已儲存為 Big5 (ANSI) 編碼
   - 建議使用 Dev-C++ 或其他支援 Big5 的編輯器開啟
   - 提示如何轉回 UTF-8（使用「從 Big5 轉換為 UTF-8」功能）

**程式碼位置**: [extension.ts](src/extension.ts#L276-L317)

### 2. PowerShell 終端機執行和中文顯示問題

**問題描述**：
1. **執行命令錯誤**：PowerShell 中直接執行 `ch4-1-1.exe` 會出現錯誤
   ```
   找不到 ch4-1-1.exe 命令，但它確實存在於目前位置。
   請改為輸入 ".\ch4-1-1.exe"
   ```

2. **中文亂碼**：即使手動執行 `.\ch4-1-1.exe`，中文輸出仍然亂碼
   ```
   蝬國ch1 = B      (應該是：繁國ch1 = B)
   ```

**解決方案**：

1. **自動偵測終端機類型**
   ```typescript
   const shellPath = (vscode.env.shell || '').toLowerCase();
   const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
   ```

2. **PowerShell 執行命令格式調整**
   - **相對路徑**：自動添加 `.\` 前綴 → `.\program.exe`
   - **絕對路徑**：使用 `&` 運算符 → `& "C:\path\program.exe"`

3. **PowerShell 雙重編碼設定**
   ```powershell
   chcp 65001 2>&1 | Out-Null
   [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   ```
   - `chcp 65001`：設定控制台代碼頁
   - `[Console]::OutputEncoding`：設定 .NET Console 輸出編碼

4. **CMD 終端機完全保留**
   - CMD 的 `chcp 65001 >nul 2>&1` 邏輯完全不變
   - 確保向後兼容性

**程式碼位置**: [extension.ts](src/extension.ts#L577-L625)

## 🧪 測試增強

### Big5 轉換測試（5 個新測試）

使用 **Sinon.js** 模擬對話框互動，確保功能正確性：

1. **用戶取消未儲存警告測試**
   - 驗證取消操作時檔案保持開啟
   - 確認未儲存的修改不會丟失

2. **用戶取消確認對話框測試**
   - 驗證取消轉換時無副作用
   - 檔案編碼保持 UTF-8

3. **成功轉換測試**
   - 驗證檔案正確寫入為 Big5
   - 使用 iconv-lite 解碼驗證內容正確
   - 確認顯示成功訊息

4. **缺少 iconv-lite 測試**
   - 驗證錯誤處理機制
   - 確保命令可正常調用

5. **ANSI Big5 格式驗證測試**
   - 確認檔案以 Big5 格式儲存（非 UTF-8）
   - UTF-8 解碼應該失敗
   - Big5 解碼應該成功

**測試套件**: `Big5 轉換單向寫入測試`
**測試文件**: [encodingConversion.test.ts](src/test/suite/encodingConversion.test.ts)

### PowerShell 測試（5 個新測試）

1. **PowerShell 編碼設定測試**
   - 驗證 `chcp 65001 2>&1 | Out-Null` 命令格式
   - 驗證 `[Console]::OutputEncoding = UTF8` 設定

2. **相對路徑執行命令測試**
   - 驗證生成 `.\test.exe` 格式

3. **絕對路徑執行命令測試**
   - 驗證生成 `& "C:\path\test.exe"` 格式

4. **路徑類型偵測測試**
   - 驗證 `path.isAbsolute()` 正確識別

5. **終端機類型偵測測試**
   - 驗證 PowerShell 和 CMD 正確區分

**測試文件**: [integration.test.ts](src/test/suite/integration.test.ts)

### 手動測試文檔

新增完整的手動測試清單：[BIG5-CONVERSION-MANUAL-TEST.md](BIG5-CONVERSION-MANUAL-TEST.md)

包含 8 個詳細測試案例：
- ✅ 基本轉換流程
- ✅ 取消操作測試
- ✅ 未儲存修改處理
- ✅ Big5 檔案驗證
- ✅ 逆向轉換（轉回 UTF-8）
- ✅ 對話框文字檢查
- ✅ 與外部工具互操作性（Dev-C++、記事本、Notepad++）
- ✅ 錯誤處理測試

## ✨ 使用者體驗改進

### 清楚的警告訊息

**轉換前確認對話框**：
```
⚠️ 轉換為 Big5 後，VS Code 將無法正確顯示此檔案。
檔案將被儲存為 ANSI Big5 編碼並關閉，請使用 Dev-C++ 等支援 Big5 的編輯器開啟。
若要在 VS Code 繼續編輯，請使用「轉換為 UTF-8」功能。

[確定轉換]  [取消]
```

**成功訊息**：
```
✅ 已成功轉換並儲存為 Big5 (ANSI) 編碼
📝 請使用 Dev-C++ 或其他支援 Big5 的編輯器開啟
💡 若要在 VS Code 繼續編輯，請重新開啟並使用「轉換為 UTF-8」功能
```

### 避免資料損失

- 未儲存修改時會先提示儲存
- 雙重確認確保使用者了解操作後果
- 檔案關閉後不會顯示亂碼
- 清楚說明如何轉回 UTF-8

### PowerShell 終端機改進

**Output Channel 顯示**：
```
==================== 執行程式 ====================
終端機類型: PowerShell
執行命令: .\test.exe
```

**終端機執行順序**：
1. 清除終端機（如啟用）
2. 設定編碼：`chcp 65001 2>&1 | Out-Null`
3. 設定輸出編碼：`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`
4. 執行程式：`.\test.exe` 或 `& "C:\path\test.exe"`

**CMD 終端機保持不變**：
- 清除終端機
- 設定編碼：`chcp 65001 >nul 2>&1`
- 執行程式：`"C:\path\test.exe"`

## 📦 技術細節

### 新增依賴

```json
{
  "devDependencies": {
    "@types/sinon": "^17.0.0",
    "sinon": "^17.0.0"
  }
}
```

### 核心改變

**Big5 轉換**：

1. **移除重新載入邏輯**
   ```typescript
   // 舊版本（會造成亂碼）
   fs.writeFileSync(filePath, big5Buffer);
   await vscode.commands.executeCommand('workbench.action.files.revert');
   ```

2. **新增關閉檔案邏輯**
   ```typescript
   // 新版本（避免亂碼）
   fs.writeFileSync(filePath, big5Buffer);
   await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
   ```

3. **雙重確認機制**
   - 使用模態對話框 (`modal: true`)
   - 提供清楚的操作說明
   - 引導使用者正確使用轉換功能

**PowerShell 執行**：

1. **終端機類型偵測**
   ```typescript
   const shellPath = (vscode.env.shell || '').toLowerCase();
   const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
   ```

2. **執行命令調整**
   ```typescript
   if (isPowerShell) {
       if (path.isAbsolute(outputFile)) {
           execCommand = `& "${outputFile}"`;  // 絕對路徑
       } else {
           execCommand = `.\\${path.basename(outputFile)}`;  // 相對路徑
       }
   }
   ```

3. **編碼設定增強**
   ```typescript
   if (isPowerShell) {
       terminal.sendText('chcp 65001 2>&1 | Out-Null', true);
       terminal.sendText('[Console]::OutputEncoding = [System.Text.Encoding]::UTF8', true);
   }
   ```

## 📊 測試結果

### 總測試數量
- **124 個測試**（+10 個新測試）
- **通過率**: 100% ✅

### 測試覆蓋
- ✅ Big5 轉換所有路徑
- ✅ PowerShell 執行命令格式
- ✅ PowerShell 編碼設定
- ✅ CMD 終端機兼容性
- ✅ 對話框互動場景
- ✅ 錯誤處理機制
- ✅ 檔案編碼驗證
- ✅ 路徑類型偵測

## 🔄 升級指引

### 從 1.1.1 升級

此版本包含 Big5 轉換和 PowerShell 執行的重要改進。

**行為變更**：
- **UTF-8 轉換**：無變更，保持原有行為
- **Big5 轉換**：改為單向寫入並關閉檔案
- **PowerShell 執行**：自動添加 `.\` 前綴和編碼設定
- **CMD 執行**：無變更，保持原有行為

**建議**：
1. 升級前確保沒有未儲存的修改
2. 第一次使用 Big5 轉換時，請仔細閱讀對話框說明
3. PowerShell 終端機現在會自動使用正確的執行格式

### 使用者影響

**正面影響**：
- ✅ Big5 轉換不會再看到亂碼
- ✅ PowerShell 中文顯示正常
- ✅ PowerShell 執行命令自動調整
- ✅ 更清楚的操作引導
- ✅ 避免誤操作造成資料損失

**需要注意**：
- ⚠️ 轉換為 Big5 後檔案會自動關閉
- ⚠️ 若要繼續在 VS Code 編輯，需要先轉回 UTF-8

## 📝 文檔更新

- ✅ [CHANGELOG.md](CHANGELOG.md) - 完整變更記錄
- ✅ [BIG5-CONVERSION-MANUAL-TEST.md](BIG5-CONVERSION-MANUAL-TEST.md) - Big5 轉換手動測試
- ✅ [BIG5-CONVERSION-TEST-SUMMARY.md](BIG5-CONVERSION-TEST-SUMMARY.md) - Big5 轉換測試總結
- ✅ [POWERSHELL-FIX.md](POWERSHELL-FIX.md) - PowerShell 修正詳細說明

## 🔗 相關資源

- [完整更新日誌](CHANGELOG.md)
- [測試總結](BIG5-CONVERSION-TEST-SUMMARY.md)
- [手動測試清單](BIG5-CONVERSION-MANUAL-TEST.md)
- [安裝指南](INSTALL.md)
- [使用說明](README.md)
- [問題回報](https://github.com/code4Copilot/cpp-smart-runner/issues)

## 🙏 致謝

感謝所有使用者的回饋，特別是關於 Big5 編碼轉換和 PowerShell 終端機問題的報告，幫助我們識別並修正這些重要的使用者體驗問題。

## 🚀 下載

**VS Code Marketplace**: [C/C++ Smart Runner](https://marketplace.visualstudio.com/items?itemName=hueyanchen.cpp-smart-runner)

**直接安裝**:
```bash
code --install-extension hueyanchen.cpp-smart-runner
```

**手動安裝 VSIX**:
從 [GitHub Releases](https://github.com/code4Copilot/cpp-smart-runner/releases/tag/v1.1.2) 下載 `cpp-smart-runner-1.1.2.vsix`

---

**版本**: 1.1.2  
**發布日期**: 2026-01-29  
**類型**: Bug Fix + Enhancement
