import { defineConfig } from 'tsup';

// Bundle @larksuite/channel instead of leaving it to the installer: the fix in
// patches/ is applied by pnpm only, so `npm i -g` (registry or a release
// tarball) would otherwise get the unpatched copy. Its own dependencies are
// listed in package.json and stay external.
const noExternal = ['@larksuite/channel'];

export default defineConfig([
  {
    entry: { cli: 'src/cli/index.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    clean: true,
    sourcemap: false,
    splitting: false,
    dts: false,
    noExternal,
    // Inline the Vite-built console (src/ui/generated/index.html) as a string.
    esbuildOptions(options) {
      options.loader = { ...options.loader, '.html': 'text' };
    },
  },
  {
    entry: { index: 'src/index.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    sourcemap: false,
    splitting: false,
    dts: true,
    noExternal,
  },
]);
