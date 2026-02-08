/**
 * Cleans OCR text block by applying common OCR error fixes.
 * @param text The raw uppercase text to clean
 */
export const cleanBlockText = (text: string): string => {
    return text
        .replace(/(?<=\d)O(?=\d)|(?<=\d)O\b|\bO(?=\d)/g, '0')
        .replace(/(?<=\d)S(?=\d)|(?<=\d)S\b|\bS(?=\d)/g, '5')
        .replace(/(?<=\d)B(?=\d)|(?<=\d)B\b|\bB(?=\d)/g, '8');
};
