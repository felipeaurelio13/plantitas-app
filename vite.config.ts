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
    // Legacy support para iOS Safari 12+ y browsers antiguos - CONFIGURACIÓN 2025 
    legacy({
      // Targets optimizados para iPhone 12 (iOS 14+) y compatibilidad amplia
      targets: [
        'iOS >= 12',
        'Safari >= 12', 
        'Chrome >= 64',
        'Firefox >= 67',
        'Edge >= 79',
        'and_chr >= 64',
        'and_ff >= 67',
        'samsung >= 8.2'
      ],
      
      // Modern targets para browsers que soportan ESM pero no todas las features
      modernTargets: [
        'iOS >= 12',
        'Safari >= 12', 
        'Chrome >= 64',
        'Firefox >= 67',
        'Edge >= 79'
      ],
      
      // CRÍTICO: modernPolyfills=true para apps complejas (mejores prácticas 2025)
      modernPolyfills: true,
      
      // Polyfills automáticos para legacy browsers
      polyfills: true,
      
      // Polyfills adicionales para DOM APIs que necesitamos
      additionalLegacyPolyfills: [
        'regenerator-runtime/runtime'
      ],
      
      // También para modern browsers que puedan necesitar polyfills específicos
      additionalModernPolyfills: [
        'regenerator-runtime/runtime'
      ],
      
      // Configuraciones para máxima compatibilidad
      renderLegacyChunks: true,
      renderModernChunks: true,
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
      // Target será manejado por legacy plugin
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