import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host:true so phones on the same WiFi can reach the dev server via LAN IP
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
})
