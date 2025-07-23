
import { buttonPressAnimationDurationMs, toggleButtonToggledOnColorConf } from '$lib/gui/preset';
import { makeTopToolbarEl } from '$lib/gui/lib/makeTopToolbar';
import { makeTileSelectionWindow } from '$lib/gui/lib/makeTileSelectionWindow';
import { event, store } from '$preset';
import { setRootElProperty } from '$lib/gui/lib/utils/setRootElProperty';

function applyRootStyles() {
    setRootElProperty("--btn-press-anim-duration", buttonPressAnimationDurationMs + "ms");
    let c = toggleButtonToggledOnColorConf;
    setRootElProperty("--toggle-col", `hsl(${c.h}, ${c.s}%, ${c.l}%)`);
}

export default function () {
    applyRootStyles();

    const toolbars: HTMLElement[] = [
        makeTopToolbarEl()
    ]
    store.canvas.get().parentElement!.append(...toolbars);

    makeTileSelectionWindow();

    event.gui.gui_built__persisting.emit('gui');
}