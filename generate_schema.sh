#!/bin/bash

rm -rf temp
mkdir temp
generate-schema -g $2 > ./temp/schema_$1_raw.json
tsx ./src/generate_schema.ts $1