import { makeToggleButton } from '$lib/gui/buttons/toggleButton';
import { makeContainer } from '$lib/gui/containers/container';
import { eventTogglable, Togglable } from '$lib/gui/lib/Togglable';
import { getElementClientSizeWithPad } from '$lib/gui/lib/utils/getElementClientSizeWithPad';
import { make } from '$lib/gui/make';
import { Notification } from '$lib/gui/notifications/Notification';
import { eventSpritesheet, Spritesheet } from '$lib/Spritesheet';
import { event, store } from '$preset';
import path from 'path-browserify-esm';

const tilesetClassPlaceholder = "placeholder";
const tswExpCalculatedWidthCssVarName = "--tsw-exp-calculated-width";

export type ViewGroup =
    "all"
    | "core"
    | "user";

export type TilesetPair = {
    tileset: Spritesheet,
    element: HTMLElement
}

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

    private _activeView: ViewGroup = 'core';

    /** Maps views to tilesets within them. Each entry contains a tileset and the element in the window linked to it. */
    private _tilesetsByViews: Record<ViewGroup, TilesetPair[]> = {
        all: [], // virtual
        core: [],
        user: []
    };

    /**
     * Maps views to the folder buttons.
     */
    private _viewToViewButtonMap: Record<ViewGroup, HTMLButtonElement | null> = {
        all: null,
        core: null,
        user: null
    }

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
            ...this.makeViewButtons()
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

        this.populateViewGroup('core', store.coreSpritesheets.get());
        this.selectExplorerView('core');

        event.gui.gui_built__persisting.on(() => {
            // do some mathing on live gui once it's out
            const explorerClientSizeWithPAd = getElementClientSizeWithPad(explorer!);
            const rootEl = document.querySelector(':root') as HTMLHtmlElement;
            rootEl.style.setProperty(tswExpCalculatedWidthCssVarName, explorerClientSizeWithPAd.w + "px");
        });


        container.append(
            header,
            sidebar,
            explorer
        );
    }

    isOpen(): boolean {
        return Togglable.with(this.element).toggleState;
    }

    /**
     * Selects tileset, switching views if needed.
     * @param tileset Tileset to select.
     * @param tilesetCard Tileset card element linked to specified tileset. If `null`, will be searched for automatically.
     */
    selectTileset(
        tileset: Spritesheet,
        tilesetCard: HTMLElement | null,
        {
            scrollTo = false
        }: Partial<{
            /** Whether to scroll to the tileset element. @default false */
            scrollTo: boolean
        }> = {}
    ): void {
        store.brush.get().setTileset(tileset);

        if (!tilesetCard) {
            tilesetCard = this.findTilesetPairUsingTileset(tileset)?.element ?? null;

            if (!tilesetCard)
                return;
        }

        Togglable.with(tilesetCard).toggleOn(tilesetCard);

        if (scrollTo && this.isTilesetCardInCurrentView(tilesetCard))
            this.scrollTo(tilesetCard);
    }

    /**
     * Populates specified view with tilesets, creating new elements in the window.
     * @param view 
     * @param tilesets 
     * @param emptyOutFirst Whether to clear the view before populating it.
     */
    private populateViewGroup(view: ViewGroup, tilesets: Spritesheet[], emptyOutFirst: boolean = false): void {
        if (emptyOutFirst)
            this.clearViewGroup(view);

        for (const tileset of tilesets) {
            this._tilesetsByViews[view].push({
                tileset: tileset,
                element: this.makeTilesetCard(tileset)
            })
        }

        if (view === this._activeView)
            this.selectExplorerView(view);

        Togglable.bindTogglablesToExclusiveToggleOnState(
            this.getAllViewsTilesets().map(e => e.element),
            {
                keepOneToggled: true
            }
        );
    }

    /**
     * Clears specified view group.
     * iF explorer is currently displaying that group, clears it too.
     */
    private clearViewGroup(view: ViewGroup): void {
        this._tilesetsByViews[view].length = 0;
        if (this._activeView === view)
            this.clearExplorerView();
    }

    /**
     * Selects explorer view and populates explorer.
     */
    private selectExplorerView(view: ViewGroup): void {
        this.clearExplorerView();

        this._activeView = view;
        if (view === 'all') {
            this._explorer.append(
                ...this.getAllViewsTilesets().map(e => e.element)
            )
        } else {
            this._explorer.append(
                ...this._tilesetsByViews[this._activeView].map(e => e.element)
            );
        }

        Togglable.with(this._viewToViewButtonMap[this._activeView]!)
            .toggleOn(this);
    }

    /**
     * Clears current explorer view, removing all displayed elements.
     */
    private clearExplorerView(): void {
        this._explorer.innerHTML = '';
    }

    /**
     * Returns all tilesets under all views.
     */
    private getAllViewsTilesets(): TilesetPair[] {
        return Object.values(this._tilesetsByViews).flat();
    }

    /**
     * Creates a tileset card element to be displayed in the explorer.
     */
    private makeTilesetCard(tileset: Spritesheet): HTMLElement {
        const labelWrappingEl = make(`<label class="tileset-label-wrapping"></label>`) as HTMLElement;

        const tilesetImgEl = make(`<img draggable="false" class="tileset" src="${tileset.imageUrl}">`) as HTMLImageElement;
        if (tileset.isLoaded)
            tilesetImgEl.classList.add(tilesetClassPlaceholder)

        eventSpritesheet.loaded.on((e) => {
            if (!e.spritesheet.isEqual(tileset))
                return;

            tilesetImgEl.classList.remove(tilesetClassPlaceholder);
            tilesetImgEl.src = e.imageUrl;
        });

        tilesetImgEl.addEventListener('click', () => this.selectTileset(tileset, labelWrappingEl));


        labelWrappingEl.append(
            tilesetImgEl,
            make(`<span class="label">${tileset.name}</span>`),
        );

        return labelWrappingEl;
    }

    /**
     * Creates view buttons to use in sidebar.
     * @returns 
     */
    private makeViewButtons(): HTMLButtonElement[] {
        const [folderAllBtn] = makeToggleButton(['folder', 'no-make-style'], 'all');
        const [folderCoreBtn] = makeToggleButton(['folder', 'no-make-style'], 'core');
        const [folderUploadsBtn] = makeToggleButton(['folder', 'no-make-style'], 'my uploads');

        const btns = [
            folderAllBtn,
            folderCoreBtn,
            folderUploadsBtn
        ];

        Togglable.bindTogglablesToExclusiveToggleOnState(btns, { keepOneToggled: true });

        folderCoreBtn.click();

        this._viewToViewButtonMap = {
            all: folderAllBtn,
            core: folderCoreBtn,
            user: folderUploadsBtn
        }

        for (const [_view, button] of Object.entries(this._viewToViewButtonMap)) {
            const view = _view as keyof typeof this._viewToViewButtonMap;

            eventTogglable.toggle.on(({ toggleState, element }) => {
                if (element === button && toggleState)
                    this.selectExplorerView(view);
            })
        }

        return btns;
    }

    /**
     * Create upload button to use in sidebar.
     * @returns
     */
    private makeUploadButton(): HTMLElement {
        const input = make(`<input type="file" accept="image/png" multiple>`) as HTMLInputElement;
        const labelWrapping = make(`<label></label>`);
        labelWrapping.append(input);
        labelWrapping.append(
            make(`<span><span class="bracket">&gt;</span> UPLOAD <span class="bracket">&lt;</span>`)
        );

        input.addEventListener('change', async (e) => {
            if (!input.files)
                return;

            this.selectExplorerView('user');

            let hasSelectedSsAfterLoad = false;
            for (const file of input.files) {
                const ssUploadRes = await this.uploadTilesetFromDisk(file);
                if (!ssUploadRes)
                    continue;

                switch (ssUploadRes.status) {
                    case 'CREATED':
                        // new spritesheet has been created
                        if (!hasSelectedSsAfterLoad) {
                            this.selectTileset(ssUploadRes.ss, null, { scrollTo: true });
                            hasSelectedSsAfterLoad = true;
                        }
                        break;
                    case 'MODIFIED':
                        // existing spritesheet has been modified, and it is the return value
                        if (!hasSelectedSsAfterLoad) {
                            this.selectTileset(ssUploadRes.ss, null, { scrollTo: true });
                            hasSelectedSsAfterLoad = true;
                        }

                        break;
                    case 'UNMODIFIED':
                        // existing spritesheet was found but not modified, and it is the return value.
                        if (!hasSelectedSsAfterLoad) {
                            this.selectTileset(ssUploadRes.ss, null, { scrollTo: true });
                            hasSelectedSsAfterLoad = true;
                        }

                        break;
                }



            }
        })

        // input.addEventListener('cancel', e => {
        //     console.log("cancel!");
        // })

        return labelWrapping;
    }

    private async uploadTilesetFromDisk(file: File): Promise<null | {
        status: 'CREATED' | 'MODIFIED' | 'UNMODIFIED'
        ss: Spritesheet
    }> {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        const fileDataURL = await new Promise<typeof reader.result>((resolve, reject) => {
            reader.addEventListener('load', () => resolve(reader.result));
            reader.addEventListener('abort', e => reject(e));
            reader.addEventListener('error', e => reject(e));
        });

        if (typeof fileDataURL !== 'string') {
            new Notification('error',
                "Failed to upload a spritesheet",
                `Unexpected file data type '${typeof fileDataURL}' for file '${file.name}'`
            ).dispatch();

            console.error(fileDataURL);
            return null;
        }

        const ss = new Spritesheet(path.parse(file.name).name, fileDataURL);
        const existingTilesetSameNameDifferentImage = this.getAllViewsTilesets()
            .find(e => e.tileset.name === ss.name)
            ?.tileset;

        if (existingTilesetSameNameDifferentImage) {
            // update existing tileset instead
            existingTilesetSameNameDifferentImage.setImageUrl(ss.imageUrl);
            await existingTilesetSameNameDifferentImage.load();

            return existingTilesetSameNameDifferentImage.isLoaded
                ? {
                    status: 'MODIFIED',
                    ss: existingTilesetSameNameDifferentImage
                }
                : null;
        }

        const existingTilesetSameNameSameImage = this.getAllViewsTilesets()
            .find(e => e.tileset.name === ss.name)
            ?.tileset;

        if (existingTilesetSameNameSameImage)
            // same tileset already exists, return it instead.
            return {
                status: 'UNMODIFIED',
                ss: existingTilesetSameNameSameImage
            };

        // proceed with load
        await ss.load();

        // is loaded = success
        if (ss.isLoaded) {
            this.populateViewGroup('user', [ss]);
            return {
                status: 'CREATED',
                ss: ss
            };
        } else {
            return null;
        }
    }

    /**
     * Scroll to specified tileset card in current view. If current view doesn't have this card, does nothing.
     * @param tilesetCard Sc
     */
    private scrollTo(tilesetCard: HTMLElement) {
        if (this.isTilesetCardInCurrentView(tilesetCard))
            this._explorer.scrollTop = tilesetCard.offsetTop
                + tilesetCard.offsetHeight / 2
                - this._explorer.clientHeight / 2;
    }

    /**
     * Searches for a tileset pair using a tileset.
     * If none found, returns `null`.
     * @param tileset
     */
    private findTilesetPairUsingTileset(tileset: Spritesheet): TilesetPair | null {
        const match = this.getAllViewsTilesets()
            .find(e => e.tileset.isEqual(tileset));

        return match ?? null;
    }

    /**
     * Checks whether a tileset card is in the current view.
     */
    private isTilesetCardInCurrentView(tilesetCard: HTMLElement): boolean {
        const match = this._tilesetsByViews[this._activeView]
            .find(e => e.element === tilesetCard);

        return !!match;
    }
}