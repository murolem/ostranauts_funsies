import { toOsPath } from '$utils/toOsPath';

export const gameAssetsPath = "/home/aliser/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Ostranauts/Ostranauts_Data/StreamingAssets/";

export const imagesDirpath = toOsPath(`${gameAssetsPath}/images`);

/** list of visual and grid placement rules for condition owners to use. */
export const itemsDirpath = toOsPath(`${gameAssetsPath}/items`);

/** list of rules for installing/uninstalling/scrapping objects */
export const installablesMainFilepath = toOsPath(`${gameAssetsPath}/data/installables/installables.json`);

/** condition owners that are variations of existing, basic ones. All of the special walls, floors, etc. */
export const condOwnersOverlaysDirpath = toOsPath(`${gameAssetsPath}/data/cooverlays`);

/** templates for objects in game (including people). Like nouns the game uses. */
export const condOwnersDirpath = toOsPath(`${gameAssetsPath}/data/condowners`);