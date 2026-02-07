import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/main.ts'],
    format: ['esm'],
    splitting: true,
    sourcemap: true,
    clean: true,
    esbuildPlugins: [
        {
            name: 'alias-gsap-to-foundry',
            setup(build) {
                build.onResolve({ filter: /^gsap$/ }, () => {
                    return {
                        path: '/scripts/greensock/esm/all.js',
                        external: true,
                    };
                });
            },
        },
    ],
});
