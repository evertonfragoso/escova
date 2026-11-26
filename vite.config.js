import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  root: 'client',
  plugins: [svelte()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    // In dev, the browser talks to Vite; socket.io traffic goes to the game server
    proxy: { '/socket.io': { target: 'http://localhost:3000', ws: true } }
  }
})
