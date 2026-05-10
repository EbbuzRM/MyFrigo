// preprocessing.ts — preprocessing module.
//
// exports: cleanBlockText
// used_by: utils\ocr\parsing.ts
// rules:   - All OCR preprocessing regex patterns must maintain strict false-positive avoidance, prioritizing no data corruption over perfect cleaning
//          - Transformations must preserve the original text length and character positions for alignment with coordinate data
//          - Date normalization must apply a consistent output format (DD.MM.YY) across all pattern matches
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Magic numbers for OCR preprocessing patterns.
 */
const LOT_CODE_MIN_LENGTH = 2;
const LOT_CODE_MAX_LENGTH = 6;

/**
 * Cleans OCR text block by applying common OCR error fixes.
 * @param text The raw uppercase text to clean
 */
export const cleanBlockText = (text: string): string => {
    return text
        // Common number misreadings (including dot-matrix fonts)
        .replace(/\b(\d{2}0)[Gg](\d{2})\b/g, '$19$2')
        .replace(/\b(\d{1,2})~(\d{2})(\d{2})\b/g, '$1$2$3')
        .replace(/\b(\d{1,2})[/\\](\d{2})1(\d{4})\b/g, '$1.$2.$3')
        .replace(/\b[A-ZÀ-Ý]{1,2}(?=\d{1,2}\s*[.\/\\ -]\s*\d{1,2}\s*[.\/\\ -]\s*\d{2,4}\b)/g, '')
        .replace(/(?<=\d)O(?=\d)|(?<=\d)O\b|\bO(?=\d)/g, '0')
        .replace(/(?<=\d)S(?=\d)|(?<=\d)S\b|\bS(?=\d)/g, '5')
        .replace(/(?<=\d)B(?=\d)|(?<=\d)B\b|\bB(?=\d)/g, '8')
        .replace(/(?<=\d)G(?=\d)|(?<=\d)G\b|\bG(?=\d)/g, '6')
        .replace(/(?<=\d)T(?=\d)|(?<=\d)T\b|\bT(?=\d)/g, '7')
        .replace(/(?<=\d)Z(?=\d)|(?<=\d)Z\b|\bZ(?=\d)/g, '2')
        .replace(/(?<=\d)I(?=\d)|(?<=\d)I\b|\bI(?=\d)/g, '1')
        .replace(/(?<=\d)L(?=\d)|(?<=\d)L\b|\bL(?=\d)/g, '1')
        // Remove time-like sequences (HH:MM) which often follow expiration dates
        .replace(/\b\d{1,2}:\d{2}\b/g, '')
        // Remove potential lot codes (e.g. L058, LO58)
        .replace(new RegExp(`\\bL[A-Z0-9]{${LOT_CODE_MIN_LENGTH},${LOT_CODE_MAX_LENGTH}}\\b`, 'gi'), '')
        // FIX: Ricomponi date frammentate come "08/202 7" -> "08/2027"
        .replace(/(\d{2}\/\d{3})\s+(\d{1})/g, '$1$2')
        .replace(/(\d{2})\s*\/\s*(\d{2})\s+(\d{1,2})/g, '$1/$2$3')
        // Normalize spaced dates: "06 05 26" or "06 . 05 . 26" or "06/05/26" -> "06.05.26"
        .replace(/\b(\d{1,2})\s*[.\/\\ -]\s*(\d{1,2})\s*[.\/\\ -]\s*(\d{2,4})\b/g, '$1.$2.$3')
        // Remove noise dots that are not part of a date (e.g. "9636.759")
        .replace(/(?<!\b\d{1,2}\.\d{1,2})\.(?=\d{3,})/g, '');
};
