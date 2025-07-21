export type ActionSimple = (trigger: HTMLElement) => void
export type ActionSelect<T> = (trigger: HTMLElement, selection: T) => void;
export type ActionMap = {
    reload: ActionSimple,
    selectTool: ActionSelect<TileBrushMode>,
    selectTileset: ActionSelect<Spritesheet>
}

/** Represents a button or a label wrapping a button. */
export type ButtonOrWrapped = HTMLButtonElement | HTMLLabelElement;