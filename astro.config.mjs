import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://achadocerto.vip',
  integrations: [sitemap()],
  output: 'static',
  build: {
    assets: '_assets'
  }
});
