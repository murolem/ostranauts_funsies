import { condOwnersDirpath, condOwnersOverlaysDirpath, itemsDirpath } from '$preset';
import { condOwnersSchema } from '$schema/condOwners';
import { condOwnersOverlaysSchema } from '$schema/condOwnersOverlays';
import { itemsSchema } from '$schema/items';
import { loadJsonFilesRecursiveWithSchema } from '$utils/loadJsonFilesRecursive';

export type Loader<T> = () => T;

const loaders = {
    condOwners: () => loadJsonFilesRecursiveWithSchema(condOwnersDirpath, condOwnersSchema).flatMap(e => e.parsed),
    condOwnersOverlays: () => loadJsonFilesRecursiveWithSchema(condOwnersOverlaysDirpath, condOwnersOverlaysSchema).flatMap(e => e.parsed),
    items: () => loadJsonFilesRecursiveWithSchema(itemsDirpath, itemsSchema).flatMap(e => e.parsed)
} satisfies Record<string, Loader<any>>;

export default loaders;

