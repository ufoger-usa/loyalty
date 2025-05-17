import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/loyalty/', // Ensure base path matches GitHub Pages repo name
  build: {
    outDir: 'dist', // Change output directory to 'dist' for GitHub Actions deployment
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor_firebase';
            }
            if (id.includes('react-dom')) {
              return 'vendor_react-dom';
            }
            // You could add more rules here for other large libraries
            // For example, qrcode.react if it's still part of a large chunk
            // if (id.includes('qrcode.react')) {
            //   return 'vendor_qrcode';
            // }
            // All other node_modules will fall into a default vendor chunk
            return 'vendor'; 
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    },
    chunkSizeWarningLimit: 300 // Reduce warning limit for chunk size
  }
})
