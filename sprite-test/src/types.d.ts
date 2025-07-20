export type Size = {
    w: number,
    h: number
}

/** Size in pixels. */
export type SizePx = Size;
/** Size in tiles. */
export type SizeTiles = Size;

// =========

export type Position = {
    x: number,
    y: number
}

/** Position of a tile. */
export type TilePosition = Position;

/** Pixel position. */
export type PxPosition = Position;


// =========

/** Represents a region of space. */
export type Region = Position & Size;

// =========

export type NeighborCardinalLayout = {
    left: boolean,
    up: boolean,
    right: boolean,
    down: boolean
}

export type CardinalDirection = keyof NeighborCardinalLayout;

// =========

