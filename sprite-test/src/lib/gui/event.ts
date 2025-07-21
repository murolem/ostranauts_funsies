import EventEmitter from 'eventemitter3';

export const guiEventEmitter = new EventEmitter();
export const guiBuiltEventName = "gui-built";
export function emitGuiBuiltEvent(): void {
    guiEventEmitter.emit(guiBuiltEventName);
}