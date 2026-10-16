// Mobile nav, header shadow on scroll, reveal-on-scroll and footer year.

const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  const setOpen = (open) => {
    mainNav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    const en = document.documentElement.lang === 'en';
    navToggle.setAttribute('aria-label', open ? (en ? 'Close menu' : 'Luk menu') : (en ? 'Open menu' : 'Åbn menu'));
  };
  navToggle.addEventListener('click', () => setOpen(!mainNav.classList.contains('open')));
  mainNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// Count the key figures up from zero the first time they scroll into view.
const counters = document.querySelectorAll('.stat-num[data-count]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
  const fmt = (n, decimals) => n.toFixed(decimals).replace('.', ',');
  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const final = el.dataset.final || el.textContent;
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = t < 1 ? fmt(target * eased, decimals) + suffix : final;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const co = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { run(entry.target); co.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => co.observe(el));
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Cookie consent, Google Analytics and (optional) marketing tags.
// IDs are set on <html>: data-ga-id="G-…" (statistics), data-ads-id="AW-…"
// (Google Ads) and data-li-id="123456" (LinkedIn Insight Tag). The marketing
// choice is only offered once an Ads or LinkedIn ID is set. Nothing loads before
// the visitor consents (Google Consent Mode v2 signals are sent with the choice).
// The choice is kept in localStorage as JSON: {"s":bool,"m":bool}.
(() => {
  const ds = document.documentElement.dataset;
  const GA_ID = ds.gaId || '';
  const ADS_ID = ds.adsId || '';
  const LI_ID = ds.liId || '';
  const HAS_MKT = !!(ADS_ID || LI_ID);
  if (!GA_ID && !HAS_MKT) return;
  const en = document.documentElement.lang === 'en';
  const KEY = 'so-consent';

  const read = () => {
    let v = null;
    try { v = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!v) return null;
    if (v === 'granted' || v === 'denied') return { s: v === 'granted' }; // old format
    try { return JSON.parse(v); } catch (e) { return null; }
  };
  const write = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* private mode */ } };
  // A choice made before marketing was offered counts as undecided for marketing.
  const decided = (c) => !!c && (!HAS_MKT || typeof c.m === 'boolean');

  const g = (v) => (v ? 'granted' : 'denied');
  const loadGoogle = (c) => {
    const stats = !!(c.s && GA_ID);
    const ads = !!(c.m && ADS_ID);
    if (!stats && !ads) return;
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        analytics_storage: g(stats),
        ad_storage: g(ads),
        ad_user_data: g(ads),
        ad_personalization: g(ads),
      });
      window.gtag('js', new Date());
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(stats ? GA_ID : ADS_ID);
      document.head.appendChild(sc);
    } else {
      window.gtag('consent', 'update', {
        analytics_storage: g(stats),
        ad_storage: g(ads),
        ad_user_data: g(ads),
        ad_personalization: g(ads),
      });
    }
    if (stats) window.gtag('config', GA_ID);
    if (ads) window.gtag('config', ADS_ID);
  };

  const loadLinkedIn = () => {
    if (!LI_ID || window._linkedin_data_partner_ids) return;
    window._linkedin_partner_id = LI_ID;
    window._linkedin_data_partner_ids = [LI_ID];
    window.lintrk = window.lintrk || function (a, b) { (window.lintrk.q = window.lintrk.q || []).push([a, b]); };
    const sc = document.createElement('script');
    sc.async = true;
    sc.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    document.head.appendChild(sc);
  };

  const apply = (c) => {
    loadGoogle(c);
    if (c.m) loadLinkedIn();
  };

  const clearCookies = (test) => {
    const host = location.hostname;
    const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').map((x) => x.split('=')[0].trim()).filter(test)
      .forEach((n) => domains.forEach((d) => {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      }));
  };
  const isStatsCookie = (n) => n === '_ga' || n.startsWith('_ga_');
  const isMktCookie = (n) => n.startsWith('_gcl_') || n.startsWith('li_') || n.startsWith('_li') || n === 'lms_ads' || n === 'lms_analytics';

  const T = en ? {
    label: 'Cookie consent',
    title: 'May we use cookies?',
    text: HAS_MKT
      ? 'We would like to use cookies for statistics (Google Analytics) and, if you allow it, for marketing (Google Ads and LinkedIn), so we can improve the website and show relevant ads. The data is processed by Google and LinkedIn. You can change your choice at any time under "Cookie settings" at the bottom of the page.'
      : 'We would like to use Google Analytics to see how the website is used, so we can improve it. This sets cookies, and the data is processed by Google. You can change your choice at any time under "Cookie settings" at the bottom of the page.',
    more: 'Read more (Danish)',
    nec: 'Necessary', necD: 'Remembers your cookie choice. Always on.',
    stats: 'Statistics', statsD: 'Google Analytics – how the website is used.',
    mkt: 'Marketing', mktD: 'Google Ads and LinkedIn – measuring and showing relevant ads, also on other websites.',
    deny: 'Decline all', deny1: 'Decline', save: 'Save choice', all: 'Accept all', accStats: 'Accept statistics',
  } : {
    label: 'Cookie-samtykke',
    title: HAS_MKT ? 'Må vi bruge cookies?' : 'Må vi bruge statistikcookies?',
    text: HAS_MKT
      ? 'Vi vil gerne bruge cookies til statistik (Google Analytics) og, hvis du tillader det, til marketing (Google Ads og LinkedIn), så vi kan forbedre hjemmesiden og vise relevante annoncer. Oplysningerne behandles af Google og LinkedIn. Du kan altid ændre dit valg under "Cookie-indstillinger" nederst på siden.'
      : 'Vi vil gerne bruge Google Analytics til at se, hvordan hjemmesiden bruges, så vi kan gøre den bedre. Det sætter cookies, og oplysningerne behandles af Google. Du kan altid ændre dit valg under "Cookie-indstillinger" nederst på siden.',
    more: 'Læs mere',
    nec: 'Nødvendige', necD: 'Husker dit cookievalg. Altid slået til.',
    stats: 'Statistik', statsD: 'Google Analytics – hvordan hjemmesiden bruges.',
    mkt: 'Marketing', mktD: 'Google Ads og LinkedIn – måling og visning af relevante annoncer, også på andre hjemmesider.',
    deny: 'Afvis alle', deny1: 'Afvis', save: 'Gem valg', all: 'Accepter alle', accStats: 'Accepter statistik',
  };

  let banner;
  const close = () => { if (banner) { banner.remove(); banner = null; } };
  const open = () => {
    if (banner) return;
    const cur = read() || {};
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', T.label);
    const opt = (key, name, desc, checked, disabled) =>
      '<label class="consent-opt">' +
        '<input type="checkbox"' + (key ? ' data-cat="' + key + '"' : '') + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />' +
        '<span><strong>' + name + '</strong> ' + desc + '</span>' +
      '</label>';
    banner.innerHTML =
      '<div class="consent-inner" tabindex="-1">' +
        '<p class="consent-title">' + T.title + '</p>' +
        '<p>' + T.text + ' <a href="/privatlivspolitik#cookies">' + T.more + '</a></p>' +
        (HAS_MKT ?
          '<div class="consent-opts">' +
            opt('', T.nec, T.necD, true, true) +
            (GA_ID ? opt('s', T.stats, T.statsD, !!cur.s, false) : '') +
            opt('m', T.mkt, T.mktD, !!cur.m, false) +
          '</div>' : '') +
        '<div class="consent-actions">' +
          '<button type="button" class="btn btn-primary" data-consent="deny">' + (HAS_MKT ? T.deny : T.deny1) + '</button>' +
          (HAS_MKT ? '<button type="button" class="btn btn-outline" data-consent="save">' + T.save + '</button>' : '') +
          '<button type="button" class="btn btn-primary" data-consent="all">' + (HAS_MKT ? T.all : T.accStats) + '</button>' +
        '</div>' +
      '</div>';
    banner.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-consent]');
      if (!btn) return;
      const act = btn.dataset.consent;
      const box = (k) => { const el = banner.querySelector('[data-cat="' + k + '"]'); return !!(el && el.checked); };
      const c = act === 'all' ? { s: !!GA_ID, m: HAS_MKT }
        : act === 'deny' ? { s: false, m: false }
        : { s: box('s'), m: box('m') };
      const before = read() || {};
      write(c);
      close();
      const revoked = (before.s && !c.s) || (before.m && !c.m);
      if (revoked) {
        // Stop the running tags from re-writing cookies before the page reloads.
        if (window.gtag) window.gtag('consent', 'update', {
          analytics_storage: g(c.s), ad_storage: g(c.m), ad_user_data: g(c.m), ad_personalization: g(c.m),
        });
        if (before.s && !c.s) clearCookies(isStatsCookie);
        if (before.m && !c.m) clearCookies(isMktCookie);
        location.reload();
      } else {
        apply(c);
      }
    });
    document.body.appendChild(banner);
    banner.querySelector('.consent-inner').focus({ preventScroll: true });
  };

  // Count clicks on phone and e-mail links (only recorded once gtag is loaded, i.e. after consent).
  const where = (a) => (a.closest('header') ? 'menu' : a.closest('footer') ? 'footer'
    : a.closest('.cta, .aside-card') ? 'kontaktboks' : 'indhold');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a) return;
    const tel = a.getAttribute('href').startsWith('tel:');
    if (window.gtag) window.gtag('event', tel ? 'klik_telefon' : 'klik_mail', { link_placering: where(a) });
  });

  document.querySelectorAll('[data-cookie-settings]').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', open);
  });

  const c = read();
  if (c) apply(c);
  if (!decided(c)) open();
})();

// Contact form (/kontakt): posts to Web3Forms, which forwards the message by e-mail.
// The access key sits on the form as data-key; without a key the form points people to phone/e-mail.
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('.cf-status');
  const btn = form.querySelector('button[type="submit"]');
  const say = (msg, kind) => { status.textContent = msg; status.dataset.kind = kind || ''; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = form.dataset.key;
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      const bad = form.querySelector(':invalid');
      if (bad) bad.focus();
      say('Udfyld venligst de felter, der er markeret med *.', 'error');
      return;
    }
    if (!key) { say('Formularen er ikke aktiv endnu – ring på 31 18 24 37 eller skriv til jn@thesecondopinion.dk.', 'error'); return; }
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.botcheck) return;
    data.access_key = key;
    data.subject = 'Ny henvendelse (' + data.rolle + ') fra ' + data.name + (data.virksomhed ? ', ' + data.virksomhed : '');
    btn.disabled = true;
    say('Sender …');
    try {
      // Sent as FormData (a "simple" CORS request, so no preflight is needed).
      const body = new FormData();
      Object.keys(data).forEach((k) => body.append(k, data[k]));
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || res.status);
      form.reset();
      form.classList.remove('was-validated');
      say('Tak for din besked. Jesper Norgart vender tilbage hurtigst muligt.', 'ok');
      if (window.gtag) window.gtag('event', 'kontaktformular', { link_placering: 'kontaktside' });
    } catch (err) {
      say('Beskeden kunne ikke sendes. Prøv igen, eller ring på 31 18 24 37.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
})();
