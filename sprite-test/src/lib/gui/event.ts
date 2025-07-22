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