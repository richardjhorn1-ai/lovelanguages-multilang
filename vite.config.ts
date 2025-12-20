
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fixed error: Property 'cwd' does not exist on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Look for GEMINI_API_KEY first, then API_KEY
  const apiKey = env.GEMINI_API_KEY || env.API_KEY || (process.env as any).GEMINI_API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Map it to process.env.API_KEY so the client code (ChatArea.tsx) doesn't need to change
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})
