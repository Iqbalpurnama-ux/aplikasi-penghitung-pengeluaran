import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Kash',
          short_name: 'Kash',
          description: 'Aplikasi Keuangan Kash',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('jspdf')) return 'vendor-pdf';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('@google/generative-ai')) return 'vendor-ai';
              return 'vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      host: true,
      port: 5173,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
