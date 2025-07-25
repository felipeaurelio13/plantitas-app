/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

export default defineConfig({
  base: '/plantitas-app/',
  plugins: [
    react(),
    // Legacy support temporalmente deshabilitado para debugging
    // legacy({
    //   targets: ['iOS >= 13', 'Safari >= 13'],
    //   additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    //   renderLegacyChunks: true,
    //   polyfills: [
    //     'es.promise.finally',
    //     'es.array.flat',
    //     'es.array.flat-map',
    //     'es.object.from-entries',
    //     'es.string.match-all'
    //   ]
    // }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['plant-icon.svg', 'manifest.json'],
      manifest: {
        name: 'Plant Care Companion',
        short_name: 'PlantApp',
        description: 'Tu asistente IA para el cuidado de plantas',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'plant-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
    visualizer({ 
      open: false, // No abrir automáticamente en build
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
      target: ['es2018', 'safari13'], // iOS compatibility direct
      minify: 'esbuild',
      sourcemap: false,
      modulePreload: { polyfill: true },
      rollupOptions: {
        output: {
          // Optimización de chunks
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Configuraciones de optimización
    chunkSizeWarningLimit: 1000, // 1MB warning limit
  },
  // Optimizaciones del dev server
  server: {
    hmr: {
      overlay: false, // Menos intrusivo en desarrollo
    },
  },
  // Optimizaciones de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'zustand',
    ],
    exclude: ['@supabase/auth-ui-react'], // Excluir deps que pueden causar problemas
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
  },
});