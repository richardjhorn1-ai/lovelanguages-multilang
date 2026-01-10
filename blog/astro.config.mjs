import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://lovelanguages.xyz',
  output: 'static',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => page.includes('/learn/'),
      serialize: (item) => ({
        ...item,
        lastmod: new Date().toISOString(),
        changefreq: item.url.endsWith('/learn/') ? 'daily' : 'weekly',
        priority: item.url.endsWith('/learn/') ? 0.9 : 0.7
      })
    }),
    tailwind({
      // Use a separate config file for the blog
      configFile: './tailwind.config.cjs'
    })
  ],
  build: {
    format: 'directory'
  }
});
