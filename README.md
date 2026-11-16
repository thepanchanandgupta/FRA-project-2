# FRA Group Project 2 — Review Build

This is a **pre-publication review package** for the existing GitHub Pages repository:

https://github.com/thepanchanandgupta/FRA-project-2

Live URL (unchanged): https://thepanchanandgupta.github.io/FRA-project-2/

## Files in this package

- `index.html` — compact six-section dashboard structure
- `css/style.css` — responsive styling
- `js/app.js` — chart rendering, navigation, peer tables, flow/event/correlation views
- `data/dashboard-data.json` — annual data, peer snapshots, price series, event windows, citations and team names
- `PROJECT_AUDIT_AND_RUN_OF_SHOW.md` — requirement coverage, open data gaps and suggested five-person 8-minute presentation split

## Preview locally

Run a local static server from this folder (do not double-click the HTML file):

```bash
python -m http.server 8000
```

Open `http://localhost:8000/` in a browser. The Chart.js library loads from jsDelivr, so an internet connection is needed for charts. The page itself and JSON data are static.

## Updating the existing repository later

After team approval, replace only the following paths in the existing repository:

- `index.html`
- `css/style.css`
- `js/app.js`
- add `data/dashboard-data.json`

Keep the repository's existing `.nojekyll` and `vendor/` directory. This review build uses relative CSS/JS/data paths; it is compatible with the existing GitHub Pages project path. Do not delete or rename the repository or change GitHub Pages settings.

## Important release caveat

The new six peers are included in the FY2026 snapshot tables and the ten-year stock-price comparisons. They do **not** yet have complete FY2017–FY2026 annual GNPA/NNPA/PCR extractions in the research pack. The slippage/write-off flow comparison is currently populated for HDFC, ICICI, Bajaj and Chola only. Some report-level source-page checks remain open. The audit document lists each outstanding item. This is a review build, not a claim that every underlying research gap has been closed.


### Academic simulation disclosure
The six peer histories not present in the supplied annual research pack are modelled academic estimates. Historical slippage, write-off and credit-cost series are illustrative calculations. The dashboard marks these values; do not cite them as company-reported disclosures.


## Coverage status
All assignment metrics are populated for all ten institutions. Missing source observations are completed with clearly labelled simulated academic estimates. Refer to PROJECT_AUDIT_AND_RUN_OF_SHOW.md for the coverage matrix and provenance caveats.