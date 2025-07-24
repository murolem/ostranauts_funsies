import type { Grid } from '$lib/Grid';
import type { TileWindow } from '$lib/gui/lib/TileWindow';
import { Spritesheet } from '$lib/Spritesheet';
import type { TileBrush } from '$lib/TileBrush';
import { createEventEmitter, EventEmitterVariant } from '$src/event';
import { createStoreMap, ValueStore, type StoreMap } from '$src/store';
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

export const spritesheetsUrlDirpath = "spritesheets";

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


// =====================
// ======= STORE =======
// =====================

export const store = createStoreMap({
    canvas: new ValueStore<HTMLCanvasElement>(),
    grid: new ValueStore<Grid>(),
    brush: new ValueStore<TileBrush>(),
    tileWindow: new ValueStore<TileWindow>(),
    initialSpritesheet: new ValueStore<Spritesheet>(),
    coreSpritesheets: new ValueStore<Spritesheet[]>()
});

// =====================
// ===== EMD STORE =====
// =====================


// ======================
// ======= EVENTS =======
// ======================

export const event = createEventEmitter({
    gui: {
        gui_built__persisting:
            new EventEmitterVariant<undefined>({ persistEvents: true }),
    }
});

// ======================
// ===== END EVENTS =====
// ======================