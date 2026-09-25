// Проверка собранного сайта: скриншоты 390px и 1440px, ошибки консоли, форма, og.png.
// Запуск: npm run build && npm run check  (или: npm run check -- https://адрес-сайта/)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const external = process.argv[2];
let server;
let url = external;
if (!url) {
  server = spawn('npx', ['vite', 'preview', '--port', '4190', '--strictPort'], { stdio: 'pipe' });
  url = 'http://localhost:4190/formula-otdyha-demo/';
  await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('4190') && r()));
}
mkdirSync('screenshots', { recursive: true });

const browser = await chromium.launch();
const problems = [];

async function run(name, opts) {
  const ctx = await browser.newContext({ ...opts, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`[${name}] console.${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`[${name}] pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`[${name}] request failed: ${r.url()}`));
  page.on('response', (r) => r.status() >= 400 && problems.push(`[${name}] HTTP ${r.status()}: ${r.url()}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `screenshots/${name}-hero.png` });
  // Прокручиваем, чтобы сработали анимации появления
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1000);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) problems.push(`[${name}] horizontal overflow ${overflow}px`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `screenshots/${name}-full.png`, fullPage: true });

  // Форма: пустая отправка → ошибки, потом корректная
  await page.locator('#form button[type=submit]').click();
  const invalid = await page.locator('.field.is-invalid').count();
  if (invalid !== 2) problems.push(`[${name}] expected 2 invalid fields, got ${invalid}`);
  await page.fill('input[name=name]', 'Анна');
  await page.locator('input[name=phone]').pressSequentially('89031234567');
  await page.fill('textarea[name=wish]', 'На море в июле, вдвоём');
  await page.locator('#form button[type=submit]').click();
  await page.waitForTimeout(900);
  const text = await page.locator('#done-text').textContent();
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '(no clipboard access)');
  if (!text.includes('+7 (903) 123-45-67')) problems.push(`[${name}] phone formatting wrong: ${text}`);
  if (clip !== text) problems.push(`[${name}] clipboard mismatch: ${clip}`);
  await page.locator('#done').screenshot({ path: `screenshots/${name}-form-done.png` });
  console.log(`[${name}] status: ${await page.locator('#status').textContent()}`);
  await ctx.close();
}

await run('mobile-390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await run('desktop-1440', { viewport: { width: 1440, height: 900 } });

// Reduced motion: всё должно быть видно без прокрутки-анимаций
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.reveal,.anim')].filter((e) => getComputedStyle(e).opacity !== '1').length);
  if (hidden) problems.push(`[reduced-motion] ${hidden} elements not visible`);
  await ctx.close();
}

// Картинка для превью ссылки в мессенджерах
if (!external) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.topbar__call,.nav,.hero__actions{display:none!important}.hero{min-height:630px!important}' });
  await page.screenshot({ path: 'public/og.png' });
  await ctx.close();
}

await browser.close();
server?.kill();
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'OK: no console errors, no overflow, form works');
process.exit(problems.length ? 1 : 0);
