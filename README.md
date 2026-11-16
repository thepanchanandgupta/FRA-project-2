# FRA Group Project 2 — Credit Risk Intelligence

Static website (HTML/CSS/JS, no build step) comparing credit risk at HDFC Bank vs ICICI Bank and Bajaj Finance vs Cholamandalam, FY2017–FY2026.

Live: https://thepanchanandgupta.github.io/FRA-project-2/

## Team
01 Alan John Wilson (P2511008) · 02 Devraj Chaudhary (P2511026) · 03 Nityam Abichandani (P2511046) · 04 Panchanand Gupta (P2511048) · 05 Febin Francis Kavalakatt (P2512026)

## Structure
- `index.html`, `css/style.css`, `js/app.js` — page, styles, logic
- `js/data/credit.js` — all displayed figures, with basis, source and page per value (generated from the team research workbooks)
- `vendor/` — Chart.js 4.4.4 and qrcodejs (MIT), loaded locally with CDN fallbacks
- `data/cleaned/prices_cleaned.csv`, `data/validation/` — validated daily price data from the earlier stage, kept for reference. The share-price event study and correlations are **not** part of this release because event dates were not fully verified.
- Original raw CSVs are not included; `data/validation/raw_manifest.csv` lists their names, sizes and SHA-256 hashes.

## Data and limitations
Annual figures extracted by the team from annual reports (page references in the site's data grid), with selected values spot-checked against company disclosures (listed on the site under "Data checks"). Banks are compared with banks and NBFCs with NBFCs only. Slippages, write-offs, credit cost and quarterly series were not collected. Blank means not available, never zero. HDFC FY2024 onward includes the HDFC Ltd merger (1 Jul 2023). ICICI GNPA/NNPA use a customer-asset basis, not the headline ratio.

## Deploy (GitHub Pages)
Settings → Pages → Deploy from a branch → `main` / `(root)`. All paths are relative, so it works under `/FRA-project-2/`. The QR code is generated from the page's own URL.

## Update: risk events, share-price reactions and correlations
- `scripts/market_analysis.py` recomputes the event study and correlations from `data/cleaned/prices_cleaned.csv` and the credit data (writes `data/outputs/market_analysis.json`, `js/data/market.js`).
- `js/data/events.js` holds event classifications, data breaks, removed claims and extra sources; `js/analysis-ui.js` renders the new sections.
- Slippages, write-offs and credit cost are shown as unavailable (no verified series). Event URLs not retained are marked as such in the source register.
