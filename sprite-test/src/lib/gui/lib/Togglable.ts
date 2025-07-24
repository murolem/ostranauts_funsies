import { createEventEmitter, EventEmitterVariant } from '$src/event';
import { v4 as uuidv4 } from 'uuid';

const toggleClass = "toggled";
export type CausedBy = string | Element | HTMLElement | Exclude<object, null>;
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
    }>(),

    exclusiveSelectionBindCreated: new EventEmitterVariant<{
        bindingId: string,
        boundElements: Set<HTMLElement>
    }>()
});

/**
 * Contains thingies to make an element togglable, creating a toggle state. 
 * 
 * Toggle state is independent from this or any instance, and each instance is dynamic. So attach as many times as you want!
 */
export class Togglable {
    private options: TogglableOptions;

    /**
     * Creates a new togglable instance, attaching to the given element. Many togglables for the same element can exist at once.
     * @param element Element to attach to.
     * @param options Options.
     */
    constructor(private element: HTMLElement, options?: Partial<TogglableOptions>) {
        this.options = {
            toggleOnClick: options?.toggleOnClick ?? false
        }

        if (this.options.toggleOnClick)
            element.addEventListener('click', () => this.invertToggle(this));
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
     * 
     * Calling this function an already bound element will remove previous binding from it and all bound elements.
     * All elements in previous binding will be toggled off, even if {@link keepOneToggled} is enabled.
     * @param collection Togglables to bind.
     * @param toggleOn 
     */
    static bindTogglablesToExclusiveToggleOnState(
        collection: HTMLElement[] | Togglable[],
        {
            keepOneToggled = false,
            toggleOn = null
        }: Partial<{
            /** 
             * If enabled, at least one element will remain toggled on (after initial toggle on).
             * Toggling on another bound element will work, but toggling off the same element will not.
             * 
             * This option is ignored when overriding a binding on an element.
             * @default false */
            keepOneToggled: boolean,

            /**
             * Togglable to toggle on after the binding.
             * @default null
             */
            toggleOn: Togglable | HTMLElement | null
        }> = {}
    ): void {
        if (collection.length === 0)
            return;

        // const togglables: Togglable[] = collection[0] instanceof HTMLElement
        //     ? collection.map(el => Togglable.attach(el as HTMLElement))
        //     : collection as Togglable[];

        const bindingId = uuidv4();

        const elementsSet = collection[0] instanceof HTMLElement
            ? new Set(collection as HTMLElement[])
            : new Set(collection.map(togglable => (togglable as Togglable).element))

        let activeElement: HTMLElement | null = null;

        const toggleListener: Parameters<typeof eventTogglable.toggle.on>[0] = e => {
            if (!elementsSet.has(e.element))
                return;

            if (e.toggleState) {
                // element toggled on

                // could happen externally, so do nothing ig
                if (e.element === activeElement)
                    return;

                // change active element
                const previousActiveElement = activeElement;
                activeElement = e.element;

                // toggle off selected, if any
                if (previousActiveElement)
                    Togglable.with(previousActiveElement).toggleOff(e.causedBy);
            } else {
                // element toggled off

                // could happen externally, so do nothing ig too 
                if (e.element !== activeElement)
                    return;

                if (keepOneToggled) {
                    Togglable.with(e.element).toggleOn('e.causedBy');
                    return;
                }

                activeElement = e.element;
            }
        }

        const bindingListener: Parameters<typeof eventTogglable.exclusiveSelectionBindCreated.on>[0] = e => {
            if (e.bindingId === bindingId)
                return;
            else if (![...e.boundElements].some(el => elementsSet.has(el)))
                return;

            // remove binding listeners
            eventTogglable.toggle.off(toggleListener);
            eventTogglable.exclusiveSelectionBindCreated.off(bindingListener);

            // untoggle active element, if any
            if (activeElement)
                Togglable.with(activeElement).toggleOff("binding override");
        }

        eventTogglable.toggle.on(toggleListener);
        eventTogglable.exclusiveSelectionBindCreated.on(bindingListener);

        eventTogglable.exclusiveSelectionBindCreated.emit(elementsSet, {
            bindingId,
            boundElements: elementsSet
        });

        if (toggleOn) {
            if (toggleOn instanceof HTMLElement)
                toggleOn = Togglable.with(toggleOn);

            toggleOn.toggleOn(this);
        }
    }

    /** Checks whether the element is toggled on or off. */
    get toggleState(): boolean {
        return this.element.classList.contains(toggleClass);
    }

    isEqual(other: Togglable) {
        return this.element === other.element;
    }

    /**
     * Inverts element's toggle state.
     * @param causedBy 
     * @returns 
     */
    invertToggle(causedBy: CausedBy): void {
        this.toggleTo(!this.toggleState, causedBy);
    }

    /**
     * Toggles the element on or off. Does nothing if the element is already in that state.
     * @param toggleState 
     * @param causedBy 
     * @returns 
     */
    toggleTo(toggleState: boolean, causedBy: CausedBy): void {
        if (this.toggleState === toggleState)
            return;

        if (toggleState) {
            this.element.classList.add(toggleClass);
        } else {
            this.element.classList.remove(toggleClass);
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
        this.toggleTo(true, causedBy);
    }

    /**
     * Shorthand for `toggle(false)`.
     */
    toggleOff(causedBy: CausedBy): void {
        this.toggleTo(false, causedBy);
    }

    /**
     * Binds with another togglable, syncing toggle state between the element, i.e. toggling one element
     * to the same state when another is toggled, and vice versa.
     * @param otherTogglable Other togglable
     */
    bindAutosyncWith(otherTogglable: Togglable): void {
        eventTogglable.toggle.on(e => {
            // toggle other element when this one is toggled, but not when it's caused by other one (through the binding toggle)
            if (e.element === this.element && e.causedBy !== otherTogglable.element)
                otherTogglable.toggleTo(e.toggleState, e.element);
            // same here, but inverted
            else if (e.element === otherTogglable.element && e.causedBy !== this.element) {
                this.toggleTo(e.toggleState, e.element);
            }
        });
    }
}