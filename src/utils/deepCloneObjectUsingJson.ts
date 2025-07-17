/**
 * Clones an object using `JSON.stringify` and then `.parse`.
 * @param obj an object to clone.
 * @returns a cloned object.
 */
export function deepCloneObjectUsingJson(obj: object): unknown {
    return JSON.parse(JSON.stringify(obj));
}