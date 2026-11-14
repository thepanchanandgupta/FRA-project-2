# FRA Group Project 2 — Market Data Cleaning & Validation Report

Stage: cleaning and validation only. **No financial analysis has been performed.**
Window: 3 Oct 2016 – 30 Sep 2026 (1 Oct 2016 was a Saturday; first trading day 3 Oct 2016). No observations after 30 Sep 2026.

## 1. Data layers

| Layer | Location | Notes |
|---|---|---|
| Raw (immutable) | `data/raw/` | 15 files, read-only. SHA-256 of every copy equals the uploaded original (`raw_manifest.csv`, 15/15 match). |
| Cleaned | `data/cleaned/prices_cleaned.csv` | Long format. Every row carries a `status` flag. Equities use Adj Close, indices use Close. |
| Validation / outputs | `data/validation/` | Exclusion log, coverage tables, event tables. |

Consolidated CSV vs 13 individual CSVs: identical (0 row differences, 0 value mismatches across all 8 value columns). Counts match `Download_Summary.csv`.

## 2. Classification of non-standard observations

| Category | Definition | Treatment |
|---|---|---|
| Market holiday (presumed) | Weekday absent from all 13 series (141 weekdays of 2,608) | No data expected. **Not verified against the official NSE holiday list** (source not reachable from the workspace). |
| Missing observation | Date in primary calendar where equities traded with volume but a series has no row | Left missing. No forward-fill. Listed in `missing_observations.csv`. |
| Excluded stale observation | Equity row with volume = 0, close = prior close, O=H=L=C | Removed from cleaned file; logged with original values. |
| Muhurat / special session | 27 Oct 2019 (Sun), 14 Nov 2020 (Sat); equities only | Preserved in cleaned file, flagged; outside primary calendar. |

Primary regular-session calendar: **2,466 trading days**.

## 3. Original vs retained rows

| Security | Original | Stale excluded | Retained in cleaned file | Muhurat (flagged) | Index rows outside calendar (flagged) | In primary calendar | Missing vs calendar | Coverage |
|---|---|---|---|---|---|---|---|---|
| HDFC Bank | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| Bajaj Finance | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| ICICI Bank | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| Cholamandalam | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| Axis Bank | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| Kotak Mahindra Bank | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| IndusInd Bank | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| Shriram Finance | 2,470 | 3 | 2,467 | 2 | 0 | 2,465 | 1 | 99.96% |
| M&M Financial | 2,470 | 3 | 2,467 | 2 | 0 | 2,465 | 1 | 99.96% |
| L&T Finance | 2,470 | 2 | 2,468 | 2 | 0 | 2,466 | 0 | 100.00% |
| Nifty Bank | 2,466 | 0 | 2,466 | 0 | 1 | 2,465 | 1 | 99.96% |
| Nifty Financial Services | 2,451 | 0 | 2,451 | 0 | 1 | 2,450 | 16 | 99.35% |
| Nifty 50 | 2,465 | 0 | 2,465 | 0 | 1 | 2,464 | 2 | 99.92% |

## 4. Exclusions (full detail in `exclusion_log.csv`)

| Date | Securities | Category |
|---|---|---|
| 2025-03-18 | All 10 equities | Stale excluded (indices traded: Nifty 50 +, Nifty Bank + — retained but outside calendar) |
| 2026-01-15 | All 10 equities | Stale excluded (no index data; presumed market holiday) |
| 2024-01-15 | Shriram Finance only | Stale excluded — **rule extension, needs your confirmation** |
| 2025-09-08 | M&M Financial only | Stale excluded — **rule extension, needs your confirmation** |
| 2019-10-27, 2020-11-14 | All 10 equities | Muhurat — preserved, flagged, not in primary calendar |

Missing observations: Nifty Financial Services 16 days (2021-01-01, 01-22, 02-15, 02-17, 05-05, 05-11, 05-20, 05-25, 05-31, 07-05, 2022-12-26, 2024-01-01, 2024-02-19, 2025-01-01, 2025-02-01, 2026-01-01); Nifty 50 2 days (2018-01-01, 2019-01-01); Nifty Bank 1 day (2025-02-01); Shriram 1; M&M Financial 1.

## 5. Benchmark coverage (primary entities and peers)

A daily return is counted as computable only if both series have an observation on that day **and** on the previous primary-calendar day. Nothing is filled or compressed, so one missing benchmark day removes two returns.

| Stock | Benchmark | Role | Common obs. days | Common coverage | Computable returns | Return coverage |
|---|---|---|---|---|---|---|
| HDFC Bank | Nifty Bank | primary | 2,465 / 2,466 | 99.96% | 2,463 / 2,465 | 99.92% |
| HDFC Bank | Nifty 50 | robustness | 2,464 | 99.92% | 2,461 | 99.84% |
| ICICI Bank | Nifty Bank | primary | 2,465 | 99.96% | 2,463 | 99.92% |
| ICICI Bank | Nifty 50 | robustness | 2,464 | 99.92% | 2,461 | 99.84% |
| Bajaj Finance | Nifty Fin. Services | primary | 2,450 | 99.35% | 2,433 | 98.70% |
| Bajaj Finance | Nifty 50 | robustness | 2,464 | 99.92% | 2,461 | 99.84% |
| Cholamandalam | Nifty Fin. Services | primary | 2,450 | 99.35% | 2,433 | 98.70% |
| Cholamandalam | Nifty 50 | robustness | 2,464 | 99.92% | 2,461 | 99.84% |

## 6. Provisional event list (availability test only)

Dates are **candidates for the data-coverage test**, not confirmed research findings. Only E05 and E08 have reaction days confirmed from a source this session (Business Standard). All others must be verified before analysis. Reaction day = first trading day on which the information could be priced.

| ID | Event | Type | Announcement | Reaction day | Status |
|---|---|---|---|---|---|
| E01 | Demonetisation announced | systematic | 2016-11-08 | 2016-11-09 | unverified |
| E02 | NBFC liquidity shock (IL&FS/DHFL) | systematic | 2018-09-21 | 2018-09-21 | unverified |
| E03 | ICICI CEO resignation | idiosyncratic (peer) | 2018-10-04 | 2018-10-04 | unverified |
| E04 | COVID crash day | systematic | 2020-03-23 | 2020-03-23 | unverified |
| E05 | HDFC: RBI halts digital launches/cards | idiosyncratic | 2020-12-02 | 2020-12-03 | reaction day verified |
| E06 | HDFC merger announced | idiosyncratic | 2022-04-04 | 2022-04-04 | unverified |
| E07 | RBI off-cycle rate hike | systematic | 2022-05-04 | 2022-05-04 | unverified |
| E08 | Bajaj: RBI bars eCOM/Insta EMI | idiosyncratic | 2023-11-15 | 2023-11-16 | order and fall verified; disclosure time to confirm |
| E09 | RBI raises unsecured-credit risk weights | systematic | 2023-11-16 | 2023-11-16 | unverified; overlaps E08 |

## 7. Event-window coverage

360 tests (9 events × 8 stock–benchmark pairs × 5 windows). **358 complete (100%); 2 incomplete.** Full detail: `event_window_coverage.csv`.

| Event | Pair | Window | Valid / required | Missing date |
|---|---|---|---|---|
| E05 | Bajaj Finance vs Nifty Fin. Services | [-20,+20] | 40 / 41 | 2021-01-01 |
| E05 | Cholamandalam vs Nifty Fin. Services | [-20,+20] | 40 / 41 | 2021-01-01 |

Both primary-entity event tests (HDFC–Nifty Bank, Bajaj–Nifty Fin. Services) are 100% complete for every window size on the events that matter most (E05 for HDFC, E08 for Bajaj), except the Bajaj/E05 case above, which is not a Bajaj event.

## 8. Estimation windows

Assumption (not yet approved): estimation window = trading days [-250, -31] relative to the reaction day (max 220 returns), adequacy threshold ≥ 120 valid returns.

| Event | Window dates | HDFC / ICICI vs Nifty Bank | Bajaj / Chola vs Nifty Fin. | vs Nifty 50 | Adequate? |
|---|---|---|---|---|---|
| E01 | none available | 0 | 0 | 0 | **No** — only ~25 trading days exist before the event |
| E02 | 2017-09-19 → 2018-08-03 | 220 | 220 | 218 | Yes |
| E03 | 2017-09-29 → 2018-08-16 | 220 | 220 | 218 | Yes |
| E04 | 2019-03-12 → 2020-02-05 | 220 | 220 | 220 | Yes |
| E05 | 2019-12-03 → 2020-10-19 | 220 | 220 | 220 | Yes, but see §9 |
| E06 | 2021-03-31 → 2022-02-16 | 220 | 208 | 220 | Yes |
| E07 | 2021-04-30 → 2022-03-16 | 220 | 208 | 220 | Yes |
| E08 | 2022-11-14 → 2023-09-29 | 220 | 218 | 220 | Yes |
| E09 | 2022-11-14 → 2023-09-29 | 220 | 218 | 220 | Yes |

## 9. Issues that affect analysis design

1. **E01 (demonetisation) cannot support a market-model event study.** There are about 25 trading days before 9 Nov 2016.
2. **E05 estimation window contains the COVID crash** (E04 is 174 trading days before it). This will distort alpha, beta and residual variance for HDFC.
3. **Overlapping event windows:** E08/E09 are the same reaction day (0 days apart), so the Bajaj-specific ban and the sector-wide risk-weight change cannot be separated by a daily event study. E02/E03 are 8 days apart, E06/E07 are 19 days apart.
4. Index-gap effect on estimation: Bajaj/Cholamandalam lose up to 12 returns in some windows because of Nifty Financial Services gaps (still adequate).

## 10. Limitations

- Holiday classification is inferred from the data, not checked against the NSE holiday list.
- Price levels are internally consistent but could not be checked against NSE/BSE from this workspace.
- Stocks use dividend-adjusted prices; indices are price-return. This is a known return-basis mismatch and will be documented in the methodology.
