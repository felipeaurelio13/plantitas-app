/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/plantitas-app/',
  plugins: [
    react({
      // Use automatic JSX runtime but don't inject React globally
      jsxRuntime: 'automatic'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['plant-icon.svg', 'manifest.json'],
      manifest: {
        name: 'Plant Care Companion',
        short_name: 'PlantApp',
        description: 'Tu asistente IA para el cuidado de plantas - Firebase Integration',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/plantitas-app/',
        icons: [
          {
            src: 'plant-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'plant-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
    visualizer({ 
      open: false,
      filename: 'stats.html',
      gzipSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    // Skip type checking for faster builds
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          firebase: ['firebase'],
          ui: ['framer-motion', 'lucide-react'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
      // Handle dynamic imports and external dependencies
      external: [],
      onwarn(warning, warn) {
        // Suppress certain warnings
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // Dev server configuration
  server: {
    hmr: {
      overlay: false,
    },
    port: 5173,
    host: true,
  },
  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase',
      'framer-motion',
      'zustand',
    ],
    exclude: [],
  },
  // Testing configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
  },
  // TypeScript configuration override
  esbuild: {
    // Remove the React injection that was causing conflicts
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});