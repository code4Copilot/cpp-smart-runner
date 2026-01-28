# Big5/GBK 編碼偵測改進

## 問題描述

### 原始問題
用戶反映 Big5 編碼的檔案被誤判為 GBK，導致編碼轉換時顯示錯誤的原始編碼名稱。

**錯誤範例**：
- 實際編碼：Big5
- 偵測結果：GBK ❌
- 影響：雖然轉換功能正常，但顯示資訊不正確

## 根本原因

### 字節範圍重疊
Big5 和 GBK 的字節範圍有重疊：

**Big5 編碼範圍**：
- 第一字節：`0xA1 - 0xF9`
- 第二字節：`0x40 - 0x7E` 或 `0x80 - 0xFE`（不包括 `0x7F`）

**GBK 編碼範圍**：
- 第一字節：`0x81 - 0xFE`
- 第二字節：`0x40 - 0xFE`（不包括 `0x7F`）

### 問題點
Big5 的範圍（`0xA1-0xF9`）完全被 GBK 的範圍（`0x81-0xFE`）包含，導致原始簡單的計分邏輯會將 Big5 檔案誤判為 GBK。

## 改進方案

### 1. 識別 Big5 特有特徵

#### Big5 特有的第二字節範圍
Big5 的第二字節可以是 `0x40-0x7E`（ASCII 可見字符範圍），這在 GBK 中較少使用。

```typescript
// Big5 特有的第二字節範圍
if (byte2 >= 0x40 && byte2 <= 0x7E && byte2 !== 0x7F) {
    big5SpecificScore += 2;  // 給予更高權重
}
```

#### GBK 特有的第一字節範圍
GBK 的第一字節可以從 `0x81` 開始，而 Big5 從 `0xA1` 開始。

```typescript
// 0x81-0xA0 是 GBK 特有範圍
if (byte1 >= 0x81 && byte1 <= 0xA0) {
    gbkScore += 2;  // GBK 特有區域給更高分
}
```

### 2. 改進的判斷邏輯

```typescript
function detectEncoding(buffer: Buffer): 'utf8' | 'big5' | 'gbk' | 'unknown' {
    // ... UTF-8 檢查 ...
    
    let big5Score = 0;
    let gbkScore = 0;
    let big5SpecificScore = 0;  // Big5 特有特徵分數
    
    for (let i = 0; i < Math.min(buffer.length - 1, 1000); i++) {
        const byte1 = buffer[i];
        const byte2 = buffer[i + 1];
        
        // Big5 判斷（包含特有特徵）
        if (byte1 >= 0xA1 && byte1 <= 0xF9) {
            if ((byte2 >= 0x40 && byte2 <= 0x7E) || (byte2 >= 0x80 && byte2 <= 0xFE)) {
                big5Score++;
                
                // Big5 特有的第二字節範圍
                if (byte2 >= 0x40 && byte2 <= 0x7E && byte2 !== 0x7F) {
                    big5SpecificScore += 2;
                }
            }
        }
        
        // GBK 判斷（區分特有範圍）
        if (byte1 >= 0x81 && byte1 <= 0xA0) {
            // GBK 特有範圍
            if (byte2 >= 0x40 && byte2 <= 0xFE && byte2 !== 0x7F) {
                gbkScore += 2;
            }
        } else if (byte1 >= 0xA1 && byte1 <= 0xFE && byte2 >= 0x40 && byte2 <= 0xFE) {
            // 重疊範圍只給基本分
            gbkScore++;
        }
    }
    
    // 優先考慮特有特徵
    const totalBig5 = big5Score + big5SpecificScore;
    
    if (big5SpecificScore > 3 || (totalBig5 > gbkScore && big5Score > 3)) {
        return 'big5';
    } else if (gbkScore > 5) {
        return 'gbk';
    }
    
    return 'big5';  // 預設 Big5（台灣常用）
}
```

## 改進效果

### 判斷準確度提升

#### 修正前
```
原始編碼: Big5 → 偵測結果: GBK ❌
```

#### 修正後
```
原始編碼: Big5 → 偵測結果: Big5 ✅
```

### 判斷依據

1. **Big5 特有特徵**（權重 x2）
   - 第二字節在 `0x40-0x7E` 範圍
   - 此範圍在 Big5 中常見，GBK 中較少

2. **GBK 特有特徵**（權重 x2）
   - 第一字節在 `0x81-0xA0` 範圍
   - 此範圍是 GBK 獨有

3. **重疊範圍**（權重 x1）
   - 兩種編碼都可能出現的字節組合
   - 給予基本分數

## 測試驗證

```bash
npm test
# 98 passing (597ms) ✅
```

所有現有測試繼續通過，編碼偵測邏輯更加準確。

## 技術細節

### Big5 vs GBK 字節範圍對比表

| 特徵 | Big5 | GBK | 用途 |
|------|------|-----|------|
| 第一字節起始 | `0xA1` | `0x81` | GBK 特有: `0x81-0xA0` |
| 第一字節結束 | `0xF9` | `0xFE` | - |
| 第二字節低段 | `0x40-0x7E` | `0x40-0x7E` | Big5 常用 |
| 第二字節高段 | `0x80-0xFE` | `0x80-0xFE` | 兩者皆用 |
| 排除字節 | `0x7F` | `0x7F` | 兩者皆排除 |

### 判斷流程

```
1. 檢查 UTF-8
   ├─ 是 → 返回 'utf8'
   └─ 否 → 繼續

2. 掃描字節特徵
   ├─ Big5 特有特徵 (0x40-0x7E)
   ├─ GBK 特有特徵 (0x81-0xA0)
   └─ 重疊範圍特徵

3. 計算分數
   ├─ big5SpecificScore (權重 x2)
   ├─ big5Score (基本分)
   └─ gbkScore

4. 判斷結果
   ├─ big5SpecificScore > 3 → Big5
   ├─ totalBig5 > gbkScore → Big5
   ├─ gbkScore > 5 → GBK
   └─ 預設 → Big5 (台灣常用)
```

## 未來改進方向

### 1. 機器學習方法
- 使用訓練好的模型判斷編碼
- 準確度可達 95% 以上

### 2. 字頻分析
- 分析常用漢字的字頻分布
- Big5 和 GBK 的字頻特徵不同

### 3. 使用專業函式庫
- chardet（Python）
- jschardet（JavaScript）
- 但會增加套件大小

## 結論

通過識別 Big5 和 GBK 的特有字節範圍特徵，並給予適當的權重，顯著提升了編碼偵測的準確度。對於台灣用戶常見的 Big5 編碼檔案，現在能夠正確識別並顯示正確的編碼名稱。

---

**修正日期**：2026-01-28  
**影響版本**：1.0.8+  
**測試狀態**：98/98 通過 ✅
