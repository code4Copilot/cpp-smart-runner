# C/C++ Smart Runner

[![Version](https://img.shields.io/badge/version-1.0.6-blue.svg)](https://github.com/hueyanchen/cpp-smart-runner)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.md)

一個智慧的 VS Code 擴充套件，專門用於安全地編譯和執行 C/C++ 程式，具備檔案時間戳記檢查和自動編碼轉換功能。

## ✨ 版本 1.0.6 新功能

- 🎯 **改進的編碼偵測** - 先偵測 → 多重嘗試 → 驗證品質 → 確認寫入
  - 支援 UTF-8/Big5/GBK 自動偵測
  - 多重編碼嘗試解碼機制
  - 替換字元比例驗證（<5%）
  - 只有確認成功才寫入檔案
- 🔄 **手動編碼轉換** - 右鍵選單支援 UTF-8 ↔ Big5 雙向轉換
- 🧪 **完整測試框架** - 80 個測試案例全部通過
- 📝 **UTF-8 編譯支援** - 自動加入編譯器 UTF-8 參數
- 🌐 **相容性提升** - 完美支援 Dev-C++ 與 VS Code 之間的檔案轉換

詳細更新內容請參閱 [CHANGELOG.md](CHANGELOG.md)。

## 功能特色

✅ **分離的編譯和執行命令** - 可以單獨編譯或執行程式  
✅ **時間戳記檢查** - 自動偵測執行檔是否比原始碼舊  
✅ **智慧警告** - 當要執行舊版本時顯示警告訊息  
✅ **編譯錯誤檢查** - 只有編譯成功才會執行  
✅ **自動編碼轉換** - 自動偵測並轉換 ANSI/Big5 檔案為 UTF-8  
✅ **手動編碼轉換** - 支援 UTF-8 ↔ Big5 雙向轉換  
✅ **可自訂設定** - 支援自訂編譯器、編譯參數等  

## 安裝需求

- Visual Studio Code 1.75.0 或更新版本
- GCC/G++ 編譯器 (已安裝並加入 PATH)

## 使用方式

### 命令

1. **C/C++: 編譯程式** (`Ctrl+Alt+C` / `Cmd+Alt+C`)
   - 只編譯當前的 C/C++ 檔案
   - 顯示編譯結果和錯誤訊息

2. **C/C++: 執行程式** (`Ctrl+Alt+R` / `Cmd+Alt+R`)
   - 執行已編譯的程式
   - 自動檢查執行檔是否比原始碼新
   - 如果執行檔不存在或過舊，會提示重新編譯

3. **C/C++: 編譯並執行** (`Ctrl+Alt+B` / `Cmd+Alt+B`)
   - 先編譯，成功後自動執行
   - 跳過時間戳記檢查（因為是剛編譯的）

4. **轉換編碼為 UTF-8 (相容AI)**
   - 將 ANSI/Big5 編碼的檔案轉換為 UTF-8
   - 適用於從 Dev-C++ 匯入的程式
   - 讓 GitHub Copilot 等 AI 工具正確辨識中文註解

5. **轉換編碼為 Big5 (相容Dev-C++)**
   - 將 UTF-8 編碼的檔案轉換為 Big5
   - 適用於需要在 Dev-C++ 開啟的程式
   - 確保在傳統環境中正常顯示中文

### 右鍵選單

在 C/C++ 檔案的編輯器中按右鍵，可以看到上述所有命令。

## 設定選項

### 預設設定（Windows 適用）

本延伸模組會根據檔案類型自動選擇編譯器：

- **C 語言 (.c)**：使用 `gcc` 編譯
- **C++ 語言 (.cpp, .cxx, .cc)**：使用 `g++` 編譯

預設編譯命令（Windows）：
```
chcp 65001 > nul && gcc "檔案.c" -o "檔案.exe"
chcp 65001 > nul && g++ "檔案.cpp" -o "檔案.exe"
```

預設執行命令：
```
"檔案.exe"
```

執行時會自動：
1. 清除終端機（`cls`）
2. 設定 UTF-8 編碼（`chcp 65001 >nul 2>&1`）- 同時支援 PowerShell 和 CMD
3. 執行程式

**終端機相容性**：
- ✅ Windows PowerShell
- ✅ Command Prompt (CMD)
- ✅ 自動使用您的預設終端機設定

### 自訂編譯命令

如果需要自訂編譯命令，可以在設定中配置：

```json
{
  "cpp-smart-runner.customCompileCommand": "chcp 65001 > nul && gcc \"$fullFileName\" -o \"$dir/$fileNameWithoutExt.exe\" -Wall -std=c11"
}
```

**注意**：設定自訂命令後，將不會自動區分 C/C++，請自行在命令中指定編譯器。

### 其他可用設定

在 VS Code 設定中可以自訂以下選項：

### 基本設定

```json
{
  "cpp-smart-runner.compilerPath": "",
  "cpp-smart-runner.compilerFlags": "-Wall -std=c++17",
  "cpp-smart-runner.outputDir": "",
  "cpp-smart-runner.clearTerminal": true,
  "cpp-smart-runner.saveBeforeCompile": true,
  "cpp-smart-runner.showExecutionMessage": true,
  "cpp-smart-runner.autoConvertEncoding": true
}
```

### 自訂命令設定（進階）

```json
{
  "cpp-smart-runner.useCustomCommand": true,
  "cpp-smart-runner.customCompileCommand": "g++ \"$fullFileName\" -o \"$dir/$fileNameWithoutExt\" -Wall -std=c++20",
  "cpp-smart-runner.customRunCommand": "\"$dir/$fileNameWithoutExt\""
}
```

### 設定說明

**基本設定：**
- **customCompileCommand**: 自訂編譯命令（留空則自動根據語言選擇 gcc/g++）
- **customRunCommand**: 自訂執行命令（預設：`"$dir/$fileNameWithoutExt.exe"`）
- **compilerPath**: 編譯器路徑（已廢棄，請使用 customCompileCommand）
- **compilerFlags**: 編譯器額外參數（當未設定 customCompileCommand 時可用）
- **outputDir**: 輸出目錄（已廢棄，請使用 customCompileCommand）
- **clearTerminal**: 執行前是否清除終端機（預設：true）
- **saveBeforeCompile**: 編譯前自動儲存檔案（預設：true）
- **showExecutionMessage**: 顯示執行訊息（預設：true）
- **autoConvertEncoding**: 編譯前自動偵測並轉換 ANSI/Big5 檔案為 UTF-8（預設：true）

**自訂命令設定：**
- **customCompileCommand**: 自訂編譯命令（留空使用預設）
- **customRunCommand**: 自訂執行命令（留空使用預設）

### 可用的變數

在自訂命令中可以使用以下變數：

| 變數 | 說明 | 範例 |
|------|------|------|
| `$fileName` | 檔名（含副檔名） | `test.cpp` |
| `$fileNameWithoutExt` | 檔名（不含副檔名） | `test` |
| `$dir` | 檔案所在目錄 | `/home/user/project` |
| `$fullFileName` | 完整檔案路徑 | `/home/user/project/test.cpp` |
| `$workspaceFolder` | 工作區資料夾 | `/home/user/project` |

### 自訂命令範例

#### 範例 1：加入 C 語言編譯參數
```json
{
  "cpp-smart-runner.compilerFlags": "-Wall -std=c11"
}
```

#### 範例 2：加入 C++ 編譯參數
```json
{
  "cpp-smart-runner.compilerFlags": "-Wall -std=c++17"
}
```

#### 範例 3：完全自訂 C 編譯命令
```json
{
  "cpp-smart-runner.customCompileCommand": "chcp 65001 > nul && gcc \"$fullFileName\" -o \"$dir/$fileNameWithoutExt.exe\" -Wall -Wextra -std=c11"
}
```

#### 範例 4：完全自訂 C++ 編譯命令
```json
{
  "cpp-smart-runner.customCompileCommand": "chcp 65001 > nul && g++ \"$fullFileName\" -o \"$dir/$fileNameWithoutExt.exe\" -Wall -std=c++20"
}
```

#### 範例 5：輸出到 build 目錄
```json
{
  "cpp-smart-runner.customCompileCommand": "chcp 65001 > nul && g++ \"$fullFileName\" -o \"$workspaceFolder/build/$fileNameWithoutExt.exe\"",
  "cpp-smart-runner.customRunCommand": "\"$workspaceFolder/build/$fileNameWithoutExt.exe\""
}
```

#### 範例 6：Linux/Mac 使用者
```json
{
  "cpp-smart-runner.customCompileCommand": "gcc \"$fullFileName\" -o \"$dir/$fileNameWithoutExt\"",
  "cpp-smart-runner.customRunCommand": "\"$dir/$fileNameWithoutExt\""
}
```

## 專案結構

```
cpp-smart-runner/
├── src/
│   ├── extension.ts          # 主程式碼
│   └── test/                 # 測試目錄
│       ├── runTest.ts        # 測試執行器
│       ├── suite/            # 測試套件
│       │   ├── index.ts      # 測試入口
│       │   ├── extension.test.ts   # 核心功能測試
│       │   ├── integration.test.ts # 整合測試
│       │   └── encoding.test.ts    # 編碼測試
│       └── fixtures/         # 測試檔案
├── .vscode/
│   ├── launch.json           # 除錯配置
│   └── tasks.json            # 任務配置
├── package.json              # 擴充套件設定
├── tsconfig.json             # TypeScript 設定
├── README.md                 # 說明文件
├── TESTING.md                # 測試文檔
└── .vscodeignore            # 打包忽略檔案
```

## 開發與編譯

### 1. 安裝相依套件

```bash
npm install
```

### 2. 編譯 TypeScript

```bash
npm run compile
```

或使用監看模式：

```bash
npm run watch
```

### 3. 執行測試

```bash
# 執行所有測試
npm test

# 或使用批次檔
run-tests.bat
```

測試涵蓋：
- ✅ 擴充套件啟動與命令註冊
- ✅ 配置管理
- ✅ 變數替換功能
- ✅ 編碼偵測與轉換
- ✅ 檔案系統操作
- ✅ 平台相容性
- ✅ 錯誤處理
- ✅ 整合測試

詳細測試文檔請參考 [TESTING.md](TESTING.md)。

### 4. 除錯擴充套件

#### 除錯擴充套件本身
1. 在 VS Code 中開啟此專案
2. 按 `F5` 或選擇「Run Extension」配置
3. 在新開啟的 VS Code 視窗中測試功能

#### 執行測試除錯
1. 選擇「Extension Tests」配置
2. 按 `F5` 啟動測試
3. 可以在測試程式碼中設置中斷點

### 5. 打包擴充套件

首先安裝 vsce（VS Code Extensions 打包工具）：

```bash
npm install -g @vscode/vsce
```

打包成 .vsix 檔案：

```bash
vsce package
```

## 測試

本專案包含完整的單元測試和整合測試。

### 執行測試

```bash
# 執行所有測試
npm test

# 使用 Windows 批次檔
run-tests.bat
```

### 在 VS Code 中執行測試

1. 按 `F5` 選擇「Extension Tests」配置
2. 或使用測試側邊欄執行特定測試

### 測試覆蓋範圍

本專案包含 **80 個完整的單元測試**，涵蓋所有核心功能：

#### 編碼偵測與轉換測試（30+ 測試）
- ✅ **Encoding Detection Test Suite** (7 tests)
  - UTF-8/Big5/GBK 自動偵測
  - UTF-8 BOM 處理
  - 邊界情況處理
  
- ✅ **UTF-8 Validation Test Suite** (6 tests)
  - 嚴格的 UTF-8 序列驗證
  - Big5 位元組識別
  
- ✅ **Multi-Encoding Decode with Fallback Test Suite** (7 tests)
  - 多重編碼嘗試機制
  - 替換字元比例驗證（<5%）
  - 品質檢查機制
  
- ✅ **Encoding Detection Integration Test Suite** (5 tests)
  - 完整的偵測→解碼→驗證→寫入流程
  - Big5 → UTF-8 轉換驗證
  - 內容完整性檢查

#### 其他功能測試（50+ 測試）
- ✅ 擴充套件啟動與命令註冊
- ✅ 配置管理
- ✅ 變數替換功能
- ✅ 檔案系統操作
- ✅ 平台相容性
- ✅ 錯誤處理
- ✅ 整合測試

**測試結果：80 passing (643ms) ✓**

詳細資訊請參考：
- [TESTING.md](TESTING.md) - 完整測試文檔
- [ENCODING-DETECTION-IMPROVEMENTS.md](ENCODING-DETECTION-IMPROVEMENTS.md) - 編碼偵測改進說明

### 6. 安裝擴充套件

方法一：透過 VS Code
1. 開啟 VS Code
2. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
3. 輸入 "Extensions: Install from VSIX..."
4. 選擇打包好的 .vsix 檔案

方法二：透過命令列
```bash
code --install-extension cpp-smart-runner-1.0.0.vsix
```

## 使用範例

### 範例 1：基本使用流程

1. 開啟一個 C++ 檔案（例如 `hello.cpp`）
2. 按 `Ctrl+Alt+C` 編譯
3. 按 `Ctrl+Alt+R` 執行

### 範例 2：修改後執行

1. 修改程式碼但忘記重新編譯
2. 按 `Ctrl+Alt+R` 執行
3. 看到警告：「⚠️ 執行檔比原始檔舊」
4. 選擇「重新編譯並執行」

### 範例 3：快速開發

1. 直接按 `Ctrl+Alt+B`（編譯並執行）
2. 如果編譯成功，自動執行最新版本

## 常見問題

**Q: 找不到編譯器？**  
A: 確保 GCC/G++ 已安裝並加入系統 PATH。可以在終端機執行 `gcc --version` 或 `g++ --version` 測試。

**Q: 想使用不同的編譯器？**  
A: 在設定中修改 `cpp-smart-runner.compilerPath`，例如設定為 `clang++`。

**Q: 如何更改編譯參數？**  
A: 修改 `cpp-smart-runner.compilerFlags` 設定，例如 `-Wall -std=c++20 -O2`。

**Q: 執行檔要放在特定目錄？**  
A: 設定 `cpp-smart-runner.outputDir` 為你想要的目錄路徑。

**Q: 中文註解出現亂碼怎麼辦？**  
A: 這個擴充套件會自動偵測並轉換編碼。如果還是有問題，可以右鍵選擇「轉換編碼為 UTF-8 (相容AI)」手動轉換。

**Q: 從 Dev-C++ 匯入的程式碼出現亂碼？**  
A: Dev-C++ 使用 Big5 編碼，而 VS Code 使用 UTF-8。本擴充套件會在編譯前自動轉換，你也可以手動轉換。

**Q: 要把程式拿回 Dev-C++ 使用？**  
A: 右鍵選擇「轉換編碼為 Big5 (相容Dev-C++)」，檔案就可以在 Dev-C++ 正常開啟。

**Q: 自動編碼轉換可以關閉嗎？**  
A: 可以，將 `cpp-smart-runner.autoConvertEncoding` 設為 `false` 即可關閉自動轉換。

## 編碼轉換功能

### 為什麼需要編碼轉換？

許多 C 語言初學者會遇到以下困擾：
- 從 Dev-C++ 複製程式碼到 VS Code，中文註解變成亂碼
- GitHub Copilot 產生的中文註解在 Dev-C++ 無法正常顯示
- 編譯後執行時，`printf` 輸出的中文亂碼

這些問題的根源是**編碼不一致**：
- **Dev-C++** 使用 Big5（ANSI）編碼
- **VS Code / GitHub Copilot** 使用 UTF-8 編碼

### 解決方案

本擴充套件提供完整的編碼解決方案：

#### 1. 自動編碼轉換（預設啟用）
編譯前自動偵測檔案編碼，若為 Big5/ANSI 則自動轉換為 UTF-8。學生無需手動操作，直接編譯即可。

#### 2. 手動編碼轉換（右鍵選單）
- **轉換為 UTF-8**：讓 AI 工具正確辨識，避免亂碼
- **轉換為 Big5**：讓 Dev-C++ 正常開啟檔案

#### 3. UTF-8 編譯支援
編譯時自動加入 `-finput-charset=utf-8 -fexec-charset=utf-8` 參數，確保編譯器正確處理 UTF-8 檔案。

#### 4. 終端機 UTF-8 支援
執行前自動執行 `chcp 65001`，讓 Windows 終端機正確顯示中文輸出。

### 使用情境

#### 情境 1：從 Dev-C++ 匯入專案
```
1. 在 Dev-C++ 撰寫程式（Big5 編碼）
2. 複製到 VS Code 開啟
3. 點擊「編譯並執行」
   → 自動偵測並轉換為 UTF-8
   → 正常編譯執行，中文正確顯示
```

#### 情境 2：使用 AI 工具開發
```
1. 使用 GitHub Copilot 產生含中文註解的程式碼（UTF-8）
2. 直接儲存並執行
   → 搭配 UTF-8 設定，終端機正確顯示中文
```

#### 情境 3：需要回到 Dev-C++
```
1. 在 VS Code 完成開發（UTF-8）
2. 右鍵選單 → 「轉換編碼為 Big5 (相容Dev-C++)」
3. 檔案轉為 Big5 編碼
   → 可在 Dev-C++ 正常開啟和編輯
```

### 技術細節

- **編碼偵測**：使用 TextDecoder 的 fatal 模式嚴格檢查 UTF-8
- **Big5 轉換**：使用 `iconv-lite` 套件進行穩定的編碼轉換
- **編譯器支援**：自動加入 `-finput-charset=utf-8 -fexec-charset=utf-8`
- **終端機設定**：執行前自動 `chcp 65001`

### 注意事項

1. **依賴套件**：編碼轉換功能需要 `iconv-lite` 套件（安裝時會自動安裝）
2. **檔案修改**：編碼轉換會直接寫入原始檔案，建議使用版本控制（Git）
3. **Dev-C++ 限制**：Dev-C++ 僅支援 Big5，無法直接開啟 UTF-8 檔案

## 📋 版本歷史

### 最新版本 v1.0.6 (2026-01-28)

**主要更新**：
- ✅ 新增自動編碼轉換功能
- ✅ 新增手動編碼轉換命令
- ✅ 完整測試框架（50+ 測試案例）
- ✅ UTF-8 編譯器支援
- ✅ 完整測試文檔

查看完整版本歷史：[CHANGELOG.md](CHANGELOG.md)

## 📚 相關文檔

- [CHANGELOG.md](CHANGELOG.md) - 完整更新日誌
- [TESTING.md](TESTING.md) - 測試文檔
- [TESTING-QUICKSTART.md](TESTING-QUICKSTART.md) - 測試快速入門
- [ENCODING-FEATURE.md](ENCODING-FEATURE.md) - 編碼功能詳細說明
- [ENCODING-DETECTION-IMPROVEMENTS.md](ENCODING-DETECTION-IMPROVEMENTS.md) - 編碼偵測改進說明
- [TERMINAL-SUPPORT.md](TERMINAL-SUPPORT.md) - 終端機支援說明 🆕

## 授權

MIT License

## 作者

Hueyan Chen (hueyan.chen@gmail.com)

## 回饋與貢獻

歡迎在 [GitHub](https://github.com/hueyanchen/cpp-smart-runner) 上：
- 🐛 回報問題：[Issues](https://github.com/hueyanchen/cpp-smart-runner/issues)
- 💡 提出建議：[Discussions](https://github.com/hueyanchen/cpp-smart-runner/discussions)
- 🔧 貢獻程式碼：[Pull Requests](https://github.com/hueyanchen/cpp-smart-runner/pulls)

### 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送至分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

請確保：
- ✅ 所有測試通過 (`npm test`)
- ✅ 遵循現有程式碼風格
- ✅ 更新相關文檔

## ⭐ 支持專案

如果這個專案對你有幫助，請給個星星 ⭐！

---

**C/C++ Smart Runner** - 讓 C/C++ 開發更簡單、更智慧  
版本 1.0.6 © 2026 Hueyan Chen