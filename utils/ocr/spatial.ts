import { TextBlock } from '@react-native-ml-kit/text-recognition';
import { DateMatch } from './types';
import { calculateDistance, isRightOf, isBelow, isAbove } from '@/utils/ocrGeometry';
import { LoggingService } from '@/services/LoggingService';

/**
 * Finds matches that are spatially linked to an expiration anchor.
 */
export const findSpatiallyAnchoredMatches = (matches: DateMatch[], anchors: TextBlock[]): Set<string> => {
    const spatiallyAnchoredMatches = new Set<string>();
    const TAG = 'OCR_Spatial';

    for (const match of matches) {
        if (!match.frame) continue;

        for (const anchor of anchors) {
            if (!anchor.frame) continue;

            const dist = calculateDistance(match.frame, anchor.frame);

            if (dist < 200) { // Within reasonable proximity
                const right = isRightOf(anchor.frame, match.frame);
                const below = isBelow(anchor.frame, match.frame);
                const above = isAbove(anchor.frame, match.frame);

                if (right || below || above) {
                    LoggingService.debug(TAG, `SPATIAL MATCH: Date ${match.value} linked to Anchor "${anchor.text}" (Dist: ${dist.toFixed(0)})`);
                    spatiallyAnchoredMatches.add(match.value);
                }
            }
        }
    }

    return spatiallyAnchoredMatches;
};
