# C/C++ Smart Runner - 測試文檔

## 測試概述

本專案包含完整的單元測試和整合測試，確保所有功能正常運作。

## 測試架構

### 測試框架
- **Mocha**: 測試框架
- **VS Code Test API**: VS Code 擴充套件測試工具
- **Node.js Assert**: 斷言庫

### 測試結構
```
src/test/
├── runTest.ts                      # 測試執行器
├── suite/
│   ├── index.ts                    # 測試套件入口
│   ├── extension.test.ts           # 擴充套件核心功能測試
│   ├── integration.test.ts         # 整合測試
│   └── encoding.test.ts            # 編碼轉換測試
└── fixtures/
    ├── test.c                      # C 語言測試檔案
    ├── test.cpp                    # C++ 測試檔案
    └── test-utf8.c                 # UTF-8 編碼測試檔案
```

## 測試套件說明

### 1. Extension Activation Test Suite (擴充套件啟動測試)
測試擴充套件的基本啟動功能：
- ✅ 擴充套件是否存在
- ✅ 擴充套件是否能正確啟動
- ✅ 所有命令是否已註冊

### 2. Configuration Test Suite (配置測試)
測試設定功能：
- ✅ 預設配置值是否正確
- ✅ 配置是否可以更新
- ✅ 配置讀取是否正常

### 3. Variable Replacement Test Suite (變數替換測試)
測試命令中的變數替換功能：
- ✅ `$fileName` 變數替換
- ✅ `$fileNameWithoutExt` 變數替換
- ✅ `$dir` 變數替換
- ✅ `$fullFileName` 變數替換
- ✅ `$workspaceFolder` 變數替換

### 4. Encoding Detection Test Suite (編碼偵測測試)
測試編碼偵測功能：
- ✅ UTF-8 編碼偵測
- ✅ 非 UTF-8 編碼偵測
- ✅ Big5 編碼識別
- ✅ ASCII 編碼處理

### 5. File System Operations Test Suite (檔案系統測試)
測試檔案操作功能：
- ✅ 建立和讀取檔案
- ✅ 檔案修改時間偵測
- ✅ 檔案存在性檢查

### 6. Command Execution Test Suite (命令執行測試)
測試所有註冊的命令：
- ✅ compile 命令
- ✅ run 命令
- ✅ compileAndRun 命令
- ✅ convertToUtf8 命令
- ✅ convertToBig5 命令

### 7. Platform Detection Test Suite (平台偵測測試)
測試跨平台支援：
- ✅ Windows 平台偵測
- ✅ Linux 平台偵測
- ✅ macOS 平台偵測
- ✅ 執行檔副檔名判斷

### 8. Error Handling Test Suite (錯誤處理測試)
測試錯誤處理機制：
- ✅ 遺失檔案處理
- ✅ 檔案副檔名驗證
- ✅ 無效輸入處理

### 9. Integration Test Suite (整合測試)
測試實際使用場景：
- ✅ 開啟 C/C++ 檔案
- ✅ 語言識別
- ✅ 檔案內容讀取

### 10. Encoding Conversion Test Suite (編碼轉換測試)
深入測試編碼轉換功能：
- ✅ UTF-8 檔案讀寫
- ✅ Big5 字元識別
- ✅ 混合字元處理
- ✅ 特殊字元處理
- ✅ Emoji 和 Unicode 字元
- ✅ TextDecoder 行為測試

## 執行測試

### 方法 1：使用 npm 命令

```bash
# 執行所有測試
npm test

# 編譯並執行測試
npm run test:unit
```

### 方法 2：在 VS Code 中執行

1. 按 `F5` 或點擊「執行」→「開始偵錯」
2. 選擇「Extension Tests」配置
3. 測試將在新的 VS Code 視窗中執行

### 方法 3：使用測試視圖

1. 點擊 VS Code 側邊欄的「測試」圖示
2. 展開測試樹狀結構
3. 點擊任意測試或測試套件旁的「執行」按鈕

## 測試輸出

測試執行後會顯示：
- ✅ 通過的測試數量
- ❌ 失敗的測試數量
- ⏱️ 測試執行時間
- 📊 測試覆蓋率資訊

## 新增測試

### 1. 建立新的測試檔案

在 `src/test/suite/` 目錄下建立新檔案，例如 `myfeature.test.ts`：

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Feature Test Suite', () => {
    test('Should do something', () => {
        // 測試邏輯
        assert.strictEqual(1 + 1, 2);
    });
});
```

### 2. 測試檔案命名規則

- 檔案名稱必須以 `.test.ts` 結尾
- 使用描述性的名稱，例如：`compiler.test.ts`, `runner.test.ts`

### 3. 測試套件結構

```typescript
suite('測試套件名稱', () => {
    // 在每個測試前執行
    setup(() => {
        // 初始化邏輯
    });

    // 在每個測試後執行
    teardown(() => {
        // 清理邏輯
    });

    test('測試案例描述', () => {
        // 測試邏輯
        assert.ok(true);
    });
});
```

## 常用斷言

```typescript
// 相等性測試
assert.strictEqual(actual, expected);
assert.deepStrictEqual(actualObject, expectedObject);

// 真值測試
assert.ok(value);
assert.strictEqual(value, true);

// 異常測試
assert.throws(() => { throw new Error('test'); });
assert.doesNotThrow(() => { /* safe code */ });

// 包含測試
assert.ok(string.includes('substring'));
assert.ok(array.includes(item));
```

## 測試最佳實踐

### 1. 測試獨立性
- 每個測試應該獨立運行
- 不依賴其他測試的執行順序
- 使用 `setup()` 和 `teardown()` 清理狀態

### 2. 描述性命名
```typescript
// ✅ 好的命名
test('Should detect UTF-8 encoding correctly', () => { });

// ❌ 不好的命名
test('test1', () => { });
```

### 3. 測試單一職責
```typescript
// ✅ 好的測試
test('Should open C file', () => { });
test('Should detect C language', () => { });

// ❌ 不好的測試（測試太多事情）
test('Should open file and detect language and read content', () => { });
```

### 4. 使用有意義的斷言訊息
```typescript
assert.ok(result, 'Result should not be null');
assert.strictEqual(actual, expected, 'Values should match');
```

## 持續整合 (CI)

### GitHub Actions 設定範例

在 `.github/workflows/test.yml` 中：

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - run: npm install
    - run: npm run compile
    - run: npm test
```

## 測試覆蓋率

目前測試覆蓋以下功能領域：

- ✅ 擴充套件啟動與註冊
- ✅ 配置管理
- ✅ 變數替換
- ✅ 編碼偵測與轉換
- ✅ 檔案系統操作
- ✅ 命令執行
- ✅ 平台相容性
- ✅ 錯誤處理
- ✅ 整合測試

## 故障排除

### 問題：測試無法執行

**解決方案**：
```bash
# 重新安裝依賴
npm install

# 清除並重新編譯
rm -rf out/
npm run compile
```

### 問題：VS Code 測試視窗沒有顯示測試

**解決方案**：
1. 確保已安裝測試依賴：`npm install`
2. 檢查 `.vscode/launch.json` 配置
3. 重新載入 VS Code 視窗

### 問題：測試超時

**解決方案**：
在測試中增加超時時間：
```typescript
suite('My Suite', () => {
    test('Long running test', function() {
        this.timeout(10000); // 10 秒
        // 測試邏輯
    });
});
```

## 相關資源

- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Mocha Documentation](https://mochajs.org/)
- [Node.js Assert Documentation](https://nodejs.org/api/assert.html)

## 貢獻測試

歡迎為專案貢獻更多測試！請確保：

1. 所有新測試都通過
2. 遵循現有的測試結構和命名規則
3. 為新功能撰寫對應的測試
4. 更新測試文檔

## 聯絡資訊

如有測試相關問題，請：
- 查看測試輸出日誌
- 參考本文檔
- 在 GitHub Issues 中回報問題
