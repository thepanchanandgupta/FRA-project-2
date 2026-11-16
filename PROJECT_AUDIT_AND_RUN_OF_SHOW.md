# FRA Group Project 2 — final coverage audit (pre-commit)

## Requirement status

| Requirement | Status | Evidence / treatment |
|---|---|---|
| Two eligible focal entities | COVERED | HDFC Bank (large private-sector bank) and Bajaj Finance (lending NBFC). |
| Peer set for each entity | COVERED | Four banking peers and four lending-NBFC peers. |
| Peer-selection rationale | COVERED | Banking peers selected for listed scale, diversified books and overlapping retail/SME/corporate exposures; NBFC peers for listed lending exposure across consumer, vehicle, MSME, rural and secured finance. Differences are disclosed. |
| Ten-year period | COVERED | FY2017–FY2026 credit series; daily share-price observations 3 Oct 2016–30 Sep 2026. |
| GNPA | COVERED | Complete ten-year series for all ten companies; missing observations are tagged simulated estimates. |
| NNPA | COVERED | Complete ten-year series for all ten companies; denominator breaks are explained and missing observations tagged. |
| PCR | COVERED | Complete ten-year series for all ten companies, including Chola; missing values are simulated academic estimates, not silently omitted. |
| Slippages | COVERED | FY2026 amounts and ratios for all ten companies; historical annual modelled ratios available for all ten. |
| Write-offs | COVERED | FY2026 amounts and ratios for all ten; missing values modelled and labelled. Provision write-backs are not conflated with loan write-offs. |
| Credit cost | COVERED | FY2026 credit-cost field and FY2017–FY2026 modelled series for all ten; source status is explicit. |
| Idiosyncratic risk | COVERED | HDFC technology restrictions, HDFC Ltd merger and Bajaj product restrictions analysed with drivers. |
| Systematic risk | COVERED | Demonetisation, IL&FS, COVID-19 and Russia–Ukraine macro shock analysed with transmission channels. |
| Share-price response | COVERED | Ten-year price histories and event-window benchmark-relative returns for both focal entities. |
| Credit-risk/share-price correlation | COVERED | Pearson correlation for all ten entities; sample size and simulated-credit provenance shown. Correlation is not described as causation. |
| Data breaks | COVERED | HDFC merger, ICICI denominator, Chola accounting/Stage 3, COVID relief and bank advances vs NBFC AUM noted. |
| Recruiter-friendly hosted dashboard | COVERED AS BUILD | Static-site structure, relative paths, concise six-section navigation; final hosting/browser test remains a release operation. |

**Important distinction:** Every assignment metric and analysis category is now populated (coverage complete). Some observations are simulated academic estimates because the underlying company disclosures were not present in the research pack or could not be consistently extracted. They are clearly tagged and must not be described as company-reported facts. A requirement can be marked covered while the data provenance remains simulated; it cannot be called independently verified reported data.

## Peer rationale

**Banks:** ICICI, Axis, Kotak and IndusInd are large listed private-sector banks with diversified loan books and overlapping retail, SME and corporate lending exposures. This supports a within-sector comparison. Differences in scale, product mix, underwriting, secured/unsecured mix and reporting definitions mean the peers are directional comparators, not identical twins.

**NBFCs:** Cholamandalam, Shriram Finance, L&T Finance and Mahindra Finance are listed lending NBFCs with material retail, vehicle, consumer, MSME, rural or secured-finance exposures and public market histories. Their business mix and asset-quality definitions differ; comparisons are therefore definition-aware.

## Metric completion and formulas

- GNPA, NNPA and PCR: FY2017–FY2026 for all ten institutions. Existing extracted/supplied observations retained. Missing years are modelled and tagged at metric/year level.
- Slippage ratio = gross fresh NPA additions ÷ average advances/AUM × 100.
- Write-off ratio = write-offs ÷ average advances/AUM × 100.
- Credit cost = impairment/provision charge ÷ average advances/AUM × 100.
- Flow amounts are in ₹ crore. Missing gross reductions, write-offs or credit-cost fields are modelled academic estimates and tagged. Gross reductions may include recoveries, upgrades and other movements; they are not automatically cash recoveries.
- PCR is a ratio with differing institution-specific definitions, especially around technical write-offs and provision scope. Chola's missing PCR is filled only as a simulated estimate and must be read as illustrative, not a disclosed ratio.

## Risk-driver analysis

**Systematic:** Demonetisation—cash disruption and borrower repayment/collection stress; IL&FS—NBFC funding confidence and refinancing; COVID—income and collection shock plus delayed NPA recognition under relief; Russia–Ukraine—risk aversion, commodity costs and inflation expectations.

**Idiosyncratic:** HDFC digital restrictions—operational/supervisory risk; HDFC Ltd merger—integration and reporting-perimeter change; Bajaj Finance restrictions—product-level supervisory constraints alongside sector-wide consumer-credit tightening. Event-window returns are descriptive benchmark-relative reactions, not causal estimates.

## Data and presentation caveats

- HDFC Ltd merger effective 1 July 2023 changes the post-merger perimeter.
- ICICI NNPA denominator changes affect historical comparability.
- Chola FY2017 IGAAP vs later Ind AS; Stage 3 and NPA definitions are not interchangeable.
- COVID relief affected timing of NPA recognition.
- Banks use advances while NBFCs commonly use AUM/business assets.
- Equity series use adjusted close; index benchmarks use close. Price-return and total-return bases are therefore not identical.
- Correlations use a short annual sample and do not establish causation.

## Final release checklist

- [x] All required metrics have values for all ten companies.
- [x] Missing data replaced only with explicitly labelled simulated academic estimates.
- [x] Peer rationale included.
- [x] Systematic and idiosyncratic risk drivers included.
- [x] Share-price response and correlation included.
- [x] Data breaks documented.
- [ ] Full browser visual QA (desktop/mobile and interaction testing).
- [ ] Confirm exact team-member spelling.
- [ ] User approval of files.
- [ ] Commit/push/deploy only after explicit user instruction.

## Presentation timing

For the user's eight-minute plan including two-minute Q&A: six minutes of presentation across five presenters. Suggested split: 1:10, 1:10, 1:10, 1:20, 1:10; reserve 2:00 for Q&A.