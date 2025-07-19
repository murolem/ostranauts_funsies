import fs from 'fs-extra';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';
import { toOsPath } from '$utils/toOsPath';
import { loadJsonFilesRecursiveWithSchema } from '$utils/loadJsonFilesRecursive';
import { condOwnersOverlaysSchema } from '$schema/condOwnersOverlays';
import { installablesSchema } from '$src/schema/installables';
import { condOwnersSchema } from '$schema/condOwners';
import { tsvFormat } from 'd3-dsv';

const gameAssetsPath = "/home/aliser/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Ostranauts/Ostranauts_Data/StreamingAssets/";
const installablesFilepath = toOsPath(`${gameAssetsPath}/data/installables/installables.json`);
const cooverlaysDirpath = toOsPath(`${gameAssetsPath}/data/cooverlays`);
const condownersDirpath = toOsPath(`${gameAssetsPath}/data/condowners`);

const pathsToValidate = [
    installablesFilepath,
    cooverlaysDirpath
];
pathsToValidate.forEach((path, i) => {
    if (!fs.existsSync(path)) {
        throw new Error(`path doesn't exist (index ${i}): ` + path);
    }
});

const entities = [
    ...loadJsonFilesRecursiveWithSchema(condownersDirpath, condOwnersSchema).map(e => e.parsed),
    ...loadJsonFilesRecursiveWithSchema(cooverlaysDirpath, condOwnersOverlaysSchema).map(e => e.parsed),
].flat();

// ===========================

const installables = installablesSchema
    .parse(fs.readJsonSync(installablesFilepath));

type Entry = {
    installable_id: string,
    item_id: string,
    item_display_name: string
}
const installablesByBuildCat = installables.reduce<
    Record<string, Entry[]>
>((acc, e) => {
    let buildType = e.strBuildType;
    if (buildType === undefined || buildType === "") {
        // buildType = "_UNSPECIFIED_";
        return acc;
    }

    const installablesByBuildType = getObjPropOrCreate(acc, buildType, () => []);

    const installableId = e.strName;
    const itemId = e.strActionCO;
    const item = entities.find(e => e.strName === itemId);
    const itemNameFriendly = item?.strNameFriendly ?? item?.strNameShort ?? item?.strName ?? "<item not found>";
    installablesByBuildType.push({
        installable_id: installableId,
        item_id: itemId,
        item_display_name: itemNameFriendly
    });

    return acc;
}, {});

fs.writeJsonSync("out.json", installablesByBuildCat, { spaces: 4 });

const rows = Object.entries(installablesByBuildCat)
    .reduce<
        object[]
    >((acc, [type, entries]) => {
        for (const e of entries) {
            acc.push({
                type,
                ...e
            });
        }

        return acc;
    }, []);
const columns: string[] = [
    "Type",
    "Installable ID",
    "Item ID",
    "Item Display Name"
]

const tableFormatted = tsvFormat(rows);
fs.writeFileSync("out.tsv", tableFormatted);

// console.log(installables.length);

