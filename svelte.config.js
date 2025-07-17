import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Preprocess with Vite for TypeScript support
  preprocess: vitePreprocess(),
  
  // Compiler options for Svelte 4
  compilerOptions: {
    // Add any specific compiler options if needed
  }
} 