# FRA Group Project 2 — Credit Risk Intelligence (HDFC Bank vs Bajaj Finance)

Static site (HTML/CSS/JS). No build step, no backend. Works on GitHub Pages and by opening `index.html` directly.

## Team
01 Alan John Wilson (P2511008) · 02 Devraj Chaudhary (P2511026) · 03 Nityam Abichandani (P2511046) · 04 Panchanand Gupta (P2511048) · 05 Febin Francis Kavalakatt (P2512026)

## Structure
- `index.html` – page; `css/style.css` – theme; `js/app.js` – all logic
- `js/data/market.js, event_study.js, validation.js, credit.js` – data as JS globals (so file:// works)
- `data/raw/` read-only original CSVs · `data/cleaned/prices_cleaned.csv` · `data/validation/` reports and logs

## Deploy on GitHub Pages
1. Create a public repo, upload the **contents** of this folder (so `index.html` is at the repo root). Keep file names/case exactly (Pages is case-sensitive).
2. Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
3. Wait ~1 min; open `https://<user>.github.io/<repo>/`.
4. Check: no console errors; charts render; the QR section shows "Served from GitHub Pages" and the QR scans to that exact URL (it is generated from `location.origin + location.pathname`, nothing hard-coded).

## Method summary
Raw → cleaned → outputs. Equities: Adj Close; indices: Close. No forward-fill; stale zero-volume rows logged in `exclusion_log.csv`. Market-model event study, estimation window [-250,-31] (≥120 returns), other events' ±20-day windows excluded. Primary benchmarks: Nifty Bank (HDFC, ICICI), Nifty Financial Services (Bajaj, Chola); Nifty 50 robustness only.

## Known open items (honest status)
- Credit-risk grid has only 9 source-verified cells; the rest are blank, not estimated. Verdict questions 1, 4, 5 are therefore marked pending.
- Only events E05 and E08 are source-verified; E01–E04, E06, E07, E09 are candidates.
- Shriram 2024-01-15 and M&M Fin 2025-09-08 stale-row exclusions await team confirmation.
- Holidays inferred from data, not checked against the NSE list.
