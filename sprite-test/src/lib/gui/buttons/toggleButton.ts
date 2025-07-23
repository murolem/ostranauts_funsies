import { Togglable } from '$lib/gui/lib/Togglable';
import { make } from '$lib/gui/make';
import EventEmitter from 'eventemitter3';

export function makeToggleButton(classNames?: string[], contents?: HTMLElement | string): HTMLButtonElement {
    const btn = make(`<button class="toggle-button ${classNames ? classNames.join(" ") : ""}"></button>`) as HTMLButtonElement;
    if (contents !== undefined)
        btn.append(contents);

    Togglable.attach(btn, { toggleOnClick: true });

    return btn;
}