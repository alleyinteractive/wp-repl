import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                // Playground 3.1 has circular dynamic imports; without this Rollup folds the Inertia page into
                // the Playground chunk and the page drops out of the Vite manifest, so the homepage 500s.
                manualChunks: (id) => (/node_modules\/@(wp-playground|php-wasm)\//.test(id) ? 'playground' : undefined),
            },
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
