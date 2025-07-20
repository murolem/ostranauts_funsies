import { randomIndex } from './randomIndex';

/**
 * Picks a random item from an array.
 * @param arr 
 */
export function pickRandomItem<T>(arr: Array<T>): T {
    return arr[randomIndex(arr)];
}