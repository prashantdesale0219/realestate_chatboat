import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Make environment variables available to the client
  define: {
    'process.env.REACT_APP_GOOGLE_SEARCH_API_KEY': JSON.stringify(process.env.REACT_APP_GOOGLE_SEARCH_API_KEY),
    'process.env.REACT_APP_GOOGLE_SEARCH_CX': JSON.stringify(process.env.REACT_APP_GOOGLE_SEARCH_CX)
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
