/**
 * Cleans OCR text block by applying common OCR error fixes.
 * @param text The raw uppercase text to clean
 */
export const cleanBlockText = (text: string): string => {
    return text
        // Common number misreadings (including dot-matrix fonts)
        .replace(/(?<=\d)O(?=\d)|(?<=\d)O\b|\bO(?=\d)/g, '0')
        .replace(/(?<=\d)S(?=\d)|(?<=\d)S\b|\bS(?=\d)/g, '5')
        .replace(/(?<=\d)B(?=\d)|(?<=\d)B\b|\bB(?=\d)/g, '8')
        .replace(/(?<=\d)G(?=\d)|(?<=\d)G\b|\bG(?=\d)/g, '6')
        .replace(/(?<=\d)T(?=\d)|(?<=\d)T\b|\bT(?=\d)/g, '7')
        .replace(/(?<=\d)Z(?=\d)|(?<=\d)Z\b|\bZ(?=\d)/g, '2')
        .replace(/(?<=\d)I(?=\d)|(?<=\d)I\b|\bI(?=\d)/g, '1')
        .replace(/(?<=\d)L(?=\d)|(?<=\d)L\b|\bL(?=\d)/g, '1')
        // Normalize spaced dates: "06 05 26" or "06 . 05 . 26" -> "06.05.26"
        .replace(/\b(\d{1,2})\s*[.\s-]\s*(\d{1,2})\s*[.\s-]\s*(\d{2,4})\b/g, '$1.$2.$3')
        // Remove noise dots that are not part of a date (e.g. "9636.759")
        .replace(/(?<=\d)\.(?=\d{3,})/g, '');
};
