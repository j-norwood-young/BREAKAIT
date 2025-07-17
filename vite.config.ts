import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: 'docs', // Output to docs directory for GitHub Pages
    emptyOutDir: true, // Clear docs directory on each build
    rollupOptions: {
      output: {
        entryFileNames: 'game.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.indexOf('.css') !== -1) {
            return 'style.css'
          }
          return '[name].[ext]'
        }
      }
    }
  },
  base: './',
  publicDir: 'public'
}) 