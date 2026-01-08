import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [
    // MDX must come before React plugin
    mdx({
      remarkPlugins: [remarkGfm, remarkFrontmatter],
      providerImportSource: '@mdx-js/react'
    }),
    react()
  ]
}))
