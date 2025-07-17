import { deepCloneObjectUsingJson } from '$utils/deepCloneObjectUsingJson';
import { mergeJsonObjects } from '$utils/mergeJsonObjects';
import { toOsPath } from '$utils/toOsPath';
import fs from 'fs-extra';
import { jsonSchemaToZod } from "json-schema-to-zod";
import { format as formatScriptStr } from "prettier";
import { createSchema as createJsonSchema } from 'genson-js';
import { assertValueNotUndefinedPassthrough } from '$utils/assertValueNotUndefined';
import { ensureDirectoryExistsAndEmpty } from '$utils/ensureDirectoryExistsAndEmpty';
import { Logger } from '$logger';
import chalk from 'chalk';
const logger = new Logger("generate_schema");
const { logDebug, logInfo, logWarn, logFatal } = logger;

const args = process.argv.slice(2);
const schemaName = assertValueNotUndefinedPassthrough(args[0]);
const schemaFilepath = assertValueNotUndefinedPassthrough(args[1]);

ensureDirectoryExistsAndEmpty('temp');

const outputSchemaJsonFilepath = toOsPath(`temp/schema_${schemaName}_json.json`);
const outputSchemaZodFilepath = toOsPath(`temp/schema_${schemaName}_zod.ts`);
const outputSchemaZodFilepath2 = toOsPath(`src/schema/${schemaName}.ts`);
if (!fs.existsSync(schemaFilepath)) {
    throw new Error("no schema found at: " + schemaFilepath);
}

logInfo(chalk.bold("loading data from:\n") + schemaFilepath)
const data = fs.readJsonSync(schemaFilepath);

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
