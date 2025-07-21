import { make } from '$lib/gui/make';

export function makeSimpleButton(): HTMLButtonElement {
    return make(`<button class="simple-button"></button>`) as HTMLButtonElement;
}
