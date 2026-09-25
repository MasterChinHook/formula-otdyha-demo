import '@fontsource/cormorant-garamond/cyrillic-600.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/cyrillic-700.css';
import '@fontsource/cormorant-garamond/latin-700.css';
import './style.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (sel) => document.querySelector(sel);

/* ---------- Появление секций на скролле ---------- */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

/* ---------- Шапка, нижняя панель, параллакс ---------- */
const topbar = $('#topbar');
const dock = $('.dock');
const hero = $('.hero');
const parallax = $('[data-parallax]');
const request = $('#request');
let ticking = false;

function onScroll() {
  ticking = false;
  const y = window.scrollY;
  const heroH = hero.offsetHeight;
  topbar.classList.toggle('is-solid', y > heroH - 80);

  const reqRect = request.getBoundingClientRect();
  const formVisible = reqRect.top < window.innerHeight && reqRect.bottom > 0;
  dock.classList.toggle('is-visible', y > heroH * 0.6 && !formVisible);

  if (!reduceMotion.matches && y < heroH) {
    parallax.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
  }
}
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);
onScroll();

/* ---------- Открыто ли сейчас (время московское) ---------- */
const status = $('#status');
function updateStatus() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  const toMin = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const now = Number(parts.hour) * 60 + Number(parts.minute);
  const weekend = parts.weekday === 'Sat' || parts.weekday === 'Sun';
  const { open, close, lunchFrom, lunchTo } = status.dataset;

  let state = 'closed';
  let text;
  if (weekend) {
    text = 'Сегодня выходной — позвоните, чтобы уточнить';
  } else if (now >= toMin(open) && now < toMin(close)) {
    if (now >= toMin(lunchFrom) && now < toMin(lunchTo)) {
      state = 'lunch';
      text = `Обед, вернёмся в ${lunchTo}`;
    } else {
      state = 'open';
      text = `Сейчас открыто, до ${close}`;
    }
  } else {
    const nextDay = parts.weekday === 'Fri' && now >= toMin(close) ? 'в понедельник' : now < toMin(open) ? 'сегодня' : 'завтра';
    text = `Сейчас закрыто, откроемся ${nextDay} в ${open}`;
  }
  status.dataset.state = state;
  status.textContent = text;
  status.hidden = false;
}
if (status) {
  updateStatus();
  setInterval(updateStatus, 60_000);
}

/* ---------- Заявка ---------- */
const form = $('#form');
const done = $('#done');
const doneText = $('#done-text');
const doneStatus = $('#done-status');
let lastText = '';

function formatPhone(value) {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = '+7';
  if (p.length) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}

const phoneInput = form.elements.phone;
phoneInput.addEventListener('input', (e) => {
  // не мешаем стирать скобки и дефисы
  if (e.inputType && e.inputType.startsWith('delete')) return;
  phoneInput.value = phoneInput.value.trim() ? formatPhone(phoneInput.value) : '';
});

const setInvalid = (input, bad) => input.closest('.field').classList.toggle('is-invalid', bad);
form.addEventListener('input', (e) => {
  if (e.target.closest('.field.is-invalid')) setInvalid(e.target, false);
});

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    ta.remove();
    return ok;
  }
}

async function copyAndReport() {
  const ok = await copy(lastText);
  doneStatus.textContent = ok ? '✓ Текст заявки скопирован' : 'Не получилось скопировать — выделите текст ниже вручную';
  doneStatus.classList.toggle('is-warn', !ok);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = form.elements.name.value.trim();
  const phoneDigits = phoneInput.value.replace(/\D/g, '');
  const wish = form.elements.wish.value.trim();

  const nameBad = name.length < 2;
  const phoneBad = phoneDigits.length !== 11;
  setInvalid(form.elements.name, nameBad);
  setInvalid(phoneInput, phoneBad);
  if (nameBad) return form.elements.name.focus();
  if (phoneBad) return phoneInput.focus();

  lastText = [
    'Здравствуйте! Хочу получить консультацию по туру.',
    `Имя: ${name}`,
    `Телефон: ${formatPhone(phoneDigits)}`,
    wish && `Пожелания: ${wish}`,
  ]
    .filter(Boolean)
    .join('\n');

  doneText.textContent = lastText;
  form.hidden = true;
  done.hidden = false;
  done.focus({ preventScroll: true });
  done.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
  await copyAndReport();
});

$('#copy-again').addEventListener('click', copyAndReport);
$('#edit').addEventListener('click', () => {
  done.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});

/* ---------- «Спросить про это направление» подставляет его в форму ---------- */
document.querySelectorAll('[data-direction]').forEach((link) =>
  link.addEventListener('click', () => {
    const title = link.dataset.direction;
    const wish = form.elements.wish;
    if (title && !wish.value.includes(title)) wish.value = wish.value ? `${wish.value}, ${title}` : title;
    if (!done.hidden) $('#edit').click();
  })
);

