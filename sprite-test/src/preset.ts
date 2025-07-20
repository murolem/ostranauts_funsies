import type { SizeTiles } from '$src/types';

// =========================
// ======= VARIABLES =======
// =========================

/** Size of one "tile" in a source spritesheet. */
export const baseTileSizePx: number = 16;

/** By what factor to scale resulting tiles. */
export const tileScalingFactor: number = 3;

/** How many tiles does a spritesheet contain, vertically and horizontally. */
export const ssSizeTiles: SizeTiles = Object.freeze({
    w: 4,
    h: 4
});

/** Canvas offset from edges of the page. */
export const canvasMarginPx = 50;

/** Canvas inner offset from its own edges. */
export const canvasPaddingPx = 100;

export const spritesheetsUrlDirpath = "/spritesheets";

/** Filename of the spritesheet metadata file, relative to the spritesheets directory. */
export const spritesheetMetadataFilename = "metadata.json";

// =========================
// ===== END VARIABLES =====
// =========================

// ==============================
// ======= AUTO VARIABLES =======
// ==============================

export const ssSizeTilesTotal = ssSizeTiles.w * ssSizeTiles.h;
export const tileScaledSizePx = baseTileSizePx * tileScalingFactor;


// ==============================
// ===== END AUTO VARIABLES =====
// ==============================