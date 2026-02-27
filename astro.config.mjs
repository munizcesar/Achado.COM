import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://achadocerto.vip',
  output: 'static',
  build: {
    assets: '_assets'
  }
});
