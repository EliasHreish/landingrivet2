import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173, strictPort: true, host: true },
  preview: { port: 4173 },
  build: {
    target: "es2020",
    cssMinify: true,
    assetsInlineLimit: 0,
  },
});
