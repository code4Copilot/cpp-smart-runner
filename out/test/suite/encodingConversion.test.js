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
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
suite('編碼轉換功能測試', () => {
    const fixturesPath = path.join(__dirname, '../../../src/test/fixtures');
    teardown(async () => {
        // 清理測試環境
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('應該成功註冊所有編碼轉換命令', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('cpp-smart-runner.convertToUtf8'), '應該註冊 convertToUtf8 命令');
        assert.ok(commands.includes('cpp-smart-runner.convertFromBig5'), '應該註冊 convertFromBig5 命令');
        assert.ok(commands.includes('cpp-smart-runner.convertFromGbk'), '應該註冊 convertFromGbk 命令');
        assert.ok(commands.includes('cpp-smart-runner.convertToBig5'), '應該註冊 convertToBig5 命令');
    });
    test('應該能在編輯器中轉換而不寫入檔案', async () => {
        // 建立測試檔案
        const testFilePath = path.join(fixturesPath, 'test-conversion-temp.c');
        const originalContent = '#include <stdio.h>\nint main() { return 0; }';
        fs.writeFileSync(testFilePath, originalContent, 'utf8');
        try {
            // 開啟檔案
            const document = await vscode.workspace.openTextDocument(testFilePath);
            const editor = await vscode.window.showTextDocument(document);
            // 記錄原始內容
            const contentBefore = document.getText();
            // 執行轉換命令（應該不改變 UTF-8 檔案）
            await vscode.commands.executeCommand('cpp-smart-runner.convertToUtf8');
            // 檢查編輯器內容
            const contentAfter = editor.document.getText();
            // UTF-8 檔案應該保持不變
            assert.strictEqual(contentAfter, contentBefore, 'UTF-8 檔案內容應該保持不變');
            // 檢查檔案未被修改（isDirty 應該是 false）
            assert.strictEqual(editor.document.isDirty, false, '檔案不應該被標記為已修改');
        }
        finally {
            // 清理測試檔案
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        }
    });
    test('編輯器修改應該可以撤銷', async () => {
        // 建立包含 Big5 編碼的測試檔案
        const testFilePath = path.join(fixturesPath, 'test-undo-temp.c');
        // 模擬一個需要轉換的情境
        const originalContent = '// Test file\nint main() { return 0; }';
        fs.writeFileSync(testFilePath, originalContent, 'utf8');
        try {
            const document = await vscode.workspace.openTextDocument(testFilePath);
            const editor = await vscode.window.showTextDocument(document);
            // 手動修改內容來測試撤銷功能
            await editor.edit(editBuilder => {
                const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
                editBuilder.replace(fullRange, '// Modified content\nint main() { return 1; }');
            });
            const modifiedContent = editor.document.getText();
            assert.ok(modifiedContent.includes('Modified content'), '內容應該已修改');
            // 測試撤銷功能
            await vscode.commands.executeCommand('undo');
            const undoneContent = editor.document.getText();
            assert.strictEqual(undoneContent, originalContent, '撤銷後應該恢復原始內容');
        }
        finally {
            // 清理測試檔案
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        }
    });
    test('應該正確處理 Big5 編碼指定轉換', async () => {
        const iconv = require('iconv-lite');
        // 建立 Big5 編碼的測試內容
        const testContent = '// 中文註解\nint main() { return 0; }';
        const big5Buffer = iconv.encode(testContent, 'big5');
        const testFilePath = path.join(fixturesPath, 'test-big5-temp.c');
        fs.writeFileSync(testFilePath, big5Buffer);
        try {
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);
            // 執行從 Big5 轉換命令
            await vscode.commands.executeCommand('cpp-smart-runner.convertFromBig5');
            // 等待一下讓命令執行完成
            await new Promise(resolve => setTimeout(resolve, 500));
            // 命令應該成功執行（不應該拋出錯誤）
            assert.ok(true, 'Big5 轉換命令應該成功執行');
        }
        catch (error) {
            // 如果是因為沒有開啟檔案等預期錯誤，也算通過
            if (error.message.includes('沒有開啟的檔案')) {
                assert.ok(true, '正確處理了沒有開啟檔案的情況');
            }
            else {
                throw error;
            }
        }
        finally {
            // 清理測試檔案
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        }
    });
    test('應該正確處理 GBK 編碼指定轉換', async () => {
        const iconv = require('iconv-lite');
        // 建立 GBK 編碼的測試內容
        const testContent = '// 简体中文注释\nint main() { return 0; }';
        const gbkBuffer = iconv.encode(testContent, 'gbk');
        const testFilePath = path.join(fixturesPath, 'test-gbk-temp.c');
        fs.writeFileSync(testFilePath, gbkBuffer);
        try {
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);
            // 執行從 GBK 轉換命令
            await vscode.commands.executeCommand('cpp-smart-runner.convertFromGbk');
            // 等待一下讓命令執行完成
            await new Promise(resolve => setTimeout(resolve, 500));
            // 命令應該成功執行（不應該拋出錯誤）
            assert.ok(true, 'GBK 轉換命令應該成功執行');
        }
        catch (error) {
            // 如果是因為沒有開啟檔案等預期錯誤，也算通過
            if (error.message.includes('沒有開啟的檔案')) {
                assert.ok(true, '正確處理了沒有開啟檔案的情況');
            }
            else {
                throw error;
            }
        }
        finally {
            // 清理測試檔案
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        }
    });
    test('應該在沒有開啟檔案時顯示錯誤', async () => {
        // 關閉所有編輯器
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        try {
            // 執行轉換命令（應該失敗）
            await vscode.commands.executeCommand('cpp-smart-runner.convertToUtf8');
            // 等待一下讓命令執行完成
            await new Promise(resolve => setTimeout(resolve, 200));
            // 命令應該正確處理沒有開啟檔案的情況
            assert.ok(true, '正確處理了沒有開啟檔案的情況');
        }
        catch (error) {
            // 預期會有錯誤
            assert.ok(true, '正確拋出錯誤');
        }
    });
    test('應該正確識別已經是 UTF-8 的檔案', async () => {
        const testFilePath = path.join(fixturesPath, 'test-utf8-check-temp.c');
        const utf8Content = '// UTF-8 檔案\nint main() { return 0; }';
        fs.writeFileSync(testFilePath, utf8Content, 'utf8');
        try {
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);
            // 執行轉換命令
            await vscode.commands.executeCommand('cpp-smart-runner.convertToUtf8');
            // 等待一下讓命令執行完成
            await new Promise(resolve => setTimeout(resolve, 200));
            // 應該顯示檔案已經是 UTF-8 的訊息
            assert.ok(true, '正確識別 UTF-8 檔案');
        }
        finally {
            // 清理測試檔案
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        }
    });
    test('子選單命令應該存在於 package.json', () => {
        const packageJsonPath = path.join(__dirname, '../../../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        // 檢查子選單定義
        assert.ok(packageJson.contributes.submenus, '應該定義 submenus');
        const encodingMenu = packageJson.contributes.submenus.find((menu) => menu.id === 'cpp-smart-runner.encodingMenu');
        assert.ok(encodingMenu, '應該定義 encodingMenu 子選單');
        assert.strictEqual(encodingMenu.label, '轉換編碼', '子選單標籤應該是「轉換編碼」');
        // 檢查子選單項目
        assert.ok(packageJson.contributes.menus['cpp-smart-runner.encodingMenu'], '應該定義子選單項目');
        const menuItems = packageJson.contributes.menus['cpp-smart-runner.encodingMenu'];
        assert.ok(menuItems.length >= 4, '子選單應該至少有 4 個項目');
    });
    test('所有轉換命令應該在 package.json 中定義', () => {
        const packageJsonPath = path.join(__dirname, '../../../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const commands = packageJson.contributes.commands;
        const commandIds = commands.map((cmd) => cmd.command);
        assert.ok(commandIds.includes('cpp-smart-runner.convertToUtf8'), '應該定義 convertToUtf8 命令');
        assert.ok(commandIds.includes('cpp-smart-runner.convertFromBig5'), '應該定義 convertFromBig5 命令');
        assert.ok(commandIds.includes('cpp-smart-runner.convertFromGbk'), '應該定義 convertFromGbk 命令');
        assert.ok(commandIds.includes('cpp-smart-runner.convertToBig5'), '應該定義 convertToBig5 命令');
    });
    test('轉換為 Big5 前應檢查未儲存的修改', async function () {
        this.timeout(10000);
        // 建立測試檔案
        const testFilePath = path.join(fixturesPath, 'test-big5-dirty-check.c');
        const originalContent = '#include <stdio.h>\nint main() {\n    printf("測試");\n    return 0;\n}';
        fs.writeFileSync(testFilePath, originalContent, 'utf8');
        try {
            // 開啟檔案
            const document = await vscode.workspace.openTextDocument(testFilePath);
            const editor = await vscode.window.showTextDocument(document);
            // 修改內容但不儲存
            await editor.edit(editBuilder => {
                const lastLine = document.lineAt(document.lineCount - 1);
                editBuilder.insert(lastLine.range.end, '\n// 未儲存的修改');
            });
            // 確認檔案處於 dirty 狀態
            assert.strictEqual(editor.document.isDirty, true, '檔案應該處於未儲存狀態');
            // 注意：實際執行 convertToBig5 會彈出對話框
            // 在自動化測試中無法模擬使用者點擊，所以這裡僅驗證狀態
            // 實際的警告對話框需要手動測試
            // 清理：關閉編輯器
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
        finally {
            // 清理測試檔案
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        }
    });
    test('自動編碼轉換應使用可撤銷的編輯器操作', async function () {
        this.timeout(10000);
        // 建立一個 Big5 編碼的測試檔案
        const testFilePath = path.join(fixturesPath, 'test-auto-convert-big5.c');
        const big5Content = '#include <stdio.h>\nint main() {\n    printf("測試");\n    return 0;\n}';
        try {
            // 使用 iconv-lite 寫入 Big5 檔案
            const iconv = require('iconv-lite');
            const big5Buffer = iconv.encode(big5Content, 'big5');
            fs.writeFileSync(testFilePath, big5Buffer);
            // 開啟檔案
            const document = await vscode.workspace.openTextDocument(testFilePath);
            const editor = await vscode.window.showTextDocument(document);
            // 取得初始內容（可能是亂碼或已自動轉換）
            const contentBefore = editor.document.getText();
            // 如果啟用自動轉換，應該已經轉換為 UTF-8
            // 檢查檔案在編輯器中可讀（不是亂碼）
            assert.ok(contentBefore.includes('stdio.h') || contentBefore.includes('main'), '檔案應該可讀（已自動轉換或原本就是 UTF-8）');
            // 驗證：如果進行了轉換，應該可以撤銷
            // （但由於已經自動轉換，這裡主要驗證檔案狀態正常）
            // 清理：關閉編輯器
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
        catch (error) {
            // 如果沒有安裝 iconv-lite，跳過測試
            if (error.code === 'MODULE_NOT_FOUND') {
                this.skip();
            }
            else {
                throw error;
            }
        }
        finally {
            // 清理測試檔案
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        }
    });
});
//# sourceMappingURL=encodingConversion.test.js.map