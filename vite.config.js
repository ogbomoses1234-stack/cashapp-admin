import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        strictPort: false,
        proxy: {
            '/api': {
                target: 'http://localhost:5001',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    esbuild: {
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
        minify: 'esbuild',
        outDir: 'dist',
        sourcemap: false,
        target: 'es2020',
        allowedHosts: ['.trycloudflare.com'],
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    charts: ['recharts'],
                },
            },
        },
    },
});
