// Ручная публикация: собирает сайт и пушит dist/ в ветку gh-pages.
// Нужна, пока GitHub Actions недоступен. Pages → Source: «Deploy from a branch», gh-pages.
import { execSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const remote = execSync('git remote get-url origin').toString().trim();

sh('npx vite build');
const dir = mkdtempSync(join(tmpdir(), 'gh-pages-'));
cpSync('dist', dir, { recursive: true });
writeFileSync(join(dir, '.nojekyll'), '');
sh('git init -q -b gh-pages', dir);
sh('git add -A', dir);
sh('git commit -qm "Deploy"', dir);
sh(`git push -q -f ${remote} gh-pages`, dir);
console.log('Готово. Сайт обновится через минуту.');
