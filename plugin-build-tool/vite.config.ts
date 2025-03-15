import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // React support for JSX/TSX
  build: {
    outDir: 'dist', // The directory where the built files will be placed 
    rollupOptions: {
      input: 'src/main.ts', // Main entry point of the plugin build
      external: ['react', 'react-dom'], // Excludes react and react-dom from the build (to prevent bundling)
      output: {
        entryFileNames: '[name].js', // Naming format for the output files
        assetFileNames: '[name].[ext]', // Naming format for assets like images and styles
        chunkFileNames: '[name]-[hash].js', // Ensure hashed chunk files
      },
    },
  },
  server: {
    port: 3000, // Default port for dev server
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // Make sure react and react-dom are included in dependencies optimization
  },
});
