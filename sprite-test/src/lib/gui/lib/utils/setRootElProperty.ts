let rootEl: HTMLElement | null = null;

/**
 * Sets property to value on the root element.
 * @param prop Se
 * @param value 
 */
export function setRootElProperty(prop: string, value: string) {
    if (!rootEl)
        rootEl = document.querySelector(':root') as HTMLHtmlElement;

    rootEl.style.setProperty(prop, value);
}