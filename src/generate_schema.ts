import { deepCloneObjectUsingJson } from '$src/utils/deepCloneObjectUsingJson';
import { mergeJsonObjects } from '$src/utils/mergeJsonObjects';
import { toOsPath } from '$src/utils/toOsPath';
import fs from 'fs-extra';
import { jsonSchemaToZod } from "json-schema-to-zod";
import { format } from "prettier";

const args = process.argv.slice(2);
const schemaName = args[0] ?? "objSchema";
console.log(schemaName);

const rawSchemaFilepath = toOsPath(`temp/schema_${schemaName}_raw.json`);
const outputSchemaJsonFilepath = toOsPath(`temp/schema_${schemaName}_json.json`);
const outputSchemaZodFilepath = toOsPath(`temp/schema_${schemaName}_zod.ts`);
const outputSchemaZodFilepath2 = toOsPath(`src/schema/${schemaName}.ts`);
if (!fs.existsSync(rawSchemaFilepath)) {
    throw new Error("no schema found at: " + rawSchemaFilepath);
}
const data = fs.readJsonSync(rawSchemaFilepath);

let dataAsArr = [];
let i = 0;
while (true) {
    const entry = data[i.toString()];
    if (!entry) {
        break;
    }

    dataAsArr.push(entry);

    i++;
}

if (dataAsArr.length === 0) {
    throw new Error("empty array");
}

let encounteredProperties: Set<string> = new Set();
let optionalProperties: Set<string> = new Set();
let res = deepCloneObjectUsingJson(dataAsArr[0]) as object;
for (let i = 1; i < dataAsArr.length; i++) {
    const entry = dataAsArr[i];

    // add any extra props to found ones 
    for (const [key, value] of Object.entries(entry)) {
        if (!(key in encounteredProperties)) {
            encounteredProperties.add(key);
        }
    }

    // remember missing props
    const keys = Object.keys(entry);
    const missingProps = [...encounteredProperties].filter(key => !keys.includes(key));
    missingProps.forEach(prop => optionalProperties.add(prop));

    res = mergeJsonObjects(res, dataAsArr[i]);
}

res = {
    type: 'object',
    properties: deepCloneObjectUsingJson(res),
    required: [...encounteredProperties].filter(prop => !optionalProperties.has(prop))
}

fs.writeJsonSync(outputSchemaJsonFilepath, res, { spaces: 4 });

const asZodSchemaStr = jsonSchemaToZod(res, {
    name: schemaName + "Schema",
    type: schemaName[0].toUpperCase() + [...schemaName].slice(1).join("") + "Schema",
    module: 'esm',
});
const asZodSchemaFormatted = await format(asZodSchemaStr, { parser: "typescript" });
fs.writeFileSync(outputSchemaZodFilepath, asZodSchemaFormatted);
fs.writeFileSync(outputSchemaZodFilepath2, asZodSchemaFormatted);

