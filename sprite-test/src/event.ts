import type { Spritesheet } from '$lib/Spritesheet'
import EventEmitter3 from 'eventemitter3'

export type EventSource = unknown;
export type EventCb<TData extends object | undefined> = (data: TData, source: EventSource) => void;
export type EventEmitterVariantOptions = {
    /** 
     * If enabled, emitted events will "retrigger" for any new added callbacks. 
     * @default false
     * */
    persistEvents: boolean
}
export interface EventMapLayer { [key: string]: EventMapLayer | EventEmitterVariant<any> }

/** Represents a tree of events. Must be processed in {@link createEventEmitter} to get to a working state. */
export type EventMap = EventMapLayer;


/**
 * A variant of a event emitter. All variants use the same instance of the event emitter.
 */
export class EventEmitterVariant<TData extends object | undefined = undefined> {
    private _baseEventEmitter: EventEmitter3 | null = null;

    // initially set to this so that this field has a value for some time.
    private _eventName: string = '<NO_NAME>';
    /** Event name. By default, uses the event map structure to concat field names to construct the name. */
    get eventName() { return this._eventName; }

    opts: EventEmitterVariantOptions;

    private _persistingEmits: { source: EventSource, data: TData }[] = [];

    constructor(options?: Partial<EventEmitterVariantOptions>) {
        this.opts = {
            persistEvents: options?.persistEvents ?? false
        }
    }

    /**
     * @internal 
     * Sets base event emitter for this variant.
     * @param emitter 
     */
    _setBaseEventEmitter(emitter: EventEmitter3): void {
        this._baseEventEmitter = emitter;
    }

    /**
     * @internal 
     * Sets event name for this variant.
     * @param name 
     */
    _setEventName(name: string): void {
        this._eventName = name;
    }

    // this weird looking syntax allows to not specify data when there's no data set for this variant.
    // thanks to https://stackoverflow.com/a/52318137/10923580
    emit(source: unknown, ...data: (TData extends undefined ? [undefined?] : [TData])): void {
        this.assertEmitterSet();

        this._baseEventEmitter!.emit(this.eventName, ...data);
        if (this.opts.persistEvents)
            this._persistingEmits.push({ source, data: data[0] as any }) //! use any assertion because of the magic fuckery used for this function arguments
    }

    on(cb: EventCb<TData>): void {
        this.assertEmitterSet();

        this._baseEventEmitter!.on(this.eventName, cb);
        if (this.opts.persistEvents)
            this._persistingEmits.forEach(emit => cb(emit.data, emit.source));
    }

    off(cb: EventCb<TData>): void {
        this.assertEmitterSet();

        this._baseEventEmitter!.off(this.eventName, cb);
    }

    once(cb: EventCb<TData>): void {
        this.assertEmitterSet();

        this._baseEventEmitter!.once(this.eventName, cb);
        if (this.opts.persistEvents && this._persistingEmits.length > 0) {
            cb(this._persistingEmits[0].data, this._persistingEmits[0].source);
            this.off(cb);
        }
    }

    private assertEmitterSet() {
        if (!this._baseEventEmitter)
            throw new Error("assertion failed assertSetEmitterSet");
    }
}

/**
 * Traverses event map, configuring:
 * - assigns event names corresponding to nested structure of the event map.
 * - assigned a base event emitter.
 */
const configureEventMapEmitters = (eventMap: EventMap, baseEventEmitter: EventEmitter3) => {
    function traverse(obj: object, pathSegments: string[]): void {
        for (const [key, value] of Object.entries(obj)) {
            const pathSegmentsInner = [...pathSegments, key];

            if (value instanceof EventEmitterVariant) {
                value._setEventName(pathSegmentsInner.join("."));
                value._setBaseEventEmitter(baseEventEmitter);
            } else {
                traverse(value, pathSegmentsInner);
            }
        }
    }

    traverse(eventMap, []);
}

/**
 * Applies some processing to an event map to make it functional. Required.
 * @param eventMap 
 * @returns 
 */
export function createEventEmitter<T extends EventMap>(eventMap: T): T {
    const emitterBase = new EventEmitter3();
    configureEventMapEmitters(eventMap, emitterBase);

    return eventMap;
}