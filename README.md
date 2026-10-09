# Second Opinion

Statisk hjemmeside for Second Opinion (rådgivning om kontorejendomme).

- `index.html` — forside
- `ejere.html` — Rådgivning til ejere af kontorejendomme (`/ejere`)
- `lejere.html` — Rådgivning til kontorlejere (`/lejere`)
- `style.css`, `src/main.js`, `assets/`

Ingen build. Lokal forhåndsvisning: `node server.js` → http://localhost:5173

Deployes på Vercel (projekt `second-opinion`, forbundet til dette repo) fra `main`; `vercel.json` slår clean URLs til.

Pushes til `main` deployes automatisk til https://second-opinion-ruby.vercel.app.
