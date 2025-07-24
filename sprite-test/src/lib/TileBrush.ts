import { store } from '$preset';
import { createEventEmitter, EventEmitterVariant } from '$src/event';
import type { GridTile } from '$src/lib/Grid';
import { cardinalDirectionsToOffsetsMap } from '$src/lib/mappings';
import { Spritesheet } from '$src/lib/Spritesheet';
import type { CardinalDirection, TilePosition } from '$src/types';

export type TileBrushMode =
    "brush"
    | "eraser";

export const eventBrush = createEventEmitter({
    tilesetChanged: new EventEmitterVariant<{
        oldTileset: Spritesheet,
        newTileset: Spritesheet
    }>()
})

export class TileBrush {
    get tileset() { return this._tileset; }
    _tileset: Spritesheet;

    private grid = store.grid.get();
    private mode: TileBrushMode = 'brush';

    /**
     * 
     * @param _tileset A tileset to use initially with the brush.
     */
    constructor(tileset: Spritesheet) {
        this._tileset = tileset;
    }

    setTileset(tileset: Spritesheet): void {
        const oldTileset = this.tileset;
        this._tileset = tileset;
        eventBrush.tilesetChanged.emit(this, { oldTileset, newTileset: tileset });
    }

    setMode(mode: TileBrushMode) {
        this.mode = mode;
    }

    tryApplyAt(tilePos: TilePosition): void {
        if (!this.grid.isTilePositionWithinGrid(tilePos))
            return;

        const cardinalNeighbors = this.grid.getCardinalNeighbors(tilePos);

        switch (this.mode) {
            case 'brush':
                if (!this._tileset.isLoaded)
                    return;

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

            const neighborCardinalNeighbors = this.grid.getCardinalNeighbors(neighborTilePos);
            const neighborTiling = Spritesheet.convertCardinalNeighborsToTiling(neighborCardinalNeighbors);
            this.grid.set(neighborTilePos, { ss: neighborTile.ss, tiling: neighborTiling });
        }
    }

    private applyBrushMode(tilePos: TilePosition, cardinalNeighbors: Record<CardinalDirection, GridTile>) {
        // update us
        const tiling = Spritesheet.convertCardinalNeighborsToTiling(cardinalNeighbors);
        this.grid.set(tilePos, { ss: this.tileset, tiling: tiling });
    }

    private applyEraserMode(tilePos: TilePosition) {
        // if tile doesn't exist drawn do nothing
        if (!this.grid.hasAt(tilePos))
            return;

        // update us
        this.grid.set(tilePos, undefined);
    }
}