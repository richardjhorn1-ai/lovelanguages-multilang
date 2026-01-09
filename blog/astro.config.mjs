import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lovelanguages.xyz',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => page.includes('/learn/')
    })
  ],
  build: {
    format: 'directory'
  }
});
