import type { Grid, GridTile } from '$src/lib/Grid';
import { cardinalDirectionsToOffsetsMap } from '$src/lib/mappings';
import type { Spritesheet } from '$src/lib/Spritesheet';
import type { CardinalDirection, TilePosition } from '$src/types';

export type TileBrushMode =
    "brush"
    | "eraser";

export class TileBrush {
    get tileset() { return this._tileset; }

    private mode: TileBrushMode = 'brush';

    constructor(
        private _grid: Grid,
        private _tileset: Spritesheet
    ) { }

    setTileset(tileset: Spritesheet): void {
        this._tileset = tileset;
    }

    setMode(mode: TileBrushMode) {
        this.mode = mode;
    }

    applyAt(tilePos: TilePosition): void {
        // attempting to draw outside of bounds = skip
        if (!this._grid.isTilePositionWithinGrid(tilePos))
            return;

        const cardinalNeighbors = this._grid.getCardinalNeighbors(tilePos);

        switch (this.mode) {
            case 'brush':
                this.applyBrushMode(tilePos, cardinalNeighbors);
                break;
            case 'eraser':
                this.applyEraserMode(tilePos);
                break;
            default:
                throw new Error("not impl brush mode: " + this.mode);
        }

        // update cardinal neighbors
        for (const [dirUntyped, neighborTile] of Object.entries(cardinalNeighbors)) {
            const dir = dirUntyped as keyof typeof cardinalNeighbors;

            if (neighborTile === undefined)
                continue

            const offset = cardinalDirectionsToOffsetsMap[dir];
            const neighborTilePos = {
                x: tilePos.x + offset.x,
                y: tilePos.y + offset.y,
            }

            const neighborCardinalNeighbors = this._grid.getCardinalNeighbors(neighborTilePos);
            const neighborTiling = this._tileset.convertCardinalNeighborsToTiling(neighborCardinalNeighbors);
            this._grid.set(neighborTilePos, neighborTiling);
        }
    }

    private applyBrushMode(tilePos: TilePosition, cardinalNeighbors: Record<CardinalDirection, GridTile>) {
        // if tile is already drawn do nothing
        if (this._grid.hasAt(tilePos))
            return;

        // update us
        const tiling = this._tileset.convertCardinalNeighborsToTiling(cardinalNeighbors);
        this._grid.set(tilePos, tiling);
    }

    private applyEraserMode(tilePos: TilePosition) {
        // if tile doesn't exist drawn do nothing
        if (!this._grid.hasAt(tilePos))
            return;

        // update us
        this._grid.set(tilePos, undefined);
    }
}