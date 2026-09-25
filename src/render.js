// Собирает разметку страницы из content.js на этапе сборки (и в dev-сервере).
import { TODO, agency, hero, why, directions, steps, contacts, request, meta } from './content.js';

const escape = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const TODO_HTML = `<mark class="todo">${escape(TODO)}</mark>`;

// Текст с подсветкой заглушек. allowHtml — для строк из content.js с &nbsp; и т.п.
const t = (s, allowHtml = false) => {
  if (!s || s === TODO) return TODO_HTML;
  const html = allowHtml ? String(s) : escape(s);
  return html.split(escape(TODO)).join(TODO_HTML);
};

const icons = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone:
    '<path d="M6.6 3.5h2.6l1.4 4.2-2 1.4a12 12 0 0 0 6.3 6.3l1.4-2 4.2 1.4v2.6a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
  star: '<path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8Z"/>',
  map: '<path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;

const logo = `<svg class="logo__mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="currentColor"/><circle cx="32" cy="30" r="11" fill="#FBE3CF"/><path d="M12 42c5 0 5-3 10-3s5 3 10 3 5-3 10-3 5 3 10 3M12 50c5 0 5-3 10-3s5 3 10 3 5-3 10-3 5 3 10 3" stroke="#FBF7F2" stroke-width="3.2" fill="none" stroke-linecap="round"/></svg>`;

// Фото из public/photos или градиентная заглушка «пейзаж».
const media = (photo, variant, { alt = '', eager = false, cls = '' } = {}) =>
  photo
    ? `<img class="media ${cls}" src="${escape(photo)}" alt="${escape(alt)}" ${
        eager ? 'fetchpriority="high"' : 'loading="lazy"'
      } decoding="async">`
    : `<div class="media ph ph--${variant} ${cls}" role="presentation"></div>`;

const section = (id, title, lead, body, cls = '') => `
<section class="section ${cls}" id="${id}" aria-labelledby="${id}-title">
  <div class="wrap">
    <header class="section__head reveal">
      <h2 class="section__title" id="${id}-title">${t(title)}</h2>
      ${lead ? `<p class="section__lead">${t(lead)}</p>` : ''}
    </header>
    ${body}
  </div>
</section>`;

export function renderPage({ photos = [], base = '/', year = new Date().getFullYear() }) {
  const url = (name) => `${base}photos/${encodeURIComponent(name)}`;
  const byName = (re) => photos.find((p) => re.test(p));
  const heroPhoto = byName(/^hero\./i);
  const aboutPhoto = byName(/^about\./i);
  const rest = photos.filter((p) => p !== heroPhoto && p !== aboutPhoto);
  const heroFile = heroPhoto ?? rest.shift();
  const pick = (i) => (rest[i] ? url(rest[i]) : null);

  const [phone1, phone2] = agency.phones;
  const h = agency.hours.weekdays;
  const address = `${agency.street}, ${agency.office}`;

  const header = `
<header class="topbar" id="topbar">
  <div class="wrap topbar__inner">
    <a class="logo" href="#top" aria-label="${escape(agency.name)} — наверх">${logo}<span class="logo__text"><b>${escape(agency.name)}</b><small>${escape(agency.kind.toLowerCase())}</small></span></a>
    <nav class="nav" aria-label="Разделы">
      <a href="#why">О нас</a><a href="#directions">Направления</a><a href="#how">Как работаем</a><a href="#contacts">Контакты</a>
    </nav>
    <a class="topbar__call" href="tel:${phone1.tel}">${icon('phone')}<span>${escape(phone1.display)}</span></a>
  </div>
</header>`;

  const heroHtml = `
<section class="hero" id="top" aria-labelledby="hero-title">
  <div class="hero__media" data-parallax>${media(heroFile && url(heroFile), 'sunset', { eager: true })}</div>
  <div class="hero__shade"></div>
  <div class="wrap hero__content">
    <p class="hero__eyebrow anim" style="--d:0">${escape(hero.eyebrow)}</p>
    <h1 class="hero__title anim" id="hero-title" style="--d:1">${t(hero.title, true)}</h1>
    <p class="hero__lead anim" style="--d:2">${t(hero.lead)}</p>
    <div class="hero__actions anim" style="--d:3">
      <a class="btn btn--accent" href="#request">${escape(hero.cta)}${icon('arrow')}</a>
      <a class="btn btn--glass" href="tel:${phone1.tel}">${icon('phone')}Позвонить</a>
    </div>
    <ul class="hero__facts anim" style="--d:4">
      <li>${icon('clock')}Пн–Пт ${h.open}–${h.close}</li>
      <li>${icon('pin')}${escape(agency.building)}, 5 этаж</li>
    </ul>
  </div>
</section>`;

  const whyBody = `
<div class="why">
  <div class="why__photo reveal">${media(aboutPhoto && url(aboutPhoto), 'dawn', { alt: '' })}</div>
  <ul class="why__list">
    ${why.items
      .map(
        (it, i) => `
    <li class="feature reveal ${it.todo ? 'feature--todo' : ''}" style="--d:${i}">
      <span class="feature__icon">${icon(it.icon)}</span>
      <div><h3>${t(it.title)}</h3><p>${t(it.text)}</p></div>
    </li>`
      )
      .join('')}
  </ul>
</div>`;

  const variants = ['noon', 'dusk', 'mount', 'dawn', 'dune', 'sunset'];
  const dirBody = `
<ul class="cards">
  ${directions.items
    .map(
      (d, i) => `
  <li class="card reveal" style="--d:${i % 3}">
    <div class="card__media">${media(pick(i), variants[i % variants.length], { alt: d.title === TODO ? '' : d.title })}<span class="card__num">${String(i + 1).padStart(2, '0')}</span></div>
    <div class="card__body">
      <h3 class="card__title">${t(d.title)}</h3>
      ${
        [d.text, d.season, d.price].every((v) => !v || v === TODO)
          ? `<p class="card__text">Описание, сезон и цены — ${TODO_HTML}</p>`
          : `<p class="card__text">${t(d.text)}</p>
      <dl class="card__meta"><div><dt>Сезон</dt><dd>${t(d.season)}</dd></div><div><dt>Цена</dt><dd>${t(d.price)}</dd></div></dl>`
      }
      <a class="card__link" href="#request" data-direction="${d.title === TODO ? '' : escape(d.title)}">Спросить про это направление${icon('arrow')}</a>
    </div>
  </li>`
    )
    .join('')}
</ul>`;

  const stepsBody = `
<ol class="steps">
  ${steps.items
    .map(
      (s, i) => `
  <li class="step reveal" style="--d:${i}">
    <span class="step__num">${i + 1}</span>
    <h3>${t(s.title)}</h3>
    <p>${t(s.text)}</p>
  </li>`
    )
    .join('')}
</ol>`;

  const weekendHtml = agency.hours.weekend ? escape(agency.hours.weekend) : TODO_HTML;
  const contactsBody = `
<div class="find">
  <div class="find__card reveal">
    <div class="find__row">
      <span class="find__icon">${icon('pin')}</span>
      <div><h3>${escape(agency.building)}</h3><p>${escape(address)}<br>${escape(agency.city)}</p></div>
    </div>
    <div class="find__row">
      <span class="find__icon">${icon('clock')}</span>
      <div>
        <h3>Режим работы</h3>
        <p>Пн–Пт: ${h.open}–${h.close}, обед ${h.lunchFrom}–${h.lunchTo}<br>Сб–Вс: ${weekendHtml}</p>
        <p class="status" id="status" data-open="${h.open}" data-close="${h.close}" data-lunch-from="${h.lunchFrom}" data-lunch-to="${h.lunchTo}" data-weekend="${agency.hours.weekend ? '1' : ''}" hidden></p>
      </div>
    </div>
    <div class="find__row">
      <span class="find__icon">${icon('phone')}</span>
      <div><h3>Телефоны</h3><p>${agency.phones
        .map((p) => `<a class="phone-link" href="tel:${p.tel}">${escape(p.display)}</a> <small>${escape(p.label.toLowerCase())}</small>`)
        .join('<br>')}</p></div>
    </div>
    <p class="find__note">${t(contacts.howToGet)}</p>
    <a class="btn btn--accent btn--wide" href="${escape(agency.mapUrl)}" target="_blank" rel="noopener">${icon('map')}Открыть в 2ГИС</a>
  </div>
  <div class="find__art reveal" aria-hidden="true">
    <div class="mapart"></div>
    <div class="find__pin"><span>${icon('pin')}</span><div class="find__label"><b>${escape(agency.name)}</b><small>${escape(agency.street)}</small></div></div>
  </div>
</div>`;

  const requestBody = `
<div class="request reveal">
  <form class="form" id="form" novalidate>
    <label class="field"><span>Как вас зовут</span><input name="name" autocomplete="name" required placeholder="Например, Анна"><em class="field__err">Напишите, как к вам обращаться</em></label>
    <label class="field"><span>Телефон</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="+7 (___) ___-__-__"><em class="field__err">Проверьте номер — нужно 10 цифр после +7</em></label>
    <label class="field"><span>Куда хочется или какой бюджет <small>— необязательно</small></span><textarea name="wish" rows="3" placeholder="Например: на море в июле, вдвоём"></textarea></label>
    <button class="btn btn--accent btn--wide" type="submit">Подготовить заявку${icon('arrow')}</button>
  </form>
  <div class="done" id="done" hidden tabindex="-1">
    <p class="done__badge" id="done-status">Текст заявки скопирован</p>
    <pre class="done__text" id="done-text"></pre>
    <p class="done__hint">Позвоните нам — или вставьте текст в мессенджер.</p>
    <div class="done__actions">
      <a class="btn btn--accent" href="tel:${phone1.tel}">${icon('phone')}${escape(phone1.display)}</a>
      <a class="btn btn--ghost" href="tel:${phone2.tel}">${icon('phone')}${escape(phone2.display)}</a>
    </div>
    <div class="done__more"><button class="linkbtn" type="button" id="copy-again">Скопировать ещё раз</button><button class="linkbtn" type="button" id="edit">Изменить заявку</button></div>
  </div>
</div>`;

  const footer = `
<footer class="footer">
  <div class="wrap footer__inner">
    <div><a class="logo logo--footer" href="#top">${logo}<span class="logo__text"><b>${escape(agency.name)}</b><small>${escape(agency.kind.toLowerCase())}, ${escape(agency.city)}</small></span></a></div>
    <p>${escape(agency.building)}<br>${escape(address)}</p>
    <p>${agency.phones.map((p) => `<a href="tel:${p.tel}">${escape(p.display)}</a>`).join('<br>')}</p>
  </div>
  <div class="wrap footer__bottom"><span>© ${year} ${escape(agency.name)}</span><span class="demo-badge">${escape(meta.demoNote)}</span></div>
</footer>
<nav class="dock" aria-label="Быстрые действия">
  <a class="dock__btn" href="tel:${phone1.tel}">${icon('phone')}Позвонить</a>
  <a class="dock__btn dock__btn--accent" href="#request">Заявка${icon('arrow')}</a>
</nav>`;

  return `${header}
<main>
${heroHtml}
${section('why', why.title, why.lead, whyBody)}
${section('directions', directions.title, directions.lead, dirBody, 'section--tint')}
${section('how', steps.title, steps.lead, stepsBody)}
${section('contacts', contacts.title, contacts.lead, contactsBody, 'section--tint')}
${section('request', request.title, request.lead, requestBody, 'section--split')}
</main>
${footer}`;
}
