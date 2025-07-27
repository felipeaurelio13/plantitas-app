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
      jsxRuntime: 'automatic'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['plant-icon.svg', 'manifest.json'],
      manifest: {
        name: 'Plant Care Companion - Firebase Edition',
        short_name: 'PlantApp',
        description: 'Tu asistente IA para el cuidado de plantas con Firebase',
        theme_color: '#22c55e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/plantitas-app/',
        icons: [
          {
            src: 'plant-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: false
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  define: {
    'process.env': process.env,
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-switch', '@radix-ui/react-tabs', 'lucide-react'],
          utils: ['zustand', 'immer', 'date-fns'],
        },
      },
      external: (id) => {
        // Don't bundle test files
        return id.includes('test') || id.includes('spec');
      },
    },
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
  },

  server: {
    port: 3000,
    host: true,
    open: true,
  },

  preview: {
    port: 4173,
    host: true,
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.github'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'dist/',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'zustand',
      'immer',
    ],
    exclude: ['firebase-admin'],
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'esnext',
    format: 'esm',
  },
});