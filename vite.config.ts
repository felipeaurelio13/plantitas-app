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
    // 🚨 EMERGENCY FIX: Solo legacy bundles para máxima compatibilidad iPhone 12
    legacy({
      // Targets ultra conservadores para iPhone 12 y anteriores
      targets: [
        'iOS >= 10',
        'Safari >= 10', 
        'Chrome >= 60',
        'Firefox >= 60',
        'Edge >= 15',
        'and_chr >= 60',
        'and_ff >= 60',
        'samsung >= 7'
      ],
      
      // CRÍTICO: Solo legacy bundles, SIN modern chunks
      renderModernChunks: false,
      renderLegacyChunks: true,
      
      // Polyfills automáticos más agresivos
      polyfills: true,
      
      // Polyfills adicionales esenciales
      additionalLegacyPolyfills: [
        'regenerator-runtime/runtime',
        'core-js/es6/promise',
        'core-js/es6/object',
        'core-js/es6/array'
      ],
      
      // SystemJS incluido para máxima compatibilidad
      externalSystemJS: false
    }),
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
      // Target ultra conservador para máxima compatibilidad
      target: 'es5',
      minify: 'terser', // Terser es más compatible que esbuild
      sourcemap: false,
      modulePreload: false, // Desactivar module preload
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