import fs from 'fs-extra';
import { z } from 'zod';
import { objSchema as installableSchema } from './schema/installable';
import { getObjPropOrCreate } from '$src/utils/getObjPropOrCreate';

type InstallableSchema = z.infer<typeof installableSchema>;

const installables_json_path = "/home/aliser/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/common/Ostranauts/Ostranauts_Data/StreamingAssets/data/installables/installables.json";

const installables = installableSchema.array()
    .parse(fs.readJsonSync(installables_json_path));

const installablesByBuildCat = installables.reduce<Record<string, any[]>>((acc, e) => {
    let buildType = e.strBuildType;
    if (buildType === undefined || buildType === "") {
        buildType = "_UNSPECIFIED_";
    }

    const installablesByBuildType = getObjPropOrCreate(acc, buildType, () => []);
    installablesByBuildType.push(e.strName);

    return acc;
}, {});

fs.writeJsonSync("out.json", installablesByBuildCat, { spaces: 4 });

// console.log(installables.length);

