import type { Grid } from '$src/lib/Grid';
import { cardinalDirectionsToOffsetsMap } from '$src/lib/mappings';
import type { Spritesheet } from '$src/lib/Spritesheet';
import type { TilePosition } from '$src/types';

export class TileBrush {
    get tileset() { return this._tileset; }

    constructor(
        private _grid: Grid,
        private _tileset: Spritesheet
    ) { }

    setTileset(tileset: Spritesheet): void {
        this._tileset = tileset;
    }

    paint(tilePos: TilePosition): void {
        // attempting to draw outside of bounds = skip
        if (!this._grid.isTilePositionWithinGrid(tilePos))
            return;

        // if tile is already drawn do nothing
        if (this._grid.hasAt(tilePos))
            return;

        const cardinalNeighbors = this._grid.getCardinalNeighbors(tilePos);

        // update us
        // console.log("neighbors: ", cardinalNeighbors);
        const tiling = this._tileset.convertCardinalNeighborsToTiling(cardinalNeighbors);
        // console.log("tiling: " + tiling.toString(2).padStart(4, '0'));
        this._grid.set(tilePos, tiling);

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
}