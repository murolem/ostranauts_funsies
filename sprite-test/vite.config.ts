import type { UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default {
    plugins: [
        tsconfigPaths()
    ],
    base: "https://murolem.github.io/ostranauts_funsies/sprite-test/app/",
    build: {
        outDir: 'app',
    }
} satisfies UserConfig;