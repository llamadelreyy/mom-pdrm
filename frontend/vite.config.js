import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/transcribe': 'http://localhost:5000',
      '/completion': 'http://localhost:5000',
      '/process_text': 'http://localhost:5000',
      '/minutes': 'http://localhost:5000',
      '/logout': 'http://localhost:5000',
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})