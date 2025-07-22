import { makeButtonLabelElementAndWrap } from '$lib/gui/buttons/buttonLabel';
import { buttonActiveClass, buttonPressAnimationDurationMs } from '$lib/gui/preset';
import { registerKeybind, type HotkeyKey } from '$lib/keybinds';

/**
 * Adds a hotkey to a button, wrapping it into a label element with said hotkey below the button.
 * @param btn
 * @param hotkey 
 * @param action 
 */
export function hotkeifyButtonWithLabel(
    btn: HTMLButtonElement,
    hotkey: HotkeyKey, {
        setActiveForClickDuration = false
    }: Partial<{
        /** If enabled, an "active" class will be added to the button, mimicking a button press behavior for a short time (if such is defined). */
        setActiveForClickDuration: boolean
    }> = {}
): HTMLLabelElement {
    registerKeybind(hotkey, () => {
        btn.click();

        if (setActiveForClickDuration) {
            btn.classList.add(buttonActiveClass);
            setTimeout(() => btn.classList.remove(buttonActiveClass), buttonPressAnimationDurationMs);
        }
    });
    return makeButtonLabelElementAndWrap(btn, hotkey, 'below');
}
