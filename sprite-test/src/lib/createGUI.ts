import trashBinIconBlack from '$src/icons/trash-bin-black.png';
import paintBrushIconBlack from '$src/icons/paint-brush-black.png';
import eraserIconBlack from '$src/icons/eraser-black.png';
import type { TileBrushMode } from '$lib/TileBrush';
import type { Spritesheet } from '$lib/Spritesheet';

const toggleButtonToggledClass = "toggled";

function make(htmlString: string): HTMLElement {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild as HTMLElement;
}

function makeSimpleButton() {
    return make(`<button class="simple-button"></button>`) as HTMLButtonElement;
}

function makeToggleButton() {
    const btn = make(`<button class="toggle-button"></button>`);
    btn.addEventListener('click', () => btn.classList.toggle(toggleButtonToggledClass));
    return btn as HTMLButtonElement;
}

function makeTileButton() {
    return make(`<button class="tile-button"></button>`) as HTMLButtonElement;
}

function makeIcon(src: string, { invert = false } = {}) {
    return make(`<img src="${src}" class="icon${invert ? ' invert' : ''}">`);
}

function makeContainer() {
    return make(`<div></div>`);
}

function makeButtonSection(name: string, els: HTMLElement[]) {
    const container = makeContainer();
    container.classList.add('button-section', `name-${name}`);
    container.append(...els);
    return container;
}

export type ActionSimple = (trigger: HTMLElement) => void
export type ActionSelect<T> = (trigger: HTMLElement, selection: T) => void;

export type ActionMap = {
    reload: ActionSimple,
    selectTool: ActionSelect<TileBrushMode>,
    selectTileset: ActionSelect<Spritesheet>
}

export default function (canvas: HTMLCanvasElement, actions: ActionMap) {
    const container = make(`<div class="gui-container dock-top"></div>`);


    const btnReload = makeSimpleButton();
    btnReload.appendChild(makeIcon(trashBinIconBlack, { invert: true }));
    btnReload.addEventListener('click', (e) => actions.reload?.(e.target as HTMLElement));


    let activeToolBtnElement: HTMLButtonElement | null = null;
    const updateActiveToolBtnElement = (newActiveBtnEl: HTMLButtonElement): void => {
        if (activeToolBtnElement
            && activeToolBtnElement !== newActiveBtnEl
            && activeToolBtnElement.classList.contains(toggleButtonToggledClass))
            activeToolBtnElement.click();

        activeToolBtnElement = newActiveBtnEl;
    }

    const btnBrush = makeToggleButton();
    btnBrush.appendChild(makeIcon(paintBrushIconBlack, { invert: true }));
    btnBrush.addEventListener('click', (e) => {
        const el = e.target as HTMLButtonElement;

        if (el.classList.contains(toggleButtonToggledClass))
            actions.selectTool?.(el, 'brush');

        updateActiveToolBtnElement(el);
    });
    btnBrush.click();

    const btnEraser = makeToggleButton();
    btnEraser.appendChild(makeIcon(eraserIconBlack, { invert: true }));
    btnEraser.addEventListener('click', (e) => {
        const el = e.target as HTMLButtonElement;

        if (el.classList.contains(toggleButtonToggledClass))
            actions.selectTool?.(e.target as HTMLElement, 'eraser');

        updateActiveToolBtnElement(el);
    });

    // const btnSelectTile = makeTileButton();


    const btnSectionReload = makeButtonSection('reload', [btnReload]);
    const btnSectionTools = makeButtonSection('tools', [btnBrush, btnEraser]);
    // const btnSelectionTile = makeButtonSection('tile-select', [btnSelectTile]);
    // btnSelectionTile.classList.add("align-right")


    container.append(
        btnSectionReload,
        btnSectionTools,
        // btnSelectionTile
    );

    canvas.parentElement!.append(container);
}