import { make } from '$lib/gui/make';

export function makeIcon(src: string, { invert = false } = {}): HTMLImageElement {
    return make(`<img src="${src}" class="icon${invert ? ' invert' : ''}">`) as HTMLImageElement;
}
