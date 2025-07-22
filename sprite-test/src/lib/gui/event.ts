import type { Spritesheet } from '$lib/Spritesheet';
import EventEmitter from 'eventemitter3';

export const guiEventEmitter = new EventEmitter();

export const guiEventGuiBuilt = "gui-built";
export function emitGuiEventGuiBuilt(): void {
    guiEventEmitter.emit(guiEventGuiBuilt);
}

export const guiEventInitialTilesetSet = "initial-spritesheet-set";
export function emitGuiEventInitialTilesetSet(spritesheet: Spritesheet): void {
    guiEventEmitter.emit(guiEventInitialTilesetSet, spritesheet);
}

export const guiEventSpritesheetsLoaded = "spritesheets-loaded";
export function emitGuiEventSpritesheetsLoaded(spritesheets: Spritesheet[]): void {
    guiEventEmitter.emit(guiEventSpritesheetsLoaded, spritesheets);
}

export const guiEventBrushTilesetChanged = "tileset-changed";
export function emitGuiEventBrushTilesetChanged(newTileset: Spritesheet): void {
    guiEventEmitter.emit(guiEventBrushTilesetChanged, newTileset);
}
export function addListenerGuiEventBrushTilesetChanged(cb: (newTileset: Spritesheet) => void): void {
    guiEventEmitter.addListener(guiEventBrushTilesetChanged, cb);
}

export const guiEventTileSelectionWindowToggled = "tile-selection-window-toggled";
export function emitGuiEventTileSelectionWindowToggled(toggleState: boolean, causedBy?: HTMLElement): void {
    guiEventEmitter.emit(guiEventTileSelectionWindowToggled, toggleState, causedBy);
}
export function addListenerGuiEventTileSelectionWindowToggled(cb: (toggleState: boolean, causedBy?: HTMLElement) => void): void {
    guiEventEmitter.addListener(guiEventTileSelectionWindowToggled, cb);
}