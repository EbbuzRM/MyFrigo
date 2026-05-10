// ocrGeometry.test.ts — tests for OCR geometry utilities.
//
// exports: none
// used_by: none
// rules:   none

import { calculateDistance, isRightOf, isBelow, isAbove } from '@/utils/ocrGeometry';
import { Frame } from '@react-native-ml-kit/text-recognition';

// ── Helpers ──────────────────────────────────────────────────────────

const createFrame = (top: number, left: number, width: number, height: number): Frame => ({
    top, left, width, height,
});

// ── Tests ────────────────────────────────────────────────────────────

describe('ocrGeometry', () => {

    // ── calculateDistance ────────────────────────────────────────────

    describe('calculateDistance', () => {
        it('should return 0 for overlapping rectangles', () => {
            const rect1 = createFrame(0, 0, 100, 50);
            const rect2 = createFrame(25, 25, 100, 50);
            expect(calculateDistance(rect1, rect2)).toBe(0);
        });

        it('should return 0 for identical rectangles', () => {
            const rect1 = createFrame(10, 10, 80, 40);
            const rect2 = createFrame(10, 10, 80, 40);
            expect(calculateDistance(rect1, rect2)).toBe(0);
        });

        it('should calculate vertical distance when one is directly below the other', () => {
            const rect1 = createFrame(0, 0, 100, 50);   // bottom at y=50
            const rect2 = createFrame(80, 0, 100, 50);   // top at y=80
            expect(calculateDistance(rect1, rect2)).toBe(30);
        });

        it('should calculate horizontal distance when one is directly to the right', () => {
            const rect1 = createFrame(0, 0, 100, 50);   // right edge at x=100
            const rect2 = createFrame(0, 130, 80, 50);   // left edge at x=130
            expect(calculateDistance(rect1, rect2)).toBe(30);
        });

        it('should calculate diagonal (corner) distance', () => {
            const rect1 = createFrame(0, 0, 50, 30);    // right at 50, bottom at 30
            const rect2 = createFrame(60, 70, 50, 30);   // left at 70, top at 60
            // dx = 70 - 50 = 20, dy = 60 - 30 = 30
            // distance = sqrt(400 + 900) = sqrt(1300) ≈ 36.06
            const dist = calculateDistance(rect1, rect2);
            expect(dist).toBeCloseTo(36.06, 1);
        });

        it('should return 0 when rectangles touch at edge', () => {
            const rect1 = createFrame(0, 0, 100, 50);    // bottom at y=50
            const rect2 = createFrame(50, 0, 100, 50);   // top at y=50 — touching
            expect(calculateDistance(rect1, rect2)).toBe(0);
        });

        it('should handle rect1 below rect2', () => {
            const rect1 = createFrame(80, 0, 100, 50);   // top at y=80
            const rect2 = createFrame(0, 0, 100, 50);    // bottom at y=50
            expect(calculateDistance(rect1, rect2)).toBe(30);
        });
    });

    // ── isRightOf ────────────────────────────────────────────────────

    describe('isRightOf', () => {
        it('should return true when target is to the right of anchor on same line', () => {
            const anchor = createFrame(10, 10, 50, 20);  // centerY = 20
            const target = createFrame(10, 70, 60, 20);  // centerY = 20, left=70 > 10
            expect(isRightOf(anchor, target)).toBe(true);
        });

        it('should return false when target is to the left of anchor', () => {
            const anchor = createFrame(10, 70, 50, 20);
            const target = createFrame(10, 10, 60, 20);  // left=10 < 70
            expect(isRightOf(anchor, target)).toBe(false);
        });

        it('should return false when target is far below anchor (not vertically aligned)', () => {
            const anchor = createFrame(10, 10, 50, 20);   // centerY = 20
            const target = createFrame(200, 70, 60, 20);  // centerY = 210, too far
            expect(isRightOf(anchor, target)).toBe(false);
        });

        it('should respect custom tolerance percentage', () => {
            const anchor = createFrame(10, 10, 50, 20);  // centerY = 20
            const target = createFrame(25, 70, 60, 20);  // centerY = 35
            // verticalDiff = 15, avgHeight = 20, tolerance = 0.5 → 10
            // 15 > 10, so NOT rightOf with default tolerance
            expect(isRightOf(anchor, target)).toBe(false);
            // With higher tolerance, should pass
            expect(isRightOf(anchor, target, 1.0)).toBe(true);
        });
    });

    // ── isBelow ─────────────────────────────────────────────────────

    describe('isBelow', () => {
        it('should return true when target is directly below anchor', () => {
            const anchor = createFrame(10, 10, 100, 20);  // top=10
            const target = createFrame(50, 10, 100, 20);  // top=50 > 10, overlapping x
            expect(isBelow(anchor, target)).toBe(true);
        });

        it('should return false when target is above anchor', () => {
            const anchor = createFrame(50, 10, 100, 20);
            const target = createFrame(10, 10, 100, 20);  // top=10 < 50
            expect(isBelow(anchor, target)).toBe(false);
        });

        it('should return false when target is not horizontally aligned', () => {
            const anchor = createFrame(10, 10, 100, 20);     // left=10, width=100 → right=110
            const target = createFrame(50, 200, 100, 20);    // left=200, no overlap
            expect(isBelow(anchor, target)).toBe(false);
        });

        it('should return true with sufficient horizontal overlap', () => {
            const anchor = createFrame(10, 10, 100, 20);     // right edge at 110
            const target = createFrame(50, 50, 100, 20);     // left=50, overlaps from 50 to 110
            // overlap = 60, minWidth = 100, 20% of 100 = 20 → 60 > 20, passes
            expect(isBelow(anchor, target)).toBe(true);
        });
    });

    // ── isAbove ─────────────────────────────────────────────────────

    describe('isAbove', () => {
        it('should return true when target is directly above anchor', () => {
            const anchor = createFrame(50, 10, 100, 20);  // top=50
            const target = createFrame(10, 10, 100, 20);  // top=10 < 50, overlapping x
            expect(isAbove(anchor, target)).toBe(true);
        });

        it('should return false when target is below anchor', () => {
            const anchor = createFrame(10, 10, 100, 20);
            const target = createFrame(50, 10, 100, 20);  // top=50 > 10
            expect(isAbove(anchor, target)).toBe(false);
        });

        it('should return false when target is not horizontally aligned', () => {
            const anchor = createFrame(50, 10, 100, 20);
            const target = createFrame(10, 200, 100, 20);  // No overlap
            expect(isAbove(anchor, target)).toBe(false);
        });

        it('should return true with sufficient horizontal overlap', () => {
            const anchor = createFrame(50, 10, 100, 20);     // right at 110
            const target = createFrame(10, 50, 100, 20);     // left=50, overlap from 50 to 110
            // overlap = 60, minWidth = 100, 20% of 100 = 20 → 60 > 20, passes
            expect(isAbove(anchor, target)).toBe(true);
        });
    });
});
