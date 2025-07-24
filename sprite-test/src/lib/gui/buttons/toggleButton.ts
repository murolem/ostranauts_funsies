import { Togglable } from '$lib/gui/lib/Togglable';
import { make } from '$lib/gui/make';

/**
 * Creates a toggle button.
 * @param classNames
 * @param contents 
 * @returns A tuple of toggle button and a togglable class.
 */
export function makeToggleButton(classNames?: string[], contents?: HTMLElement | string): [HTMLButtonElement, Togglable] {
    const btn = make(`<button class="toggle-button ${classNames ? classNames.join(" ") : ""}"></button>`) as HTMLButtonElement;
    if (contents !== undefined)
        btn.append(contents);

    const togglable = Togglable.attach(btn, { toggleOnClick: true });

    return [btn, togglable];
}