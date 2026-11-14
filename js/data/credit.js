/* Credit-risk observation repository.
   RULES: only values read from a document that was actually opened are recorded here.
   Everything else is absent (shown as "not yet verified" in the UI) - never estimated.
   status: "reported" | "unavailable". source_type: "primary" | "secondary". */
window.FRA_CREDIT = {
  entities: {
    HDFC:  { name: "HDFC Bank",      type: "Large private-sector bank (category a)", peer: "ICICI", color: "#4ea1ff" },
    ICICI: { name: "ICICI Bank",     type: "Primary peer of HDFC Bank",              peer: "HDFC",  color: "#a78bfa" },
    BAJAJ: { name: "Bajaj Finance",  type: "NBFC in the lending business (category d)", peer: "CHOLA", color: "#22d3ee" },
    CHOLA: { name: "Cholamandalam",  type: "Primary peer of Bajaj Finance",          peer: "BAJAJ", color: "#2dd4bf" }
  },
  periods: ["FY2017","FY2018","FY2019","FY2020","FY2021","FY2022","FY2023","FY2024","FY2025","FY2026"],
  metrics: [
    { key: "GNPA", label: "GNPA", unit: "%" },
    { key: "NNPA", label: "NNPA", unit: "%" },
    { key: "PCR", label: "PCR", unit: "%" },
    { key: "SLIPPAGE_RATIO", label: "Slippage ratio", unit: "%" },
    { key: "WRITEOFFS", label: "Write-offs", unit: "Rs crore" },
    { key: "CREDIT_COST", label: "Credit cost", unit: "%" },
    { key: "ADV_GROWTH", label: "Advances / AUM growth", unit: "%" },
    { key: "CRAR", label: "Capital adequacy (CRAR)", unit: "%" }
  ],
  sources: {
    S1: { title: "Bajaj Finance Ltd - Directors' Report, Annual Report FY2023-24 (Working Results, p. 97)", url: "https://www.bajajfinserv.in/finance-digital-annual-report-fy24/bajaj-finance-ltd-ar-2023-24-assets/pdf/director-report.pdf", type: "primary" },
    S2: { title: "Equitymaster - HDFC Bank 2023-24 Annual Report Analysis (Key Ratio Analysis)", url: "https://equitymaster.com/research-it/annual-results-analysis/HDBK/HDFC-BANK-2023-24-Annual-Report-Analysis/10666", type: "secondary" },
    S3: { title: "Business Standard - Bajaj Fin falls 4% as RBI bars lending under eCOM, Insta EMI Card (16 Nov 2023)", url: "https://www.business-standard.com/amp/markets/news/bajaj-fin-falls-4-as-rbi-bars-lending-under-ecom-insta-emi-card-schemes-123111600189_1.html", type: "secondary" },
    S4: { title: "Business Standard - HDFC Bank dips as RBI asks to halt digital launches, new credit cards (3 Dec 2020)", url: "https://www.business-standard.com/amp/article/markets/hdfc-bank-dips-1-as-rbi-asks-to-halt-digital-launches-new-credit-cards-120120300358_1.html", type: "secondary" }
  },
  observations: [
    { entity: "BAJAJ", period: "FY2024", metric: "GNPA", value: 0.85, unit: "%", status: "reported", source: "S1", page: "p. 97", basis: "Consolidated", reporting_date: "2024-03-31", notes: "As reported in Directors' Report. Earlier draft of this project showed 1.05% - not supported by this source." },
    { entity: "BAJAJ", period: "FY2024", metric: "NNPA", value: 0.37, unit: "%", status: "reported", source: "S1", page: "p. 97", basis: "Consolidated", reporting_date: "2024-03-31", notes: "Earlier draft showed 0.45% - not supported by this source." },
    { entity: "BAJAJ", period: "FY2024", metric: "ADV_GROWTH", value: 34, unit: "%", status: "reported", source: "S1", page: "p. 98", basis: "Consolidated AUM growth", reporting_date: "2024-03-31", notes: "AUM Rs 330,615 crore. FY2023 AUM growth was 25% (p. 97)." },
    { entity: "BAJAJ", period: "FY2023", metric: "ADV_GROWTH", value: 25, unit: "%", status: "reported", source: "S1", page: "p. 97", basis: "Consolidated AUM growth", reporting_date: "2023-03-31", notes: "Stated as the prior-year growth in the FY2024 report." },
    { entity: "HDFC", period: "FY2024", metric: "GNPA", value: 1.2, unit: "%", status: "reported", source: "S2", page: "Key Ratio Analysis", basis: "Bank, post-merger (secondary source)", reporting_date: "2024-03-31", notes: "Secondary source, rounded to 1 d.p. To be replaced by the annual report figure." },
    { entity: "HDFC", period: "FY2023", metric: "GNPA", value: 1.1, unit: "%", status: "reported", source: "S2", page: "Key Ratio Analysis", basis: "Bank, pre-merger (secondary source)", reporting_date: "2023-03-31", notes: "Secondary source, rounded to 1 d.p." },
    { entity: "HDFC", period: "FY2024", metric: "NNPA", value: 0.3, unit: "%", status: "reported", source: "S2", page: "Key Ratio Analysis", basis: "Bank, post-merger (secondary source)", reporting_date: "2024-03-31", notes: "Secondary source, rounded to 1 d.p." },
    { entity: "HDFC", period: "FY2023", metric: "NNPA", value: 0.3, unit: "%", status: "reported", source: "S2", page: "Key Ratio Analysis", basis: "Bank, pre-merger (secondary source)", reporting_date: "2023-03-31", notes: "Secondary source, rounded to 1 d.p." },
    { entity: "HDFC", period: "FY2024", metric: "ADV_GROWTH", value: 54.4, unit: "%", status: "reported", source: "S2", page: "Balance Sheet table", basis: "Advances, Rs 25,658,914 m vs Rs 16,619,493 m", reporting_date: "2024-03-31", notes: "Growth is inflated by the 1 Jul 2023 merger with HDFC Ltd (structural break) - not organic growth." }
  ],
  data_breaks: [
    { entity: "HDFC", when: "FY2024", what: "Merger of HDFC Ltd into HDFC Bank (effective 1 Jul 2023, date to be confirmed against a primary source). FY2024 balance sheet and growth are not comparable with FY2023 and earlier." },
    { entity: "BAJAJ", when: "FY2019", what: "Ind AS adoption by NBFCs (impairment on expected-credit-loss basis). To be documented from the annual report." },
    { entity: "ALL", when: "Nov 2021 - Oct 2022", what: "RBI circular on NPA classification (clarification, 12 Nov 2021; deadline extended to 30 Sep 2022). Affects comparability of GNPA across years. To be confirmed from RBI." }
  ]
};
