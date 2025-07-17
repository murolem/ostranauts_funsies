import fs from 'fs-extra';
import { unknown, z } from 'zod';
import path from 'path';
import { getObjPropOrCreate } from '$utils/getObjPropOrCreate';
import { toOsPath } from '$utils/toOsPath';
import { readFilesRecursive } from '$utils/readFilesRecursive';
import { loadJsonFilesRecursiveWithSchema } from '$utils/loadJsonFilesRecursive';
import { cooverlaysSchema } from '$src/schema/cooverlays';
import { installablesSchema } from '$src/schema/installables';

const gameAssetsPath = "/home/aliser/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Ostranauts/Ostranauts_Data/StreamingAssets/";
const installablesFilepath = toOsPath(`${gameAssetsPath}/data/installables/installables.json`);
const cooverlaysDirpath = toOsPath(`${gameAssetsPath}/data/cooverlays`);

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
    ...loadJsonFilesRecursiveWithSchema(cooverlaysDirpath, cooverlaysSchema).map(e => e.parsed)
].flat();

// ===========================

const installables = installablesSchema
    .parse(fs.readJsonSync(installablesFilepath));

const installablesByBuildCat = installables.reduce<Record<string, any[]>>((acc, e) => {
    let buildType = e.strBuildType;
    if (buildType === undefined || buildType === "") {
        buildType = "_UNSPECIFIED_";
    }

    const installablesByBuildType = getObjPropOrCreate(acc, buildType, () => []);

    const installableId = e.strName;
    const itemId = e.strActionCO;
    const item = entities.find(e => e.strName === itemId);
    const itemNameFriendly = item?.strNameFriendly ?? "<item not found>";
    installablesByBuildType.push([
        installableId,
        itemId,
        itemNameFriendly
    ]);

    return acc;
}, {});

fs.writeJsonSync("out.json", installablesByBuildCat, { spaces: 4 });

// console.log(installables.length);

