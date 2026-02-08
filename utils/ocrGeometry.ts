/**
 * Utility functions for OCR spatial logic (Bounding Boxes).
 * @module utils/ocrGeometry
 */

import { Frame } from '@react-native-ml-kit/text-recognition';

/**
 * Calculates the minimum distance between two rectangles.
 * Returns 0 if they intersect.
 */
export function calculateDistance(rect1: Frame, rect2: Frame): number {
    const xOverlap = Math.max(0, Math.min(rect1.left + rect1.width, rect2.left + rect2.width) - Math.max(rect1.left, rect2.left));
    const yOverlap = Math.max(0, Math.min(rect1.top + rect1.height, rect2.top + rect2.height) - Math.max(rect1.top, rect2.top));

    if (xOverlap > 0 && yOverlap > 0) return 0;

    if (xOverlap > 0) {
        if (rect1.top < rect2.top) return rect2.top - (rect1.top + rect1.height);
        return rect1.top - (rect2.top + rect2.height);
    }

    if (yOverlap > 0) {
        if (rect1.left < rect2.left) return rect2.left - (rect1.left + rect1.width);
        return rect1.left - (rect2.left + rect2.width);
    }

    // Corner distance (Pythagoras)
    const dx = rect1.left < rect2.left ? rect2.left - (rect1.left + rect1.width) : rect1.left - (rect2.left + rect2.width);
    const dy = rect1.top < rect2.top ? rect2.top - (rect1.top + rect1.height) : rect1.top - (rect2.top + rect2.height);
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks if rect2 is to the RIGHT of rect1, within a reasonable vertical alignment.
 * @param tolerancePct Vertical alignment tolerance (percentage of height)
 */
export function isRightOf(anchor: Frame, target: Frame, tolerancePct: number = 0.5): boolean {
    // Center Y difference should be small to be considered on the same line
    const anchorCenterY = anchor.top + anchor.height / 2;
    const targetCenterY = target.top + target.height / 2;
    const avgHeight = (anchor.height + target.height) / 2;

    const verticalDiff = Math.abs(anchorCenterY - targetCenterY);
    const isVerticallyAligned = verticalDiff <= avgHeight * tolerancePct;
    const isToRight = target.left > anchor.left; // Strictly to the right

    return isVerticallyAligned && isToRight;
}

/**
 * Checks if rect2 is BELOW rect1, within a reasonable horizontal alignment.
 * @param tolerancePct Horizontal alignment tolerance (percentage of width difference)
 */
export function isBelow(anchor: Frame, target: Frame, tolerancePct: number = 0.8): boolean {
    const isBelowPosition = target.top > anchor.top;

    // Horizontal overlap check
    const xOverlap = Math.max(0, Math.min(anchor.left + anchor.width, target.left + target.width) - Math.max(anchor.left, target.left));
    const minWidth = Math.min(anchor.width, target.width);

    // They should share some X vertical column (overlap horizontally)
    const isHorizontallyAligned = xOverlap > minWidth * 0.2; // At least 20% overlap or meaningful alignment

    return isBelowPosition && isHorizontallyAligned;
}

/**
 * Checks if rect2 is ABOVE rect1, within a reasonable horizontal alignment.
 * (Useful for cases where the date is printed above the "SCAD" label)
 */
export function isAbove(anchor: Frame, target: Frame, tolerancePct: number = 0.8): boolean {
    const isAbovePosition = target.top < anchor.top;

    // Reuse same horizontal alignment logic as isBelow
    const xOverlap = Math.max(0, Math.min(anchor.left + anchor.width, target.left + target.width) - Math.max(anchor.left, target.left));
    const minWidth = Math.min(anchor.width, target.width);

    const isHorizontallyAligned = xOverlap > minWidth * 0.2;

    return isAbovePosition && isHorizontallyAligned;
}
