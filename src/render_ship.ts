import fs from 'fs-extra';
import { getObjPropOrCreate, getObjPropOrCreateAsync } from '$utils/getObjPropOrCreate';
import { toOsPath } from '$utils/toOsPath';
import { loadJsonFilesRecursiveWithSchema } from '$utils/loadJsonFilesRecursive';
import { condOwnersOverlaysSchema } from '$schema/condOwnersOverlays';
import { installablesSchema } from '$src/schema/installables';
import { condOwnersSchema } from '$schema/condOwners';
import { assertValueNotUndefinedPassthrough } from '$utils/assertValueNotUndefined';
import { createCanvas, loadImage, Image } from 'canvas';
import { shipSchema } from '$src/schema/ship';
import chalk from 'chalk';
import loaders from '$src/loaders';
import path from 'path';
import { Logger } from '$logger';
import { isWithinRange } from '$utils/isWithinRange';
import { imagesDirpath } from '$preset';
const logger = new Logger("render_ship");
const { logInfo, logWarn, logFatal } = logger;

// ==========================

const tileSizePx = 16;

const emptyTileImageFilepath = "./src/empty_tile.png";

// ==========================

const args = process.argv.slice(2);
const shipDefFilepath = assertValueNotUndefinedPassthrough(args[1], "ship def filepath not provided");

if (!fs.existsSync(shipDefFilepath))
    throw new Error("ship file doesn't exist at path: " + shipDefFilepath);
else if (!fs.statSync(shipDefFilepath).isFile())
    throw new Error("ship file is not a file; path: " + shipDefFilepath);

const data = fs.readJsonSync(shipDefFilepath);
if (Array.isArray(data) && data.length !== 1)
    throw new Error("expected a single definition in a ship file, found: " + data.length);

const def = shipSchema.parse(data[0]);

// =======================================

const shipName = def.strName;
const outputFilepath = path.join("renders", shipName + ".png");
fs.ensureDirSync(path.parse(outputFilepath).dir);

logInfo(`rendering ship ${chalk.bold(shipName)} \nfrom: ${shipDefFilepath}`);

logInfo("loading item defs");

const itemDefs = loaders.items();
const condOwnersDefs = loaders.condOwners();
const condOwnersOverlaysDefs = loaders.condOwnersOverlays();

/** Given a definition, creates a new object containing same properties with an extra `defType` string field containing a custom name for this definition type. */
const mapDefToIncludeType = <T, S extends string>(def: T, type: S): { defType: S } & T => {
    return {
        defType: type,
        ...def
    }
}

const defs = [
    ...itemDefs.map(e => mapDefToIncludeType(e, 'item')),
    ...condOwnersDefs.map(e => mapDefToIncludeType(e, 'condOwners')),
    ...condOwnersOverlaysDefs.map(e => mapDefToIncludeType(e, 'condOwnersOverlaysDefs')),
];

logInfo("calculating dimensions");

type Size = {
    w: number,
    h: number
}

type Bounds = {
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
}

type Position = {
    x: number,
    y: number
}

const bounds = def.aItems.reduce<
    Bounds
>
    ((acc, e) => {
        if (e.fX < acc.minX) {
            acc.minX = e.fX;
        }
        if (e.fX > acc.maxX) {
            acc.maxX = e.fX;
        }

        if (e.fY < acc.minY) {
            acc.minY = e.fY;
        }
        if (e.fY > acc.maxY) {
            acc.maxY = e.fY;
        }

        return acc;
    }, { minX: 0, maxX: 0, minY: 0, maxY: 0 });

const sizeTiles: Size = {
    w: bounds.maxX - bounds.minX + 3,
    h: bounds.maxY - bounds.minY + 3,
}

logInfo(chalk.bold(`size in ${chalk.underline("tiles")}: ${sizeTiles.w} x ${sizeTiles.w}`));

logInfo("rendering items");

const sizePixels: Size = {
    w: sizeTiles.w * tileSizePx,
    h: sizeTiles.h * tileSizePx,
}

logInfo(chalk.bold(`size in ${chalk.underline("pixels")}: ${sizePixels.w} x ${sizePixels.w}`));

// ==================

const canvas = createCanvas(sizePixels.w, sizePixels.h);
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

if (!fs.existsSync(emptyTileImageFilepath))
    throw new Error("empty tile placeholder not found, tried path: " + emptyTileImageFilepath);

const emptyTile = await loadImage(fs.readFileSync(emptyTileImageFilepath));

/** Calculates canvas pixel position based on float signed tile position. */
const getCanvasPxPosition = (tilePosX: number, tilePosY: number): Position => {
    // offset position into positive number territory, then multiple by tile size
    return {
        x: (tilePosX + bounds.minX * -1) * tileSizePx,
        y: (tilePosY + bounds.minY * -1) * tileSizePx,
    }
}

// ==================

/** lazy loaded image store */
const itemDefToImageMap: Record<string, Image> = {};

for (const [i, item] of def.aItems.entries()) {
    const iCounter = i + 1;
    const logCounterPart = `${iCounter} of ${def.aItems.length}`;

    const itemId = item.strName;
    const itemDef = defs.find(e => e.strName === itemId);
    if (!itemDef)
        throw new Error(`failed to render item ${chalk.bold(itemId)} (${logCounterPart}): item definition not found`);

    let imageId: string | undefined;
    switch (itemDef.defType) {
        // defs that directly specify the image
        case 'item':
        case 'condOwnersOverlaysDefs':
            imageId = itemDef.strImg;
            break
        case 'condOwners': {
            const baseDef = itemDefs.find(def => def.strName === itemId);
            assertValueNotUndefinedPassthrough(baseDef, "based definition not found");

            imageId = baseDef?.strImg;
            break;
        }
        default:
            throw new Error("item def handler not impl");
    }
    // const imageId = itemDef.strImg;
    const image = await getObjPropOrCreateAsync(itemDefToImageMap, itemId, async () => {
        if (imageId === undefined) {
            logWarn(`undefined imageId for tile ${chalk.bold(itemId)}: will be rendering an empty tile instead`);
            return emptyTile;
        }

        const imagePath = path.join(imagesDirpath, imageId + ".png");
        if (!fs.existsSync(imagePath))
            throw new Error("item image not found, tried path: " + imagePath);
        return await loadImage(imagePath);
    });

    const posPx = getCanvasPxPosition(item.fX, item.fY);
    ctx.drawImage(image, posPx.x, posPx.y);
}

logInfo(`${chalk.bold("rendering complete!")} writing output: \nto ${outputFilepath}`);
fs.writeFileSync(outputFilepath, canvas.toBuffer());

logInfo("all done!");



// // Write "Awesome!"
// ctx.font = '30px Impact'
// ctx.rotate(0.1)
// ctx.fillText('Awesome!', 50, 100)

// // Draw line under text
// var text = ctx.measureText('Awesome!')
// ctx.strokeStyle = 'rgba(0,0,0,0.5)'
// ctx.beginPath()
// ctx.lineTo(50, 102)
// ctx.lineTo(50 + text.width, 102)
// ctx.stroke()

// // Draw cat with lime helmet
// loadImage('renders/lime-cat.jpg').then((image) => {
//     ctx.drawImage(image, 50, 0, 70, 70)

//     fs.writeFileSync("out.png", canvas.toBuffer());

//     // console.log('<img src="' + canvas.toDataURL() + '" />')
// })