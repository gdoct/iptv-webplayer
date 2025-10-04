import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({  }) => {
  const isSingleFile = process.env.VITE_SINGLE_FILE === 'true'

  return {
    plugins: [
      react(),
      ...(isSingleFile ? [viteSingleFile()] : [])
    ],
    base: isSingleFile ? './' : '/iptv-webplayer/',
    build: {
      outDir: isSingleFile ? 'dist-single' : 'dist',
      rollupOptions: {
        // Don't externalize react-dom for the application build
        // but suppress the warning about the library having it as an import
        onwarn(warning, warn) {
          // Suppress the specific warning about react-dom imports from the style library
          if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('react-dom')) {
            return
          }
          warn(warning)
        }
      }
    },
    publicDir: 'public'
  }
})
