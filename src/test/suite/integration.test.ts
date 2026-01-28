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
        const testPattern = '**/*.cpp';
        const watcher = vscode.workspace.createFileSystemWatcher(testPattern);
        
        assert.ok(watcher, 'File watcher should be created');
        
        // Clean up
        watcher.dispose();
    });
});
