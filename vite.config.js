import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
 
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
 
  // 🔥 ADD THIS (VERY IMPORTANT)
  base: '/',
 
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      }
    }
  }
})
