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
import { createEventEmitter, EventEmitterVariant } from '$src/event';
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

export const eventSpritesheet = createEventEmitter({
    loaded:
        new EventEmitterVariant<{
            spritesheet: Spritesheet,
            image: ImageBitmap,
            imageUrl: string
        }>({ persistEvents: true })
});

/**
 * A class for handling spritesheet images.
 * 
 * Creating a new spritesheet instance does NOT load the spritesheet. Call {@link Spritesheet.load} first.
*/
export class Spritesheet {
    get name() { return this._name; }
    private set name(value) { this._name = value; }
    private _name: string;

    get imageUrl() { return this._imageUrl; }
    private set imageUrl(value) { this.imageUrl = value; }
    private _imageUrl: string;

    /**
     * Whether the spritesheet has finished loading.
    */
    get isLoaded() { return this._isLoaded; }
    private set isLoaded(value) { this._isLoaded = value; }
    private _isLoaded: boolean = false;

    get image() { return this._image; }
    private _image: ImageBitmap | null = null;

    /**
     * Creates a new spritesheet instance. Call {@link load} to load the actual spritesheet first.
     * @param name
     * @param imageUrl 
    */
    constructor(name: SsName, imageUrl: string) {
        this._name = name;
        this._imageUrl = imageUrl;
    }

    /**
     * Loads multiple spritesheets.
     * @param spritesheets 
    */
    static async loadAll(spritesheets: Spritesheet[]): Promise<Spritesheet[]> {
        const promises: Promise<any>[] = [];
        for (const ss of spritesheets) {
            const promise = ss.load();
            promises.push(promise);

            await wait(25);
        }

        return await Promise.all(promises);
    }

    /** 
     * Returns a random core tileset.
    */
    static getRandomCoreTileset(): Spritesheet {
        const ssMeta = pickRandomItem(ssMetadata);
        const ssUrlRelPath = `${spritesheetsUrlDirpath}/${ssMeta.relPath}`;
        return new Spritesheet(ssMeta.ssName, ssUrlRelPath);
    }

    /** 
     * Returns all core tilesets.
    */
    static getAllCoreTilesets(): Spritesheet[] {
        return ssMetadata.map(meta => new Spritesheet(meta.ssName, `${spritesheetsUrlDirpath}/${meta.relPath}`));
    }

    /** Converts a map of neighboring tiles into a tiling configuration for tile in between. */
    static convertCardinalNeighborsToTiling(cardinalNeighbors: Record<CardinalDirection, GridTile>): TilingConfiguration {
        let res: TilingConfiguration = Tiling.none;
        for (const [dirUntyped, neighborTile] of Object.entries(cardinalNeighbors)) {
            const dir = dirUntyped as keyof typeof cardinalNeighbors;
            if (neighborTile !== undefined)
                res |= Tiling[dir];
        }

        return res;
    }

    isEqual(other: Spritesheet): boolean {
        return this.imageUrl === other.imageUrl;
    }

    /**
     * Loads the spritesheet.
     * @returns this.
    */
    async load(): Promise<this> {
        if (this.isLoaded) {
            console.warn(this);
            console.warn("attempting to load an already loaded spritesheet: (see above)");
            return this;
        }

        const tilesetImg = await fetch(this.imageUrl)
            .then(res => res.blob())
            .then(createImageBitmap)
            .catch(err => {
                logFatal({
                    msg: "error while loading a spritesheet",
                    throw: true,
                    data: {
                        ss: this,
                        imageUrl: this.imageUrl,
                        name: this.name,
                        error: err
                    }
                });
                throw ''//type guard
            });

        this._image = tilesetImg;
        this._isLoaded = true;
        eventSpritesheet.loaded.emit(this, {
            spritesheet: this,
            image: this.image!,
            imageUrl: this.imageUrl
        });

        return this;
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

    private assertLoaded(msg?: string): void {
        if (!this.isLoaded)
            throw new Error(msg ?? "failed assert assertLoaded");
    }
}