import type { ButtonOrWrapped } from '$lib/gui/types';

/**
 * Unwraps a button, possibly wrapped in a label element.
 * @param btn 
 */
export function unwrapButton(btn: ButtonOrWrapped): HTMLButtonElement {
    if (btn.tagName === 'BUTTON')
        return btn as HTMLButtonElement;
    else if (btn.tagName === "LABEL") {
        return btn.querySelector(":scope > button") as HTMLButtonElement;
    }

    console.error(btn);
    throw new Error("failed to unwrap a button: unknown configuration (see above)");
}