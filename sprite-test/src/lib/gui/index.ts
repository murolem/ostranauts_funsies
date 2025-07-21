
import { buttonPressAnimationDurationMs } from '$lib/gui/preset';
import type { ActionMap } from '$lib/gui/types';
import { makeTopToolbarEl } from '$lib/gui/lib/makeTopToolbar';
import { emitGuiBuiltEvent } from '$lib/gui/event';

function applyRootStyles() {
    const rootEl = document.querySelector(':root') as HTMLHtmlElement;
    rootEl.style.setProperty("--btn-press-anim-duration", buttonPressAnimationDurationMs + "ms");
}

export default function (canvas: HTMLCanvasElement, actions: ActionMap) {
    applyRootStyles();

    const toolbars: HTMLElement[] = [
        makeTopToolbarEl(actions)
    ]

    canvas.parentElement!.append(...toolbars);

    emitGuiBuiltEvent();
}