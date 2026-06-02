import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite legge le env var con prefisso definito in `envPrefix`.
// Manteniamo REACT_APP_* per compatibilità con i compose esistenti.
export default defineConfig({
  plugins: [react()],
  envPrefix: 'REACT_APP_',
  server: {
    port: 3000,
    host: true, // ascolta su 0.0.0.0 (necessario in container)
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'build', // mantieni 'build' così il Dockerfile non cambia
    sourcemap: true,
  },
});
