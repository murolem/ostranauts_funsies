import { readFilesRecursive } from '$utils/readFilesRecursive';
import path from 'path';
import fs from 'fs-extra';
import type { SpritesheetMetadata } from '$lib/Spritesheet';
import { toOsPath } from '$utils/toOsPath';

/*
Generates metadata needed for spritesheet discovery.
*/


const spritesheetsDirpath = toOsPath("public/spritesheets");

const metadata: SpritesheetMetadata[] = [];

const extensionLcWhitelist: string[] = [
    "png"
]

for (const relFilepath of readFilesRecursive(spritesheetsDirpath)) {
    const ext = path.parse(relFilepath).ext;
    const extLcNoDot = ext.slice(1).toLocaleLowerCase();
    if (!extensionLcWhitelist.includes(extLcNoDot))
        continue

    metadata.push({
        ssName: "Core_" + path.parse(relFilepath).name,
        relPath: relFilepath
    })
}

const saveTo = toOsPath("src/data/ss_metadata.json");
fs.writeJsonSync(saveTo, metadata, { spaces: 4 });