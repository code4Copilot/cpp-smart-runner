# Change Log

所有重要的專案變更都會記錄在此檔案中。

格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
版本號遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

## [1.1.0] - 2026-01-28

### 新增功能 🎉
- **✨ 在編輯器中轉換（可撤銷）** - 編碼轉換更安全
  - 轉換為 UTF-8 時，直接修改編輯器內容，不立即寫入檔案
  - 使用者可以用 **Ctrl+Z** 撤銷轉換
  - 只有在儲存檔案時才真正寫入磁碟
  - 提供更安全的轉換體驗，避免資料損失
  
- **📁 子選單支援** - 讓使用者選擇原始編碼
  - 新增右鍵子選單：「轉換編碼」
  - **轉換為 UTF-8 (自動偵測)** - 原有的自動偵測功能
  - **從 Big5 轉換為 UTF-8** - 明確指定原始編碼為 Big5
  - **從 GBK 轉換為 UTF-8** - 明確指定原始編碼為 GBK
  - **轉換為 Big5 編碼** - 轉換為 Dev-C++ 相容格式
  - 避免自動偵測錯誤的情況

### 改進 ✨
- **編碼轉換函數重構** - 支援指定原始編碼
  - 新增 `sourceEncoding` 參數：`'auto' | 'big5' | 'gbk'`
  - 自動模式維持原有行為
  - 手動模式使用 iconv-lite 直接解碼
- **訊息改進** - 提示使用者可以撤銷
  - 成功訊息包含「可按 Ctrl+Z 撤銷」提示
  - 偵測失敗時建議使用子選單選擇編碼

### 測試 🧪
- **新增編碼轉換功能測試** - 10 個新測試確保功能正確性
  - 命令註冊測試
  - 編輯器修改測試
  - 撤銷功能測試
  - Big5/GBK 指定編碼轉換測試
  - 錯誤處理測試
  - package.json 配置驗證測試
  - 總測試數量：108 個測試

### 技術細節 🔧
- 使用 `editor.edit()` API 修改編輯器內容
- 使用 `vscode.Range` 選取全部內容進行替換
- 保留 Big5 轉換的檔案寫入邏輯（因為 VS Code 無法直接顯示 Big5）
- 新增 3 個命令註冊：`convertFromBig5`、`convertFromGbk`
- 在 package.json 新增 `submenus` 和 `menus` 配置

### 文件 📝
- 新增 [ENCODING-CONVERSION-IMPROVEMENTS.md](ENCODING-CONVERSION-IMPROVEMENTS.md) - 詳細說明改進內容
- 更新 README.md - 新增子選單使用說明
- 更新 CHANGELOG.md - 記錄版本變更

## [1.0.9] - 2026-01-28

### 修正 🐛
- **Big5/GBK 編碼偵測改進** - 修正 Big5 檔案被誤判為 GBK 的問題
  - 改進啟發式演算法，正確識別 Big5 特有的字節範圍特徵
  - Big5 第二字節範圍 `0x40-0x7E` 給予更高權重
  - GBK 特有範圍 `0x81-0xA0` 正確識別
  - 測試驗證：真實 Big5 檔案現在能正確識別 ✅

### 技術細節 🔧
- 優化字節範圍判斷邏輯，避免重疊範圍的誤判
- 增加 Big5 特有特徵分數（`big5SpecificScore`）
- 改進判斷條件：優先考慮特有特徵而非總分

## [1.0.8] - 2026-01-28

### 改進 ✨
- **動態語言標準判斷** - 編譯器參數架構優化
  - C 檔案自動使用 `-std=c11` 標準
  - C++ 檔案自動使用 `-std=c++17` 標準
  - `compilerFlags` 設定改為通用參數（`-Wall -O2`）
  - 語言特定標準由程式動態判斷，不需手動配置
- **編譯命令結構優化** - 參數順序更加合理
  - 順序：編譯器 → 檔案 → 語言標準 → 編碼參數 → 其他參數 → 輸出檔案
  - 確保編碼參數（`-finput-charset=utf-8 -fexec-charset=utf-8`）正確應用

### 測試 🧪
- **新增編譯器參數測試** - 10 個新測試確保編譯正確性
  - 語言標準測試（C11/C++17）
  - 編譯器選擇測試（gcc/g++）
  - 編譯命令組合測試
  - 參數順序驗證測試
  - 自訂參數處理測試
  - 總測試數量：98 個測試全部通過 ✅

### 技術細節 🔧
- 移除 `package.json` 中的硬編碼語言標準參數
- 在 `extension.ts` 中實作動態語言偵測邏輯
- 支援未來擴充不同語言標準版本

## [1.0.6] - 2026-01-28

### 新增功能 🎉
- **改進的自動編碼偵測** - 四階段智慧轉換流程
  - ✅ 先偵測編碼（UTF-8/Big5/GBK/BOM）
  - ✅ 多重嘗試解碼（按優先級嘗試多種編碼）
  - ✅ 驗證解碼品質（檢查替換字元比例 <5%）
  - ✅ 只有確認成功才寫入檔案
- **手動編碼轉換命令** - 新增右鍵選單功能
  - `轉換編碼為 UTF-8 (相容AI)` - 將 Big5 檔案轉為 UTF-8
  - `轉換編碼為 Big5 (相容Dev-C++)` - 將 UTF-8 檔案轉回 Big5
- **UTF-8 編譯器支援** - 自動加入 `-finput-charset=utf-8 -fexec-charset=utf-8` 參數
- **完整單元測試框架** - 使用 Mocha + VS Code Test API
  - 80 個測試案例全部通過 ✅
  - 10 個測試套件涵蓋所有核心功能
  - 包含編碼偵測、多重嘗試、品質驗證、整合測試
- **測試文檔** - 新增完整的測試文檔和快速入門指南
- **CI/CD 配置** - GitHub Actions 自動化測試

### 改進 ✨
- 編譯命令自動使用 UTF-8 編碼設定
- 終端機執行前自動設定 UTF-8（`chcp 65001 >nul 2>&1`）
- 同時支援 PowerShell 和 CMD 終端機
- 自動使用使用者的預設終端機設定
- 改善中文註解和輸出的顯示

### 配置選項 ⚙️
- `cpp-smart-runner.autoConvertEncoding` - 編譯前自動轉換編碼（預設：true）

### 技術細節 🔧
- 使用 `iconv-lite` 進行穩定的編碼轉換
- 使用 TextDecoder 的 fatal 模式進行嚴格的 UTF-8 偵測
- 啟發式算法偵測 Big5/GBK（基於位元組範圍特徵）
- 替換字元比例驗證（<5% 閾值）確保解碼品質
- 多重編碼嘗試機制（detectEncoding → [big5, gbk, cp950]）
- 測試框架支援跨平台測試（Windows/Linux/macOS）

### 測試覆蓋 🧪
- Encoding Detection Test Suite (7 tests)
- UTF-8 Validation Test Suite (6 tests)
- Multi-Encoding Decode with Fallback Test Suite (7 tests)
- Encoding Detection Integration Test Suite (5 tests)
- 其他測試套件（檔案操作、TextEncoder/Decoder、邊界情況等）
- 總計 80 個測試案例，全部通過 ✅

### 文檔更新 📚
- 新增 `ENCODING-FEATURE.md` - 編碼功能詳細說明
- 新增 `TESTING.md` - 完整測試文檔
- 新增 `TESTING-QUICKSTART.md` - 測試快速入門
- 新增 `TEST-SUMMARY.md` - 測試總結
- 新增 `TESTING-ARCHITECTURE.md` - 測試架構圖
- 更新 `README.md` - 加入編碼轉換和測試說明

### 開發工具 🛠️
- 新增 `build-vsix.bat` - 自動化 VSIX 打包腳本
- 新增 `run-tests.bat` - 測試執行腳本
- 新增 `install-test-deps.bat` - 測試依賴安裝腳本
- 新增 `.vscode/launch.json` - 測試除錯配置
- 新增 `.github/workflows/test.yml` - CI/CD 配置

### 依賴更新 📦
- 新增 `iconv-lite@^0.6.3` - 編碼轉換
- 新增 `mocha@^10.3.0` - 測試框架
- 新增 `@vscode/test-electron@^2.3.9` - VS Code 測試工具
- 新增 `glob@^10.3.10` - 檔案搜尋
- 新增 `@types/mocha@^10.0.6` - Mocha 型別定義
- 新增 `@types/glob@^8.1.0` - Glob 型別定義

## [1.0.5] - 2025-12-15

### 改進
- 優化編譯輸出訊息
- 改善錯誤處理

## [1.0.4] - 2025-11-20

### 修正
- 修正變數替換的邊界情況
- 改善 Windows 路徑處理

## [1.0.3] - 2025-10-10

### 新增
- 新增自訂命令支援
- 改善除錯輸出

## [1.0.2] - 2025-09-05

### 改進
- 優化編譯流程
- 改善警告顯示

## [1.0.1] - 2025-08-01

### 修正
- 修正初始版本的小問題

## [1.0.0] - 2025-07-15

### 初始版本
- 基本的編譯和執行功能
- 檔案時間戳記檢查
- 右鍵選單整合
- 可自訂編譯器設定

---

## 版本說明

### 版本號格式：主版本.次版本.修訂版本

- **主版本**：不相容的 API 變更
- **次版本**：向後相容的功能新增
- **修訂版本**：向後相容的問題修正

### 變更類型

- **新增** - 新功能
- **改進** - 現有功能的改進
- **修正** - 錯誤修正
- **移除** - 移除的功能
- **安全性** - 安全性相關的修正

## 升級指南

### 升級至 1.0.6

1. **安裝新版本**
   ```bash
   code --install-extension cpp-smart-runner-1.0.6.vsix
   ```

2. **新功能**
   - 編碼轉換功能會自動啟用
   - 右鍵選單會出現新的編碼轉換選項
   - 如不需要自動轉換，可在設定中關閉 `autoConvertEncoding`

3. **相容性**
   - 完全向後相容 1.0.5 版本
   - 所有現有功能保持不變
   - 新增的功能不影響原有使用方式

4. **建議動作**
   - 如果遇到中文亂碼問題，可使用右鍵選單的編碼轉換功能
   - 建議搭配 Git 使用，以便在編碼轉換後可以恢復

## 回報問題

如果發現任何問題，請在 [GitHub Issues](https://github.com/hueyanchen/cpp-smart-runner/issues) 回報。

## 貢獻

歡迎提交 Pull Request！請確保：
- 所有測試通過 (`npm test`)
- 遵循現有的程式碼風格
- 更新相關文檔
