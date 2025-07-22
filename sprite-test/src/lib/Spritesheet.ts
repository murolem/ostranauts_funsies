import { baseTileSizePx, spritesheetsUrlDirpath, ssSizeTiles, ssSizeTilesTotal } from '$preset';
import ssMetadataUntyped from '$src/data/ss_metadata.json';
import type { CardinalDirection, Position, Region, TilePosition } from '$src/types';
import path from 'path-browserify-esm';
import { wait } from '$utils/wait';
import { Logger } from '$logger';
import { convertIndexToXyPosition } from '$src/lib/converters';
import type { GridTile } from '$lib/Grid';
import { Tiling, tilingToSsIndexMap } from '$lib/mappings';
import { pickRandomItem } from '$utils/rand/pickRandomItem';
const logger = new Logger("lib/spritesheets");
const { logFatal } = logger;

const ssMetadata = ssMetadataUntyped as SpritesheetMetadata[];

/** Name for a particular spritesheet */
export type SsName = string;

/** Tile index within a spritesheet. */
export type SsTileIndex = number;

/** Binary mask configuration for a tile. */
export type TilingConfiguration = number;

/** Configuration for a tile. */
export type TileConfiguration = {
    ss: Spritesheet,
    tiling: TilingConfiguration,
};

/** Pixel position of a region within a spritesheet. */
export type SsRegionPosition = Position;

export type SpritesheetMetadata = {
    /** Name for a spritesheet. */
    ssName: string,

    /** Path to a spritesheet relative to the spritesheets' directory. */
    relPath: string
}

export class Spritesheet {
    get name() { return this._name; }

    get image() { return this._image; }

    get imageUrl() { return this._imageUrl; }

    /**
     * @param _name
     * @param _image 
     * @param _imageUrl 
     */
    constructor(
        private _name: SsName,
        private _image: ImageBitmap,
        private _imageUrl: string
    ) { }

    isEqual(other: Spritesheet): boolean {
        return this.imageUrl === other.imageUrl;
    }

    /** 
     * Loads a random default spritesheet.
    */
    static async loadRandomCoreTileset(): Promise<Spritesheet> {
        const ssMeta = pickRandomItem(ssMetadata);
        const ssUrlRelPath = `${spritesheetsUrlDirpath}/${ssMeta.relPath}`;
        return await this.loadTileset(ssUrlRelPath, ssMeta.ssName);
    }

    /** 
     * Loads all default spritesheets.
    */
    static async loadCoreTilesets(): Promise<Spritesheet[]> {
        const promises: Promise<any>[] = [];
        for (const ssMeta of ssMetadata) {
            const relFilepath = `${spritesheetsUrlDirpath}/${ssMeta.relPath}`;

            const promise = this.loadTileset(relFilepath, ssMeta.ssName);
            promises.push(promise);

            await wait(25);
        }

        return await Promise.all(promises);
    }

    /**
     * Loads a spritesheet from a url under specified name.
     * @param url 
     * @param name 
     */
    static async loadTileset(url: string, name: string): Promise<Spritesheet> {
        return await fetch(url)
            .then(res => res.blob())
            .then(createImageBitmap)
            .then(bitmap => {
                const ss = new Spritesheet(
                    name,
                    bitmap,
                    url
                );

                return ss;
            })
            .catch(err => {
                logFatal({
                    msg: "error while loading a spritesheet",
                    throw: true,
                    data: {
                        url,
                        name,
                        error: err
                    }
                });
                throw ''//type guard
            });
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
    calculateSpritesheetTileRegion(tiling: TilingConfiguration): Region {
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
    convertCardinalNeighborsToTiling(cardinalNeighbors: Record<CardinalDirection, GridTile>): TilingConfiguration {
        let res: TilingConfiguration = Tiling.none;
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