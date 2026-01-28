# 測試快速入門

## 🚀 快速開始

### 1. 安裝並執行測試（3 步驟）

```bash
# Step 1: 安裝依賴
npm install

# Step 2: 編譯程式碼
npm run compile

# Step 3: 執行測試
npm test
```

### Windows 使用者快速方式
```cmd
雙擊 run-tests.bat
```

## 📊 測試結果預覽

執行成功後會看到類似輸出：

```
C/C++ Smart Runner Test Suite

✓ Extension should be present (45ms)
✓ Extension should activate (120ms)
✓ All commands should be registered (30ms)
✓ Should have default configuration values (15ms)
✓ Should detect UTF-8 encoding (8ms)
✓ Should detect non-UTF-8 encoding (7ms)
...

50 passing (2.5s)
```

## 🎯 在 VS Code 中執行測試

### 方法 1：使用 F5 快捷鍵
1. 開啟專案
2. 按 `F5`
3. 選擇「Extension Tests」
4. 查看測試結果

### 方法 2：使用測試側邊欄
1. 點擊 VS Code 左側的「測試」圖示（燒杯圖示）
2. 展開測試樹
3. 點擊任意測試旁的「▶」按鈕

### 方法 3：使用命令面板
1. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
2. 輸入「Test: Run All Tests」
3. Enter

## 🐛 除錯測試

### 設置中斷點
1. 在測試檔案中點擊行號左側設置紅點
2. 按 `F5` 選擇「Extension Tests」
3. 測試執行到中斷點時會暫停
4. 可以檢視變數、單步執行等

### 除錯單一測試
1. 在測試檔案中找到要除錯的測試
2. 在測試函式內設置中斷點
3. 按 `F5` 啟動除錯
4. 或在測試側邊欄右鍵測試 → 「除錯測試」

## 📝 編寫新測試

### 基本範例

在 `src/test/suite/` 新增檔案 `mytest.test.ts`：

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Test Suite', () => {
    test('My first test', () => {
        // Arrange
        const expected = 42;
        
        // Act
        const actual = 21 + 21;
        
        // Assert
        assert.strictEqual(actual, expected);
    });
    
    test('Should test VS Code API', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.length > 0);
    });
});
```

### 測試非同步操作

```typescript
test('Should handle async operations', async () => {
    const result = await someAsyncFunction();
    assert.ok(result);
});
```

### 測試檔案操作

```typescript
import * as fs from 'fs';
import * as path from 'path';

test('Should create file', () => {
    const testFile = path.join(__dirname, 'temp.txt');
    fs.writeFileSync(testFile, 'test content');
    
    assert.ok(fs.existsSync(testFile));
    
    // 清理
    fs.unlinkSync(testFile);
});
```

## 🔍 常用斷言

```typescript
// 相等性
assert.strictEqual(actual, expected);
assert.notStrictEqual(actual, notExpected);

// 深度相等（物件比較）
assert.deepStrictEqual(actualObj, expectedObj);

// 真假值
assert.ok(value); // value 是 truthy
assert.strictEqual(value, true); // value 嚴格等於 true

// 包含測試
assert.ok(str.includes('substring'));
assert.ok(array.includes(item));

// 異常測試
assert.throws(() => {
    throw new Error('Expected error');
});

assert.doesNotThrow(() => {
    // 安全的程式碼
});

// 範圍測試
assert.ok(value > 0);
assert.ok(value < 100);
```

## 🛠️ 測試結構

```typescript
suite('測試套件名稱', () => {
    // 每個測試前執行
    setup(() => {
        // 初始化
    });
    
    // 每個測試後執行
    teardown(() => {
        // 清理
    });
    
    test('測試 1', () => {
        // 測試邏輯
    });
    
    test('測試 2', async () => {
        // 非同步測試
    });
});
```

## 📦 測試檔案放置位置

```
src/test/
├── suite/
│   ├── extension.test.ts      # 擴充套件核心測試
│   ├── integration.test.ts    # 整合測試
│   ├── encoding.test.ts       # 編碼測試
│   └── [your-test].test.ts    # 👈 你的新測試
└── fixtures/
    └── [test-files]           # 測試用的檔案
```

## ⚡ 快速測試指令

```bash
# 編譯並測試
npm run test:unit

# 只編譯
npm run compile

# 監看模式（自動重新編譯）
npm run watch

# Lint 檢查
npm run lint
```

## 🎓 測試最佳實踐

### ✅ 好的測試
```typescript
test('Should calculate sum of two positive numbers', () => {
    const result = add(2, 3);
    assert.strictEqual(result, 5);
});
```

### ❌ 不好的測試
```typescript
test('test1', () => {
    const x = doSomething();
    assert.ok(x); // 不清楚測試什麼
});
```

### 測試命名規則
- 使用描述性名稱
- 說明「應該做什麼」
- 英文使用 "Should ..." 開頭
- 中文使用「應該...」開頭

### 測試獨立性
```typescript
// ❌ 不好：測試之間有依賴
let sharedState;
test('test1', () => { sharedState = 1; });
test('test2', () => { assert.ok(sharedState); });

// ✅ 好：每個測試獨立
test('test1', () => {
    const state = 1;
    assert.ok(state);
});
```

## 🔧 故障排除

### 問題：測試找不到模組
```bash
# 解決方案
rm -rf node_modules
npm install
```

### 問題：TypeScript 編譯錯誤
```bash
# 解決方案
npm run compile
# 檢查錯誤訊息並修正
```

### 問題：測試超時
```typescript
// 增加超時時間
test('Long test', function() {
    this.timeout(10000); // 10 秒
    // 測試邏輯
});
```

### 問題：VS Code 沒有顯示測試
1. 重新載入視窗：`Ctrl+R`
2. 確認測試檔案名稱以 `.test.ts` 結尾
3. 確認已編譯：`npm run compile`

## 📚 更多資源

- [完整測試文檔](TESTING.md)
- [測試總結](TEST-SUMMARY.md)
- [VS Code 測試 API](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Mocha 文檔](https://mochajs.org/)

## 💡 提示

1. **頻繁執行測試**：在修改程式碼後立即執行測試
2. **使用監看模式**：`npm run watch` 自動編譯
3. **測試優先**：先寫測試，再寫實作（TDD）
4. **保持測試簡單**：一個測試只測一件事
5. **命名清楚**：讓測試名稱自我解釋

## 🎉 開始測試！

現在你已經準備好開始測試了！

```bash
# 立即執行
npm test
```

或在 VS Code 按 `F5` 選擇「Extension Tests」！
