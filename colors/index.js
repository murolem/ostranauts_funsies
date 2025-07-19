async function getColors() {
    const colorsJsonUrl = "colors.json";
    const res = await fetch(colorsJsonUrl);
    if (!res.ok) {
        console.err(res);
        alert("failed to load colors json");
        return;
    }

    return await res.json();
}

function generateGrid(colors) {
    const gridEl = document.querySelector('.grid');
    throwIfUndefinedPassthrough(gridEl);

    colors.sort((a, b) => {
        const ahsv = rgb2hsv(a.nR, a.nG, a.nB);
        const bhsv = rgb2hsv(b.nR, b.nG, b.nB)
        // return ahsv.h - bhsv.h;
        return ahsv.s - bhsv.s;
        // return ahsv.l - bhsv.l;
        // return a.strName.localeCompare(b.strName);
        // return calculatePerceivedBrigntess(a.nR, a.nG, a.nB) - calculatePerceivedBrigntess(b.nR, b.nG, b.nB)
    });

    for (const colObj of colors) {
        const name = colObj.strName;
        const [r, g, b] = [colObj.nR, colObj.nG, colObj.nB];

        const tileEl = document.createElement("div");
        tileEl.classList.add('tile');
        tileEl.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

        tileEl.innerText = name + "\n" + rgbToHex(r, g, b);

        const perceivedBrightness = calculateColorPerceivedBrightnessBinary(r / 255, g / 255, b / 255);
        tileEl.classList.add(`perceived-${perceivedBrightness}`);

        gridEl.appendChild(tileEl);
    }
}

async function main() {
    const colors = await getColors();
    generateGrid(colors);
}

main();


function throwIfUndefinedPassthrough(value, optionalMsg) {
    if (value === undefined) {
        throw new Error(optionalMsg);
    }

    return value;
}

function calculatePerceivedBrigntess(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculates perceived brightness of a color, returning either "light" or "dark".
 * @param r A 0 to 1 ranging red channel.
 * @param g A 0 to 1 ranging green channel.
 * @param b A 0 to 1 ranging blue channel.
 */
function calculateColorPerceivedBrightnessBinary(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5
        ? "light"
        : "dark"
}

/**
 * Calculates perceived brightness of a color, returning an opposite either "light" or "dark".
* @param r A 0 to 1 ranging red channel.
* @param g A 0 to 1 ranging green channel.
* @param b A 0 to 1 ranging blue channel.
 */
function calculateColorPerceivedBrightnessBinaryInverted(r, g, b) {
    return calculateColorPerceivedBrightnessBinary(r, g, b)
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function rgb2hsv(r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs),
        diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(rabs);
        gg = diffc(gabs);
        bb = diffc(babs);

        if (rabs === v) {
            h = bb - gg;
        } else if (gabs === v) {
            h = (1 / 3) + rr - bb;
        } else if (babs === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: Math.round(h * 360),
        s: percentRoundFn(s * 100),
        v: percentRoundFn(v * 100)
    };
}