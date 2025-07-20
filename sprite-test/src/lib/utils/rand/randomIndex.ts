import { randomIntInRange } from './randomIntInRange';

/**
 * Generates a random index for a given array.
 * 
 * If array is empty, returns `-1`.
 * @param arr Array to generate a random index for.
 */
export function randomIndex(arr: any[]): number {
    return arr.length > 0 ? randomIntInRange(arr.length - 1) : -1;
}