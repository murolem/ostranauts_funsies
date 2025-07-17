import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { jsonSchemaToZod } from "json-schema-to-zod";
import { format as formatScriptStr } from "prettier";
import { createSchema as createJsonSchema } from 'genson-js';
import { assertValueNotUndefinedPassthrough } from '$utils/assertValueNotUndefined';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import { Logger } from '$logger';
import chalk from 'chalk';
import path from 'path';
import { readFilesRecursive } from '$utils/readFilesRecursive';
const logger = new Logger("generate_schema");
const { logDebug, logInfo, logWarn, logFatal } = logger;

const args = process.argv.slice(2);
const schemaName = assertValueNotUndefinedPassthrough(args[0]);
const dataPath = assertValueNotUndefinedPassthrough(args[1]);

ensureDirectoryExistsAndEmpty('temp');

const outputSchemaJsonFilepath = toOsPath(`temp/schema_${schemaName}_json.json`);
const outputSchemaZodFilepath = toOsPath(`temp/schema_${schemaName}_zod.ts`);
const outputSchemaZodFilepath2 = toOsPath(`src/schema/${schemaName}.ts`);
if (!fs.existsSync(dataPath)) {
    throw new Error("data path not found: " + dataPath);
}

const dataFilepaths: string[] = [];
if (fs.statSync(dataPath).isDirectory()) {
    logInfo(`${chalk.bold("DIRECTORY")} loading mode`);

    dataFilepaths.push(
        ...readFilesRecursive(dataPath)
            .filter(p => p.toLocaleLowerCase().endsWith('.json'))
            .map(p => path.join(dataPath, p))
    );
} else {
    logInfo(`${chalk.bold("FILE")} loading mode`);

    dataFilepaths.push(dataPath);
}

if (dataFilepaths.length === 0) {
    logFatal({ msg: "found no datapaths to loads", throw: true });
}

let data: unknown[] = [];
for (const filepath of dataFilepaths) {
    logInfo("loading: " + filepath);

    const loaded = fs.readJsonSync(filepath);
    if (!Array.isArray(loaded)) {
        logFatal({
            msg: "encountered a JSON file that contains something other than an array. found type: " + typeof loaded,
            throw: true,
            data: {
                relFilepath: filepath,
                filepath
            }
        });
        throw ''//type guard
    }

    data.push(loaded);
}

if (data.length === 0) {
    logFatal({ msg: "no data loaded", throw: true });
}

data = data.flat();

// ========================

const jsonSchema = createJsonSchema(data);
fs.writeJsonSync(outputSchemaJsonFilepath, jsonSchema, { spaces: 4 });
logInfo(chalk.bold("JSON schema generated at:\n") + outputSchemaJsonFilepath);

const asZodSchemaStr = jsonSchemaToZod(jsonSchema, {
    name: schemaName + "Schema",
    type: schemaName[0].toUpperCase() + [...schemaName].slice(1).join("") + "Schema",
    module: 'esm',
});
const asZodSchemaFormatted = await formatScriptStr(asZodSchemaStr, { parser: "typescript" });
fs.writeFileSync(outputSchemaZodFilepath, asZodSchemaFormatted);
fs.writeFileSync(outputSchemaZodFilepath2, asZodSchemaFormatted);

logInfo(chalk.bold("zod schema saved to:\n") + outputSchemaZodFilepath2)
