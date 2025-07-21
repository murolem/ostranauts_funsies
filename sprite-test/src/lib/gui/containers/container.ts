import { make } from '$lib/gui/make';

export function makeContainer(classes: string[]): HTMLDivElement {
    return make(`<div class="${classes.join(" ")}"></div>`) as HTMLDivElement;
}
