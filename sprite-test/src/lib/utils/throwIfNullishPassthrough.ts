/**
 * 
 * @param value 
 * @param optionalMsg 
 * @returns 
 */
export function throwIfNullishPassthrough<T extends unknown>(value: T, optionalMsg?: string): Exclude<T, undefined | null> {
    if (value === undefined || value === null) {
        throw new Error(optionalMsg);
    }

    return value as any;
}