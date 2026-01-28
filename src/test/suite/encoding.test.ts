import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { TextDecoder } from 'util';

suite('Encoding Conversion Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    function isUtf8(buffer: Buffer): boolean {
        try {
            new TextDecoder('utf-8', { fatal: true }).decode(buffer);
            return true;
        } catch {
            return false;
        }
    }

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
        const decoder = new TextDecoder('utf-8');
        const decoded = decoder.decode(buffer);
        
        assert.strictEqual(decoded, content);
    });

    test('Should preserve UTF-8 encoding after read/write cycle', () => {
        const content = '// 中文註解 UTF-8\nprintf("測試\\n");';
        fs.writeFileSync(testFile, content, 'utf-8');
        
        const buffer = fs.readFileSync(testFile);
        const isUtf8 = (buf: Buffer): boolean => {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(buf);
                return true;
            } catch {
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
        const decoder = new TextDecoder('utf-8', { fatal: true });
        
        assert.doesNotThrow(() => {
            decoder.decode(validUtf8);
        });
    });

    test('Should throw on invalid UTF-8 in fatal mode', () => {
        const invalidUtf8 = Buffer.from([0xFF, 0xFE]);
        const decoder = new TextDecoder('utf-8', { fatal: true });
        
        assert.throws(() => {
            decoder.decode(invalidUtf8);
        });
    });

    test('Should not throw on invalid UTF-8 in non-fatal mode', () => {
        const invalidUtf8 = Buffer.from([0xFF, 0xFE]);
        const decoder = new TextDecoder('utf-8', { fatal: false });
        
        assert.doesNotThrow(() => {
            decoder.decode(invalidUtf8);
        });
    });
});

suite('Character Encoding Edge Cases Test Suite', () => {
    test('Should handle newline characters', () => {
        const content = 'Line 1\nLine 2\r\nLine 3\rLine 4';
        const buffer = Buffer.from(content, 'utf-8');
        const decoder = new TextDecoder('utf-8');
        const decoded = decoder.decode(buffer);
        
        assert.strictEqual(decoded, content);
    });

    test('Should handle special characters', () => {
        const content = 'Tab:\t Quote:" Backslash:\\ Null:\0';
        const buffer = Buffer.from(content, 'utf-8');
        const decoder = new TextDecoder('utf-8');
        const decoded = decoder.decode(buffer);
        
        assert.ok(decoded.includes('\t'));
        assert.ok(decoded.includes('"'));
        assert.ok(decoded.includes('\\'));
    });

    test('Should handle emoji and special Unicode characters', () => {
        const content = '😀 🎉 ❤️ 中文 日本語 한글';
        const buffer = Buffer.from(content, 'utf-8');
        
        const isUtf8 = (buf: Buffer): boolean => {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(buf);
                return true;
            } catch {
                return false;
            }
        };
        
        assert.strictEqual(isUtf8(buffer), true);
    });

    test('Should handle multibyte characters', () => {
        const content = '€ £ ¥ © ® ™';
        const buffer = Buffer.from(content, 'utf-8');
        const decoder = new TextDecoder('utf-8');
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
            0xB8, 0xD5  // 試
        ]);

        function isUtf8(buffer: Buffer): boolean {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            } catch {
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
        } catch (err) {
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
        
        function isUtf8(buffer: Buffer): boolean {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            } catch {
                return false;
            }
        }

        assert.strictEqual(isUtf8(emptyBuffer), true);
    });

    test('Should handle pure ASCII content', () => {
        const asciiContent = 'int main() { return 0; }';
        const buffer = Buffer.from(asciiContent, 'ascii');
        
        function isUtf8(buffer: Buffer): boolean {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            } catch {
                return false;
            }
        }

        assert.strictEqual(isUtf8(buffer), true);
    });

    test('Should handle mixed ASCII and UTF-8 Chinese', () => {
        const mixedContent = 'int main() { printf("你好世界\\n"); return 0; }';
        const buffer = Buffer.from(mixedContent, 'utf-8');
        
        function isUtf8(buffer: Buffer): boolean {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            } catch {
                return false;
            }
        }

        assert.strictEqual(isUtf8(buffer), true);
    });

    test('Should handle UTF-8 BOM', () => {
        const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
        const content = Buffer.from('Hello', 'utf-8');
        const withBom = Buffer.concat([bom, content]);
        
        function isUtf8(buffer: Buffer): boolean {
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(buffer);
                return true;
            } catch {
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
        const decoder = new TextDecoder('utf-8');
        
        const encoded = encoder.encode(text);
        const decoded = decoder.decode(encoded);
        
        assert.strictEqual(decoded, text);
    });

    test('Should handle special characters in encoding', () => {
        const text = 'Line1\nLine2\tTabbed\r\nWindows';
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8');
        
        const encoded = encoder.encode(text);
        const decoded = decoder.decode(encoded);
        
        assert.strictEqual(decoded, text);
    });

    test('Should preserve emoji in encoding', () => {
        const text = 'Hello 👋 World 🌍';
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8');
        
        const encoded = encoder.encode(text);
        const decoded = decoder.decode(encoded);
        
        assert.strictEqual(decoded, text);
    });
});
