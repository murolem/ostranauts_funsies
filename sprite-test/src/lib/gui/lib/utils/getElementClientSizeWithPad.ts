import type { SizePx } from '$src/types';

export function getElementClientSizeWithPad(el: HTMLElement): SizePx {
    const compStyle = getComputedStyle(el);

    return {
        w: el.clientWidth + parseFloat(compStyle.paddingLeft) + parseFloat(compStyle.paddingRight),
        h: el.clientHeight + parseFloat(compStyle.paddingTop) + parseFloat(compStyle.paddingBottom)
    }
}