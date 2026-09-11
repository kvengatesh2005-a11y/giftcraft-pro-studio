import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],

  server: {
    allowedHosts: [
      'brtreasuretrove.com',
      'www.brtreasuretrove.com',
      'br-treasure-trove.onrender.com',
    ],
  },

  preview: {
    allowedHosts: [
      'brtreasuretrove.com',
      'www.brtreasuretrove.com',
      'br-treasure-trove.onrender.com',
    ],
  },
})
