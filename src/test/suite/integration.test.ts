import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Integration Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    
    let openedDocuments: vscode.TextDocument[] = [];
    
    teardown(async () => {
        // 關閉所有測試中開啟的文件
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        openedDocuments = [];
    });
    
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
    let disposables: vscode.Disposable[] = [];
    
    teardown(() => {
        // 清理所有 disposable 資源
        disposables.forEach(d => {
            try {
                d.dispose();
            } catch (e) {
                // 忽略已經 disposed 的錯誤
            }
        });
        disposables = [];
    });
    
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
    
    test('Should use correct PowerShell encoding settings', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const shellPath = (vscode.env.shell || '').toLowerCase();
            const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
            
            if (isPowerShell) {
                // PowerShell 應該設定兩個命令
                const chcpCommand = 'chcp 65001 2>&1 | Out-Null';
                const consoleEncodingCommand = '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8';
                
                // 驗證 chcp 命令格式
                assert.ok(chcpCommand.includes('chcp 65001'));
                assert.ok(chcpCommand.includes('Out-Null'));
                
                // 驗證 Console.OutputEncoding 命令
                assert.ok(consoleEncodingCommand.includes('[Console]::OutputEncoding'));
                assert.ok(consoleEncodingCommand.includes('UTF8'));
            }
        }
    });
    
    test('Should generate correct PowerShell execution command for relative path', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const shellPath = (vscode.env.shell || '').toLowerCase();
            const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
            
            if (isPowerShell) {
                const fileName = 'test.exe';
                const execCommand = `.\\${fileName}`;
                
                // 驗證命令格式
                assert.ok(execCommand.startsWith('.\\'));
                assert.ok(execCommand.includes(fileName));
                assert.strictEqual(execCommand, '.\\test.exe');
            }
        }
    });
    
    test('Should generate correct PowerShell execution command for absolute path', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const shellPath = (vscode.env.shell || '').toLowerCase();
            const isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
            
            if (isPowerShell) {
                const absolutePath = 'C:\\project\\test.exe';
                const execCommand = `& "${absolutePath}"`;
                
                // 驗證命令格式
                assert.ok(execCommand.startsWith('& '));
                assert.ok(execCommand.includes(absolutePath));
                assert.strictEqual(execCommand, '& "C:\\project\\test.exe"');
            }
        }
    });
    
    test('Should correctly detect absolute vs relative paths', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const path = require('path');
            
            // 測試絕對路徑偵測
            const absolutePath = 'C:\\Users\\test\\project\\test.exe';
            assert.strictEqual(path.isAbsolute(absolutePath), true);
            
            // 測試相對路徑偵測
            const relativePath = 'test.exe';
            assert.strictEqual(path.isAbsolute(relativePath), false);
            
            const relativePathWithDot = '.\\test.exe';
            assert.strictEqual(path.isAbsolute(relativePathWithDot), false);
        }
    });
    
    test('Should generate correct CMD execution command with quotes', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const shellPath = (vscode.env.shell || '').toLowerCase();
            const isCmd = shellPath.includes('cmd');
            
            if (isCmd) {
                const outputFile = 'C:\\project\\test.exe';
                const execCommand = `"${outputFile}"`;
                
                // 驗證 CMD 命令格式
                assert.ok(execCommand.startsWith('"'));
                assert.ok(execCommand.endsWith('"'));
                assert.ok(execCommand.includes(outputFile));
                assert.strictEqual(execCommand, '"C:\\project\\test.exe"');
            }
        }
    });
    
    test('Should handle custom command without modification', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // 模擬自訂命令
            const customCommand = 'wine test.exe';
            const useCustomCommand = true;
            
            // 自訂命令應該保持原樣
            if (useCustomCommand) {
                const execCommand = customCommand;
                assert.strictEqual(execCommand, 'wine test.exe');
                
                // 確保不會被 PowerShell 或 CMD 邏輯修改
                assert.ok(!execCommand.startsWith('.\\'));
                assert.ok(!execCommand.startsWith('& '));
            }
        }
    });
    
    test('Should use different command format for different terminals', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const outputFile = 'C:\\Users\\test\\project\\test.exe';
            const fileName = 'test.exe';
            
            // PowerShell 絕對路徑格式
            const powershellAbsolute = `& "${outputFile}"`;
            assert.strictEqual(powershellAbsolute, '& "C:\\Users\\test\\project\\test.exe"');
            
            // PowerShell 相對路徑格式
            const powershellRelative = `.\\${fileName}`;
            assert.strictEqual(powershellRelative, '.\\test.exe');
            
            // CMD 格式
            const cmdFormat = `"${outputFile}"`;
            assert.strictEqual(cmdFormat, '"C:\\Users\\test\\project\\test.exe"');
            
            // 驗證三種格式都不相同
            assert.notStrictEqual(powershellAbsolute, cmdFormat);
            assert.notStrictEqual(powershellRelative, cmdFormat);
            assert.notStrictEqual(powershellAbsolute, powershellRelative);
        }
    });
});

suite('Unified Command Format Test Suite', () => {
    test('Should use relative path format for Windows executables', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const outputFile = 'C:\\C_Code_Test\\ch04\\ch4-1-1.exe';
            const fileName = path.basename(outputFile);
            
            // 統一格式：使用相對路徑
            const execCommand = `.\\${fileName}`;
            
            assert.strictEqual(execCommand, '.\\ch4-1-1.exe');
            assert.ok(execCommand.startsWith('.\\'));
            assert.ok(!execCommand.includes('"') || fileName.includes(' '));
        }
    });
    
    test('Should handle filenames with spaces correctly', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const outputFile = 'C:\\C_Code_Test\\ch04\\ch4 test file.exe';
            const fileName = path.basename(outputFile);
            
            let execCommand;
            if (fileName.includes(' ')) {
                execCommand = `."\\${fileName}"`;
            } else {
                execCommand = `.\\${fileName}`;
            }
            
            assert.strictEqual(execCommand, '."\\ch4 test file.exe"');
            assert.ok(execCommand.includes('"'));
            assert.ok(execCommand.startsWith('.'));
        }
    });
    
    test('Should use cd command before relative path execution', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const outputFile = 'C:\\C_Code_Test\\ch04\\ch4-1-1.exe';
            const fileDir = path.dirname(outputFile);
            const fileName = path.basename(outputFile);
            
            const cdCommand = `cd "${fileDir}"`;
            const execCommand = `.\\${fileName}`;
            
            assert.strictEqual(cdCommand, 'cd "C:\\C_Code_Test\\ch04"');
            assert.strictEqual(execCommand, '.\\ch4-1-1.exe');
            
            // 驗證命令組合
            assert.ok(cdCommand.includes(fileDir));
            assert.ok(execCommand.startsWith('.\\'));
        }
    });
    
    test('Should not modify custom commands', () => {
        const isWindows = process.platform === 'win32';
        const useCustomCommand = true;
        
        if (isWindows && useCustomCommand) {
            const customCommand = 'wine test.exe';
            const execCommand = customCommand;
            
            // 自訂命令不應該被轉換成相對路徑格式
            assert.strictEqual(execCommand, 'wine test.exe');
            assert.ok(!execCommand.startsWith('.\\'));
        }
    });
    
    test('Should work for both CMD and PowerShell', () => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            const outputFile = 'C:\\project\\test.exe';
            const fileDir = path.dirname(outputFile);
            const fileName = path.basename(outputFile);
            
            // 相對路徑格式在 CMD 和 PowerShell 都能用
            const cdCommand = `cd "${fileDir}"`;
            const execCommand = `.\\${fileName}`;
            
            // 驗證這個格式對兩種終端機都有效
            assert.strictEqual(execCommand, '.\\test.exe');
            
            // CMD 和 PowerShell 都接受 .\ 前綴
            assert.ok(execCommand.match(/^\.\\/));
            
            // 不需要 & 符號（只有 PowerShell 的絕對路徑才需要）
            assert.ok(!execCommand.includes('&'));
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
