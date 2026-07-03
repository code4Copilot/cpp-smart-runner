import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TextDecoder, TextEncoder } from 'util';

const execAsync = promisify(exec);

let outputChannel: vscode.OutputChannel;
let runnerTerminal: vscode.Terminal | undefined;

interface CommandVariables {
    fileName: string;              // 檔名(含副檔名)例如: test.cpp
    fileNameWithoutExt: string;    // 檔名(不含副檔名)例如: test
    dir: string;                   // 檔案所在目錄
    fullFileName: string;          // 完整路徑
    workspaceFolder: string;       // 工作區資料夾
}

export function activate(context: vscode.ExtensionContext) {
    // 避免重複創建 outputChannel（測試環境可能多次啟動）
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('C/C++ Smart Runner');
    }
    
    // 註冊編譯命令
    let compileCommand = vscode.commands.registerCommand('cpp-smart-runner.compile', async () => {
        await compileCurrentFile();
    });
    
    // 註冊執行命令
    let runCommand = vscode.commands.registerCommand('cpp-smart-runner.run', async () => {
        await runCurrentFile();
    });
    
    // 註冊編譯並執行命令
    let compileAndRunCommand = vscode.commands.registerCommand('cpp-smart-runner.compileAndRun', async () => {
        const success = await compileCurrentFile();
        if (success) {
            await runCurrentFile(true);
        }
    });
    
    // 註冊手動轉換編碼命令（自動偵測）
    let convertToUtf8Command = vscode.commands.registerCommand('cpp-smart-runner.convertToUtf8', async () => {
        await handleEncodingConversion('utf8', 'auto');
    });

    // 註冊從特定編碼轉換的命令
    let convertFromBig5Command = vscode.commands.registerCommand('cpp-smart-runner.convertFromBig5', async () => {
        await handleEncodingConversion('utf8', 'big5');
    });

    let convertFromGbkCommand = vscode.commands.registerCommand('cpp-smart-runner.convertFromGbk', async () => {
        await handleEncodingConversion('utf8', 'gbk');
    });

    let convertToBig5Command = vscode.commands.registerCommand('cpp-smart-runner.convertToBig5', async () => {
        await handleEncodingConversion('big5', 'auto');
    });
    
    context.subscriptions.push(
        compileCommand, runCommand, compileAndRunCommand,
        convertToUtf8Command, convertFromBig5Command, convertFromGbkCommand,
        convertToBig5Command, outputChannel
    );
    
    outputChannel.appendLine('C/C++ Smart Runner 已啟動');
}

function getCommandVariables(sourceFile: string): CommandVariables {
    const ext = path.extname(sourceFile);
    const fileName = path.basename(sourceFile);
    const fileNameWithoutExt = path.basename(sourceFile, ext);
    const dir = path.dirname(sourceFile);
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || dir;
    
    return {
        fileName,
        fileNameWithoutExt,
        dir,
        fullFileName: sourceFile,
        workspaceFolder
    };
}

function replaceVariables(command: string, vars: CommandVariables): string {
    // 必須先替換較長的變數名稱,避免被較短的覆蓋
    return command
        .replace(/\$workspaceFolder/g, vars.workspaceFolder)
        .replace(/\$fullFileName/g, vars.fullFileName)
        .replace(/\$fileNameWithoutExt/g, vars.fileNameWithoutExt)
        .replace(/\$fileName/g, vars.fileName)
        .replace(/\$dir/g, vars.dir);
}

// ===== 改進的編碼檢測函數 =====

function isUtf8(buffer: Buffer): boolean {
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        return true;
    } catch {
        return false;
    }
}

function detectEncoding(buffer: Buffer): 'utf8' | 'big5' | 'gbk' | 'unknown' {
    // 檢查是否為 UTF-8
    if (isUtf8(buffer)) {
        return 'utf8';
    }
    
    // 檢查 UTF-8 BOM
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8';
    }
    
    // 改進的 Big5 vs GBK 判斷邏輯
    let big5Score = 0;
    let gbkScore = 0;
    let big5SpecificScore = 0;  // Big5 特有字節範圍
    
    for (let i = 0; i < Math.min(buffer.length - 1, 1000); i++) {
        const byte1 = buffer[i];
        const byte2 = buffer[i + 1];
        
        // Big5 特有範圍 (更嚴格的判斷)
        // Big5 第一字節: 0xA1-0xF9
        // Big5 第二字節: 0x40-0x7E 或 0x80-0xFE (但不是 0x7F)
        if (byte1 >= 0xA1 && byte1 <= 0xF9) {
            if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFE)) {
                big5Score++;
                
                // Big5 特有的第二字節範圍 (0x40-0x7E)，GBK 較少使用
                if (byte2 >= 0x40 && byte2 <= 0x7E && byte2 !== 0x7F) {
                    big5SpecificScore += 2;  // 更高權重
                }
            }
        }
        
        // GBK 特有範圍
        // GBK 第一字節: 0x81-0xFE
        // GBK 第二字節: 0x40-0xFE
        // 但要排除 Big5 的高分區域
        if (byte1 >= 0x81 && byte1 <= 0xA0) {  // 0x81-0xA0 是 GBK 特有，Big5 從 0xA1 開始
            if (byte2 >= 0x40 && byte2 <= 0xFE && byte2 !== 0x7F) {
                gbkScore += 2;  // GBK 特有區域給更高分
            }
        } else if (byte1 >= 0xA1 && byte1 <= 0xFE && byte2 >= 0x40 && byte2 <= 0xFE) {
            gbkScore++;  // 重疊區域只給基本分
        }
    }
    
    // 判斷邏輯：優先考慮特有特徵
    const totalBig5 = big5Score + big5SpecificScore;
    
    if (big5SpecificScore > 3 || (totalBig5 > gbkScore && big5Score > 3)) {
        return 'big5';  // 有 Big5 特徵或總分更高
    } else if (gbkScore > 5) {
        return 'gbk';
    }
    
    // 預設假設 Big5 (台灣常用)
    return 'big5';
}

function tryDecodeWithFallback(buffer: Buffer): { content: string, encoding: string } | null {
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
            } catch {
                // iconv-lite 不可用,使用內建 TextDecoder
                if (enc === 'big5' || enc === 'cp950') {
                    const content = new TextDecoder('big5').decode(buffer);
                    return { content, encoding: 'big5' };
                }
            }
        } catch (err) {
            continue;
        }
    }
    
    return null;
}

// ===== 編碼轉換核心邏輯 =====

async function handleEncodingConversion(target: 'utf8' | 'big5', sourceEncoding: 'auto' | 'big5' | 'gbk' = 'auto') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('沒有開啟的檔案');
        return;
    }

    const document = editor.document;
    const filePath = document.fileName;
    
    if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage('檔案不存在');
        return;
    }

    // 檢查檔案是否有未儲存的修改
    if (document.isDirty) {
        const choice = await vscode.window.showWarningMessage(
            '檔案有未儲存的修改，編碼轉換會覆寫這些修改。要繼續嗎？',
            '儲存並轉換',
            '取消'
        );
        
        if (choice === '儲存並轉換') {
            await document.save();
        } else {
            // 用戶取消
            return;
        }
    }

    const buffer = fs.readFileSync(filePath);

    try {
        if (target === 'utf8') {
            // 偵測是否已經是 UTF-8
            const currentEncoding = detectEncoding(buffer);
            if (currentEncoding === 'utf8') {
                vscode.window.showInformationMessage('檔案已經是 UTF-8 編碼');
                return;
            }
            
            let decodedContent: string | null = null;
            let detectedEncoding = '';
            
            if (sourceEncoding === 'auto') {
                // 自動偵測
                const result = tryDecodeWithFallback(buffer);
                if (!result) {
                    vscode.window.showErrorMessage('無法自動偵測檔案編碼');
                    return;
                }
                decodedContent = result.content;
                detectedEncoding = result.encoding;
            } else {
                // 指定來源編碼
                try {
                    const iconv = require('iconv-lite');
                    decodedContent = iconv.decode(buffer, sourceEncoding);
                    detectedEncoding = sourceEncoding;
                } catch {
                    vscode.window.showErrorMessage(`無法使用 ${sourceEncoding} 編碼讀取檔案`);
                    return;
                }
            }
            
            // 檢查解碼是否成功
            if (!decodedContent) {
                vscode.window.showErrorMessage('解碼檔案內容失敗');
                return;
            }
            
            // 寫入 UTF-8
            fs.writeFileSync(filePath, decodedContent, 'utf8');
            
            // 重新載入檔案
            await vscode.commands.executeCommand('workbench.action.files.revert');
            
            vscode.window.showInformationMessage(`✅ 已從 ${detectedEncoding.toUpperCase()} 轉換為 UTF-8`);
            
        } else if (target === 'big5') {
            // 轉換為 Big5
            const currentEncoding = detectEncoding(buffer);
            if (currentEncoding === 'big5') {
                vscode.window.showInformationMessage('檔案已經是 Big5 編碼');
                return;
            }
            
            const content = buffer.toString('utf8');
            
            try {
                const iconv = require('iconv-lite');
                const big5Buffer = iconv.encode(content, 'big5');
                fs.writeFileSync(filePath, big5Buffer);
                
                await vscode.commands.executeCommand('workbench.action.files.revert');
                vscode.window.showInformationMessage('✅ 成功轉換為 Big5 編碼');
            } catch {
                vscode.window.showErrorMessage('轉換為 Big5 失敗,請確認已安裝 iconv-lite');
            }
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`編碼轉換失敗: ${error.message}`);
    }
}

async function compileCurrentFile(): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('沒有開啟的檔案');
        return false;
    }
    
    const document = editor.document;
    const languageId = document.languageId;
    
    if (languageId !== 'c' && languageId !== 'cpp') {
        vscode.window.showErrorMessage('目前檔案不是 C/C++ 程式');
        return false;
    }
    
    // 自動儲存
    if (document.isDirty) {
        await document.save();
    }
    
    const sourceFile = document.fileName;
    const config = vscode.workspace.getConfiguration('cpp-smart-runner');
    const vars = getCommandVariables(sourceFile);
    
    let compileCommand: string;
    
    // 檢查是否使用自訂命令
    const useCustom = config.get<boolean>('useCustomCommand', false);
    const customCommand = config.get<string>('customCompileCommand', '');
    
    if (useCustom && customCommand) {
        // 使用自訂命令
        compileCommand = replaceVariables(customCommand, vars);
    } else {
        // 使用預設編譯命令
        const compiler = getCompiler(languageId, config);
        const outputFile = getOutputPath(sourceFile, config);
        const extraFlags = config.get<string>('compilerFlags', '-Wall -O2');
        const standard = languageId === 'cpp' 
            ? config.get<string>('cppStandard', '-std=c++11')
            : config.get<string>('cStandard', '-std=c11');
        
        compileCommand = `"${compiler}" ${standard} ${extraFlags} "${sourceFile}" -o "${outputFile}"`;
    }
    
    outputChannel.show(true);
    outputChannel.appendLine('');
    outputChannel.appendLine('==================== 開始編譯 ====================');
    outputChannel.appendLine(`檔案: ${vars.fileName}`);
    outputChannel.appendLine(`命令: ${compileCommand}`);
    outputChannel.appendLine('');
    
    try {
        const { stdout, stderr } = await execAsync(compileCommand, {
            cwd: vars.dir,
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
            // eslint-disable-next-line @typescript-eslint/naming-convention
            env: { ...process.env, LANG: 'en_US.UTF-8' } // 確保 UTF-8 環境
        });
        
        // 檢查是否有警告
        let hasWarnings = false;
        if (stderr) {
            outputChannel.appendLine(stderr);
            const lowerStderr = stderr.toLowerCase();
            hasWarnings = lowerStderr.includes('warning') && !lowerStderr.includes('error');
        }
        if (stdout) {
            outputChannel.appendLine(stdout);
        }
        
        outputChannel.appendLine('');
        if (hasWarnings) {
            const warningCount = (stderr.match(/warning:/gi) || []).length;
            outputChannel.appendLine(`==================== 編譯成功(有 ${warningCount} 個警告)====================`);
            vscode.window.showWarningMessage(`⚠️ 編譯成功,但有 ${warningCount} 個警告`);
        } else {
            outputChannel.appendLine('==================== 編譯成功 ====================');
            vscode.window.showInformationMessage('✅ 編譯成功');
        }
        return true;
        
    } catch (error: any) {
        outputChannel.appendLine('');
        outputChannel.appendLine('==================== 編譯失敗 ====================');
        outputChannel.appendLine(error.message);
        vscode.window.showErrorMessage('❌ 編譯失敗,請檢查錯誤訊息');
        return false;
    }
}

async function runCurrentFile(skipTimeCheck: boolean = false): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('沒有開啟的檔案');
        return;
    }
    
    const document = editor.document;
    const languageId = document.languageId;
    
    if (languageId !== 'c' && languageId !== 'cpp') {
        vscode.window.showErrorMessage('目前檔案不是 C/C++ 程式');
        return;
    }
    
    const sourceFile = document.fileName;
    const config = vscode.workspace.getConfiguration('cpp-smart-runner');
    const vars = getCommandVariables(sourceFile);
    
    // 除錯輸出
    if (config.get<boolean>('showExecutionMessage', true)) {
        outputChannel.appendLine('');
        outputChannel.appendLine('==================== 執行變數除錯 ====================');
        outputChannel.appendLine(`fileName: ${vars.fileName}`);
        outputChannel.appendLine(`fileNameWithoutExt: ${vars.fileNameWithoutExt}`);
        outputChannel.appendLine(`dir: ${vars.dir}`);
        outputChannel.appendLine('');
    }
    
    // 取得輸出檔路徑
    const outputFile = getOutputPath(sourceFile, config);
    
    // 檢查執行檔是否存在
    if (!fs.existsSync(outputFile)) {
        const choice = await vscode.window.showWarningMessage(
            '執行檔不存在,是否先編譯?',
            '編譯並執行',
            '取消'
        );
        
        if (choice === '編譯並執行') {
            const success = await compileCurrentFile();
            if (success) {
                await runCurrentFile(true);
            }
        }
        return;
    }
    
    // 檢查檔案時間戳記
    if (!skipTimeCheck) {
        const sourceStats = fs.statSync(sourceFile);
        const outputStats = fs.statSync(outputFile);
        
        if (outputStats.mtime < sourceStats.mtime) {
            const choice = await vscode.window.showWarningMessage(
                '⚠️ 警告:執行檔比原始檔舊,可能執行的是舊版本!',
                '重新編譯並執行',
                '仍然執行',
                '取消'
            );
            
            if (choice === '重新編譯並執行') {
                const success = await compileCurrentFile();
                if (success) {
                    await runCurrentFile(true);
                }
                return;
            } else if (choice === '取消') {
                return;
            }
        }
    }
    
    // 重用或建立終端機
    // 檢查終端機是否仍然存在
    if (!runnerTerminal || runnerTerminal.exitStatus !== undefined) {
        runnerTerminal = vscode.window.createTerminal({
            name: 'C/C++ Runner'
        });
    }
    runnerTerminal.show();
    
    const isWindows = process.platform === 'win32';
    
    // 偵測終端機類型（僅用於 Windows 編碼設定）
    let isPowerShell = false;
    if (isWindows) {
        const shellPath = (vscode.env.shell || '').toLowerCase();
        isPowerShell = shellPath.includes('powershell') || shellPath.includes('pwsh');
        
        // 如果 shell 路徑偵測失敗，嘗試從活動終端機獲取
        if (!isPowerShell && vscode.window.activeTerminal) {
            const terminalName = vscode.window.activeTerminal.name.toLowerCase();
            isPowerShell = terminalName.includes('powershell') || terminalName.includes('pwsh');
        }
    }
    
    // 清空終端機
    if (config.get<boolean>('clearTerminal', true)) {
        const clearCommand = isWindows ? 'cls' : 'clear';
        runnerTerminal.sendText(clearCommand, true);
    }
    
    // Windows 環境設定 UTF-8（根據終端機類型使用對應語法）
    if (isWindows) {
        if (isPowerShell) {
            // PowerShell 需要設定控制台和輸出編碼
            runnerTerminal.sendText('chcp 65001 2>&1 | Out-Null', true);
            runnerTerminal.sendText('[Console]::OutputEncoding = [System.Text.Encoding]::UTF8', true);
        } else {
            // CMD 只需要 chcp
            runnerTerminal.sendText('chcp 65001 >nul 2>&1', true);
        }
    }
    
    // 準備執行命令
    let execCommand: string;
    let useCustomCommand = config.get<boolean>('useCustomCommand', false);
    const fileDir = path.dirname(outputFile);
    const fileName = path.basename(outputFile);
    
    // 統一先切換到檔案所在目錄（自訂和預設命令都需要）
    runnerTerminal.sendText(`cd "${fileDir}"`, true);
    
    const customRunCommand = config.get<string>('customRunCommand', '');
    
    if (useCustomCommand && customRunCommand) {
        // 使用自訂命令
        execCommand = replaceVariables(customRunCommand, vars);
        
        if (config.get<boolean>('showExecutionMessage', true)) {
            outputChannel.appendLine('');
            outputChannel.appendLine('==================== 執行程式 ====================');
            outputChannel.appendLine(`使用自訂命令`);
            outputChannel.appendLine(`終端機類型: ${isPowerShell ? 'PowerShell' : (isWindows ? 'CMD' : 'Unix Shell')}`);
            outputChannel.appendLine(`切換目錄: ${fileDir}`);
            outputChannel.appendLine(`執行命令: ${execCommand}`);
        }
    } else {
        // 使用預設命令：相對路徑執行
        // 使用相對路徑執行
        if (isWindows) {
            // Windows: 使用 .\ 格式
            if (fileName.includes(' ')) {
                execCommand = `".\\${fileName}"`;
            } else {
                execCommand = `.\\${fileName}`;
            }
        } else {
            // Unix-like: 使用 ./ 格式
            if (fileName.includes(' ')) {
                execCommand = `"./${fileName}"`;
            } else {
                execCommand = `./${fileName}`;
            }
        }
        
        if (config.get<boolean>('showExecutionMessage', true)) {
            outputChannel.appendLine('');
            outputChannel.appendLine('==================== 執行程式 ====================');
            outputChannel.appendLine(`終端機類型: ${isPowerShell ? 'PowerShell' : (isWindows ? 'CMD' : 'Unix Shell')}`);
            outputChannel.appendLine(`切換目錄: ${fileDir}`);
            outputChannel.appendLine(`執行命令: ${execCommand}`);
        }
    }
    
    // 執行命令
    runnerTerminal.sendText(execCommand);
}

function getCompiler(languageId: string, config: vscode.WorkspaceConfiguration): string {
    const customCompiler = config.get<string>('compilerPath', '');
    
    if (customCompiler) {
        return customCompiler;
    }
    
    // 自動偵測編譯器
    return languageId === 'cpp' ? 'g++' : 'gcc';
}

function getOutputPath(sourceFile: string, config: vscode.WorkspaceConfiguration): string {
    const outputDir = config.get<string>('outputDir', '');
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';
    
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    
    if (outputDir) {
        // 確保輸出目錄存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        return path.join(outputDir, baseName + ext);
    } else {
        // 與原始檔同目錄
        return path.join(path.dirname(sourceFile), baseName + ext);
    }
}

export function deactivate() {
    if (outputChannel) {
        outputChannel.dispose();
    }
    if (runnerTerminal) {
        runnerTerminal.dispose();
        runnerTerminal = undefined;
    }
}
