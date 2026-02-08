/**
 * Keywords and patterns for identifying expiration date anchors in OCR text.
 * @module utils/ocrKeywords
 */

/**
 * Primary keywords that strongly indicate an expiration date follows.
 */
export const EXPIRATION_ANCHORS = [
    'SCAD', 'SCADENZA',
    'EXP', 'EXPIRES', 'EXPIRY',
    'BEST BEFORE', 'USE BY', 'BBE', 'BB',
    'ENTRO', 'CONSUMARSI', 'PREFERIBILMENTE',
    'VALIDO', 'FINO', 'VAL',
    'DA CONSUMARE', 'DATA',
    'LOTTO/SCAD',
    'TMC' // Termine Minimo di Conservazione
] as const;

/**
 * Checks if a block of text acts as an expiration anchor.
 * Returns true if it contains any of the expiration keywords.
 * 
 * @param text The text block to check
 */
export function isExpirationAnchor(text: string): boolean {
    if (!text || text.length < 2) return false;

    const upperText = text.toUpperCase();

    // Check for direct keyword, but be careful with short words like "DA" or "IL"
    return EXPIRATION_ANCHORS.some(keyword => {
        // Exact word match or clear containment for longer words
        if (keyword.length > 3) {
            return upperText.includes(keyword);
        }
        // For short keywords, require word boundaries or clear context
        const regex = new RegExp(`\\b${keyword}\\b`);
        return regex.test(upperText);
    });
}
