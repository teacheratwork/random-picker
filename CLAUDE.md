# random-picker

Installable web app (PWA) for Android that draws random numbers in a range —
typically pupils' register numbers, so that nobody is called twice. Name on the
phone: **«Numeri casuali»**. UI in Italian.

Language note: this is a `dev/` subproject — code, comments and docs in English
(except `README.md`, written in Italian for the user). Conversation stays Italian.
The user reads HTML/CSS well and JavaScript with effort: keep `app.js` commented
and explain any change to its logic.

Plan and design decisions: `../../_plans/_done/2026-10-08-dev-app-numeri-casuali.md`
(or `../../_plans/` while still open). Original UI sketch:
`../../_inbox/archiviato/2026-10-08_062604-247_telegram-foto.jpg`.

## Layout

```
src/                    the app — exactly what gets uploaded to the hosting
  index.html            screen + panels (<dialog>): history, exclusions, confirm
  style.css             mobile portrait layout, always dark (design "Quaderno scuro")
  app.js                all logic (state → save → render), commented
  manifest.webmanifest  installability: name, icons, standalone, portrait
  sw.js                 service worker: offline cache (cache-first)
  icons/                PNG icons, generated
tools/make_icons.py     regenerates icons/ with Pillow (dev only)
```

No build step, no dependencies, no external requests.

## Design (chosen with the user, 2026-10-08)

"Quaderno scuro": always dark (navy `#161c26`), thin blue-grey lines
(`#6f8bb5`) separating the parts, ochre (`#d4a853`) for small accents only.
Top to bottom: "DA | A" (dashed divider, underlined) → drawn number in a flat
rounded tile (equal 36px space above and below; hints sit inside the space
below) → wide centred draw button with an ochre offset shadow → status box with
an ochre left band → switch between two lines → small "Resetta" → credit
"Designed by teacheratwork" pinned to the bottom. Long numbers shrink
(`digits-3`, `digits-4` classes) to stay inside the tile. Mockups of the
rejected variants were throwaway (scratchpad), not kept.

## Behaviour (agreed with the user)

- Big drawn number in the middle; "DA n A m" above, tap a value to edit it
  (integers 0–9999, DA < A). Changing the range with draws in progress asks
  confirmation and clears the draws; exclusions outside the new range are dropped.
- Switch "Consenti ripetizione" off (default): no repeats, counter
  `drawn/available` (available = range minus excluded). When everything is out:
  hint "Finiti!", draw button disabled. Switch on: counter "N estrazioni".
- ⋮ menu: "Storico estratti" (newest first) and "Escludi numeri" (grid toggle,
  "Riammetti tutti").
- "Resetta" asks confirmation and clears draws only — **exclusions are kept**.
- Randomness: `crypto.getRandomValues` + rejection sampling (unbiased).

## State

One object saved as JSON in `localStorage` under key `random-picker:v1`:
`{ min, max, allowRepeat, excluded[], history[], last }`. Validated on load
(`cleanState`); broken data falls back to defaults. Lives only on that device.

## ⚠️ Releasing a change

`sw.js` serves files cache-first. **After changing any file in `src/`, bump
`CACHE` in `sw.js`** (`random-picker-v1` → `v2` …), otherwise installed phones
keep the old version. Then re-upload `src/` and open the app twice on the phone
(first open fetches the new service worker, second uses it).

If the state shape ever changes incompatibly, also bump `STORAGE_KEY` in `app.js`
(or migrate in `cleanState`).

## Testing locally

`python -m http.server 8000` from `src/`, then `http://localhost:8000/` in Chrome
(localhost counts as secure: service worker and install work without HTTPS).
DevTools → Application → Manifest / Service workers; toggle Offline to check.
Use a fresh profile or "Update on reload" in DevTools, because of the cache-first SW.

Verified on 2026-10-08 (headless Chrome via DevTools protocol): full logic
checklist, no installability errors, service worker caches all 8 files, app
loads with the server stopped.

## Hosting

**GitHub Pages** (chosen 2026-10-08), GitHub account `teacheratwork`:
repo `teacheratwork/random-picker` (public), remote `github`.
`.github/workflows/pages.yml` publishes `src/` at every push to `main`
(Settings → Pages → Source: "GitHub Actions").
Expected URL: `https://teacheratwork.github.io/random-picker/` (relative paths,
so the sub-folder is fine). Status: see the plan's implementation notes.

## Git

Two remotes: `origin` = `forgejo:samuele/random-picker.git` (backup of the history, private)
and `github` = `https://github.com/teacheratwork/random-picker.git` (publishing). Push to both:
`git push origin main` and `git push github main`.
Forgejo is on the NAS, see `../_context/git-workflow.md`. Commit messages in English.
