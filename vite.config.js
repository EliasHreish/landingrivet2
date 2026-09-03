import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

/* <!-- @include partials/x.html --> is replaced with the file's content, in dev and build. */
function partials() {
  return {
    name: "rivet-partials",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(/<!--\s*@include\s+([\w./-]+)\s*-->/g, (_, file) =>
          fs.readFileSync(path.join(root, file), "utf8")
        );
      },
    },
    configureServer(server) {
      const dir = path.join(root, "partials");
      server.watcher.add(dir);
      server.watcher.on("change", (file) => {
        if (file.startsWith(dir)) server.ws.send({ type: "full-reload" });
      });
    },
  };
}

/* Dev-only clean URLs (/privacy → /privacy.html). Vercel does the same in production via cleanUrls. */
function cleanUrls() {
  return {
    name: "rivet-clean-urls",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const [pathname, query] = (req.url || "").split("?");
        if (/^\/[a-z0-9/-]+$/i.test(pathname) && !pathname.endsWith("/")) {
          const candidate = path.join(root, `${pathname}.html`);
          if (fs.existsSync(candidate)) req.url = `${pathname}.html${query ? `?${query}` : ""}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [partials(), cleanUrls()],
  server: { port: 5173, strictPort: true, host: true },
  preview: { port: 4173 },
  build: {
    target: "es2020",
    cssMinify: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: path.join(root, "index.html"),
        privacy: path.join(root, "privacy.html"),
        terms: path.join(root, "terms.html"),
        sign: path.join(root, "onboarding/sign.html"),
      },
    },
  },
});
