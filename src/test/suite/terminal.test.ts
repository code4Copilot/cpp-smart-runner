import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Terminal Management Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    let testFile: string;
    let testExe: string;

    suiteSetup(async () => {
        // 確保擴充套件已啟動
        const ext = vscode.extensions.getExtension('hueyanchen.cpp-smart-runner');
        if (ext && !ext.isActive) {
            await ext.activate();
        }
    });

    setup(async () => {
        // 設定測試檔案
        testFile = path.join(fixturesPath, 'test.c');
        const isWindows = process.platform === 'win32';
        testExe = path.join(fixturesPath, isWindows ? 'test.exe' : 'test');
        
        // 清除現有的終端機
        vscode.window.terminals.forEach(t => t.dispose());
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    teardown(async () => {
        // 關閉所有編輯器和終端機
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        vscode.window.terminals.forEach(t => t.dispose());
        
        // 清理編譯生成的檔案
        if (fs.existsSync(testExe)) {
            try {
                fs.unlinkSync(testExe);
            } catch (err) {
                // 忽略刪除錯誤
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    test('Should create terminal when running first time', async function() {
        this.timeout(10000);
        
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        
        // 先編譯檔案
        await vscode.commands.executeCommand('cpp-smart-runner.compile');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 執行程式
        const terminalCountBefore = vscode.window.terminals.length;
        await vscode.commands.executeCommand('cpp-smart-runner.run');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const terminalCountAfter = vscode.window.terminals.length;
        
        // 應該創建了一個新的終端機
        assert.ok(terminalCountAfter > terminalCountBefore, 'Should create a new terminal');
        
        // 確認終端機名稱
        const runnerTerminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        assert.ok(runnerTerminal, 'Should create terminal named "C/C++ Runner"');
    });

    test('Should reuse terminal on second run', async function() {
        this.timeout(15000);
        
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        
        // 先編譯
        await vscode.commands.executeCommand('cpp-smart-runner.compile');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 第一次執行
        await vscode.commands.executeCommand('cpp-smart-runner.run');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const terminalCountAfterFirst = vscode.window.terminals.length;
        const firstRunnerTerminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        
        // 第二次執行
        await vscode.commands.executeCommand('cpp-smart-runner.run');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const terminalCountAfterSecond = vscode.window.terminals.length;
        const secondRunnerTerminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        
        // 終端機數量應該相同（重用）
        assert.strictEqual(terminalCountAfterSecond, terminalCountAfterFirst, 
            'Should reuse terminal, not create new one');
        
        // 應該只有一個 C/C++ Runner 終端機
        const runnerTerminals = vscode.window.terminals.filter(t => t.name === 'C/C++ Runner');
        assert.strictEqual(runnerTerminals.length, 1, 
            'Should have only one C/C++ Runner terminal');
        
        // 應該是同一個終端機實例
        assert.strictEqual(firstRunnerTerminal, secondRunnerTerminal, 
            'Should reuse the same terminal instance');
    });

    test('Should create new terminal after disposing old one', async function() {
        this.timeout(15000);
        
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        
        // 編譯
        await vscode.commands.executeCommand('cpp-smart-runner.compile');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 第一次執行
        await vscode.commands.executeCommand('cpp-smart-runner.run');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const firstTerminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        assert.ok(firstTerminal, 'First terminal should exist');
        
        // 手動關閉終端機
        firstTerminal.dispose();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 再次執行
        await vscode.commands.executeCommand('cpp-smart-runner.run');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const secondTerminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        assert.ok(secondTerminal, 'Should create new terminal after old one was disposed');
        
        // 應該是不同的終端機實例
        assert.notStrictEqual(firstTerminal, secondTerminal, 
            'Should create a new terminal instance');
    });

    test('Should reuse terminal for multiple compileAndRun operations', async function() {
        this.timeout(15000);
        
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        
        // 第一次編譯並執行
        await vscode.commands.executeCommand('cpp-smart-runner.compileAndRun');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const terminalCountAfterFirst = vscode.window.terminals.length;
        
        // 第二次編譯並執行
        await vscode.commands.executeCommand('cpp-smart-runner.compileAndRun');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const terminalCountAfterSecond = vscode.window.terminals.length;
        
        // 終端機數量應該相同
        assert.strictEqual(terminalCountAfterSecond, terminalCountAfterFirst, 
            'Should reuse terminal for multiple compileAndRun operations');
        
        // 只應該有一個 C/C++ Runner 終端機
        const runnerTerminals = vscode.window.terminals.filter(t => t.name === 'C/C++ Runner');
        assert.strictEqual(runnerTerminals.length, 1, 
            'Should have only one C/C++ Runner terminal after multiple runs');
    });

    test('Should not create terminal when only compiling', async function() {
        this.timeout(10000);
        
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        
        const terminalCountBefore = vscode.window.terminals.length;
        
        // 只編譯，不執行
        await vscode.commands.executeCommand('cpp-smart-runner.compile');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const terminalCountAfter = vscode.window.terminals.length;
        
        // 編譯不應該創建終端機
        assert.strictEqual(terminalCountAfter, terminalCountBefore, 
            'Compile command should not create terminal');
    });

    test('Should handle terminal with cleared content', async function() {
        this.timeout(15000);
        
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        
        // 編譯並執行
        await vscode.commands.executeCommand('cpp-smart-runner.compileAndRun');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const firstTerminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        assert.ok(firstTerminal, 'Terminal should exist after first run');
        
        // 再次執行（應該重用並清空終端機）
        await vscode.commands.executeCommand('cpp-smart-runner.run');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const secondTerminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        
        // 應該是同一個終端機
        assert.strictEqual(firstTerminal, secondTerminal, 
            'Should reuse the same terminal and clear it');
    });
});

suite('Terminal Configuration Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
    let testFile: string;
    let testExe: string;

    setup(async () => {
        testFile = path.join(fixturesPath, 'test.c');
        const isWindows = process.platform === 'win32';
        testExe = path.join(fixturesPath, isWindows ? 'test.exe' : 'test');
        
        vscode.window.terminals.forEach(t => t.dispose());
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    teardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        vscode.window.terminals.forEach(t => t.dispose());
        
        if (fs.existsSync(testExe)) {
            try {
                fs.unlinkSync(testExe);
            } catch (err) {
                // 忽略
            }
        }
        
        // 重置設定
        await vscode.workspace.getConfiguration('cpp-smart-runner')
            .update('clearTerminal', undefined, vscode.ConfigurationTarget.Global);
        
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    test('Should respect clearTerminal setting', async function() {
        this.timeout(15000);
        
        // 設定不清空終端機
        await vscode.workspace.getConfiguration('cpp-smart-runner')
            .update('clearTerminal', false, vscode.ConfigurationTarget.Global);
        
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        
        // 編譯並執行
        await vscode.commands.executeCommand('cpp-smart-runner.compileAndRun');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const terminal = vscode.window.terminals.find(t => t.name === 'C/C++ Runner');
        assert.ok(terminal, 'Terminal should be created regardless of clearTerminal setting');
        
        // 再次執行（應該重用終端機）
        await vscode.commands.executeCommand('cpp-smart-runner.run');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const runnerTerminals = vscode.window.terminals.filter(t => t.name === 'C/C++ Runner');
        assert.strictEqual(runnerTerminals.length, 1, 
            'Should still reuse terminal when clearTerminal is false');
    });
});
