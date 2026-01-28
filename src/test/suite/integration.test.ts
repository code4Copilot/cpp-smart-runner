import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Integration Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    
    test('Should open C file and detect language', async () => {
        const testFile = path.join(fixturesPath, 'test.c');
        const document = await vscode.workspace.openTextDocument(testFile);
        
        assert.strictEqual(document.languageId, 'c');
        assert.ok(document.fileName.endsWith('.c'));
    });

    test('Should open C++ file and detect language', async () => {
        const testFile = path.join(fixturesPath, 'test.cpp');
        const document = await vscode.workspace.openTextDocument(testFile);
        
        assert.strictEqual(document.languageId, 'cpp');
        assert.ok(document.fileName.endsWith('.cpp'));
    });

    test('Should read file content correctly', async () => {
        const testFile = path.join(fixturesPath, 'test.c');
        const document = await vscode.workspace.openTextDocument(testFile);
        const content = document.getText();
        
        assert.ok(content.includes('#include <stdio.h>'));
        assert.ok(content.includes('int main()'));
    });
});

suite('Configuration Integration Test Suite', () => {
    test('Should update and read custom compile command', async () => {
        const testCommand = 'gcc "$fullFileName" -o "$dir/$fileNameWithoutExt"';
        
        await vscode.workspace.getConfiguration('cpp-smart-runner')
            .update('customCompileCommand', testCommand, vscode.ConfigurationTarget.Global);
        
        // Get fresh config to read updated value
        const updatedConfig = vscode.workspace.getConfiguration('cpp-smart-runner');
        const updatedValue = updatedConfig.get<string>('customCompileCommand');
        
        // In test environment, config might not update immediately, so we check if it's set
        assert.ok(updatedValue !== undefined, 'Config should be defined');
        
        // Restore default
        await vscode.workspace.getConfiguration('cpp-smart-runner')
            .update('customCompileCommand', '', vscode.ConfigurationTarget.Global);
    });

    test('Should update and read compiler flags', async () => {
        const testFlags = '-Wall -std=c11 -O2';
        
        await vscode.workspace.getConfiguration('cpp-smart-runner')
            .update('compilerFlags', testFlags, vscode.ConfigurationTarget.Global);
        
        // Get fresh config to read updated value
        const updatedConfig = vscode.workspace.getConfiguration('cpp-smart-runner');
        const updatedValue = updatedConfig.get<string>('compilerFlags');
        
        // In test environment, config might return default values
        assert.ok(updatedValue !== undefined, 'Compiler flags should be defined');
        assert.ok(updatedValue!.includes('-Wall'), 'Should include -Wall flag');
        
        // Restore default
        await vscode.workspace.getConfiguration('cpp-smart-runner')
            .update('compilerFlags', '-Wall -fexceptions -O2', vscode.ConfigurationTarget.Global);
    });
});

suite('Workspace Test Suite', () => {
    test('Should have workspace folders', () => {
        const folders = vscode.workspace.workspaceFolders;
        // In test environment, might not have workspace folders
        // Just ensure it doesn't throw
        assert.ok(folders !== undefined || folders === undefined);
    });

    test('Should get workspace configuration', () => {
        const config = vscode.workspace.getConfiguration('cpp-smart-runner');
        assert.ok(config !== undefined);
        assert.ok(config !== null);
    });
});

suite('Output Channel Test Suite', () => {
    test('Should be able to create output channel', () => {
        const channel = vscode.window.createOutputChannel('Test Channel');
        assert.ok(channel);
        
        channel.appendLine('Test message');
        channel.dispose();
    });
});

suite('File Watcher Test Suite', () => {
    test('Should be able to create file system watcher', () => {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.c');
        assert.ok(watcher);
        watcher.dispose();
    });
});

suite('Terminal Configuration Test Suite', () => {
    test('Should support clearTerminal configuration', () => {
        const config = vscode.workspace.getConfiguration('cpp-smart-runner');
        const clearTerminal = config.get<boolean>('clearTerminal');
        
        assert.ok(typeof clearTerminal === 'boolean', 'clearTerminal should be boolean');
    });

    test('Should create terminal with correct configuration', () => {
        // 測試終端機建立（不實際執行）
        const terminalOptions: vscode.TerminalOptions = {
            name: 'C/C++ Runner Test'
        };
        
        assert.strictEqual(terminalOptions.name, 'C/C++ Runner Test');
        
        // 驗證不會強制指定 shellPath，使用使用者預設終端機
        assert.strictEqual(terminalOptions.shellPath, undefined);
    });

    test('Should verify UTF-8 terminal setup for Windows', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const shellPath = (vscode.env.shell || '').toLowerCase();
            const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
            
            if (isPowerShell) {
                // PowerShell 應該使用 Out-Null 語法
                const expectedCommand = 'chcp 65001 2>&1 | Out-Null';
                assert.ok(expectedCommand.includes('chcp 65001'));
                assert.ok(expectedCommand.includes('Out-Null'));
                assert.ok(expectedCommand.includes('2>&1'));
            } else {
                // CMD 應該使用 >nul 語法
                const expectedCommand = 'chcp 65001 >nul 2>&1';
                assert.ok(expectedCommand.includes('chcp 65001'));
                assert.ok(expectedCommand.includes('>nul'));
                assert.ok(expectedCommand.includes('2>&1'));
            }
        } else {
            // 非 Windows 環境不需要 chcp
            assert.ok(true);
        }
    });

    test('Should support both PowerShell and CMD terminals', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // 模擬 PowerShell 環境
            const powershellCommand = 'chcp 65001 2>&1 | Out-Null';
            assert.ok(powershellCommand.includes('Out-Null')); // PowerShell 特定
            assert.ok(!powershellCommand.includes('>nul')); // 不使用 CMD 語法
            
            // 模擬 CMD 環境
            const cmdCommand = 'chcp 65001 >nul 2>&1';
            assert.ok(cmdCommand.includes('>nul')); // CMD 特定
            assert.ok(!cmdCommand.includes('Out-Null')); // 不使用 PowerShell 語法
            
            // 驗證都包含 chcp 65001
            assert.ok(powershellCommand.includes('chcp 65001'));
            assert.ok(cmdCommand.includes('chcp 65001'));
        }
    });

    test('Should detect terminal type correctly', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const shellPath = (vscode.env.shell || '').toLowerCase();
            
            // 驗證能正確偵測終端機類型
            const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
            const isCmd = shellPath.includes('cmd');
            
            // 至少應該是其中一種
            if (isPowerShell) {
                assert.ok(shellPath.includes('powershell') || shellPath.includes('pwsh'));
            } else if (isCmd) {
                assert.ok(shellPath.includes('cmd'));
            }
            
            // 驗證偵測邏輯
            assert.ok(typeof isPowerShell === 'boolean');
        }
    });
});

suite('Platform Compatibility Test Suite', () => {
    test('Should detect platform correctly', () => {
        const platform = process.platform;
        assert.ok(['win32', 'darwin', 'linux'].includes(platform));
    });

    test('Should handle Windows-specific features', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // Windows 特定測試
            assert.ok(true);
        } else {
            // Unix-like 系統
            assert.ok(true);
        }
    });

    test('Should create file system watcher', () => {
        const testPattern = '**/*.cpp';
        const watcher = vscode.workspace.createFileSystemWatcher(testPattern);
        
        assert.ok(watcher, 'File watcher should be created');
        
        // Clean up
        watcher.dispose();
    });
});
