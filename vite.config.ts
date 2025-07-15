/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
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
    visualizer({ open: true }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
  },
});