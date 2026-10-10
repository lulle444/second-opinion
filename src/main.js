// Mobile nav, header shadow on scroll, reveal-on-scroll and footer year.

const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  const setOpen = (open) => {
    mainNav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Luk menu' : 'Åbn menu');
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

// Cookie consent + Google Analytics. Nothing is loaded and no banner is shown
// until a GA4 measurement ID is set on <html data-ga-id="G-...">; GA only loads
// after the visitor accepts. The choice itself is kept in localStorage.
(() => {
  const GA_ID = document.documentElement.dataset.gaId;
  if (!GA_ID) return;
  const KEY = 'so-consent';
  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } };

  const loadGA = () => {
    if (window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const sc = document.createElement('script');
    sc.async = true;
    sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(sc);
  };

  const clearGACookies = () => {
    const host = location.hostname;
    const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').map((c) => c.split('=')[0].trim())
      .filter((n) => n === '_ga' || n.startsWith('_ga_'))
      .forEach((n) => domains.forEach((d) => {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      }));
  };

  let banner;
  const close = () => { if (banner) { banner.remove(); banner = null; } };
  const open = () => {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie-samtykke');
    banner.innerHTML =
      '<div class="consent-inner" tabindex="-1">' +
        '<p class="consent-title">Må vi bruge statistikcookies?</p>' +
        '<p>Vi vil gerne bruge Google Analytics til at se, hvordan hjemmesiden bruges, så vi kan gøre den bedre. ' +
        'Det sætter cookies, og oplysningerne behandles af Google. Du kan altid ændre dit valg under ' +
        '"Cookie-indstillinger" nederst på siden. <a href="/privatlivspolitik#cookies">Læs mere</a></p>' +
        '<div class="consent-actions">' +
          '<button type="button" class="btn btn-primary" data-consent="denied">Afvis</button>' +
          '<button type="button" class="btn btn-primary" data-consent="granted">Accepter statistik</button>' +
        '</div>' +
      '</div>';
    banner.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-consent]');
      if (!btn) return;
      const choice = btn.dataset.consent;
      const before = read();
      write(choice);
      close();
      if (choice === 'granted') loadGA();
      else if (before === 'granted') { clearGACookies(); location.reload(); }
    });
    document.body.appendChild(banner);
    banner.querySelector('.consent-inner').focus({ preventScroll: true });
  };

  // Count clicks on phone links (only recorded once GA is loaded, i.e. after consent).
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="tel:"]');
    if (a && window.gtag) {
      const where = a.closest('header') ? 'menu' : a.closest('footer') ? 'footer'
        : a.closest('.cta, .aside-card') ? 'kontaktboks' : 'indhold';
      window.gtag('event', 'klik_telefon', { link_placering: where });
    }
  });

  document.querySelectorAll('[data-cookie-settings]').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', open);
  });

  const choice = read();
  if (choice === 'granted') loadGA();
  else if (choice !== 'denied') open();
})();
