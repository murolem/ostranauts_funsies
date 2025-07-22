
import { buttonPressAnimationDurationMs, toggleButtonToggledOnColorConf } from '$lib/gui/preset';
import type { ActionMap } from '$lib/gui/types';
import { makeTopToolbarEl } from '$lib/gui/lib/makeTopToolbar';
import { emitGuiEventGuiBuilt } from '$lib/gui/event';
import { toggleTileSelectionWindow } from '$lib/gui/lib/makeTileSelectionWindow';

function applyRootStyles() {
    const rootEl = document.querySelector(':root') as HTMLHtmlElement;
    rootEl.style.setProperty("--btn-press-anim-duration", buttonPressAnimationDurationMs + "ms");
    let c = toggleButtonToggledOnColorConf;
    rootEl.style.setProperty("--toggle-col", `hsl(${c.h}, ${c.s}%, ${c.l}%)`);
}

export default function (canvas: HTMLCanvasElement, actions: ActionMap) {
    applyRootStyles();

    const toolbars: HTMLElement[] = [
        makeTopToolbarEl(actions)
    ]

    // create it on start so it can catch some useful events, but keep it hidden
    toggleTileSelectionWindow(actions, false);

    canvas.parentElement!.append(...toolbars);

    emitGuiEventGuiBuilt();
}