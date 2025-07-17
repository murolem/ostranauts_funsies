import { readFilesRecursive } from '$utils/readFilesRecursive'
import type { ZodType } from 'zod'
import fs from 'fs-extra';
import path from 'path';
import { schemaParse } from '$utils/schemaParse';
import { z } from 'zod';

export type ResultEntry<T extends ZodType> = {
    filepath: string,
    relFilepath: string,
    // filename: string,
    // dirpath: string,
    // relDirpath: string,
    parsed: z.infer<T>
}

/** 
 * Searches for JSON files in directory recursively, parsing each of them using given schema. 
*/
export function loadJsonFilesRecursiveWithSchema<T extends ZodType>(pathStr: string, schema: T): ResultEntry<T>[] {
    const jsonFiles = readFilesRecursive(pathStr)
        .filter(relFilepath => relFilepath.toLocaleLowerCase().endsWith('.json'));

    const res: ResultEntry<T>[] = [];
    for (const relFilepath of jsonFiles) {
        const filepath = path.join(pathStr, relFilepath);
        const raw = fs.readJsonSync(filepath);

        res.push({
            filepath,
            relFilepath,
            parsed: schemaParse(schema, raw)
        });
    }

    return res;
}