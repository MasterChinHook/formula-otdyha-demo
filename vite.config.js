import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Путь сайта на GitHub Pages: https://<user>.github.io/<repo>/
// Для своего домена или локальной проверки: BASE_PATH=/ npm run build
const base = process.env.BASE_PATH ?? '/formula-otdyha-demo/';

const photosDir = resolve(__dirname, 'public/photos');
const PHOTO_RE = /\.(jpe?g|webp|png|avif)$/i;
const listPhotos = () =>
  existsSync(photosDir)
    ? readdirSync(photosDir).filter((f) => PHOTO_RE.test(f) && !f.startsWith('.')).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }))
    : [];

// Рендерит страницу из src/content.js прямо в index.html (статичный HTML, без мигания).
function pagePlugin() {
  let resolvedBase = base;
  return {
    name: 'formula-page',
    configResolved(c) {
      resolvedBase = c.base;
    },
    configureServer(server) {
      server.watcher.add(photosDir);
      const reload = (file) => {
        if (file.startsWith(photosDir) || /src[\\/](content|render)\.js$/.test(file)) server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload).on('unlink', reload).on('change', reload);
    },
    async transformIndexHtml(html, ctx) {
      const mod = ctx.server
        ? await ctx.server.ssrLoadModule('/src/render.js')
        : await import(pathToFileURL(resolve(__dirname, 'src/render.js')).href + '?t=' + Date.now());
      return html.replace('<!--app-->', mod.renderPage({ photos: listPhotos(), base: resolvedBase }));
    },
  };
}

export default defineConfig({
  base,
  plugins: [pagePlugin()],
  build: { target: 'es2019', assetsInlineLimit: 0 },
});
