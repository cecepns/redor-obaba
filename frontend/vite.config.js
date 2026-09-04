import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'obaba-logo.jpeg'],
      manifest: {
        name: 'Redor OBABA - Donor Darah Komunitas',
        short_name: 'Redor OBABA',
        description: 'Aplikasi Donor Darah Komunitas Redor OBABA: Pantau stok darah & hubungkan donor instan',
        theme_color: '#b91c1c',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'obaba-logo.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: 'obaba-logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg,jpg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
