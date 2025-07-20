import type { CardinalDirection, Position } from '$src/types';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';

/** Tiling instructions. */
export const Tiling: Record<'none' | CardinalDirection, number> = {
    none: 0,
    left: 1 << 0,
    up: 1 << 1,
    right: 1 << 2,
    down: 1 << 3,
};

/**
 * Maps spritesheet indices to tiling instructions.
 */
export const ssIndexToTilingMap: Record<number, number> = {
    0: Tiling.right | Tiling.down,
    1: Tiling.left | Tiling.down | Tiling.right,
    2: Tiling.left | Tiling.down,
    3: Tiling.up,
    4: Tiling.up | Tiling.right | Tiling.down,
    5: Tiling.left | Tiling.up | Tiling.right | Tiling.down,
    6: Tiling.up | Tiling.left | Tiling.down,
    7: Tiling.right,
    8: Tiling.up | Tiling.right,
    9: Tiling.left | Tiling.up | Tiling.right,
    10: Tiling.up | Tiling.left,
    11: Tiling.left,
    12: Tiling.left | Tiling.right,
    13: Tiling.none,
    14: Tiling.up | Tiling.down,
    15: Tiling.down,
};

/**
 * Maps tiling instructions to spritesheet indices.
 */
export const tilingToSsIndexMap = Object.entries(ssIndexToTilingMap).reduce<
    Record<number, number>
>((acc, [ssIndex, tiling]) => {
    const prop = getObjPropOrCreate(acc, tiling, () => parseInt(ssIndex));
    if (prop != parseInt(ssIndex)) {
        throw new Error("failed to create tiling mapping: found a duplicate tiling rule: " + tiling.toString(2));
    }

    return acc;
}, {})

/**
 * Maps cardinal direction to their actual positional offsets.
 */
export const cardinalDirectionsToOffsetsMap: Record<CardinalDirection, Position> = {
    left: { x: -1, y: 0 },
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
}

/**
 * Maps cardinal direction to their opposites.
 */
export const cardinalDirectionsToOppositeDirectionsMap: Record<CardinalDirection, CardinalDirection> = {
    left: 'right',
    up: 'down',
    right: 'left',
    down: 'up'
}