import type { TileBrush } from '$lib/TileBrush';
import { v4 as uuidv4 } from 'uuid';

export interface StoreLayer { [key: string]: StoreLayer | ValueStore<any> }
export type StoreMap = StoreLayer;

export class ValueStore<T extends any> {
    private value: T | string;
    private noValue: string;

    /**
     * Creates a new instance of a store for a value.
     * @param initialValue Optional initial value. Can be any value, including `undefined`.
     */
    constructor(initialValue?: T) {
        this.noValue = uuidv4();

        if (arguments.length > 0) {
            this.value = initialValue as T;
        } else {
            this.value = this.noValue
        }
    }

    /**
     * Returns whether there's a value stored.
     */
    get hasValue() {
        return this.value !== this.noValue;
    }

    /**
     * Attempts to retrieve the stored value.
     * 
     * @returns Whether there's a value stored. Additionally, if there's a value stored, calls `setOutValue` with the stored value. 
     * It can be then as an "out" pattern to to assign the value to some variable outside the store.
     */
    tryGet(setOutValue: (value: T) => void): boolean {
        if (this.hasValue) {
            setOutValue(this.value as T);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Retrieve the stored values.
     * @throws {Error} if no value is stored.
     * @returns Stored value.
     */
    get(): T {
        if (!this.hasValue)
            throw new Error("store error: value is not assigned");

        return this.value as T;
    }

    /**
     * Set value.
     * @param value Value to set.
     */
    set(value: T): void {
        this.value = value;
    }

    /**
     * Clears stored value.
     */
    clear(): void {
        this.value = this.noValue;
    }
}

export function createStoreMap<T extends StoreMap>(storeMap: T): T {
    return storeMap;
}