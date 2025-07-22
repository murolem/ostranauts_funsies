import { makeSimpleButton } from '$lib/gui/buttons/simpleButton';
import { makeContainer } from '$lib/gui/containers/container';
import { makeIcon } from '$lib/gui/images/icon';
import type { ActionMap, ButtonOrWrapped } from '$lib/gui/types';
import trashBinIconBlack from '$src/icons/trash-bin-black.png';
import paintBrushIconBlack from '$src/icons/paint-brush-black.png';
import eraserIconBlack from '$src/icons/eraser-black.png';
import { makeButtonSection } from '$lib/gui/containers/buttonSection';
import { bindExclusiveSelectionToToggleButtons, makeToggleButton, addEventListenerToggleButtonToggled, setToggleButtonToggle } from '$lib/gui/buttons/toggleButton';
import type { HotkeyKey } from '$lib/keybinds';
import { hotkeifyButtonWithLabel } from '$lib/gui/lib/utils/hotkeifyButtonWithLabel';
import type { TileBrushMode } from '$lib/TileBrush';
import { unwrapButton } from '$lib/gui/lib/utils/unwrapButton';
import type { SizePx } from '$src/types';
import { randomInRange } from '$utils/rand/randomInRange';
import { generateBezierFromSketch } from '$utils/generateBezierFromSketch';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';
import { guiEventGuiBuilt, guiEventEmitter } from '$lib/gui/event';
import { toggleButtonToggledOnColorConf } from '$lib/gui/preset';
import { map } from '$utils/map';
import { make } from '$lib/gui/make';
import { toggleTileSelectionWindow } from '$lib/gui/lib/makeTileSelectionWindow';

function makeReloadButton(actions: ActionMap): ButtonOrWrapped {
    const btnReload = makeSimpleButton();
    btnReload.appendChild(makeIcon(trashBinIconBlack, { invert: true }));
    btnReload.addEventListener('click', (e) => actions.reload?.(e.target as HTMLElement));
    const btnReloadWrapped = hotkeifyButtonWithLabel(btnReload, 'A', { setActiveForClickDuration: true });

    return btnReloadWrapped;
}

function makeToolButton(
    actions: ActionMap,
    tool: TileBrushMode,
    hotkey: HotkeyKey,
    contents: HTMLElement,
): ButtonOrWrapped {
    const btn = makeToggleButton(["tool-" + tool]);
    btn.appendChild(contents);
    addEventListenerToggleButtonToggled(btn, (_, toggleState) => {
        if (toggleState)
            actions.selectTool(btn, tool)
    })

    return hotkeifyButtonWithLabel(btn, hotkey);
}

/**
 * do not even ask me what this is OvO
 */
function makeTileButton(actions: ActionMap): ButtonOrWrapped {
    const btnSelectTile = makeToggleButton(["button-tile"]);
    guiEventEmitter.addListener(guiEventGuiBuilt, () => initTileButtonLogic(btnSelectTile));

    addEventListenerToggleButtonToggled(btnSelectTile, (_, toggleState) => toggleTileSelectionWindow(actions, toggleState));

    return hotkeifyButtonWithLabel(btnSelectTile, 'T');
}

function initTileButtonLogic(btn: HTMLButtonElement) {
    const pixelsPerSide = 5;
    const tolerance = 1;
    const litPixelsPerSide = pixelsPerSide - tolerance * 2;

    // =====

    const canvas = document.createElement('canvas');

    const btnCompStyle = getComputedStyle(btn);

    const clientSizeNoPad: SizePx = {
        w: btn.clientWidth + parseFloat(btnCompStyle.paddingLeft) + parseFloat(btnCompStyle.paddingRight),
        h: btn.clientHeight + parseFloat(btnCompStyle.paddingTop) + parseFloat(btnCompStyle.paddingBottom)
    }

    const pixelSize = Math.floor(Math.min(clientSizeNoPad.w, clientSizeNoPad.h) / pixelsPerSide);

    canvas.width = pixelSize * pixelsPerSide;
    canvas.height = pixelSize * pixelsPerSide;
    const ctx = canvas.getContext('2d')!;

    let useColor = false;

    addEventListenerToggleButtonToggled(btn, (_, toggleState) => {
        useColor = toggleState;
    })

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

function makeDisplayScreen() {
    const el = make(`<img class="screen">`) as HTMLImageElement;

    return {
        el,
        setImage(src: string): void {
            el.src = src;
        }
    }
}

export function makeTopToolbarEl(actions: ActionMap): HTMLElement {
    const toolbar = makeContainer(["gui-container", "dock-top"]);

    const brushToolButton = makeToolButton(
        actions,
        'brush',
        'B',
        makeIcon(paintBrushIconBlack, { invert: true }),
    );
    setToggleButtonToggle(unwrapButton(brushToolButton), true);

    const toolButtons = [
        brushToolButton,
        makeToolButton(
            actions,
            'eraser',
            'E',
            makeIcon(eraserIconBlack, { invert: true }),
        ),
    ];

    bindExclusiveSelectionToToggleButtons(toolButtons.map(unwrapButton));

    // const tileDisplayScreen = makeDisplayScreen();

    toolbar.append(
        makeButtonSection('reload', [
            makeReloadButton(actions)
        ]),
        makeButtonSection('tools',
            toolButtons
        ),
        makeButtonSection('tile-select', [
            makeTileButton(actions),
            // tileDisplayScreen.el
        ])
    );

    return toolbar;
}
