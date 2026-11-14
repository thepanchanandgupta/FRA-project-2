# Stage 1 audit (15 Nov 2026)
Backup: a local pre-change backup (full copy before any change).
Raw: data/raw/ has 15 files; SHA-256 of all 15 equals the attached originals (0 differences).
Reconciliation re-derived from raw only: 13 individual CSVs = consolidated (32,082 rows, 0 unmatched, 0 value mismatches over 8 columns); row counts = Download_Summary.csv; 0 duplicate dates; 0 nulls; 0 OHLC inconsistencies; all first/last dates 2016-10-03 / 2026-09-30.
Cleaned layer vs raw: analysis_price equals raw Adj Close (equities) / Close (indices) on every retained row (0 diffs); rows removed = 2 per equity (2025-03-18, 2026-01-15), +1 Shriram (2024-01-15), +1 M&M Fin (2025-09-08) = 22 total.
Pending rows: both are zero-volume, O=H=L=C=prior close, while HDFC Bank and the other equities traded normally that day (exchange open). Treated as stale placeholders but NOT yet corroborated externally.
Nifty Bank: max |Adj Close/Close - 1| = 1.17e-5 (negligible, Close used).
Corporate actions in raw: splits/bonus - Bajaj 2025-06-16 (2), Chola 2019-06-14 (5), HDFC 2019-09-19 (2) and 2025-08-26 (2), ICICI 2017-06-20 (1.1), Kotak 2026-01-14 (5), Shriram 2025-01-10 (5). Adj Close handles them.
