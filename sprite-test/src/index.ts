import { ssIndexToTilingMap } from '$src/lib/mappings';
import { throwIfNullishPassthrough } from '$utils/throwIfNullishPassthrough';
import { event, ssSizeTilesTotal, store } from '$preset';
import { Grid } from '$src/lib/Grid';
import { TileBrush } from '$src/lib/TileBrush';
import { Spritesheet } from '$src/lib/Spritesheet';
import createGUI from '$lib/gui';

if (Object.keys(ssIndexToTilingMap).length !== ssSizeTilesTotal)
    throw new Error(`mismatch between configuring spritesheet size and tiles and defined mappings: ss size set to ${ssSizeTilesTotal} tiles, while index mappings configured for ${Object.keys(ssIndexToTilingMap).length} tiles`);

// =====

const canvas = throwIfNullishPassthrough(document.getElementById('canvas'), "canvas element not found") as HTMLCanvasElement;
if (canvas.tagName !== 'CANVAS')
    throw new Error("canvas element is not a canvas element, found: " + canvas.tagName);
store.canvas.set(canvas);

const ctx = canvas.getContext('2d')!; // !explicit assertion; asserted next line
if (!ctx)
    throw new Error("2d rendering context unsupported");

const randomCoreSs = await Spritesheet.getRandomCoreTileset().load();
const allCoreSpritesheetsPromise = Spritesheet.loadAll(Spritesheet.getAllCoreTilesets());
const grid = new Grid(canvas, ctx);
store.grid.set(grid);
const brush = new TileBrush(grid, randomCoreSs);
store.brush.set(brush);

// =====

let isMouseDown = false;
let isMouseDownWithinCanvas = false;
let offsetMousePos = { x: 0, y: 0 };

window.addEventListener('mousedown', () => isMouseDown = true);
window.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mousedown', () => isMouseDownWithinCanvas = true);
canvas.addEventListener('mouseup', () => isMouseDownWithinCanvas = false);
canvas.addEventListener('mousemove', (e) => {
    offsetMousePos.x = e.offsetX;
    offsetMousePos.y = e.offsetY;
});

createGUI();

// event.gui.first_tileset_set.emit(brush, { tileset: brush.tileset });
// emitGuiEventBrushTilesetChanged(brush.tileset);
allCoreSpritesheetsPromise
    .then(spritesheets => event.gui.core_tilesets_loaded__persisting.emit('index', { tilesets: spritesheets }));

function draw() {
    ctx.save();
    // this resets with resizes. smh.
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = 'hsl(0, 0%, 15%)';
    ctx.fillRect(
        0, 0,
        grid.sizePixelsPadded.w, grid.sizePixelsPadded.h
    );

    // ============================

    // check for both because the "up" event sometimes can not be detected within an element
    // because it happens outside the element (ie user holds mouse down, then moves it outside the element and releases there).
    if (isMouseDown && isMouseDownWithinCanvas) {
        const tilePos = grid.convertPxPositionToTilePos(offsetMousePos);
        brush.tryApplyAt(tilePos);
    }

    grid.draw(brush);

    // ============================

    ctx.restore();
    requestAnimationFrame(draw);
}

draw();