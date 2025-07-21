import { make } from '$lib/gui/make';
import EventEmitter from 'eventemitter3';

const toggleButtonToggledClass = "toggled";

const ee = new EventEmitter();
const toggleEventName = "toggle";
type ToggleEventData = {
    btn: HTMLButtonElement,
    toggledOn: boolean
}

function emitToggleEvent(btn: HTMLButtonElement, toggledOn: boolean): void {
    const eventArgs: ToggleEventData = {
        btn: btn,
        toggledOn: toggledOn
    }
    ee.emit(toggleEventName, eventArgs);
}

export function makeToggleButton(classNames?: string[]): HTMLButtonElement {
    const btn = make(`<button class="toggle-button ${classNames ? classNames.join(" ") : ""}"></button>`) as HTMLButtonElement;
    btn.addEventListener('click', () => setToggleButtonToggle(btn, !isToggleButtonToggledOn(btn)));
    return btn;
}

/** Checks whether a toggle button is toggled on. */
export function isToggleButtonToggledOn(btn: HTMLButtonElement): boolean {
    return btn.classList.contains(toggleButtonToggledClass);
}

/** 
 * Sets toggle state for a toggle button. 
 * 
 * Does nothing for buttons that are already in specified state.
 * */
export function setToggleButtonToggle(btn: HTMLButtonElement, toggleState: boolean): void {
    const currentToggleState = isToggleButtonToggledOn(btn);
    if (toggleState === currentToggleState)
        return;

    if (toggleState) {
        // toggle on
        btn.classList.add(toggleButtonToggledClass);
        emitToggleEvent(btn, true);
    } else {
        // toggle off
        btn.classList.remove(toggleButtonToggledClass);
        emitToggleEvent(btn, false);
    }
}

/**
 * Register a callback for when a button is toggled on/off.
 * @param toggleBtn 
 * @param cb 
 */
export function addEventListenerToggleButtonToggled(
    toggleBtn: HTMLButtonElement,
    cb: (toggleBtn: HTMLButtonElement, isToggledOn: boolean) => void
) {
    ee.addListener(toggleEventName, (data: ToggleEventData) => {
        if (data.btn !== toggleBtn)
            return;

        cb(toggleBtn, data.toggledOn);
    });
}

/** 
 * Forces given buttons to only have a single button selected at a time by
 * toggling off previous button when a new button is toggled on.
 */
export function bindExclusiveSelectionToToggleButtons(
    buttons: HTMLButtonElement[], {
        keepToggleOn = false
    }: Partial<{
        /** If enabled, if a button is toggled on and pressed again, it will NOT be toggled off. 
         * This keeps at least one button always toggled, granted one was toggled on at some point */
        keepToggleOn: boolean
    }> = {}): void {
    buttons.forEach(btn => {
        addEventListenerToggleButtonToggled(
            btn,
            (_, toggleState) => {
                if (toggleState) {
                    // toggled on
                    // make sure other buttons are toggled off
                    buttons.forEach(otherButton => {
                        if (otherButton === btn)
                            return;

                        setToggleButtonToggle(otherButton, false);
                    });
                } else {
                    // toggled off
                    // make sure at least one button is toggled on.
                    const isAnyButtonToggledOn = buttons.some(btn => isToggleButtonToggledOn(btn));
                    if (isAnyButtonToggledOn)
                        return

                    setToggleButtonToggle(btn, true);
                }
            }
        )
    });
}