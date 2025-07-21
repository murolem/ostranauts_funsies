import { makeContainer } from '$lib/gui/containers/container';

export function makeButtonSection(name: string, els: HTMLElement[]): HTMLDivElement {
    const container = makeContainer(['button-section', `name-${name}`]);
    container.classList.add();
    container.append(...els);
    return container;
}
