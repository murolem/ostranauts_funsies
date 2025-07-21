import { make } from '$lib/gui/make';

export function makeTileButton(): HTMLButtonElement {
    return make(`<button class="tile-button"></button>`) as HTMLButtonElement;
}