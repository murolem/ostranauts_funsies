import { make } from '$lib/gui/make';

export function makeButtonLabelElementAndWrap(
    btnEl: HTMLButtonElement,
    text: string,
    labelPos: 'above' | 'below'
): HTMLLabelElement {
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
