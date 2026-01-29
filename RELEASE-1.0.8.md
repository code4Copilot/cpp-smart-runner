# 版本 1.0.8 發布說明

發布日期：2026-01-28

## 🎯 主要改進

### 動態語言標準判斷

本版本優化了編譯器參數架構，實現了更智慧的語言標準管理：

#### 改進前（1.0.7）
- `compilerFlags` 設定包含語言特定標準：`-Wall -std=c11 -O2`
- 需要使用者手動調整不同語言的標準
- C 和 C++ 使用相同的參數配置

#### 改進後（1.0.8）
- `compilerFlags` 設定改為通用參數：`-Wall -O2`
- 程式自動根據檔案類型判斷語言標準：
  - C 檔案（.c）→ 自動加入 `-std=c11`
  - C++ 檔案（.cpp, .cxx, .cc）→ 自動加入 `-std=c++11`
- 編譯命令結構更清晰合理

## 📋 編譯命令結構

### C 檔案編譯命令
```bash
gcc "file.c" -std=c11 -finput-charset=utf-8 -fexec-charset=utf-8 -Wall -O2 -o "file.exe"
```

### C++ 檔案編譯命令
```bash
g++ "file.cpp" -std=c++11 -finput-charset=utf-8 -fexec-charset=utf-8 -Wall -O2 -o "file.exe"
```

### 參數順序邏輯
1. 編譯器（gcc/g++）
2. 原始檔案路徑
3. **語言標準**（-std=c11/-std=c++11）← 動態判斷
4. 編碼參數（-finput-charset, -fexec-charset）
5. 通用編譯參數（-Wall, -O2 等）
6. 輸出檔案（-o）

## 🧪 測試覆蓋

### 新增測試套件：Compiler Flags Test Suite
- ✅ 語言標準判斷測試（C11/C++11）
- ✅ 編譯器選擇測試（gcc/g++）
- ✅ 編譯命令組合測試
- ✅ 參數順序驗證測試
- ✅ 自訂參數處理測試
- ✅ 空白參數處理測試

**總測試數：98 個測試全部通過** ✅

## 💡 使用建議

### 推薦配置方式

#### 方式一：使用預設配置（推薦）
讓程式自動處理語言標準，只設定通用參數：
```json
{
  "cpp-smart-runner.compilerFlags": "-Wall -Wextra -O2 -g"
}
```

#### 方式二：完全自訂
如果需要使用非標準的語言版本：
```json
{
  "cpp-smart-runner.customCompileCommand": "gcc \"$fullFileName\" -std=c17 -finput-charset=utf-8 -fexec-charset=utf-8 -Wall -O2 -o \"$dir/$fileNameWithoutExt.exe\""
}
```

## 🔧 技術細節

### 實作位置
- **配置檔案**：[package.json](package.json#L152-L155)
  - 預設 `compilerFlags` 改為 `-Wall -O2`
- **動態判斷**：[extension.ts](src/extension.ts#L308-L325)
  - 根據 `document.languageId` 判斷語言類型
  - 自動插入對應的語言標準參數

### 核心邏輯
```typescript
// 動態判斷語言標準
const languageId = document.languageId; // 'c' 或 'cpp'
const compiler = languageId === 'cpp' ? 'g++' : 'gcc';
const standardFlag = languageId === 'cpp' ? '-std=c++17' : '-std=c11';

// 組合編譯命令
const compileCmd = `${compiler} "${fileName}" ${standardFlag} -finput-charset=utf-8 -fexec-charset=utf-8 ${compilerFlags} -o "${outputFile}"`;
```

## 📦 升級方式

### 從 1.0.7 升級
1. 更新擴充套件到 1.0.8
2. 檢查 `cpp-smart-runner.compilerFlags` 設定
3. 如果包含 `-std=c11` 或 `-std=c++17`，可以移除（會自動加入）
4. 保留其他通用參數如 `-Wall`, `-O2`, `-g` 等

### 範例調整
**調整前：**
```json
{
  "cpp-smart-runner.compilerFlags": "-Wall -std=c11 -O2"
}
```

**調整後：**
```json
{
  "cpp-smart-runner.compilerFlags": "-Wall -O2"
}
```

## 🎉 優勢

1. **更簡潔的配置**：使用者不需要關心語言標準
2. **更好的相容性**：C 和 C++ 自動使用正確的標準
3. **更易擴充**：未來可輕鬆支援更多語言版本選項
4. **更好的測試**：完整的單元測試確保功能正確性

## 📚 相關文件

- [CHANGELOG.md](CHANGELOG.md) - 完整變更記錄
- [README.md](README.md) - 使用說明和配置範例
- [測試報告](src/test/suite/extension.test.ts#L353-L488) - 編譯器參數測試

---

感謝使用 C/C++ Smart Runner！
