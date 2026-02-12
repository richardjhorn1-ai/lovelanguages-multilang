import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import path from 'path';

export default defineConfig({
  site: 'https://www.lovelanguages.io',
  trailingSlash: 'always',
  output: 'server',
  adapter: vercel(),
  vite: {
    resolve: {
      alias: {
        '@components': path.resolve('./src/components'),
        '@layouts': path.resolve('./src/layouts'),
      }
    }
  },
  integrations: [
    mdx(),
    tailwind({
      // Use a separate config file for the blog
      configFile: './tailwind.config.cjs'
    })
  ],
  build: {
    format: 'directory'
  }
});
