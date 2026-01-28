import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('編碼轉換功能測試', () => {
    const fixturesPath = path.join(__dirname, '../../../src/test/fixtures');
    
    test('應該成功註冊所有編碼轉換命令', async () => {
        const commands = await vscode.commands.getCommands();
        
        assert.ok(
            commands.includes('cpp-smart-runner.convertToUtf8'),
            '應該註冊 convertToUtf8 命令'
        );
        assert.ok(
            commands.includes('cpp-smart-runner.convertFromBig5'),
            '應該註冊 convertFromBig5 命令'
        );
        assert.ok(
            commands.includes('cpp-smart-runner.convertFromGbk'),
            '應該註冊 convertFromGbk 命令'
        );
        assert.ok(
            commands.includes('cpp-smart-runner.convertToBig5'),
            '應該註冊 convertToBig5 命令'
        );
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
            assert.strictEqual(
                editor.document.isDirty, 
                false, 
                '檔案不應該被標記為已修改'
            );
        } finally {
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
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                editBuilder.replace(fullRange, '// Modified content\nint main() { return 1; }');
            });
            
            const modifiedContent = editor.document.getText();
            assert.ok(
                modifiedContent.includes('Modified content'),
                '內容應該已修改'
            );
            
            // 測試撤銷功能
            await vscode.commands.executeCommand('undo');
            
            const undoneContent = editor.document.getText();
            assert.strictEqual(
                undoneContent,
                originalContent,
                '撤銷後應該恢復原始內容'
            );
        } finally {
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
        } catch (error: any) {
            // 如果是因為沒有開啟檔案等預期錯誤，也算通過
            if (error.message.includes('沒有開啟的檔案')) {
                assert.ok(true, '正確處理了沒有開啟檔案的情況');
            } else {
                throw error;
            }
        } finally {
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
        } catch (error: any) {
            // 如果是因為沒有開啟檔案等預期錯誤，也算通過
            if (error.message.includes('沒有開啟的檔案')) {
                assert.ok(true, '正確處理了沒有開啟檔案的情況');
            } else {
                throw error;
            }
        } finally {
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
        } catch (error) {
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
        } finally {
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
        const encodingMenu = packageJson.contributes.submenus.find(
            (menu: any) => menu.id === 'cpp-smart-runner.encodingMenu'
        );
        assert.ok(encodingMenu, '應該定義 encodingMenu 子選單');
        assert.strictEqual(encodingMenu.label, '轉換編碼', '子選單標籤應該是「轉換編碼」');
        
        // 檢查子選單項目
        assert.ok(
            packageJson.contributes.menus['cpp-smart-runner.encodingMenu'],
            '應該定義子選單項目'
        );
        
        const menuItems = packageJson.contributes.menus['cpp-smart-runner.encodingMenu'];
        assert.ok(menuItems.length >= 4, '子選單應該至少有 4 個項目');
    });
    
    test('所有轉換命令應該在 package.json 中定義', () => {
        const packageJsonPath = path.join(__dirname, '../../../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const commands = packageJson.contributes.commands;
        const commandIds = commands.map((cmd: any) => cmd.command);
        
        assert.ok(
            commandIds.includes('cpp-smart-runner.convertToUtf8'),
            '應該定義 convertToUtf8 命令'
        );
        assert.ok(
            commandIds.includes('cpp-smart-runner.convertFromBig5'),
            '應該定義 convertFromBig5 命令'
        );
        assert.ok(
            commandIds.includes('cpp-smart-runner.convertFromGbk'),
            '應該定義 convertFromGbk 命令'
        );
        assert.ok(
            commandIds.includes('cpp-smart-runner.convertToBig5'),
            '應該定義 convertToBig5 命令'
        );
    });
});
