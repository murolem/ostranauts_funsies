/** Maps cardinal directions to binary masks that can be combined. */
/**
 * @type {Record<CardinalDirection, number>}
 */
const mapOfCardinalDirectionsToSsIndexMasks = {
    left: 0b1,
    up: 0b10,
    right: 0b100,
    down: 0b1000
}

/** 
 * Maps spreadsheet indices to various combination of cardinal direction masks representing how a sprite at that index tiles with surrounding sprites.
 * This one in a raw format (all strings), generated from a script.
 * @type {Record<string, string>}
 */
const rawMapOfSsIndicesToCardinalDirectionMasks = {
    '0': '1100',
    '1': '1101',
    '2': '1001',
    '3': '10',
    '4': '1110',
    '5': '1111',
    '6': '1011',
    '7': '100',
    '8': '110',
    '9': '111',
    '10': '11',
    '11': '1',
    '12': '101',
    '13': '0',
    '14': '1010',
    '15': '1000'
}

/** 
 * Maps spreadsheet indices to various combination of cardinal direction masks representing how a sprite at that index tiles with surrounding sprites.
 * @type {Record<number, number>}
 */
const mapOfSsIndicesToCardinalDirectionMasks = Object.entries(rawMapOfSsIndicesToCardinalDirectionMasks).reduce((acc, [key, value]) => {
    acc[parseInt(key)] = parseInt(value, 2);

    return acc;
}, {});

/** 
 * Maps a direction mask representing how a spreadsheet sprite tiles with surrounding sprites to a spreadsheet index for that tile.
 * @type {Record<number, number>}
 */
const mapOfCardinalDirectionMasksToSsIndices = Object.entries(mapOfSsIndicesToCardinalDirectionMasks).reduce((acc, [key, value]) => {
    acc[value] = parseInt(key);

    return acc;
}, {});

/**
 * Maps cardinal direction to their actual positional offsets.
 * @type {Record<CardinalDirection, Vector2>}
 */
const mapOfCardinalDirectionsToPositionOffsets = {
    left: { x: -1, y: 0 },
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
}

/**
 * Maps cardinal direction to their opposites.
 * @type {Record<CardinalDirection, CardinalDirection>}
 */
const mapOfCardinalDirectionsToOppositeDirections = {
    left: 'right',
    up: 'down',
    right: 'left',
    down: 'up'
}

/** Given 4 cardinal directions as bools representing how a sprite tiles, encodes them to a spritesheet index. */
/**
 * 
 * @param {NeighborMatrix} matrix 
 * @returns 
 */
function encodeNeighborMatrixIntoSsIndex(matrix) {
    const encoded = (matrix.left ? mapOfCardinalDirectionsToSsIndexMasks.left : 0)
        | (matrix.up ? mapOfCardinalDirectionsToSsIndexMasks.up : 0)
        | (matrix.right ? mapOfCardinalDirectionsToSsIndexMasks.right : 0)
        | (matrix.down ? mapOfCardinalDirectionsToSsIndexMasks.down : 0);

    return mapOfCardinalDirectionMasksToSsIndices[encoded];
}

/** Given a spritesheet index, converts it to 4 cardinal directions representing how a sprite tiles, as bools.
 * 
 * @param {number} ssIndex 
 * @returns 
 */
function decodeSsIndexIntoNeighborMatrix(ssIndex) {
    const cardDirMask = mapOfSsIndicesToCardinalDirectionMasks[ssIndex];

    return {
        left: (cardDirMask & mapOfCardinalDirectionsToSsIndexMasks.left) === mapOfCardinalDirectionsToSsIndexMasks.left,
        up: (cardDirMask & mapOfCardinalDirectionsToSsIndexMasks.up) === mapOfCardinalDirectionsToSsIndexMasks.up,
        right: (cardDirMask & mapOfCardinalDirectionsToSsIndexMasks.right) === mapOfCardinalDirectionsToSsIndexMasks.right,
        down: (cardDirMask & mapOfCardinalDirectionsToSsIndexMasks.down) === mapOfCardinalDirectionsToSsIndexMasks.down
    }
}

// ======================================

/**
 * 
 * @param {unknown} value 
 * @param {string?} optionalMsg 
 * @returns 
 */
function throwIfNullishPassthrough(value, optionalMsg) {
    if (value === undefined || value === null) {
        throw new Error(optionalMsg); h
    }

    return value;
}

// ==================================

const baseTileSizePx = 16;
const tileScalingFactor = 4;
const tileScaledSizePx = baseTileSizePx * tileScalingFactor;

// spritesheet size
const ssSizeSprites = {
    w: 4,
    h: 4
}

const canvasMarginPx = 50;
const canvasPaddingPx = 100;

// ==================================

/** @type {HTMLCanvasElement} */
const canvas = throwIfNullishPassthrough(document.getElementById('canvas'));
const ctx = canvas.getContext('2d');

const tileImg = new Image();
tileImg.addEventListener('load', draw);
tileImg.src = "spritesheets/ItmWallPanelWSheet.png";

const canvasSizeTiles = {
    w: Math.floor((window.innerWidth - canvasMarginPx * 2 - canvasPaddingPx * 2) / tileScaledSizePx),
    h: Math.floor((window.innerHeight - canvasMarginPx * 2 - canvasPaddingPx * 2) / tileScaledSizePx),
};

const canvasSizePxPadded = {
    w: canvasSizeTiles.w * tileScaledSizePx,
    h: canvasSizeTiles.h * tileScaledSizePx
}

const canvasSizePxUnpadded = {
    w: canvasSizePxPadded.w + canvasPaddingPx * 2,
    h: canvasSizePxPadded.h + canvasPaddingPx * 2
}

canvas.width = canvasSizePxUnpadded.w;
canvas.height = canvasSizePxUnpadded.h;


let isMouseDown = false;
let offsetMousePos = { x: 0, y: 0 };

canvas.addEventListener('mousedown', () => isMouseDown = true);
canvas.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mousemove', (e) => {
    offsetMousePos.x = e.offsetX - canvasPaddingPx;
    offsetMousePos.y = e.offsetY - canvasPaddingPx;
});

/**
 * 
 * @param {Vector2} offsetPxPos 
 * @returns 
 */
function convertOffsetPxPosToTilePos(offsetPxPos) {
    return {
        x: Math.floor(offsetPxPos.x / tileScaledSizePx),
        y: Math.floor(offsetPxPos.y / tileScaledSizePx),
    }
}

// ======================

/** flat index only tile gride */
const tileGrid = {}

/** Given an XY position and a width within that space, returns an index to that position.
 * 
 * @param {Vector2} xyPos 
 * @param {number} width 
 * @returns 
 */
function convertXyPositionToIndex(xyPos, width) {
    return width * xyPos.y + xyPos.x;
}

/** Given an index in a XY space, converts it to XY position within the same space.
 * 
 * @param {number} index 
 * @param {number} width 
 * @returns 
 */
function convertIndexToXyPosition(index, width) {
    const row = Math.floor(index / width);
    const col = index - (width * row);
    return {
        x: col,
        y: row
    }
}

/**
 * 
 * @param {Vector2} tilePos 
 * @returns 
 */
function convertTilePositionToTileGridIndex(tilePos) {
    return convertXyPositionToIndex(tilePos, canvasSizeTiles.w);
}

/**
 * 
 * @param {number} tileGridIndex 
 * @returns 
 */
function convertTileGridIndexToTilePosition(tileGridIndex) {
    return convertIndexToXyPosition(tileGridIndex, canvasSizeTiles.w);
}

/**
 * 
 * @param {number} ssIndex 
 * @returns 
 */
function convertSsIndexToSpritePosition(ssIndex) {
    return convertIndexToXyPosition(ssIndex, 4);
}

/**
 * 
 * @param {Vector2} tilePos 
 * @returns 
 */
function getTileFromGridAtTilePosition(tilePos) {
    assertTilePositionWithinGrid(tilePos);

    return tileGrid[convertTilePositionToTileGridIndex(tilePos)];
}

/**
 * 
 * @param {Vector2} tilePos 
 * @param {number} value 
 */
function setGridTileAtTilePosition(tilePos, value) {
    assertTilePositionWithinGrid(tilePos);

    tileGrid[convertTilePositionToTileGridIndex(tilePos)] = value;
}

/**
 * 
 * @param {Vector2} tilePos 
 * @returns 
 */
function drawTileAtTilePos(tilePos) {
    assertTilePositionWithinGrid(tilePos);

    // if tile already draw do nothing
    if (getTileFromGridAtTilePosition(tilePos) !== undefined)
        return;

    const neighborMatrix = {};
    for (const [dir, offset] of Object.entries(mapOfCardinalDirectionsToPositionOffsets)) {
        const neighborTilePos = {
            x: tilePos.x + offset.x,
            y: tilePos.y + offset.y,
        }

        if (!isTilePositionWithinGrid(neighborTilePos)) {
            neighborMatrix[dir] = false;
            continue;
        }

        let neighborTile = getTileFromGridAtTilePosition(neighborTilePos);
        if (neighborTile !== undefined) {
            neighborMatrix[dir] = true;
            // console.log("found neighbor at: " + dir);

            const directionFromNeighborTile = mapOfCardinalDirectionsToOppositeDirections[dir];
            const neighborNeighborMatrix = decodeSsIndexIntoNeighborMatrix(neighborTile);
            neighborNeighborMatrix[directionFromNeighborTile] = true;
            const newValue = encodeNeighborMatrixIntoSsIndex(neighborNeighborMatrix);
            // const oldValueStr = neighborTile.toString(2);
            // const newValueStr = newValue.toString(2);
            // debugger;
            setGridTileAtTilePosition(neighborTilePos, newValue);
        } else {
            neighborMatrix[dir] = false;
        }
    }

    console.log("==========")
    setGridTileAtTilePosition(tilePos, encodeNeighborMatrixIntoSsIndex(neighborMatrix));
}

/**
 * 
 * @param {number} value 
 * @param {number} rangeFrom 
 * @param {number} rangeTo 
 * @returns 
 */
function isWithinRange(value, rangeFrom, rangeTo) {
    return value >= rangeFrom && value <= rangeTo;
}

/**
 * 
 * @param {Vector2} tilePos 
 */
function assertTilePositionWithinGrid(tilePos) {
    if (!isTilePositionWithinGrid(tilePos))
        throw new Error("failed assertTilePositionWithinGrid: " + tilePos);
}

/**
 * 
 * @param {Vector2} tilePos 
 * @returns 
 */
function isTilePositionWithinGrid(tilePos) {
    return isWithinRange(tilePos.x, 0, canvasSizeTiles.w - 1)
        && isWithinRange(tilePos.y, 0, canvasSizeTiles.h - 1);
}

/**
 * 
 * @param {Vector2} offsetPxPos 
 * @returns 
 */
function isOffsetPxPositionWithinGrid(offsetPxPos) {
    const tilePos = convertOffsetPxPosToTilePos(offsetPxPos);
    return isTilePositionWithinGrid(tilePos);
}

/**
 * 
 * @param {number} ssIndex 
 * @returns 
 */
function calculateSsRegionToDraw(ssIndex) {
    if (!isWithinRange(ssIndex, 0, ssSizeSprites.w * ssSizeSprites.h))
        throw new Error("ss index outside of bounds; received: " + ssIndex);

    const spritePosition = convertSsIndexToSpritePosition(ssIndex);

    return {
        x: spritePosition.x * baseTileSizePx,
        y: spritePosition.y * baseTileSizePx,
        w: baseTileSizePx,
        h: baseTileSizePx
    }
}

function draw() {
    ctx.save();
    ctx.translate(canvasPaddingPx, canvasPaddingPx);
    ctx.imageSmoothingEnabled = false;

    if (isMouseDown && isOffsetPxPositionWithinGrid(offsetMousePos)) {
        drawTileAtTilePos(convertOffsetPxPosToTilePos(offsetMousePos));
    }

    ctx.strokeStyle = 'hsl(0, 0%, 20%)';

    // draw grid: vertical lines
    for (let i = 0; i <= canvasSizeTiles.w; i++) {
        const pxPosFrom = {
            x: tileScaledSizePx * i,
            y: 0
        };
        const pxPosTo = {
            x: tileScaledSizePx * i,
            y: canvasSizePxPadded.h
        };

        ctx.beginPath();
        ctx.moveTo(pxPosFrom.x, pxPosFrom.y);
        ctx.lineTo(pxPosTo.x, pxPosTo.y);
        ctx.stroke();
    }

    // draw grid: horizontal lines
    for (let i = 0; i <= canvasSizeTiles.h; i++) {
        const pxPosFrom = {
            x: 0,
            y: tileScaledSizePx * i
        };
        const pxPosTo = {
            x: canvasSizePxPadded.w,
            y: tileScaledSizePx * i
        };

        ctx.beginPath();
        ctx.moveTo(pxPosFrom.x, pxPosFrom.y);
        ctx.lineTo(pxPosTo.x, pxPosTo.y);
        ctx.stroke();
    }

    let i = 0;
    for (let [tileGridIndexStr, ssIndex] of Object.entries(tileGrid)) {
        const tileGridIndex = parseInt(tileGridIndexStr);
        const tileGridPos = convertTileGridIndexToTilePosition(tileGridIndex);

        const pxPos = {
            x: tileGridPos.x * tileScaledSizePx,
            y: tileGridPos.y * tileScaledSizePx,
        }

        // ssIndex = i % 16;
        const regionToDraw = calculateSsRegionToDraw(ssIndex);
        // console.log(regionToDraw);
        // console.log(regionToDraw)

        // ctx.save();
        // ctx.translate(pxPos.x, pxPos.y);
        // ctx.scale(tileScalingFactor, tileScalingFactor);
        ctx.drawImage(tileImg, regionToDraw.x, regionToDraw.y, regionToDraw.w, regionToDraw.h, pxPos.x, pxPos.y, tileScaledSizePx, tileScaledSizePx);
        // ctx.restore();

        i++;
    }

    // for (let i = 0; i < canvasSizeTiles.w * canvasSizeTiles.h; i++) {
    //     const row = Math.floor(i / canvasSizeTiles.w);
    //     const col = (canvasSizeTiles * row) - i;
    // }

    ctx.restore();
    requestAnimationFrame(draw);
}