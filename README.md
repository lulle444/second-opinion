# The Second Opinion

Statisk hjemmeside for The Second Opinion (uafhængig rådgivning om kontorejendomme), https://thesecondopinion.dk.

Ingen build: HTML, `style.css`/`style.min.css`, `src/main.js` og `assets/`. Lokal forhåndsvisning: `node server.js`.

Hosting: Cloudflare Pages (projekt `second-opinion`, forbundet til dette repo). Pushes til `main` deployes automatisk.
Sikkerheds-headers ligger i `_headers`, omdirigeringer i `_redirects`. DNS og mail-records ligger i Cloudflare.
