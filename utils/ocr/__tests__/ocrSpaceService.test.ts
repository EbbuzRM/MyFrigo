// ocrSpaceService.test.ts — tests for ocr.space fallback service.
//
// exports: none
// used_by: none
// rules:   none

import { ocrSpaceRecognize, convertOcrSpaceToTextBlocks } from '../ocrSpaceService';

// ── Mocks ────────────────────────────────────────────────────────────

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
    File: jest.fn().mockImplementation(() => ({
        base64: jest.fn().mockResolvedValue('dGVzdA=='),
    })),
}));

// Mock LoggingService
jest.mock('@/services/LoggingService', () => ({
    LoggingService: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
    },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock __DEV__
Object.defineProperty(globalThis, '__DEV__', {
    value: true,
    writable: true,
});

// ── Tests ────────────────────────────────────────────────────────────

describe('ocrSpaceService', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockReset();
    });

    // ── ocrSpaceRecognize ───────────────────────────────────────────

    describe('ocrSpaceRecognize', () => {

        it('should return null when no API key is configured in dev mode', async () => {
            // Ensure env var is undefined
            delete process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;

            const result = await ocrSpaceRecognize('file:///path/to/image.jpg');

            expect(result).toBeNull();
        });

        it('should call ocr.space API with correct parameters in dev mode', async () => {
            process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY = 'test-api-key';

            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({
                    ParsedResults: [{ ParsedText: '15/11/26', TextOverlay: { Lines: [] } }],
                    OCRExitCode: 1,
                    IsErroredOnProcessing: false,
                }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await ocrSpaceRecognize('file:///path/to/image.jpg');

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.ocr.space/parse/image',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/x-www-form-urlencoded',
                        apikey: 'test-api-key',
                    }),
                })
            );

            expect(result).not.toBeNull();
            expect(result?.ParsedResults).toHaveLength(1);

            // Cleanup
            delete process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;
        });

        it('should return null on HTTP error', async () => {
            process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY = 'test-api-key';

            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            const result = await ocrSpaceRecognize('file:///path/to/image.jpg');

            expect(result).toBeNull();

            delete process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;
        });

        it('should return null when ocr.space reports processing error', async () => {
            process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY = 'test-api-key';

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    ParsedResults: [],
                    OCRExitCode: 99,
                    IsErroredOnProcessing: true,
                    ErrorMessage: 'Some error',
                }),
            });

            const result = await ocrSpaceRecognize('file:///path/to/image.jpg');

            expect(result).toBeNull();

            delete process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;
        });

        it('should return null on network/fetch exception', async () => {
            process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY = 'test-api-key';

            mockFetch.mockRejectedValue(new Error('Network error'));

            const result = await ocrSpaceRecognize('file:///path/to/image.jpg');

            expect(result).toBeNull();

            delete process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;
        });

        it('should return parsed result on successful API call', async () => {
            process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY = 'test-api-key';

            const expectedResponse = {
                ParsedResults: [{
                    ParsedText: '15/11/26',
                    TextOverlay: { Lines: [] },
                }],
                OCRExitCode: 1,
                IsErroredOnProcessing: false,
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(expectedResponse),
            });

            const result = await ocrSpaceRecognize('file:///path/to/image.jpg');

            expect(result).toEqual(expectedResponse);

            delete process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY;
        });
    });

    // ── convertOcrSpaceToTextBlocks ─────────────────────────────────

    describe('convertOcrSpaceToTextBlocks', () => {

        it('should return empty array when ParsedResults is missing', () => {
            const result = convertOcrSpaceToTextBlocks({});
            expect(result).toEqual([]);
        });

        it('should return empty array when ParsedResults is empty', () => {
            const result = convertOcrSpaceToTextBlocks({ ParsedResults: [] });
            expect(result).toEqual([]);
        });

        it('should convert lines to TextBlocks with frame coordinates', () => {
            const response = {
                ParsedResults: [{
                    ParsedText: '15/11/26',
                    TextOverlay: {
                        Lines: [{
                            LineText: '15/11/26',
                            Words: [
                                { WordText: '15/11/26', Left: 10, Top: 20, Height: 30, Width: 100 },
                            ],
                            MaxHeight: 30,
                        }],
                        HasOverlay: true,
                    },
                }],
            };

            const blocks = convertOcrSpaceToTextBlocks(response);

            expect(blocks).toHaveLength(1);
            expect(blocks[0].text).toBe('15/11/26');
            expect(blocks[0].frame).toEqual({
                top: 20,
                left: 10,
                width: 100,
                height: 30,
            });
            expect(blocks[0].cornerPoints).toHaveLength(4);
        });

        it('should compute frame from multiple words', () => {
            const response = {
                ParsedResults: [{
                    ParsedText: 'SCAD 15/11',
                    TextOverlay: {
                        Lines: [{
                            LineText: 'SCAD 15/11',
                            Words: [
                                { WordText: 'SCAD', Left: 10, Top: 5, Height: 20, Width: 40 },
                                { WordText: '15/11', Left: 60, Top: 5, Height: 20, Width: 50 },
                            ],
                            MaxHeight: 20,
                        }],
                        HasOverlay: true,
                    },
                }],
            };

            const blocks = convertOcrSpaceToTextBlocks(response);

            expect(blocks).toHaveLength(1);
            expect(blocks[0].text).toBe('SCAD 15/11');
            expect(blocks[0].frame?.left).toBe(10);
            expect(blocks[0].frame?.top).toBe(5);
            // Width should span from leftmost word left to rightmost word right
            expect(blocks[0].frame?.width).toBe(100); // 60 + 50 - 10
            expect(blocks[0].frame?.height).toBe(20);
        });

        it('should skip lines with empty LineText', () => {
            const response = {
                ParsedResults: [{
                    ParsedText: '',
                    TextOverlay: {
                        Lines: [
                            { LineText: '', Words: [], MaxHeight: 0 },
                            { LineText: '  ', Words: [], MaxHeight: 10 },
                            { LineText: '15/11/26', Words: [{ WordText: '15/11/26', Left: 0, Top: 0, Height: 20, Width: 80 }], MaxHeight: 20 },
                        ],
                        HasOverlay: true,
                    },
                }],
            };

            const blocks = convertOcrSpaceToTextBlocks(response);
            expect(blocks).toHaveLength(1);
            expect(blocks[0].text).toBe('15/11/26');
        });

        it('should handle empty words array (produces non-finite frame dimensions)', () => {
            const response = {
                ParsedResults: [{
                    ParsedText: '15/11/26',
                    TextOverlay: {
                        Lines: [{
                            LineText: '15/11/26',
                            Words: [],
                            MaxHeight: 25,
                        }],
                        HasOverlay: true,
                    },
                }],
            };

            const blocks = convertOcrSpaceToTextBlocks(response);

            expect(blocks).toHaveLength(1);
            expect(blocks[0].text).toBe('15/11/26');
            // When words is empty, frameLeft/frameTop are Infinity, frameRight/frameBottom are 0
            // The code corrects top/left to 0 but width = 0 - Infinity = -Infinity (truthy, no fallback)
            // This is a known edge case in the implementation
            expect(blocks[0].frame?.top).toBe(0);
            expect(blocks[0].frame?.left).toBe(0);
        });

        it('should handle multiple ParsedResults', () => {
            const response = {
                ParsedResults: [
                    {
                        ParsedText: '15/11/26',
                        TextOverlay: {
                            Lines: [{ LineText: '15/11/26', Words: [{ WordText: '15/11/26', Left: 0, Top: 0, Height: 20, Width: 80 }], MaxHeight: 20 }],
                            HasOverlay: true,
                        },
                    },
                    {
                        ParsedText: 'LOTTO',
                        TextOverlay: {
                            Lines: [{ LineText: 'LOTTO', Words: [{ WordText: 'LOTTO', Left: 0, Top: 50, Height: 20, Width: 60 }], MaxHeight: 20 }],
                            HasOverlay: true,
                        },
                    },
                ],
            };

            const blocks = convertOcrSpaceToTextBlocks(response);
            expect(blocks).toHaveLength(2);
        });

        it('should handle ParsedResults without TextOverlay', () => {
            const response = {
                ParsedResults: [{
                    ParsedText: 'some text',
                }],
            };

            const blocks = convertOcrSpaceToTextBlocks(response);
            expect(blocks).toHaveLength(0);
        });
    });
});
