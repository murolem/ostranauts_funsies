
import { buttonPressAnimationDurationMs, toggleButtonToggledOnColorConf } from '$lib/gui/preset';
import { makeTopToolbarEl } from '$lib/gui/lib/makeTopToolbar';
import { event, store } from '$preset';
import { setRootElProperty } from '$lib/gui/lib/utils/setRootElProperty';
import { TileWindow } from '$lib/gui/windows/TileWindow';

function applyRootStyles() {
    setRootElProperty("--btn-press-anim-duration", buttonPressAnimationDurationMs + "ms");
    let c = toggleButtonToggledOnColorConf;
    setRootElProperty("--toggle-col", `hsl(${c.h}, ${c.s}%, ${c.l}%)`);
}

export default function () {
    applyRootStyles();

    const tileWindow = new TileWindow();
    document.body.append(tileWindow.element);
    tileWindow.selectTileset(store.initialSpritesheet.get(), null, { scrollTo: true });

    const toolbars: HTMLElement[] = [
        makeTopToolbarEl()
    ]
    store.canvas.get().parentElement!.append(...toolbars);

    event.gui.gui_built__persisting.emit('gui');
}