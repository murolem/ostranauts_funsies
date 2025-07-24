import { makeSimpleButton } from '$lib/gui/buttons/simpleButton';
import { makeContainer } from '$lib/gui/containers/container';
import { makeIcon } from '$lib/gui/images/icon';
import type { ButtonOrWrapped } from '$lib/gui/types';
import trashBinIconBlack from '$src/icons/trash-bin-black.png';
import paintBrushIconBlack from '$src/icons/paint-brush-black.png';
import eraserIconBlack from '$src/icons/eraser-black.png';
import { makeButtonSection } from '$lib/gui/containers/buttonSection';
import { makeToggleButton } from '$lib/gui/buttons/toggleButton';
import type { HotkeyKey } from '$lib/keybinds';
import { hotkeifyButtonWithLabel } from '$lib/gui/lib/utils/hotkeifyButtonWithLabel';
import { eventBrush, type TileBrushMode } from '$lib/TileBrush';
import { unwrapButton } from '$lib/gui/lib/utils/unwrapButton';
import { randomInRange } from '$utils/rand/randomInRange';
import { generateBezierFromSketch } from '$utils/generateBezierFromSketch';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';
import { toggleButtonToggledOnColorConf } from '$lib/gui/preset';
import { map } from '$utils/map';
import { make } from '$lib/gui/make';
import { getElementClientSizeWithPad } from '$lib/gui/lib/utils/getElementClientSizeWithPad';
import { event, store } from '$preset';
import { eventTogglable, Togglable } from '$lib/gui/lib/Togglable';

function makeReloadButton(): ButtonOrWrapped {
    const btnReload = makeSimpleButton();
    btnReload.appendChild(makeIcon(trashBinIconBlack, { invert: true }));
    btnReload.addEventListener('click', () => store.grid.get().clear());
    const btnReloadWrapped = hotkeifyButtonWithLabel(btnReload, 'A', { setActiveForClickDuration: true });

    return btnReloadWrapped;
}

function makeToolButton(
    tool: TileBrushMode,
    hotkey: HotkeyKey,
    contents: HTMLElement,
): ButtonOrWrapped {
    const [btn] = makeToggleButton(["tool-" + tool]);
    btn.appendChild(contents);
    eventTogglable.toggle.on((d) => {
        if (d.element === btn && d.toggleState)
            store.brush.get().setMode(tool);
    })

    return hotkeifyButtonWithLabel(btn, hotkey);
}

/**
 * do not even ask me what this is OvO
 * pretty little colors
 */
function makeTileButton(): ButtonOrWrapped {
    const [btnSelectTile, btnTogglable] = makeToggleButton(["button-tile"]);
    btnTogglable.bindAutosyncWith(store.tileWindow.get().togglable);

    event.gui.gui_built__persisting.on(() => {
        initTileButtonLogic(btnSelectTile);
    })

    return hotkeifyButtonWithLabel(btnSelectTile, 'T');
}

function initTileButtonLogic(btn: HTMLButtonElement) {
    const pixelsPerSide = 5;
    const tolerance = 1;
    const litPixelsPerSide = pixelsPerSide - tolerance * 2;

    // =====

    const canvas = document.createElement('canvas');

    const btnClientSizeWithPad = getElementClientSizeWithPad(btn);

    const pixelSize = Math.floor(Math.min(btnClientSizeWithPad.w, btnClientSizeWithPad.h) / pixelsPerSide);

    canvas.width = pixelSize * pixelsPerSide;
    canvas.height = pixelSize * pixelsPerSide;
    const ctx = canvas.getContext('2d')!;

    let useColor = false;

    eventTogglable.toggle.on(d => {
        if (d.element === btn)
            useColor = d.toggleState;
    });

    // =====

    type DestinationConfig = {
        /** Initial brightness value, from 0 to 1. */
        fromBrightness: number,

        /** Target brightness value, from 0 to 1. */
        toBrightness: number,

        /** Current progress towards target brightness value, from 0 to 1. */
        t: number,

        isDone: boolean,

        progress(dt: number): void,

        sample(t: number): number
    }

    /** Maps pixel indices (based on XY) to their current brightness, from 0 to 1. */
    const mapOfPixelIndexToBrightness: Record<number, DestinationConfig> = {};

    function generateRandomDestinationConf(activeConf?: DestinationConfig): DestinationConfig {
        const minDurationMs = 250;
        const maxDurationMs = 1000;

        const fromBrightness = activeConf
            ? activeConf.toBrightness
            : randomInRange(0, 1);
        const toBrightness = randomInRange(0, 1);
        const deltaBrightnessSigned = toBrightness - fromBrightness;
        const deltaBrightnessUnsigned = Math.abs(deltaBrightnessSigned);
        const durationMs = randomInRange(
            minDurationMs * deltaBrightnessUnsigned,
            maxDurationMs * deltaBrightnessUnsigned
        );

        let currentMs = 0;
        let t = activeConf
            ? activeConf.t - 1
            : 0;
        let isDone = false;

        const sample: DestinationConfig['sample'] = t => {
            return fromBrightness + deltaBrightnessSigned * t;
        }

        const progress: DestinationConfig['progress'] = dt => {
            currentMs += dt;
            t = currentMs / durationMs;
            if (t >= 1)
                isDone = true;
        }

        return {
            get fromBrightness() { return fromBrightness; },
            get toBrightness() { return toBrightness },
            get t() { return t },
            get isDone() { return isDone },
            progress: progress,
            sample: sample
        }
    }


    const sampleBrightnessChangeCurve = generateBezierFromSketch(`
                                                                                                X       x
                                                                         
                                                        X
                                                
                                        
        x             x
`);


    const draw = (prevTs: number) => {
        // !force assertion because what even is that fuckass type??
        const ts = performance.now();
        const dt = ts - prevTs;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // update pixels
        for (let i = 0; i < litPixelsPerSide ** 2; i++) {
            // update
            let conf = getObjPropOrCreate(mapOfPixelIndexToBrightness, i, generateRandomDestinationConf);
            conf.progress(dt);
            if (conf.isDone) {
                conf = generateRandomDestinationConf(conf);
                mapOfPixelIndexToBrightness[i] = conf;
            }
        };

        // draw pixels
        let i = 0;
        for (let row = tolerance; row < pixelsPerSide - tolerance; row++) {
            for (let col = tolerance; col < pixelsPerSide - tolerance; col++) {
                const conf = mapOfPixelIndexToBrightness[i];

                // draw
                const brightness01 = conf.sample(sampleBrightnessChangeCurve(conf.t));
                ctx.fillStyle = useColor
                    ? `hsl(${toggleButtonToggledOnColorConf.h}, ${toggleButtonToggledOnColorConf.s}%, ${toggleButtonToggledOnColorConf.l * map(brightness01, 0, 1, 0.4, 1)}%)`
                    : `hsl(0, 0%, 55%,  ${brightness01})`;

                ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);

                i++;
            }
        }

        requestAnimationFrame(draw);
    }

    btn.append(canvas);
    requestAnimationFrame(draw);
}

function makeTileDisplayScreen() {
    const imgEl = make(`<img draggable="false" class="tile-screen">`) as HTMLImageElement;
    eventBrush.tilesetChanged.on(e => {
        imgEl.src = e.newTileset.imageUrl;
    });

    imgEl.addEventListener('click', () => {
        store.tileWindow.get().togglable.invertToggle(imgEl);
    });

    return imgEl;
}

export function makeTopToolbarEl(): HTMLElement {
    const toolbar = makeContainer(["gui-container", "dock-top"]);

    const brushToolButtonWrapped = makeToolButton(
        'brush',
        'B',
        makeIcon(paintBrushIconBlack, { invert: true }),
    );

    const eraserToolButtonWrapped = makeToolButton(
        'eraser',
        'E',
        makeIcon(eraserIconBlack, { invert: true }),
    );

    Togglable.bindTogglablesToExclusiveToggleOnState([
        unwrapButton(brushToolButtonWrapped),
        unwrapButton(eraserToolButtonWrapped)
    ], { keepOneToggled: true, toggleOn: unwrapButton(brushToolButtonWrapped) });


    toolbar.append(
        makeButtonSection('reload', [
            makeReloadButton()
        ]),
        makeButtonSection('tools', [
            brushToolButtonWrapped,
            eraserToolButtonWrapped
        ]),
        makeButtonSection('tile-select', [
            makeTileButton(),
            makeTileDisplayScreen()
        ])
    );

    return toolbar;
}
