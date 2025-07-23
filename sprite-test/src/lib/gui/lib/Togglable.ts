import { make } from '$lib/gui/make';
import { createEventEmitter, EventEmitterVariant } from '$src/event';

const toggleClass = "toggled";
export type CausedBy = "string" | Element | HTMLElement | Exclude<object, null>;
// export type CausedBy = unknown;
export type TogglableOptions = {
    /** 
     * If enabled, attaches a listener to the `click` event, toggling the element each time it's clicked. 
     * @default false
    */
    toggleOnClick: boolean
}

export const eventTogglable = createEventEmitter({
    toggle: new EventEmitterVariant<{
        element: HTMLElement,
        togglable: Togglable,
        toggleState: boolean,
        causedBy: CausedBy
    }>()
});

type ExclusiveSelectionBinding = {
    toggledOnTogglable: Togglable | null,
    boundTogglables: Set<Togglable>
}
/**
 * Contains thingies to make an element togglable, creating a toggle state. 
 * 
 * Toggle state is independent from this or any instance, and each instance is dynamic. So attach as many times as you want!
 */
export class Togglable {
    private options: TogglableOptions;

    /**
     * Creates a new togglable instance, attaching to the given element.
     * @param element Element to attach to.
     * @param options Options.
     */
    constructor(private element: HTMLElement, options?: Partial<TogglableOptions>) {
        this.options = {
            toggleOnClick: options?.toggleOnClick ?? false
        }

        if (this.options.toggleOnClick)
            element.addEventListener('click', () => this.toggle(element));
    }

    /**
     * Creates a new togglable instance, attaching to the given element.
     * 
     * Alias for the construction.
     * @param element Element to attach to.
     * @param options Options.
     */
    static with(element: HTMLElement, options?: Partial<TogglableOptions>) {
        return new Togglable(element, options);
    }

    /**
     * Creates a new togglable instance, attaching to the given element.
     * 
     * Alias for the construction.
     * @param element Element to attach to.
     * @param options Options.
     */
    static attach(element: HTMLElement, options?: Partial<TogglableOptions>) {
        return new Togglable(element, options);
    }

    /**
     * Binds multiple togglable elements together, 
     * making it only possible to toggle on one element at a time.
     * @param togglables Togglables to bind.
     * @param toggleOn 
     */
    static bindTogglablesToExclusiveToggleOnState(
        togglables: Togglable[],
        {
            ensureOneToggledOn = false,
            toggleOn = null
        }: Partial<{
            /** 
             * If enabled, at least one element will remain toggled on (after initial toggle on).
             * Toggling on another bound element will work, but toggling off the same element will not.
             * @default false */
            ensureOneToggledOn: boolean,

            /**
             * Togglable to toggle on after the binding.
             * @default null
             */
            toggleOn: Togglable | null
        }> = {}
    ): void {
        const binding: ExclusiveSelectionBinding = {
            boundTogglables: new Set(togglables),
            toggledOnTogglable: null
        }

        eventTogglable.toggle.on(({ togglable, causedBy, toggleState }) => {
            if (!binding.boundTogglables.has(togglable))
                return;

            if (toggleState) {
                // element toggled on

                // should not happen since binding can only have that value and the same togglable when toggling it off
                if (togglable === binding.toggledOnTogglable)
                    throw new Error("failed to process exclusive selection binding for togglable: illegal state");

                // toggle off selected, if any
                if (binding.toggledOnTogglable) {
                    binding.toggledOnTogglable.toggleOff(causedBy);
                    binding.toggledOnTogglable = null;
                }

                // select new
                togglable.toggleOn(causedBy);
                binding.toggledOnTogglable = togglable;
            } else {
                // element toggled off

                if (ensureOneToggledOn && togglable === binding.toggledOnTogglable) {
                    // ensure is enabled; cannot toggle off the only element
                    return;
                }


                // toggle off selected, if any
                if (binding.toggledOnTogglable) {
                    binding.toggledOnTogglable.toggleOff(causedBy);
                    binding.toggledOnTogglable = null;
                }
            }
        });

        if (toggleOn)
            toggleOn.toggleOn(binding);
    }

    /** Checks whether the element is toggled on or off. */
    get toggleState(): boolean {
        return this.element.classList.contains(toggleClass);
    }

    /**
     * Inverts element's toggle state.
     * @param causedBy 
     * @returns 
     */
    toggle(causedBy: CausedBy): void;
    /**
     * Toggles the element on or off. Does nothing if the element is already in that state.
     * @param toggleState 
     * @param causedBy 
     * @returns 
     */
    toggle(toggleState: boolean, causedBy: CausedBy): void;
    toggle(arg1: CausedBy | boolean, arg2?: CausedBy): void {
        let toggleState: boolean;
        let causedBy: CausedBy;
        if (typeof arg1 === 'boolean') {
            toggleState = arg1;
            causedBy = arg2!;
        } else {
            causedBy = arg1;
            toggleState = !this.toggleState;
        }

        eventTogglable.toggle.emit(causedBy, {
            element: this.element,
            togglable: this,
            toggleState,
            causedBy
        });
    }

    /**
     * Shorthand for `toggle(true)`.
     */
    toggleOn(causedBy: CausedBy): void {
        this.toggle(true, causedBy);
    }

    /**
     * Shorthand for `toggle(false)`.
     */
    toggleOff(causedBy: CausedBy): void {
        this.toggle(false, causedBy);
    }
}