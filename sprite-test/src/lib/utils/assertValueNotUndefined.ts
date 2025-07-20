import { Logger } from '$logger';
const logger = new Logger("utils/assertValueNotUndefined");
const { logFatal } = logger;

export function assertValueNotUndefined(value: unknown, errorText?: string): void {
    if (value === undefined) {
        logFatal({
            msg: errorText ?? "assertion failed: undefined value",
            throw: true
        });
    }
}

export function assertValueNotUndefinedPassthrough<T extends unknown>(value: T, errorText?: string): Exclude<T, undefined> {
    assertValueNotUndefined(value, errorText);
    return value as Exclude<typeof value, undefined>;
}