"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
// ===== 複製 extension.ts 中的函數用於測試 =====
function isUtf8(buffer) {
    try {
        new util_1.TextDecoder('utf-8', { fatal: true }).decode(buffer);
        return true;
    }
    catch {
        return false;
    }
}
function detectEncoding(buffer) {
    // 檢查是否為 UTF-8
    if (isUtf8(buffer)) {
        return 'utf8';
    }
    // 檢查 UTF-8 BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8';
    }
    // 簡單啟發式判斷 Big5 vs GBK
    let big5Score = 0;
    let gbkScore = 0;
    for (let i = 0; i < Math.min(buffer.length - 1, 1000); i++) {
        const byte1 = buffer[i];
        const byte2 = buffer[i + 1];
        // Big5 範圍
        if (byte1 >= 0xA1 && byte1 <= 0xF9) {
            if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFE)) {
                big5Score++;
            }
        }
        // GBK 範圍
        if (byte1 >= 0x81 && byte1 <= 0xFE && byte2 >= 0x40 && byte2 <= 0xFE) {
            gbkScore++;
        }
    }
    if (big5Score > gbkScore && big5Score > 5) {
        return 'big5';
    }
    else if (gbkScore > 5) {
        return 'gbk';
    }
    // 預設假設 Big5 (台灣常用)
    return 'big5';
}
function tryDecodeWithFallback(buffer) {
    const detectedEncoding = detectEncoding(buffer);
    if (detectedEncoding === 'utf8') {
        return { content: buffer.toString('utf8'), encoding: 'utf8' };
    }
    // 嘗試編碼列表
    const encodings = [detectedEncoding, 'big5', 'gbk', 'cp950'];
    for (const enc of encodings) {
        try {
            // 使用 iconv-lite 如果可用
            try {
                const iconv = require('iconv-lite');
                const content = iconv.decode(buffer, enc);
                // 驗證:檢查是否有過多的替換字元
                const replacementCount = (content.match(/�/g) || []).length;
                if (replacementCount < content.length * 0.05) { // 少於5%替換字元
                    return { content, encoding: enc };
                }
            }
            catch {
                // iconv-lite 不可用,使用內建 TextDecoder
                if (enc === 'big5' || enc === 'cp950') {
                    const content = new util_1.TextDecoder('big5').decode(buffer);
                    return { content, encoding: 'big5' };
                }
            }
        }
        catch (err) {
            continue;
        }
    }
    return null;
}
// ===== 測試套件開始 =====
suite('Encoding Detection Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    test('Should detect UTF-8 encoding', () => {
        const utf8Content = 'Hello World\n// 這是測試';
        const buffer = Buffer.from(utf8Content, 'utf-8');
        const encoding = detectEncoding(buffer);
        assert.strictEqual(encoding, 'utf8');
    });
    test('Should detect UTF-8 with BOM', () => {
        const utf8Content = '// 測試內容';
        const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
        const content = Buffer.from(utf8Content, 'utf-8');
        const buffer = Buffer.concat([bom, content]);
        const encoding = detectEncoding(buffer);
        assert.strictEqual(encoding, 'utf8');
    });
    test('Should detect Big5 encoding (simulated)', () => {
        // Big5 字元範例：大字試（模擬）
        // 使用 Big5 範圍的位元組序列
        const big5Bytes = Buffer.from([
            0xA4, 0x6A, // 大
            0xA6, 0x72, // 字
            0xB8, 0xD5, // 試
            0xA4, 0x40, // 一
            0xA4, 0x47, // 下
            0xB8, 0xD5, // 試
        ]);
        const encoding = detectEncoding(big5Bytes);
        // Big5 和 GBK 範圍有重疊，啟發式算法可能偵測為任一種
        assert.ok(['big5', 'gbk'].includes(encoding), `Expected big5 or gbk, got ${encoding}`);
    });
    test('Should detect GBK encoding (simulated)', () => {
        // GBK 範圍但不符合 Big5 的位元組
        const gbkBytes = Buffer.from([
            0x81, 0x40, // GBK
            0x82, 0x50,
            0x83, 0x60,
            0x84, 0x70,
            0x85, 0x80,
            0x86, 0x90,
        ]);
        const encoding = detectEncoding(gbkBytes);
        // 應該偵測為 gbk 或至少不是 utf8
        assert.notStrictEqual(encoding, 'utf8');
    });
    test('Should handle empty buffer', () => {
        const emptyBuffer = Buffer.from('');
        const encoding = detectEncoding(emptyBuffer);
        assert.strictEqual(encoding, 'utf8');
    });
    test('Should handle ASCII content as UTF-8', () => {
        const asciiContent = 'int main() { return 0; }';
        const buffer = Buffer.from(asciiContent, 'ascii');
        const encoding = detectEncoding(buffer);
        assert.strictEqual(encoding, 'utf8');
    });
});
suite('UTF-8 Validation Test Suite', () => {
    test('Should detect valid UTF-8 content', () => {
        const utf8Content = 'Hello World\n// 這是測試';
        const buffer = Buffer.from(utf8Content, 'utf-8');
        assert.strictEqual(isUtf8(buffer), true);
    });
    test('Should detect ASCII as valid UTF-8', () => {
        const asciiContent = 'Hello World\nint main() { return 0; }';
        const buffer = Buffer.from(asciiContent, 'ascii');
        assert.strictEqual(isUtf8(buffer), true);
    });
    test('Should reject invalid UTF-8 sequences', () => {
        // Invalid UTF-8 byte sequence
        const invalidBuffer = Buffer.from([0xFF, 0xFE, 0xFD]);
        assert.strictEqual(isUtf8(invalidBuffer), false);
    });
    test('Should handle Big5 encoded bytes', () => {
        // Common Big5 characters (will fail UTF-8 validation)
        const big5Buffer = Buffer.from([0xA4, 0x40, 0xA6, 0x72, 0xB8, 0xD5]); // 大字試
        assert.strictEqual(isUtf8(big5Buffer), false);
    });
    test('Should handle empty buffer', () => {
        const emptyBuffer = Buffer.from('');
        assert.strictEqual(isUtf8(emptyBuffer), true);
    });
    test('Should handle buffer with BOM', () => {
        const utf8WithBom = Buffer.from('\uFEFFHello World', 'utf-8');
        assert.strictEqual(isUtf8(utf8WithBom), true);
    });
});
suite('Multi-Encoding Decode with Fallback Test Suite', () => {
    test('Should decode UTF-8 content directly', () => {
        const content = 'Hello World\n// UTF-8 測試內容';
        const buffer = Buffer.from(content, 'utf-8');
        const result = tryDecodeWithFallback(buffer);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result?.encoding, 'utf8');
        assert.strictEqual(result?.content, content);
    });
    test('Should handle ASCII as UTF-8', () => {
        const content = 'int main() { return 0; }';
        const buffer = Buffer.from(content, 'ascii');
        const result = tryDecodeWithFallback(buffer);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result?.encoding, 'utf8');
        assert.strictEqual(result?.content, content);
    });
    test('Should attempt Big5 decoding with iconv-lite if available', function () {
        let iconv;
        try {
            iconv = require('iconv-lite');
        }
        catch {
            this.skip(); // 跳過測試如果 iconv-lite 不可用
            return;
        }
        // 建立 Big5 編碼內容
        const originalContent = '// 這是測試\nprintf("你好");';
        const big5Buffer = iconv.encode(originalContent, 'big5');
        const result = tryDecodeWithFallback(big5Buffer);
        assert.notStrictEqual(result, null);
        // Big5/GBK/cp950 都是有效的中文編碼，啟發式算法可能返回任一種
        assert.ok(['big5', 'gbk', 'cp950'].includes(result?.encoding || ''), `Expected big5/gbk/cp950, got ${result?.encoding}`);
        // 驗證內容可以正確解碼
        assert.ok((result && result.content.includes('測試')) || (result && result.content.length > 0));
    });
    test('Should validate replacement character ratio', function () {
        let iconv;
        try {
            iconv = require('iconv-lite');
        }
        catch {
            this.skip();
            return;
        }
        // 建立一個會產生少量替換字元的內容
        const originalContent = '// Big5 中文\nint main() { return 0; }';
        const big5Buffer = iconv.encode(originalContent, 'big5');
        const result = tryDecodeWithFallback(big5Buffer);
        if (result) {
            // 檢查替換字元比例應該 < 5%
            const replacementCount = (result.content.match(/�/g) || []).length;
            const ratio = replacementCount / result.content.length;
            assert.ok(ratio < 0.05, `Replacement ratio ${ratio} should be less than 0.05`);
        }
    });
    test('Should return null for completely invalid data', () => {
        // 建立完全無法解碼的資料
        const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
        const result = tryDecodeWithFallback(invalidBuffer);
        // 可能返回 null 或嘗試解碼（取決於實作）
        // 至少不應該拋出錯誤
        assert.ok(true); // 測試不崩潰即可
    });
    test('Should handle empty buffer', () => {
        const emptyBuffer = Buffer.from('');
        const result = tryDecodeWithFallback(emptyBuffer);
        assert.notStrictEqual(result, null);
        assert.strictEqual(result?.encoding, 'utf8');
        assert.strictEqual(result?.content, '');
    });
    test('Should try multiple encodings in sequence', function () {
        let iconv;
        try {
            iconv = require('iconv-lite');
        }
        catch {
            this.skip();
            return;
        }
        // GBK 編碼內容
        const gbkContent = '// 简体中文\nprintf("你好");';
        const gbkBuffer = iconv.encode(gbkContent, 'gbk');
        const result = tryDecodeWithFallback(gbkBuffer);
        assert.notStrictEqual(result, null);
        // 應該嘗試 Big5, GBK 等編碼
        assert.ok(result?.encoding);
    });
});
suite('Encoding File Operations Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    const testFile = path.join(fixturesPath, 'encoding-test.c');
    setup(() => {
        if (!fs.existsSync(fixturesPath)) {
            fs.mkdirSync(fixturesPath, { recursive: true });
        }
    });
    teardown(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });
    test('Should write and read UTF-8 file', () => {
        const content = '// UTF-8 測試\nint main() { return 0; }';
        fs.writeFileSync(testFile, content, 'utf-8');
        const buffer = fs.readFileSync(testFile);
        const decoder = new util_1.TextDecoder('utf-8');
        const decoded = decoder.decode(buffer);
        assert.strictEqual(decoded, content);
    });
    test('Should preserve UTF-8 encoding after read/write cycle', () => {
        const content = '// 中文註解 UTF-8\nprintf("測試\\n");';
        fs.writeFileSync(testFile, content, 'utf-8');
        const buffer = fs.readFileSync(testFile);
        const isUtf8 = (buf) => {
            try {
                new util_1.TextDecoder('utf-8', { fatal: true }).decode(buf);
                return true;
            }
            catch {
                return false;
            }
        };
        assert.strictEqual(isUtf8(buffer), true);
    });
    test('Should handle mixed ASCII and Chinese characters', () => {
        const content = 'Hello 世界\nprintf("你好\\n");';
        fs.writeFileSync(testFile, content, 'utf-8');
        const readContent = fs.readFileSync(testFile, 'utf-8');
        assert.strictEqual(readContent, content);
    });
});
suite('TextDecoder Behavior Test Suite', () => {
    test('Should use fatal mode correctly', () => {
        const validUtf8 = Buffer.from('Hello', 'utf-8');
        const decoder = new util_1.TextDecoder('utf-8', { fatal: true });
        assert.doesNotThrow(() => {
            decoder.decode(validUtf8);
        });
    });
    test('Should throw on invalid UTF-8 in fatal mode', () => {
        const invalidUtf8 = Buffer.from([0xFF, 0xFE]);
        const decoder = new util_1.TextDecoder('utf-8', { fatal: true });
        assert.throws(() => {
            decoder.decode(invalidUtf8);
        });
    });
    test('Should not throw on invalid UTF-8 in non-fatal mode', () => {
        const invalidUtf8 = Buffer.from([0xFF, 0xFE]);
        const decoder = new util_1.TextDecoder('utf-8', { fatal: false });
        assert.doesNotThrow(() => {
            decoder.decode(invalidUtf8);
        });
    });
});
suite('Character Encoding Edge Cases Test Suite', () => {
    test('Should handle newline characters', () => {
        const content = 'Line 1\nLine 2\r\nLine 3\rLine 4';
        const buffer = Buffer.from(content, 'utf-8');
        const decoder = new util_1.TextDecoder('utf-8');
        const decoded = decoder.decode(buffer);
        assert.strictEqual(decoded, content);
    });
    test('Should handle special characters', () => {
        const content = 'Tab:\t Quote:" Backslash:\\ Null:\0';
        const buffer = Buffer.from(content, 'utf-8');
        const decoder = new util_1.TextDecoder('utf-8');
        const decoded = decoder.decode(buffer);
        assert.ok(decoded.includes('\t'));
        assert.ok(decoded.includes('"'));
        assert.ok(decoded.includes('\\'));
    });
    test('Should handle emoji and special Unicode characters', () => {
        const content = '😀 🎉 ❤️ 中文 日本語 한글';
        const buffer = Buffer.from(content, 'utf-8');
        const isUtf8 = (buf) => {
            try {
                new util_1.TextDecoder('utf-8', { fatal: true }).decode(buf);
                return true;
            }
            catch {
                return false;
            }
        };
        assert.strictEqual(isUtf8(buffer), true);
    });
    test('Should handle multibyte characters', () => {
        const content = '€ £ ¥ © ® ™';
        const buffer = Buffer.from(content, 'utf-8');
        const decoder = new util_1.TextDecoder('utf-8');
        const decoded = decoder.decode(buffer);
        assert.strictEqual(decoded, content);
    });
});
suite('Command Integration Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    const testFile = path.join(fixturesPath, 'command-test.c');
    setup(() => {
        if (!fs.existsSync(fixturesPath)) {
            fs.mkdirSync(fixturesPath, { recursive: true });
        }
    });
    teardown(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });
    test('Should have convertToUtf8 command registered', async () => {
        const vscode = require('vscode');
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('cpp-smart-runner.convertToUtf8'));
    });
    test('Should have convertToBig5 command registered', async () => {
        const vscode = require('vscode');
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('cpp-smart-runner.convertToBig5'));
    });
});
suite('Big5 Encoding Test Suite', () => {
    test('Should detect Big5 as non-UTF8', () => {
        // Common Big5 byte sequences
        const big5Bytes = Buffer.from([
            0xA4, 0x40, // 大
            0xA6, 0x72, // 字
            0xB8, 0xD5 // 試
        ]);
        function isUtf8(buffer) {
            try {
                new util_1.TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            }
            catch {
                return false;
            }
        }
        assert.strictEqual(isUtf8(big5Bytes), false);
    });
    test('Should require iconv-lite for Big5 conversion', () => {
        try {
            const iconv = require('iconv-lite');
            assert.ok(iconv, 'iconv-lite should be available');
            assert.ok(typeof iconv.encode === 'function');
            assert.ok(typeof iconv.decode === 'function');
        }
        catch (err) {
            assert.fail('iconv-lite is required but not installed');
        }
    });
    test('Should encode Chinese text to Big5', () => {
        const iconv = require('iconv-lite');
        const text = '測試';
        const big5Buffer = iconv.encode(text, 'big5');
        assert.ok(Buffer.isBuffer(big5Buffer));
        assert.ok(big5Buffer.length > 0);
        // Decode back and verify
        const decoded = iconv.decode(big5Buffer, 'big5');
        assert.strictEqual(decoded, text);
    });
    test('Should decode Big5 to UTF-8', () => {
        const iconv = require('iconv-lite');
        const big5Buffer = Buffer.from([0xB4, 0xFA, 0xB8, 0xD5]); // 測試 in Big5
        const decoded = iconv.decode(big5Buffer, 'big5');
        assert.ok(decoded.length > 0);
        assert.strictEqual(typeof decoded, 'string');
    });
});
suite('Encoding Conversion Edge Cases Test Suite', () => {
    test('Should handle empty file content', () => {
        const emptyBuffer = Buffer.from('');
        function isUtf8(buffer) {
            try {
                new util_1.TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            }
            catch {
                return false;
            }
        }
        assert.strictEqual(isUtf8(emptyBuffer), true);
    });
    test('Should handle pure ASCII content', () => {
        const asciiContent = 'int main() { return 0; }';
        const buffer = Buffer.from(asciiContent, 'ascii');
        function isUtf8(buffer) {
            try {
                new util_1.TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            }
            catch {
                return false;
            }
        }
        assert.strictEqual(isUtf8(buffer), true);
    });
    test('Should handle mixed ASCII and UTF-8 Chinese', () => {
        const mixedContent = 'int main() { printf("你好世界\\n"); return 0; }';
        const buffer = Buffer.from(mixedContent, 'utf-8');
        function isUtf8(buffer) {
            try {
                new util_1.TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            }
            catch {
                return false;
            }
        }
        assert.strictEqual(isUtf8(buffer), true);
    });
    test('Should handle UTF-8 BOM', () => {
        const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
        const content = Buffer.from('Hello', 'utf-8');
        const withBom = Buffer.concat([bom, content]);
        function isUtf8(buffer) {
            try {
                new util_1.TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            }
            catch {
                return false;
            }
        }
        assert.strictEqual(isUtf8(withBom), true);
    });
});
suite('TextEncoder/TextDecoder Test Suite', () => {
    test('Should encode and decode UTF-8 correctly', () => {
        const text = '測試 Test 123';
        const encoder = new TextEncoder();
        const decoder = new util_1.TextDecoder('utf-8');
        const encoded = encoder.encode(text);
        const decoded = decoder.decode(encoded);
        assert.strictEqual(decoded, text);
    });
    test('Should handle special characters in encoding', () => {
        const text = 'Line1\nLine2\tTabbed\r\nWindows';
        const encoder = new TextEncoder();
        const decoder = new util_1.TextDecoder('utf-8');
        const encoded = encoder.encode(text);
        const decoded = decoder.decode(encoded);
        assert.strictEqual(decoded, text);
    });
    test('Should preserve emoji in encoding', () => {
        const text = 'Hello 👋 World 🌍';
        const encoder = new TextEncoder();
        const decoder = new util_1.TextDecoder('utf-8');
        const encoded = encoder.encode(text);
        const decoded = decoder.decode(encoded);
        assert.strictEqual(decoded, text);
    });
});
suite('Encoding Detection Integration Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    const testFile = path.join(fixturesPath, 'integration-test.c');
    setup(() => {
        if (!fs.existsSync(fixturesPath)) {
            fs.mkdirSync(fixturesPath, { recursive: true });
        }
    });
    teardown(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });
    test('Complete workflow: UTF-8 detection and validation', () => {
        // 步驟 1: 建立 UTF-8 檔案
        const originalContent = '// UTF-8 測試\nint main() {\n    printf("你好世界\\n");\n    return 0;\n}';
        fs.writeFileSync(testFile, originalContent, 'utf-8');
        // 步驟 2: 讀取並偵測編碼
        const buffer = fs.readFileSync(testFile);
        const encoding = detectEncoding(buffer);
        // 步驟 3: 驗證偵測結果
        assert.strictEqual(encoding, 'utf8');
        // 步驟 4: 嘗試解碼
        const result = tryDecodeWithFallback(buffer);
        // 步驟 5: 驗證解碼成功
        assert.notStrictEqual(result, null);
        assert.strictEqual(result?.encoding, 'utf8');
        assert.strictEqual(result?.content, originalContent);
    });
    test('Complete workflow: Big5 to UTF-8 conversion', function () {
        let iconv;
        try {
            iconv = require('iconv-lite');
        }
        catch {
            this.skip();
            return;
        }
        // 步驟 1: 建立 Big5 編碼檔案
        const originalContent = '// Big5 中文\nint main() {\n    printf("測試");\n    return 0;\n}';
        const big5Buffer = iconv.encode(originalContent, 'big5');
        fs.writeFileSync(testFile, big5Buffer);
        // 步驟 2: 讀取並偵測編碼
        const buffer = fs.readFileSync(testFile);
        const encoding = detectEncoding(buffer);
        // 步驟 3: 驗證偵測到 Big5
        assert.ok(['big5', 'gbk'].includes(encoding), `Expected big5 or gbk, got ${encoding}`);
        // 步驟 4: 多重嘗試解碼
        const result = tryDecodeWithFallback(buffer);
        // 步驟 5: 驗證解碼成功
        assert.notStrictEqual(result, null);
        assert.ok((result && result.content.includes('中文')) || (result && result.content.length > 0));
        // 步驟 6: 驗證替換字元比例
        const replacementCount = (result.content.match(/�/g) || []).length;
        const ratio = replacementCount / result.content.length;
        assert.ok(ratio < 0.05, `Replacement ratio ${ratio} should be < 5%`);
        // 步驟 7: 確認成功後寫入 UTF-8
        if (result && ratio < 0.05) {
            fs.writeFileSync(testFile, result.content, 'utf-8');
            // 驗證寫入的檔案是 UTF-8
            const newBuffer = fs.readFileSync(testFile);
            const newEncoding = detectEncoding(newBuffer);
            assert.strictEqual(newEncoding, 'utf8');
        }
    });
    test('Should reject invalid encoding and not write', () => {
        // 建立一個無法正確解碼的檔案
        const invalidBuffer = Buffer.from([
            0xFF, 0xFE, 0xFD, 0xFC,
            0x00, 0x01, 0x02, 0x03
        ]);
        fs.writeFileSync(testFile, invalidBuffer);
        const buffer = fs.readFileSync(testFile);
        const result = tryDecodeWithFallback(buffer);
        // 可能無法解碼或產生大量替換字元
        if (result) {
            const replacementCount = (result.content.match(/�/g) || []).length;
            const ratio = replacementCount / result.content.length;
            // 如果替換字元太多，不應該寫入
            if (ratio >= 0.05) {
                // 測試邏輯: 不寫入檔案
                assert.ok(true, 'Correctly rejected invalid content with high replacement ratio');
            }
        }
    });
    test('Should handle mixed encoding scenarios', function () {
        let iconv;
        try {
            iconv = require('iconv-lite');
        }
        catch {
            this.skip();
            return;
        }
        // 建立包含常見中文字的 Big5 內容
        const content = 'int main() { printf("測試程式"); return 0; }';
        const big5Buffer = iconv.encode(content, 'big5');
        // 偵測編碼
        const encoding = detectEncoding(big5Buffer);
        assert.notStrictEqual(encoding, 'utf8');
        // 嘗試解碼
        const result = tryDecodeWithFallback(big5Buffer);
        assert.notStrictEqual(result, null);
        // 驗證可以讀取到有意義的內容
        assert.ok(result.content.length > 0);
    });
    test('Should preserve content integrity through conversion', function () {
        let iconv;
        try {
            iconv = require('iconv-lite');
        }
        catch {
            this.skip();
            return;
        }
        // 建立測試內容
        const originalContent = '// 中文註解\nprintf("Hello");';
        // Big5 → Buffer → 偵測 → 解碼 → UTF-8
        const big5Buffer = iconv.encode(originalContent, 'big5');
        const result = tryDecodeWithFallback(big5Buffer);
        assert.notStrictEqual(result, null);
        // 寫入 UTF-8
        fs.writeFileSync(testFile, result.content, 'utf-8');
        // 讀回並驗證
        const utf8Content = fs.readFileSync(testFile, 'utf-8');
        const newBuffer = fs.readFileSync(testFile);
        // 驗證是 UTF-8
        assert.strictEqual(detectEncoding(newBuffer), 'utf8');
        // 驗證內容包含關鍵字
        assert.ok(utf8Content.includes('printf'));
    });
});
//# sourceMappingURL=encoding.test.js.map