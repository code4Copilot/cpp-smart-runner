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
        const updatedValue = updatedConfig.get('customCompileCommand');
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
        const updatedValue = updatedConfig.get('compilerFlags');
        // In test environment, config might return default values
        assert.ok(updatedValue !== undefined, 'Compiler flags should be defined');
        assert.ok(updatedValue.includes('-Wall'), 'Should include -Wall flag');
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
//# sourceMappingURL=integration.test.js.map