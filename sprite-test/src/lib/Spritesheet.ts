import { baseTileSizePx, spritesheetsUrlDirpath, ssSizeTiles, ssSizeTilesTotal } from '$preset';
import ssMetadataUntyped from '$src/data/ss_metadata.json';
import type { CardinalDirection, Position, Region, TilePosition } from '$src/types';
import path from 'path-browserify-esm';
import { wait } from '$utils/wait';
import { Logger } from '$logger';
import { convertIndexToXyPosition } from '$src/lib/converters';
import type { GridTile } from '$lib/Grid';
import { Tiling, tilingToSsIndexMap } from '$lib/mappings';
const logger = new Logger("lib/spritesheets");
const { logFatal } = logger;

const ssMetadata = ssMetadataUntyped as SpritesheetMetadata[];
// console.log(ssMetadata);

/** Binary mask configuration for a tile. */
export type TileConfiguration = number;

/** Tile index within a spritesheet. */
export type SsTileIndex = number;

/** Pixel position of a region within a spritesheet. */
export type SsRegionPosition = Position;

export type SpritesheetMetadata = {
    /** Path to a spritesheet relative to the spritesheets' directory. */
    relPath: string
}


export class Spritesheet {
    get relUrlFilepath() { return this._relUrlFilepath; }

    get filename() { return this._filename; }

    get image() { return this._image; }

    /**
     * 
     * @param _relUrlFilepath URL filepath relative to the spritesheets directory.
     * @param _filename 
     * @param _image 
     */
    constructor(
        private _relUrlFilepath: string,
        private _filename: string,
        private _image: ImageBitmap
    ) { }

    /** Loads all default spritesheets. */
    static async loadDefault(): Promise<Spritesheet[]> {
        const promises: Promise<any>[] = [];
        for (const ssMeta of ssMetadata) {
            const relFilepath = `${spritesheetsUrlDirpath}/${ssMeta.relPath}`;

            const promise = fetch(relFilepath)
                .then(res => res.blob())
                .then(createImageBitmap)
                .then(bitmap => {
                    const ss = new Spritesheet(
                        relFilepath,
                        path.parse(ssMeta.relPath).base,
                        bitmap
                    );

                    return ss;
                })
                .catch(err => {
                    logFatal({
                        msg: "error while loading spritesheets",
                        throw: true,
                        data: {
                            spritesheet: relFilepath,
                            error: err
                        }
                    });
                    throw ''//type guard
                });

            promises.push(promise);

            await wait(25);
        }

        return Promise.all(promises);
    }


    /**
     * Converts spritesheet tile index to a a tile position within the spritesheet.
     * @param ssIndex 
     * @returns 
     */
    convertSsIndexToTilePosition(ssIndex: SsTileIndex): TilePosition {
        this.assertSsIndexWithinSpritesheet(ssIndex);

        return convertIndexToXyPosition(ssIndex, ssSizeTiles.w);
    }

    /**
     * Given a tiling configuration, find a matching tile and returns its region within the spritesheet.
     * @param ssIndex 
     */
    calculateSpritesheetTileRegion(tiling: TileConfiguration): Region {
        const ssIndex = tilingToSsIndexMap[tiling];
        const tilePos = this.convertSsIndexToSsTilePosition(ssIndex);

        return {
            x: tilePos.x * baseTileSizePx,
            y: tilePos.y * baseTileSizePx,
            w: baseTileSizePx,
            h: baseTileSizePx
        }
    }

    /** Converts a map of neighboring tiles into a tiling configuration for a tile at the center. */
    convertCardinalNeighborsToTiling(cardinalNeighbors: Record<CardinalDirection, GridTile>): TileConfiguration {
        let res: TileConfiguration = Tiling.none;
        for (const [dirUntyped, neighborTile] of Object.entries(cardinalNeighbors)) {
            const dir = dirUntyped as keyof typeof cardinalNeighbors;
            if (neighborTile !== undefined)
                res |= Tiling[dir];
        }

        return res;
    }

    /** Convert spreadsheet tile index to a tile position (NOT pixel position) within the spreadsheet. */
    convertSsIndexToSsTilePosition(ssIndex: SsTileIndex): TilePosition {
        return convertIndexToXyPosition(ssIndex, ssSizeTiles.w);
    }

    /**
     * Checks whether spritesheet index is within the spritesheet.
     * @param ssIndex 
     */
    isSsIndexWithinSpritesheet(ssIndex: SsTileIndex): boolean {
        return ssIndex < ssSizeTilesTotal;
    }

    /**
     * Asserts that a spritesheet index is within the spritesheet.
     * @param ssIndex A
     */
    assertSsIndexWithinSpritesheet(ssIndex: SsTileIndex): void {
        if (!this.isSsIndexWithinSpritesheet(ssIndex))
            throw new Error("failed assert assertSsIndexWithinSpritesheet: " + ssIndex);
    }
}