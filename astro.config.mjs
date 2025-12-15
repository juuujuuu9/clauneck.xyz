// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://clauneck.xyz',
  base: '/',
  output: 'server',
  adapter: vercel({
    functionPerRoute: false,
  }),
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsDir: 'assets',
    }
  }
});