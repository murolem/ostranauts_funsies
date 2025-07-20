import { ssIndexToTilingMap } from '$src/lib/mappings';
import { throwIfNullishPassthrough } from '$utils/throwIfNullishPassthrough';
import { canvasPaddingPx, ssSizeTilesTotal } from '$preset';
import { Grid } from '$src/lib/Grid';
import { TileBrush } from '$src/lib/TileBrush';
import { Spritesheet } from '$src/lib/Spritesheet';
import { pickRandomItem } from '$utils/rand/pickRandomItem';


if (Object.keys(ssIndexToTilingMap).length !== ssSizeTilesTotal)
    throw new Error(`mismatch between configuring spritesheet size and tiles and defined mappings: ss size set to ${ssSizeTilesTotal} tiles, while index mappings configured for ${Object.keys(ssIndexToTilingMap).length} tiles`);

// =====

const canvas = throwIfNullishPassthrough(document.getElementById('canvas'), "canvas element not found") as HTMLCanvasElement;
if (canvas.tagName !== 'CANVAS')
    throw new Error("canvas element is not a canvas element, found: " + canvas.tagName);

const ctx = canvas.getContext('2d')!; // !explicit assertion; asserted next line
if (!ctx)
    throw new Error("2d rendering context unsupported");

const spritesheets = await Spritesheet.loadDefault();
// console.log(spritesheets)
const grid = new Grid(canvas, ctx);
const brush = new TileBrush(grid, pickRandomItem(spritesheets));
// const brush = new TileBrush(grid, spritesheets.find(ss => ss.filename === "ItmWallThin1x1YellowSheet.png")!);

// =====

let isMouseDown = false;
let offsetMousePos = { x: 0, y: 0 };

canvas.addEventListener('mousedown', () => isMouseDown = true);
canvas.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mousemove', (e) => {
    offsetMousePos.x = e.offsetX - canvasPaddingPx;
    offsetMousePos.y = e.offsetY - canvasPaddingPx;
});

function draw() {
    ctx.save();
    ctx.translate(canvasPaddingPx, canvasPaddingPx);
    // this resets with resizes. smh.
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = 'hsl(0, 0%, 15%)';
    ctx.fillRect(
        0, 0,
        grid.sizePixelsPadded.w, grid.sizePixelsPadded.h
    );

    // ============================

    if (isMouseDown) {
        const tilePos = grid.convertPxPositionToTilePos(offsetMousePos)
        brush.paint(tilePos);
    }

    grid.draw(brush);

    // ============================

    ctx.restore();
    requestAnimationFrame(draw);
}

draw();