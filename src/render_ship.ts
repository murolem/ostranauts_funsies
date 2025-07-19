import fs from 'fs-extra';
import { getObjPropOrCreate, getObjPropOrCreateAsync } from '$utils/getObjPropOrCreate';
import { toOsPath } from '$utils/toOsPath';
import { loadJsonFilesRecursiveWithSchema } from '$utils/loadJsonFilesRecursive';
import { condOwnersOverlaysSchema } from '$schema/condOwnersOverlays';
import { installablesSchema } from '$src/schema/installables';
import { condOwnersSchema } from '$schema/condOwners';
import { assertValueNotUndefinedPassthrough } from '$utils/assertValueNotUndefined';
import { createCanvas, loadImage, Image } from 'canvas';
import { shipItemSchema, shipSchema } from '$src/schema/ship';
import chalk from 'chalk';
import loaders from '$src/loaders';
import path from 'path';
import { Logger } from '$logger';
import { isWithinRange } from '$utils/isWithinRange';
import { imagesDirpath } from '$preset';
import type { ItemSchema } from '$schema/items';
import { DEG2RAD } from '$utils/geom/converters';
import type z from 'zod';
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

const shipDef = shipSchema.parse(data[0]);

// =======================================

const shipName = shipDef.strName;
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

const lookupBaseDef = (baseDefId: string): ItemSchema | null => {
    return itemDefs.find(def => def.strName === baseDefId) ?? null;
}

// interface DefCompBase {
//     type: string,
// }

// type Def = {
//     defType: string,
//     data: unknown,
//     baseDef?: Def
// }

// const rawDefsWithTypes = [
//     ['item', itemDefs],
//     ['condOwner', condOwnersDefs],
//     ['condOwnersOverlay', condOwnersOverlaysDefs]
// ] satisfies [string, unknown][];

// const defs: Def[] = [];
// for (const rawDefs of rawDefsWithTypes) {
//     for(const rawDef of rawDefs) {
//         const baseDef = rawDef.

//         const def: Def = {
//             defType: rawDef[0],
//             data: rawDef[1],
//             baseDef
//         }
//     }
// }

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

const bounds = shipDef.aItems.reduce<
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
    w: bounds.maxX - bounds.minX + 7,
    h: bounds.maxY - bounds.minY + 7,
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
// rotate entire canvas by 180 deg to render ships in the same direction game does
ctx.translate(sizePixels.w / 2, sizePixels.h / 2);
ctx.rotate(Math.PI);
ctx.translate(-sizePixels.w / 2, -sizePixels.h / 2);
// we love pixels
ctx.imageSmoothingEnabled = false;

if (!fs.existsSync(emptyTileImageFilepath))
    throw new Error("empty tile placeholder not found, tried path: " + emptyTileImageFilepath);

const emptyTile = await loadImage(fs.readFileSync(emptyTileImageFilepath));

/** Calculates canvas pixel position based on float signed tile position. */
const getCanvasPxPosition = (tilePosX: number, tilePosY: number): Position => {
    // offset position into positive number territory, then multiple by tile size
    return {
        x: (tilePosX + 3 + bounds.minX * -1) * tileSizePx,
        y: (tilePosY + 3 + bounds.minY * -1) * tileSizePx,
    }
}

// ==================

/** lazy loaded image store */
const itemDefToImageMap: Record<string, Image> = {};

// shipDef.aItems.sort((a, b) => {
//     const dy = b.fY - a.fY;
//     if (dy !== 0) {
//         return dy;
//     } else {
//         return b.fX - a.fX;
//     }
// });

const shipDefItemsGroupedByDrawingOrder = shipDef.aItems.reduce<
    Record<number, z.infer<typeof shipItemSchema>[]>
>((acc, e) => {
    const id = e.strName;
    const idLc = id.toLocaleLowerCase();

    if (idLc.includes("floor")) {
        getObjPropOrCreate(acc, 0, () => []).push(e);
        return acc;
    }

    if (idLc.includes("wall")) {
        getObjPropOrCreate(acc, 10, () => []).push(e);
        return acc;
    }

    if (idLc.includes("conduit")) {
        getObjPropOrCreate(acc, 20, () => []).push(e);
        return acc;
    }

    if (idLc.includes("intake")) {
        getObjPropOrCreate(acc, 30, () => []).push(e);
        return acc;
    }

    getObjPropOrCreate(acc, 100, () => []).push(e);
    return acc;
}, {});

for (const group of Object.values(shipDefItemsGroupedByDrawingOrder)) {
    group.sort((a, b) => {
        const dy = b.fY - a.fY;
        if (dy !== 0) {
            return dy;
        } else {
            return b.fX - a.fX;
        }
    });
}

let i = 0;
for (const [drawOrder, items] of Object.entries(shipDefItemsGroupedByDrawingOrder)) {
    for (const item of items) {
        const iCounter = i + 1;
        const logCounterPart = `draw order${drawOrder}; item ${iCounter} of ${shipDef.aItems.length}`;

        const itemId = item.strName;
        logInfo(`[${i}] placing item ${chalk.bold(itemId)}`)
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
                const baseDef = itemDefs.find(def => def.strName === itemDef.strItemDef);
                assertValueNotUndefinedPassthrough(baseDef, `base definition for item ${chalk.bold(itemId)} not found`);

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

        ctx.save();
        // translate to tile center
        ctx.translate(posPx.x, posPx.y);
        ctx.translate(tileSizePx / 2, tileSizePx / 2);

        // apply rotation
        ctx.rotate(DEG2RAD(item.fRotation))

        // translate by half image size so that image center aligns with the tile center
        ctx.translate(-image.width / 2, -image.height / 2);

        ctx.drawImage(image, 0, 0);
        ctx.restore();

        const newFilepath = outputFilepath.slice(0, outputFilepath.length - path.parse(outputFilepath).ext.length)
            + "-" + iCounter
            + path.parse(outputFilepath).ext;
        fs.writeFileSync(newFilepath, canvas.toBuffer());


        i++;
    }
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