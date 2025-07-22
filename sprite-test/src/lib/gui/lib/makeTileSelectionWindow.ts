import { bindExclusiveSelectionToToggleButtons, makeToggleButton } from '$lib/gui/buttons/toggleButton';
import { makeContainer } from '$lib/gui/containers/container';
import { guiEventEmitter, guiEventInitialTilesetSet, guiEventSpritesheetsLoaded } from '$lib/gui/event';
import { make } from '$lib/gui/make';
import type { ActionMap } from '$lib/gui/types';
import { Spritesheet, type SpritesheetMetadata } from '$lib/Spritesheet';
import ssMetadataUntyped from '$src/data/ss_metadata.json';

const ssMetadata = ssMetadataUntyped as SpritesheetMetadata[];

const tileSelectionWindowClassActive = "active";
const tilesetDataAttrTilesetName = "data-ss-name";
const tilesetClassTilesetPlaceholder = "tileset-placeholder";
const tilesetClassSelected = "selected";

let tileSelectionWindow: HTMLElement | null = null;
let selectedTilesetWrappingEl: HTMLElement | null = null;

let actionMap: ActionMap | null = null;
let tilesets: Spritesheet[] | null = null;
let explorer: HTMLElement | null = null;

/**
 * @example
 * ┌──────────────────────────────────────────────────────────────┐
 * │                          Tile selection                      │
 * ├──────────────────────────────────────────────────────────────┤
 * │   All   │    ────────────    ────────────    ────────────   █│
 * │  Core   │    │          │    │          │    │          │   █│
 * │ Uploads │    │          │    │          │    │          │    │
 * │         │    │          │    │          │    │          │    │
 * │         │    │          │    │          │    │          │    │
 * │         │    ────────────    ────────────    ────────────    │
 * │         │        Tile1           Tile2           Tile3       │
 * │         │    ────────────    ────────────    ────────────    │
 * │         │    │          │    │          │    │          │    │
 * │         │    │          │    │          │    │          │    │
 * │         │    │          │    │          │    │          │    │
 * ├─────────┤    │          │    │          │    │          │    │
 * │         │    ────────────    ────────────    ────────────    │
 * │ >Upload<│        Tile4           Tile5           Tile6       │
 * │         │                                                    │
 * └─────────┴────────────────────────────────────────────────────┘
 */
function makeAndAppendTileSelectionWindow(): void {
    if (tileSelectionWindow)
        return;

    const container = makeContainer(["tile-selection-window"]);

    const header = make(`<div class="header">TILE SELECTION</div>`);


    const sidebar = make(`<div class="sidebar"></div>`);
    const sidebarFolders = make(`<div class="sidebar-folders"></div>`);

    const folderAll = makeToggleButton(['folder', 'no-make-style'], 'all');
    const folderCore = makeToggleButton(['folder', 'no-make-style'], 'core');
    const folderUploads = makeToggleButton(['folder', 'no-make-style'], 'my uploads');

    folderAll.click();

    const folderBtns = [
        folderAll,
        folderCore,
        // folderUploads
    ];
    bindExclusiveSelectionToToggleButtons(folderBtns);
    sidebarFolders.append(...folderBtns);

    const sidebarUpload = make(`<div class="sidebar-upload"></div>`);
    sidebarUpload.append(
        make(`<span><span class="bracket">&gt;</span> UPLOAD <span class="bracket">&lt;</span></span>`)
    )

    sidebar.append(
        sidebarFolders,
        sidebarUpload
    )

    explorer = make(`<div class="explorer"></div>`);
    for (const ssMeta of ssMetadata) {
        const labelWrapping = make(`<label class="tileset-label-wrapping" ${tilesetDataAttrTilesetName}=${ssMeta.ssName}></label>`);
        const imgPlaceholder = make(`<div class="${tilesetClassTilesetPlaceholder}"></div>`);
        labelWrapping.append(
            imgPlaceholder,
            make(`<span class="label">${ssMeta.ssName}</span>`),
        );

        explorer.append(labelWrapping);
    }

    guiEventEmitter.addListener(guiEventInitialTilesetSet, (tileset: Spritesheet) => {
        tilesets = [tileset];

        selectedTilesetElUsingTileset(tileset);
        explorer!.scrollTop = selectedTilesetWrappingEl!.offsetTop
            + selectedTilesetWrappingEl!.offsetHeight / 2
            - explorer!.clientHeight / 2;
    });

    guiEventEmitter.addListener(guiEventSpritesheetsLoaded, (spritesheets: Spritesheet[]) => {
        tilesets = spritesheets;

        for (const labelWrappingEl of explorer!.children) {
            const ssName = labelWrappingEl.getAttribute(tilesetDataAttrTilesetName);
            if (!ssName)
                throw new Error("failed to extract tileset name from an explorer item");

            const ss = spritesheets.find(ss => ss.name === ssName);
            if (!ss)
                throw new Error(`failed to find a matching spritesheets for an explorer item; ss name: ${ssName}`);

            const placeholderEl = labelWrappingEl.querySelector(`:scope > .${tilesetClassTilesetPlaceholder}`);
            if (!placeholderEl)
                throw new Error(`failed to find a placeholder tileset for an explorer item; ss name: ${ssName}`);

            const tilesetImgEl = make(`<img draggable="false" class="tileset" src="${ss.imageUrl}">`);
            tilesetImgEl.addEventListener('click', () => selectTilesetEl(labelWrappingEl as HTMLElement));
            placeholderEl.replaceWith(tilesetImgEl);
        }
    });

    container.append(
        header,
        sidebar,
        explorer
    );

    tileSelectionWindow = container;
    document.body.append(container);
}

export function toggleTileSelectionWindow(actions: ActionMap, toggleState: boolean): void {
    let isFirstTimeToggling = false;

    if (!tileSelectionWindow) {
        isFirstTimeToggling = true;
        actionMap = actions;
        makeAndAppendTileSelectionWindow();
    }

    const toggleFn = () => {
        if (toggleState)
            tileSelectionWindow!.classList.add(tileSelectionWindowClassActive);
        else
            tileSelectionWindow!.classList.remove(tileSelectionWindowClassActive);
    }

    // add a small delay so that when the element is first added, the animation on class addition plays
    if (isFirstTimeToggling)
        setTimeout(toggleFn, 10);
    else
        toggleFn();
}

function selectTilesetEl(wrappingLabelEl: HTMLElement): void {
    if (selectedTilesetWrappingEl)
        selectedTilesetWrappingEl.classList.remove(tilesetClassSelected);

    selectedTilesetWrappingEl = wrappingLabelEl;
    selectedTilesetWrappingEl.classList.add(tilesetClassSelected);

    const ssName = wrappingLabelEl.getAttribute(tilesetDataAttrTilesetName);
    if (!ssName) {
        console.error(wrappingLabelEl);
        throw new Error("failed to select a tileset element in tileset select window: tileset name data attribute not set (see above)");
    }

    const ss = tilesets?.find(ss => ss.name === ssName);
    if (!ss) {
        console.error(wrappingLabelEl);
        throw new Error("failed to select a tileset element in tileset select window: no matching tileset was found (see above)");
    }

    actionMap!.selectTileset(wrappingLabelEl, ss);
}

function selectedTilesetElUsingTileset(tileset: Spritesheet): void {
    assertTilesetSelectionWindowCreated();

    // todo: store children separatly so we dont have to make an array on each selection
    const matchingWrappingLabelEl = [...explorer!.children].find(el => {
        const ssName = el.getAttribute(tilesetDataAttrTilesetName);
        if (!ssName) {
            console.error(el);
            throw new Error("failed to select tileset element: ss name attribute is empty on element (see above)");
        }

        if (ssName === tileset.name)
            return true;
    });

    if (!matchingWrappingLabelEl) {
        console.error(tileset);
        throw new Error("failed to select tileset element: no matching tileset element found, tileset: (see above)")
    }

    selectTilesetEl(matchingWrappingLabelEl as HTMLElement);
}

export function isTilesetSelectionWindowCreated(): boolean {
    return !!tileSelectionWindow;
}

export function isTilesetSelectionWindowOpen(): boolean {
    return tileSelectionWindow
        ? tileSelectionWindow.classList.contains(tileSelectionWindowClassActive)
        : false;
}


function assertTilesetSelectionWindowCreated(): void {
    if (!isTilesetSelectionWindowCreated())
        throw new Error("failed assert isTilesetSelectionWindowCreated");
}