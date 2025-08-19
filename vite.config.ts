// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // ← alias @ -> /src
    },
  },
  build: {
    outDir: 'docs',        // si publicas con carpeta /docs en GitHub Pages
    sourcemap: true,
  },
  // base: '/NOMBRE_REPO/', // si el sitio se sirve en username.github.io/NOMBRE_REPO/
})


