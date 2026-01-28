# C/C++ Smart Runner

一個智慧的 VS Code 延伸模組，專門用於安全地編譯和執行 C/C++ 程式，具備檔案時間戳記檢查功能。

## 功能特色

✅ **分離的編譯和執行命令** - 可以單獨編譯或執行程式  
✅ **時間戳記檢查** - 自動偵測執行檔是否比原始碼舊  
✅ **智慧警告** - 當要執行舊版本時顯示警告訊息  
✅ **編譯錯誤檢查** - 只有編譯成功才會執行  
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

### 右鍵選單

在 C/C++ 檔案的編輯器中按右鍵，可以看到上述三個命令。

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
2. 設定 UTF-8 編碼（`chcp 65001`）
3. 執行程式

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
  "cpp-smart-runner.showExecutionMessage": true
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
│   └── extension.ts          # 主程式碼
├── package.json               # 延伸模組設定
├── tsconfig.json              # TypeScript 設定
├── README.md                  # 說明文件
└── .vscodeignore             # 打包忽略檔案
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

### 3. 測試延伸模組

1. 在 VS Code 中開啟此專案
2. 按 `F5` 啟動除錯
3. 在新開啟的 VS Code 視窗中測試功能

### 4. 打包延伸模組

首先安裝 vsce（VS Code Extensions 打包工具）：

```bash
npm install -g @vscode/vsce
```

打包成 .vsix 檔案：

```bash
vsce package
```

### 5. 安裝延伸模組

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

## 授權

MIT License

## 作者

Your Name

## 回饋與貢獻

歡迎在 GitHub 上提出問題或貢獻程式碼。