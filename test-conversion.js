// 測試編碼轉換功能
const fs = require('fs');
const path = require('path');

function isUtf8(buffer) {
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        return true;
    } catch {
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
    
    // 改進的 Big5 vs GBK 判斷邏輯
    let big5Score = 0;
    let gbkScore = 0;
    let big5SpecificScore = 0;
    
    for (let i = 0; i < Math.min(buffer.length - 1, 1000); i++) {
        const byte1 = buffer[i];
        const byte2 = buffer[i + 1];
        
        // Big5 特有範圍
        if (byte1 >= 0xA1 && byte1 <= 0xF9) {
            if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFE)) {
                big5Score++;
                
                // Big5 特有的第二字節範圍
                if (byte2 >= 0x40 && byte2 <= 0x7E && byte2 !== 0x7F) {
                    big5SpecificScore += 2;
                }
            }
        }
        
        // GBK 特有範圍
        if (byte1 >= 0x81 && byte1 <= 0xA0) {
            if (byte2 >= 0x40 && byte2 <= 0xFE && byte2 !== 0x7F) {
                gbkScore += 2;
            }
        } else if (byte1 >= 0xA1 && byte1 <= 0xFE && byte2 >= 0x40 && byte2 <= 0xFE) {
            gbkScore++;
        }
    }
    
    // 判斷邏輯
    const totalBig5 = big5Score + big5SpecificScore;
    
    if (big5SpecificScore > 3 || (totalBig5 > gbkScore && big5Score > 3)) {
        return 'big5';
    } else if (gbkScore > 5) {
        return 'gbk';
    }
    
    return 'big5';
}

function tryDecodeWithFallback(buffer) {
    const detectedEncoding = detectEncoding(buffer);
    
    console.log(`偵測到的編碼: ${detectedEncoding}`);
    
    if (detectedEncoding === 'utf8') {
        return { content: buffer.toString('utf8'), encoding: 'utf8' };
    }
    
    // 嘗試編碼列表
    const encodings = [detectedEncoding, 'big5', 'gbk', 'cp950'];
    
    for (const enc of encodings) {
        try {
            const iconv = require('iconv-lite');
            const content = iconv.decode(buffer, enc);
            
            // 驗證:檢查是否有過多的替換字元
            const replacementCount = (content.match(/�/g) || []).length;
            const replacementRatio = replacementCount / content.length;
            
            console.log(`嘗試 ${enc}: 替換字元數=${replacementCount}, 比例=${(replacementRatio * 100).toFixed(2)}%`);
            
            if (replacementRatio < 0.05) {
                console.log(`✓ 使用編碼: ${enc}`);
                return { content, encoding: enc };
            }
        } catch (err) {
            console.log(`✗ ${enc} 解碼失敗: ${err.message}`);
            continue;
        }
    }
    
    return null;
}

// 主程式
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('使用方式: node test-conversion.js <檔案路徑>');
    process.exit(1);
}

const filePath = args[0];
if (!fs.existsSync(filePath)) {
    console.error(`錯誤: 檔案不存在: ${filePath}`);
    process.exit(1);
}

console.log(`\n========== 測試檔案: ${filePath} ==========\n`);

const buffer = fs.readFileSync(filePath);
console.log(`檔案大小: ${buffer.length} bytes\n`);

const result = tryDecodeWithFallback(buffer);

if (result) {
    console.log(`\n========== 解碼成功 ==========`);
    console.log(`原始編碼: ${result.encoding}`);
    console.log(`\n內容預覽:\n`);
    console.log(result.content.substring(0, 500));
    
    // 模擬寫入 UTF-8
    const outputPath = filePath + '.utf8.test';
    fs.writeFileSync(outputPath, result.content, 'utf8');
    console.log(`\n✓ 已轉換為 UTF-8 並儲存到: ${outputPath}`);
} else {
    console.log('\n✗ 解碼失敗');
}
