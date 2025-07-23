import { makeContainer } from '$lib/gui/containers/container';
import { eventTogglable, Togglable } from '$lib/gui/lib/Togglable';
import { getElementClientSizeWithPad } from '$lib/gui/lib/utils/getElementClientSizeWithPad';
import { make } from '$lib/gui/make';
import { Spritesheet, type SpritesheetMetadata } from '$lib/Spritesheet';
import { event, store } from '$preset';
import ssMetadataUntyped from '$src/data/ss_metadata.json';

const ssMetadata = ssMetadataUntyped as SpritesheetMetadata[];

const tileSelectionWindowClassActive = "active";
const tilesetDataAttrTilesetName = "data-ss-name";
const tilesetClassTilesetPlaceholder = "tileset-placeholder";
const tilesetClassSelected = "selected";
const tswExpCalculatedWidthCssVarName = "--tsw-exp-calculated-width";

export type TilesetView =
    "all"
    | "core"
    | "user";

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
export class TileWindow {
    private _element: HTMLElement;
    get element() { return this._element; }
    private set element(value) { this._element = value; }

    private _togglable: Togglable;
    get togglable() { return this._togglable; }
    private set togglable(value) { this._togglable = value; }

    private _explorer: HTMLElement;

    private _activeView: TilesetView = 'core';

    /** Maps views to tilesets within them. Each entry contains a tileset and the element in the window linked to it. */
    private _tilesetsByViews: Record<TilesetView, Array<{ tileset: Spritesheet, element: HTMLElement }>> = {
        all: [], // virtual
        core: [],
        user: []
    };

    constructor() {
        store.tileWindow.set(this);

        const container = makeContainer(["tile-selection-window"]);
        this._element = container;

        const containerTogglable = new Togglable(container);
        this._togglable = containerTogglable;

        // relay to the gui
        // eventTogglable.toggle.on(({ togglable, toggleState, causedBy }) => {
        //     if (togglable !== containerTogglable)
        //         return;

        //     event.gui.tile_window.toggled.emit(causedBy, { toggleState });
        // })

        const header = make(`<div class="header"></div>`);

        const headerText = make(`<span class="header-text">TILE SELECTION</span>`);

        const windowCloseButton = make(`<button class="close-button no-make-style"></button>`) as HTMLButtonElement;
        for (let i = 0; i < 3; i++) {
            windowCloseButton.append(
                make(`<span class="chevron"></span>`)
            );
        };
        windowCloseButton.addEventListener('click', () => {
            containerTogglable.toggleOff(windowCloseButton);
        });

        header.append(
            headerText,
            windowCloseButton
        )


        const sidebar = make(`<div class="sidebar"></div>`);
        const sidebarFolders = make(`<div class="sidebar-folders"></div>`);

        sidebarFolders.append(
            ...this.makeFolderButtons()
        );

        const sidebarUpload = make(`<div class="sidebar-upload"></div>`);
        sidebarUpload.append(
            this.makeUploadButton()
        )

        sidebar.append(
            sidebarFolders,
            sidebarUpload
        )

        const explorer = make(`<div class="explorer"></div>`);
        this._explorer = explorer;

        event.gui.gui_built__persisting.on(() => {
            // do some mathing on live gui once it's out
            const explorerClientSizeWithPAd = getElementClientSizeWithPad(explorer!);
            const rootEl = document.querySelector(':root') as HTMLHtmlElement;
            rootEl.style.setProperty(tswExpCalculatedWidthCssVarName, explorerClientSizeWithPAd.w + "px");
        })


        for (const ssMeta of ssMetadata) {
            const labelWrapping = make(`<label class="tileset-label-wrapping" ${tilesetDataAttrTilesetName}=${ssMeta.ssName}></label>`);
            const imgPlaceholder = make(`<div class="${tilesetClassTilesetPlaceholder}"></div>`);
            labelWrapping.append(
                imgPlaceholder,
                make(`<span class="label">${ssMeta.ssName}</span>`),
            );

            explorer.append(labelWrapping);
        }

        event.gui.first_tileset_set__persisting.on(({ tileset }) => {
            tilesetViews.core = [tileset];

            this.selectTileset(tileset, { scrollTo: true });
        });

        event.gui.core_tilesets_loaded__persisting.on(({ tilesets }) => {
            tilesetViews.core = tilesets;
            this.repopulateExplorerTileGroupView(tilesets);
        });

        container.append(
            header,
            sidebar,
            explorer
        );

        tileWindow = container;
        document.body.append(container);
    }

    /**
     * Populates specified view with tilesets, creating new elements in the window.
     * @param view 
     * @param tilesets 
     * @param clearView Whether to clear the view before populating it.
     */
    private populateView(view: TilesetView, tilesets: Spritesheet[], clearView: boolean = false): void {
        if (clearView)
            this.clearView(view);

        for (const tileset of tilesets) {
            this._tilesetsByViews[view].push({
                tileset: tileset,
                element: 
            })

        }
    }

    /**
     * Clears specified view. If explorer is on that view, clears it too.
     * @param view View to clear.
     */
    private clearView(view: TilesetView): void {
        this._tilesetsByViews[view].length = 0;
        if (this._activeView === view)
            this.clearExplorer();
    }

    /**
     * Clears explorer, removing all displayed elements.
     */
    private clearExplorer() {
        this._explorer.innerHTML = '';
    }

    /**
     * Creates a tileset card element to be displayed in the explorer.
     */
    private makeTilesetCard(tileset: Spritesheet): HTMLElement {
        const labelWrappingEl = make(`<label class="tileset-label-wrapping" ${tilesetDataAttrTilesetName}=${tileset.name}></label>`) as HTMLElement;

        const tilesetImgEl = make(`<img draggable="false" class="tileset" src="${tileset.imageUrl}">`);
        if ()
            tilesetImgEl.addEventListener('click', () => selectTilesetEl(labelWrappingEl));

        labelWrappingEl.append(
            tilesetImgEl,
            make(`<span class="label">${tileset.name}</span>`),
        );


    }

    private makeFolderButtons(): HTMLButtonElement[] {
        const folderAllBtn = makeToggleButton(['folder', 'no-make-style'], 'all');
        const folderCoreBtn = makeToggleButton(['folder', 'no-make-style'], 'core');
        const folderUploadsBtn = makeToggleButton(['folder', 'no-make-style'], 'my uploads');

        const viewToButtonMap: Record<TilesetView, HTMLButtonElement> = {
            all: folderAllBtn,
            core: folderCoreBtn,
            user: folderUploadsBtn
        }

        // select default group
        toggleButton(viewToButtonMap[selectedTilesetGroup], true);

        for (const [viewGroupUntyped, button] of Object.entries(viewToButtonMap)) {
            const viewGroup = viewGroupUntyped as keyof typeof viewToButtonMap;

            onToggleButtonToggle(button, (_, toggleState) => {
                if (toggleState) {
                    selectedTilesetGroup = viewGroup;

                    if (button === folderAllBtn) {
                        // special mode, select alL!
                        repopulateExplorerTileGroupView(Object.values(tilesetViews).flat());
                    } else {
                        repopulateExplorerTileGroupView(tilesetViews[viewGroup]);
                    }
                }
            });
        }

        // // handle external changes to the view
        // addListenerGuiEventTileSelectionWindowTilesetViewChanged(data => {
        //     if (data.changedComponent !== 'view-button') {
        //         const btn = viewToButtonMap[data.newTilesetGroup];
        //         setToggleButtonToggle(btn, true);
        //     }
        // });

        const btns = [
            folderAllBtn,
            folderCoreBtn,
            folderUploadsBtn
        ];

        bindExclusiveSelectionToToggleButtons(btns);



        return btns;
    }

    private makeUploadButton(): HTMLElement {
        const input = make(`<input type="file" accept="image/png">`);
        const labelWrapping = make(`<label></label>`);
        labelWrapping.append(input);
        labelWrapping.append(
            make(`<span><span class="bracket">&gt;</span> UPLOAD <span class="bracket">&lt;</span>`)
        );

        return labelWrapping;
    }

    // selectTileset(wrappingLabelEl: HTMLElement): void {
    //     if (selectedTilesetWrappingEl)
    //         selectedTilesetWrappingEl.classList.remove(tilesetClassSelected);

    //     selectedTilesetWrappingEl = wrappingLabelEl;
    //     selectedTilesetWrappingEl.classList.add(tilesetClassSelected);

    //     const ssName = wrappingLabelEl.getAttribute(tilesetDataAttrTilesetName);
    //     if (!ssName) {
    //         console.error(wrappingLabelEl);
    //         throw new Error("failed to select a tileset element in tileset select window: tileset name data attribute not set (see above)");
    //     }

    //     let ss: Spritesheet | undefined = undefined;
    //     for (const tilesetGroup of Object.values(tilesetViews)) {
    //         ss = tilesetGroup.find(ss => ss.name === ssName);

    //         if (ss)
    //             break;
    //     }

    //     if (!ss) {
    //         console.error(wrappingLabelEl);
    //         throw new Error("failed to select a tileset element in tileset select window: no matching tileset was found (see above)");
    //     }

    //     actionMap!.selectTileset(wrappingLabelEl, ss);
    // }

    /**
     * Selects tileset in the current view. If view doesn't have this tileset, does nothing.
     * @param tileset 
     */
    selectTileset(
        tileset: Spritesheet,
        {
            scrollTo = false
        }: Partial<{
            /** Whether to scroll to the tileset element. @default false */
            scrollTo: boolean
        }> = {}
    ): void {
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
        if (scrollTo) {
            explorer!.scrollTop = selectedTilesetWrappingEl!.offsetTop
                + selectedTilesetWrappingEl!.offsetHeight / 2
                - explorer!.clientHeight / 2;
        }
    }

    /**
     * Searches for a selected tileset element in the current view.
     * If none are found (ie selection is in another view group), returns null.
     */
    private findSelectedTilesetElFromView(): HTMLButtonElement | null {
        // todo: store children separatly so we dont have to make an array on each selection
        const matchingWrappingLabelEl = [...explorer!.children].find(el => {
            return isToggleButtonToggledOn(el as HTMLButtonElement);
        });

        return (matchingWrappingLabelEl as HTMLButtonElement) ?? null;
    }

    private repopulateExplorerTileGroupView(spritesheets: Spritesheet[]): void {
        // if (!explorer)
        //     throw new Error("failed to change explorer view: explorer is not initialized yet");

        // // get currently selected tileset, if any
        // const selectedTilesetEl = findSelectedTilesetElFromView();
        // const selectedTileset =

        //     // remove all child nodes
        //     explorer.innerHTML = '';

        // // repopulate
        // for (const tileset of spritesheets) {
        //     const labelWrappingEl = make(`<label class="tileset-label-wrapping" ${tilesetDataAttrTilesetName}=${tileset.name}></label>`) as HTMLElement;

        //     const tilesetImgEl = make(`<img draggable="false" class="tileset" src="${tileset.imageUrl}">`);
        //     if ()
        //         tilesetImgEl.addEventListener('click', () => selectTilesetEl(labelWrappingEl));

        //     labelWrappingEl.append(
        //         tilesetImgEl,
        //         make(`<span class="label">${tileset.name}</span>`),
        //     );

        //     explorer.append(labelWrappingEl);
        // }
    }

    isTilesetSelectionWindowOpen(): boolean {
        return tileWindow
            ? tileWindow.classList.contains(tileSelectionWindowClassActive)
            : false;
    }
}

// function toggleTileSelectionWindow(causedBy: unknown, toggleState: boolean): void {
//     let isFirstTimeToggling = false;

//     if (!tileWindow) {
//         isFirstTimeToggling = true;
//         makeTileSelectionWindow();
//     }

//     const toggleFn = () => {
//         if (toggleState)
//             tileWindow!.classList.add(tileSelectionWindowClassActive);
//         else
//             tileWindow!.classList.remove(tileSelectionWindowClassActive);

//         event.gui.tile_window.toggled.emit(tileWindow, { toggleState })
//     }

//     // add a small delay so that when the element is first added, the animation on class addition actually plays
//     if (isFirstTimeToggling)
//         setTimeout(toggleFn, 10);
//     else
//         toggleFn();
// }