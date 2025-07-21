import trashBinIconBlack from '$src/icons/trash-bin-black.png';
import paintBrushIconBlack from '$src/icons/paint-brush-black.png';
import eraserIconBlack from '$src/icons/eraser-black.png';
import type { TileBrushMode } from '$lib/TileBrush';
import type { Spritesheet } from '$lib/Spritesheet';
import { registerKeybind, type HotkeyAction, type HotkeyKey } from '$lib/keybinds';

const buttonActiveClass = "active";
const toggleButtonToggledClass = "toggled";
const buttonPressAnimationDurationMs = 125;

const rootEl = document.querySelector(':root') as HTMLHtmlElement;
rootEl.style.setProperty("--btn-press-anim-duration", buttonPressAnimationDurationMs + "ms");

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

function makeButtonLabelElementAndWrap(btnEl: HTMLButtonElement, text: string, labelPos: 'above' | 'below') {
    const el = make(`<label class="button-label-wrapping"></label>`);
    const textEl = make(`<span class="button-label-text">${text}</span>`);
    if (labelPos === 'above') {
        el.append(textEl);
        el.append(btnEl);
    } else {
        el.append(btnEl);
        el.append(textEl);
    }

    return el as HTMLLabelElement;
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

/**
 * Adds a hotkey to a button, wrapping it into a label element with said hotkey below the button.
 * @param btn
 * @param hotkey 
 * @param action 
 */
function hotkeifyButtonWithLabel(btn: HTMLButtonElement, hotkey: HotkeyKey, { setActiveForClickDuration = false } = {}): HTMLLabelElement {
    registerKeybind(hotkey, () => {
        btn.click();

        if (setActiveForClickDuration) {
            btn.classList.add(buttonActiveClass);
            setTimeout(() => btn.classList.remove(buttonActiveClass), buttonPressAnimationDurationMs);
        }
    });
    return makeButtonLabelElementAndWrap(btn, hotkey, 'below');
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
    const btnReloadWrapped = hotkeifyButtonWithLabel(btnReload, 'A', { setActiveForClickDuration: true });

    const runIfToggled = (toggleBtn: HTMLButtonElement, fn: (toggleBtn: HTMLButtonElement) => void) => {
        if (toggleBtn.classList.contains(toggleButtonToggledClass))
            fn(toggleBtn);
    }

    let activeToolBtnElement: HTMLButtonElement | null = null;
    const updateToggleButtonState = (newActiveBtnEl: HTMLButtonElement): void => {
        // if it's the same button, revert the toggle cuz we there should be tool selected at all times.
        if (activeToolBtnElement && activeToolBtnElement === newActiveBtnEl) {
            newActiveBtnEl.classList.add(toggleButtonToggledClass);
            return;
        }

        // untoggle other button
        if (activeToolBtnElement
            && activeToolBtnElement.classList.contains(toggleButtonToggledClass))
            activeToolBtnElement.classList.remove(toggleButtonToggledClass);

        activeToolBtnElement = newActiveBtnEl;
    }

    const btnBrush = makeToggleButton();
    btnBrush.appendChild(makeIcon(paintBrushIconBlack, { invert: true }));
    btnBrush.addEventListener('click', (e) => {
        const el = e.target as HTMLButtonElement;

        updateToggleButtonState(el);
        runIfToggled(el, el => actions.selectTool?.(el, 'brush'));
    });
    const btnBrushWrapped = hotkeifyButtonWithLabel(btnBrush, 'B');

    const btnEraser = makeToggleButton();
    btnEraser.appendChild(makeIcon(eraserIconBlack, { invert: true }));
    btnEraser.addEventListener('click', (e) => {
        const el = e.target as HTMLButtonElement;

        updateToggleButtonState(el);
        runIfToggled(el, el => actions.selectTool?.(el, 'eraser'));
    });
    const btnEraserWrapped = hotkeifyButtonWithLabel(btnEraser, 'E');


    const btnSelectTile = makeTileButton();


    const btnSectionReload = makeButtonSection('reload', [btnReloadWrapped]);
    const btnSectionTools = makeButtonSection('tools', [btnBrushWrapped, btnEraserWrapped]);
    const btnSectionTileSelector = makeButtonSection('tile-select', [btnSelectTile]);
    btnSectionTileSelector.classList.add("align-right")


    container.append(
        btnSectionReload,
        btnSectionTools,
        // btnSectionTileSelector
    );

    canvas.parentElement!.append(container);


    btnBrush.click();
}