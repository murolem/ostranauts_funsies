import type { TileConfiguration } from '$lib/Spritesheet';
import type { TileBrush } from '$lib/TileBrush';
import { tileScaledSizePx } from '$preset';
import { convertIndexToXyPosition, convertXyPositionToIndex } from '$src/lib/converters';
import { cardinalDirectionsToOffsetsMap } from '$src/lib/mappings';
import type { PxPosition, TilePosition, SizeTiles, SizePx, CardinalDirection } from '$src/types';
import { clamp } from '$utils/clamp';
import { generateBezierFromSketch } from '$utils/generateBezierFromSketch';
import { isWithinRange } from '$utils/isWithinRange';

/** Tile index inside a grid. */
export type GridIndex = number;
/** Tile configuration within a grid. */
export type GridTile = TileConfiguration | undefined;

export class Grid {
    get sizeTiles() { return this._sizeTiles; }
    private _sizeTiles: SizeTiles;

    get sizePixelsPadded() { return this._sizePixels; }
    private _sizePixels: SizePx;

    /** A record mapping indices, representing 2D positions, to tile configurations at these positions. */
    private _grid: Record<GridIndex, GridTile> = {}

    /** How many ms it takes to clear the grid? */
    private _scheduledClearDurationMs = 150;

    /** Timestamp pointing to when to clear the entire grid.  */
    private _clearScheduleAtTs: number | null = null;

    /** T curve used to smoothen the clear animation. */
    private _sampleClearCurve = generateBezierFromSketch(`
                                                                                        X       x
                                                                 
                                                X
                                        
                                
x             x
`);

    constructor(
        private _canvas: HTMLCanvasElement,
        private _ctx: CanvasRenderingContext2D,
    ) {
        this._sizeTiles = Object.freeze({
            w: Math.floor(_canvas.clientWidth / tileScaledSizePx),
            h: Math.floor(_canvas.clientHeight / tileScaledSizePx),
        });

        this._sizePixels = Object.freeze({
            w: this.sizeTiles.w * tileScaledSizePx,
            h: this.sizeTiles.h * tileScaledSizePx
        });

        _canvas.width = this._sizePixels.w;
        _canvas.height = this._sizePixels.h;

        _canvas.classList.add("initialized");
    }

    /**
     * Converts pixel position within canvas to a tile position. 
     * @param pxPos 
     * @returns 
     */
    convertPxPositionToTilePos(pxPos: PxPosition): TilePosition {
        return {
            x: Math.floor(pxPos.x / tileScaledSizePx),
            y: Math.floor(pxPos.y / tileScaledSizePx),
        }
    }

    /**
     * Converts tile position to a tile grid index.
     * @param {Size} tilePos 
     * @returns 
     */
    convertTilePositionToTileGridIndex(tilePos: TilePosition): GridIndex {
        return convertXyPositionToIndex(tilePos, this.sizeTiles.w);
    }

    /**
     * Converts tile grid index to a tile position.
     * @param tileGridIndex 
     * @returns 
     */
    convertTileGridIndexToTilePosition(tileGridIndex: GridIndex): TilePosition {
        return convertIndexToXyPosition(tileGridIndex, this.sizeTiles.w);
    }

    /** 
     * Returns tile at tile position.
     */
    get(gridIndex: GridIndex): GridTile;
    /** 
     * Returns tile at grid index.
     */
    get(tilePos: TilePosition): GridTile;
    get(arg1: GridIndex | TilePosition): GridTile {
        const gridIndex = typeof arg1 === 'number'
            ? arg1
            : this.convertTilePositionToTileGridIndex(arg1);

        return this._grid[gridIndex];
    }

    /** 
     * Returns tiles neighboring a tile position on cardinal directions.
     * Neighbor tiles outside grid bounds will always return `undefined`.
     * @throws {Error} If tile position outside grid bounds.
     */
    getCardinalNeighbors(tilePos: TilePosition): Record<CardinalDirection, GridTile> {
        const res: Record<CardinalDirection, GridTile> = {
            left: undefined,
            up: undefined,
            right: undefined,
            down: undefined
        };

        for (const [dirUntyped, offset] of Object.entries(cardinalDirectionsToOffsetsMap)) {
            const dir = dirUntyped as keyof typeof cardinalDirectionsToOffsetsMap;

            const neighborTilePos: TilePosition = {
                x: tilePos.x + offset.x,
                y: tilePos.y + offset.y,
            }

            if (!this.isTilePositionWithinGrid(neighborTilePos)) {
                continue;
            }

            res[dir] = this.get(neighborTilePos);
        }

        return res;
    }

    /** 
     * Sets tile at tile position.
     * @throws {Error} If tile position outside grid bounds.
     */
    set(gridIndex: GridIndex, value: GridTile): void;
    /** 
     * Sets tile at grid index.
     * @throws {Error} If grid index outside grid bounds.
     */
    set(tilePos: TilePosition, value: GridTile): void;
    set(arg1: GridIndex | TilePosition, arg2: GridTile): void {
        const gridIndex = typeof arg1 === 'number'
            ? arg1
            : this.convertTilePositionToTileGridIndex(arg1);
        const value = arg2;

        this.assertGridIndexWithinGrid(gridIndex);
        if (value === undefined)
            delete this._grid[gridIndex];
        else
            this._grid[gridIndex] = value;
    }

    /** 
     * Checks whether there's a tile at tile position.
     * @throws {Error} If tile position outside grid bounds.
     */
    hasAt(gridIndex: GridIndex): boolean;
    /** 
     * Checks whether there a tile at grid index.
     * @throws {Error} If grid index outside grid bounds.
     */
    hasAt(tilePos: TilePosition): boolean;
    hasAt(arg1: GridIndex | TilePosition): boolean {
        const gridIndex = typeof arg1 === 'number'
            ? arg1
            : this.convertTilePositionToTileGridIndex(arg1);

        this.assertGridIndexWithinGrid(gridIndex);
        return this._grid[gridIndex] !== undefined;
    }

    /**
     * Draws grid onto canvas.
     */
    draw(brush: TileBrush) {
        this._tryScheduledClearIfAny();

        const ctx = this._ctx;

        ctx.strokeStyle = 'hsl(0, 0%, 20%)';

        // draw grid: vertical lines
        for (let i = 0; i <= this.sizeTiles.w; i++) {
            const pxPosFrom = {
                x: tileScaledSizePx * i,
                y: 0
            };
            const pxPosTo = {
                x: tileScaledSizePx * i,
                y: this.sizePixelsPadded.h
            };

            ctx.beginPath();
            ctx.moveTo(pxPosFrom.x, pxPosFrom.y);
            ctx.lineTo(pxPosTo.x, pxPosTo.y);
            ctx.stroke();
        }

        // draw grid: horizontal lines
        for (let i = 0; i <= this.sizeTiles.h; i++) {
            const pxPosFrom = {
                x: 0,
                y: tileScaledSizePx * i
            };
            const pxPosTo = {
                x: this.sizePixelsPadded.w,
                y: tileScaledSizePx * i
            };

            ctx.beginPath();
            ctx.moveTo(pxPosFrom.x, pxPosFrom.y);
            ctx.lineTo(pxPosTo.x, pxPosTo.y);
            ctx.stroke();
        }

        const isClearScheduled = this._isClearScheduled();
        let clearProgressT = 0;
        let tileOffsetFromClear = 0;
        if (isClearScheduled) {
            const clearProgressTRaw = this._getScheduledClearProgress();
            // sampled
            clearProgressT = this._sampleClearCurve(clearProgressTRaw);
            tileOffsetFromClear = tileScaledSizePx / 2 * clearProgressT;
        }

        // draw grid: tiles
        let i = 0;
        for (let [gridIndexStr, tileConfiguration] of Object.entries(this._grid)) {
            // skip undefined tiles.
            // shouldn't happen but still checking.
            // todo check if actually happens
            if (tileConfiguration === undefined)
                continue;

            const gridIndex = parseInt(gridIndexStr);
            const tilePos = this.convertTileGridIndexToTilePosition(gridIndex);

            const pxPos = {
                x: tilePos.x * tileScaledSizePx,
                y: tilePos.y * tileScaledSizePx,
            }

            const ssRegionToDraw = brush.tileset.calculateSpritesheetTileRegion(tileConfiguration);

            ctx.save();
            ctx.translate(pxPos.x, pxPos.y);

            if (isClearScheduled) {
                ctx.translate(tileOffsetFromClear, tileOffsetFromClear);
                ctx.scale(1 - clearProgressT, 1 - clearProgressT);
            }

            // console.log("drawing region: " + JSON.stringify(ssRegionToDraw))
            ctx.drawImage(
                brush.tileset.image,
                ssRegionToDraw.x, ssRegionToDraw.y, ssRegionToDraw.w, ssRegionToDraw.h,
                0, 0, tileScaledSizePx, tileScaledSizePx
            );

            ctx.restore();
            i++;
        }
    }

    /**
     * Schedules a clear of the grid to near time.
     */
    clear(): void {
        if (this._isClearScheduled())
            return;

        this._clearScheduleAtTs = Date.now() + this._scheduledClearDurationMs;
    }

    /**
     * Clears the grid if scheduled clear time has cometh. Otherwise, does nothing.
     */
    private _tryScheduledClearIfAny(): void {
        if (this._isClearScheduled() && this._clearScheduleAtTs! <= Date.now()) {
            this._grid = {};
            this._clearScheduleAtTs = null;
        }
    }

    /**
     * Returns progress on a scheduled clear, from 0 to 1.
     * If no clear is scheduled, returns 0.
     */
    private _getScheduledClearProgress(): number {
        if (!this._isClearScheduled())
            return 0;

        const msLeft = this._clearScheduleAtTs! - Date.now();
        const t = 1 - (msLeft / this._scheduledClearDurationMs);
        return clamp(t, 0, 1);
    }

    private _isClearScheduled() {
        return this._clearScheduleAtTs !== null;
    }

    /**
     * Checks whether a tile position is within the grid.
     * @param tilePos
     * @returns 
     */
    isTilePositionWithinGrid(tilePos: TilePosition): boolean {
        return isWithinRange(tilePos.x, 0, this.sizeTiles.w - 1)
            && isWithinRange(tilePos.y, 0, this.sizeTiles.h - 1);
    }

    /**
     * Checks whether a grid index is within the grid.
     * @param gridIndex
     * @returns 
     */
    isGridIndexWithinGrid(gridIndex: GridIndex): boolean {
        return isWithinRange(gridIndex, 0, this.sizeTiles.w * this.sizeTiles.h);
    }

    /**
     * Asserts that a tile position is within the grid.
     * @param tilePos
     */
    assertTilePositionWithinGrid(tilePos: TilePosition): void {
        if (!this.isTilePositionWithinGrid(tilePos))
            throw new Error("failed assert assertIsTilePositionWithinGrid: " + tilePos);
    }

    /**
     * Asserts that a grid index is within the grid.
     * @param gridIndex
     */
    assertGridIndexWithinGrid(gridIndex: GridIndex): void {
        if (!this.isGridIndexWithinGrid(gridIndex))
            throw new Error("failed assert assertGridIndexWithinGrid: " + gridIndex);
    }
}