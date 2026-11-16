"""Event study + correlation analysis from the validated cleaned prices.
Usage: python3 -I market_analysis.py <repo_dir>
Outputs: <repo>/data/outputs/*.csv|json and <repo>/js/data/market.js
No forward-fill. Equities: Adj Close. Indices: Close (price index)."""
import sys, json, math
import numpy as np, pandas as pd
from scipy import stats

repo = sys.argv[1]
px = pd.read_csv(f'{repo}/data/cleaned/prices_cleaned.csv', parse_dates=['Date'])
cal = pd.read_csv(f'{repo}/data/validation/primary_calendar.csv', parse_dates=['primary_calendar_date'])['primary_calendar_date']
px = px[px.status == 'PRIMARY']
NAMES = {'HDFC Bank': 'HDFC', 'ICICI Bank': 'ICICI', 'Bajaj Finance': 'BAJAJ',
         'Cholamandalam Investment and Finance': 'CHOLA', 'Nifty Bank Index': 'NBANK',
         'Nifty Financial Services Index': 'NFIN', 'Nifty 50 Index': 'N50'}
px = px[px.Security.isin(NAMES)]
P = px.pivot(index='Date', columns='Security', values='analysis_price').rename(columns=NAMES)
P = P.reindex(cal)  # primary calendar; gaps stay NaN (no forward fill)
dates = list(P.index)
R = P.pct_change(fill_method=None)  # NaN if either day missing

BENCH = {'HDFC': 'NBANK', 'ICICI': 'NBANK', 'BAJAJ': 'NFIN', 'CHOLA': 'NFIN'}
STOCKS = ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA']
PEER = {'HDFC': 'ICICI', 'ICICI': 'HDFC', 'BAJAJ': 'CHOLA', 'CHOLA': 'BAJAJ'}

# Reaction day = first session in which the news could be priced (day 0)
EVENTS = [
 dict(id='E01', name='Demonetisation announced (evening 8 Nov 2016)', type='systematic', day='2016-11-09'),
 dict(id='E02', name='IL&FS / DHFL NBFC liquidity sell-off', type='systematic', day='2018-09-21'),
 dict(id='E03', name='ICICI Bank CEO Chanda Kochhar exits (Videocon probe)', type='idiosyncratic', day='2018-10-04', lender='ICICI'),
 dict(id='E04', name='COVID-19 market crash (Nifty 50 largest one-day fall)', type='systematic', day='2020-03-23'),
 dict(id='E05', name='RBI curbs HDFC Bank digital launches / new credit cards', type='idiosyncratic', day='2020-12-03', lender='HDFC'),
 dict(id='E06', name='HDFC Ltd - HDFC Bank merger announced', type='idiosyncratic', day='2022-04-04', lender='HDFC'),
 dict(id='E07', name='RBI off-cycle repo-rate hike', type='systematic', day='2022-05-04'),
 dict(id='E08', name='RBI bars Bajaj Finance eCOM / Insta EMI Card', type='idiosyncratic', day='2023-11-16', lender='BAJAJ'),
 dict(id='E09', name='RBI raises risk weights on consumer credit / bank loans to NBFCs', type='systematic', day='2023-11-16'),
]
for e in EVENTS:
    e['t0'] = dates.index(pd.Timestamp(e['day']))
t0s = sorted({e['t0'] for e in EVENTS})

EST_LO, EST_HI, MIN_EST = -250, -31, 120
WINDOWS = {'[0,0]': (0, 0), '[-1,+1]': (-1, 1), '[-5,+5]': (-5, 5), '[-10,+10]': (-10, 10), '[0,+20]': (0, 20)}

def est_idx(t0):
    idx = [i for i in range(t0 + EST_LO, t0 + EST_HI + 1) if i >= 1]
    # drop any day inside +/-20 sessions of ANOTHER event's reaction day
    out = []
    for i in idx:
        if any(abs(i - o) <= 20 for o in t0s if o != t0):
            continue
        out.append(i)
    return out

def fit(stock, bench, t0):
    idx = est_idx(t0)
    y = R[stock].iloc[idx]; x = R[bench].iloc[idx]
    m = y.notna() & x.notna()
    y, x = y[m].values, x[m].values
    if len(y) < MIN_EST:
        return None
    X = np.column_stack([np.ones(len(x)), x])
    b, *_ = np.linalg.lstsq(X, y, rcond=None)
    res = y - X @ b
    s2 = res @ res / (len(y) - 2)
    XtXi = np.linalg.inv(X.T @ X)
    return dict(a=b[0], b=b[1], s=math.sqrt(s2), n=len(y), XtXi=XtXi, res=res,
                r2=1 - (res @ res) / ((y - y.mean()) @ (y - y.mean())))

def window_stats(stock, bench, t0, lo, hi, f):
    ii = list(range(t0 + lo, t0 + hi + 1))
    y = R[stock].iloc[ii].values; x = R[bench].iloc[ii].values
    if np.isnan(y).any() or np.isnan(x).any():
        return None
    raw = float(np.prod(1 + y) - 1)
    braw = float(np.prod(1 + x) - 1)
    out = dict(raw=raw, bench=braw, excess_raw=raw - braw)
    if f is None:
        return out
    ar = y - (f['a'] + f['b'] * x)
    car = float(ar.sum()); L = len(ar)
    # prediction-error variance of the CAR (sums the forecast-error covariance)
    Xw = np.column_stack([np.ones(L), x]); v = Xw.sum(axis=0)
    var = f['s'] ** 2 * (L + v @ f['XtXi'] @ v)
    t = car / math.sqrt(var)
    p = 2 * (1 - stats.t.cdf(abs(t), f['n'] - 2))
    # empirical placebo: all overlapping L-day residual sums in the estimation window
    r = f['res']
    sums = np.array([r[k:k + L].sum() for k in range(len(r) - L + 1)]) if len(r) >= L else np.array([])
    pe = float((np.abs(sums) >= abs(car)).mean()) if len(sums) else None
    out.update(car=car, t=float(t), p=float(p), placebo_p=pe)
    return out

results = []
for e in EVENTS:
    for s in STOCKS:
        for bname, b in (('primary', BENCH[s]), ('robust_N50', 'N50')):
            f = fit(s, b, e['t0'])
            row = dict(event=e['id'], stock=s, benchmark=b, bench_role=bname,
                       est_n=None if f is None else f['n'],
                       alpha=None if f is None else f['a'], beta=None if f is None else f['b'],
                       resid_sd=None if f is None else f['s'])
            for wn, (lo, hi) in WINDOWS.items():
                w = window_stats(s, b, e['t0'], lo, hi, f)
                row[wn] = w
            results.append(row)

# --- recovery: sessions until Adj Close >= close of day -1 (within 250 sessions) ---
def recovery(stock, t0):
    base = P[stock].iloc[t0 - 1]
    if np.isnan(base): return None
    low = None
    for k in range(0, 251):
        v = P[stock].iloc[t0 + k] if t0 + k < len(P) else np.nan
        if np.isnan(v): continue
        if k == 0 and v >= base:
            return dict(status='no_decline_day0', days=0)
        if v >= base and k > 0:
            return dict(status='recovered', days=k)
    return dict(status='not_recovered_within_250', days=None)

rec = {}
trough = {}
for e in EVENTS:
    for s in STOCKS:
        rec[(e['id'], s)] = recovery(s, e['t0'])
        seg = P[s].iloc[e['t0'] - 1:e['t0'] + 61]
        base = P[s].iloc[e['t0'] - 1]
        trough[(e['id'], s)] = float(seg.min() / base - 1) if not np.isnan(base) else None

# --- day-0 intraday context (unadjusted Open/Low vs prior Close; no dividend ex-dates fall on these days) ---
RAW = px.pivot(index='Date', columns='Security', values='Close').rename(columns=NAMES).reindex(cal)
OPN = px.pivot(index='Date', columns='Security', values='Open').rename(columns=NAMES).reindex(cal)
LOW = px.pivot(index='Date', columns='Security', values='Low').rename(columns=NAMES).reindex(cal)
VOL = px.pivot(index='Date', columns='Security', values='Volume').rename(columns=NAMES).reindex(cal)
intraday = {}
for e in EVENTS:
    for s in STOCKS:
        pc = RAW[s].iloc[e['t0'] - 1]
        o, l, c = OPN[s].iloc[e['t0']], LOW[s].iloc[e['t0']], RAW[s].iloc[e['t0']]
        v0 = VOL[s].iloc[e['t0']]; vavg = VOL[s].iloc[e['t0'] - 60:e['t0'] - 1].mean()
        intraday[f"{e['id']}|{s}"] = dict(open_gap=float(o / pc - 1), low_vs_prev=float(l / pc - 1), close_vs_prev=float(c / pc - 1),
                                          vol_ratio=float(v0 / vavg) if vavg else None)

# --- indexed event paths (day -1 = 100), offsets -20..+40 ---
paths = {}
for e in EVENTS:
    offs = list(range(-20, 41)); d = {}
    for c in STOCKS + ['NBANK', 'NFIN', 'N50']:
        base = P[c].iloc[e['t0'] - 1]
        d[c] = [None if (np.isnan(P[c].iloc[e['t0'] + o]) or np.isnan(base) or e['t0'] + o < 0)
                else round(float(P[c].iloc[e['t0'] + o] / base * 100), 2) for o in offs]
    paths[e['id']] = dict(offsets=offs, series=d, date0=e['day'])

# --- full-history indexed (3 Oct 2016 = 100) ---
base0 = P.iloc[0]
full = dict(dates=[d.strftime('%Y-%m-%d') for d in dates])
for c in STOCKS + ['NBANK', 'NFIN']:
    full[c] = [None if np.isnan(v) else round(float(v / base0[c] * 100), 1) for v in P[c].values]

# --- daily return co-movement ---
def corr(a, b, mask=None):
    m = R[a].notna() & R[b].notna()
    if mask is not None: m &= mask
    if m.sum() < 30: return None
    r, p = stats.pearsonr(R[a][m], R[b][m])
    return dict(r=float(r), n=int(m.sum()))
fy = pd.Series([d.year + (1 if d.month >= 4 else 0) for d in dates], index=P.index)  # FY label = year of 31 Mar end
comove = {}
for s in STOCKS:
    comove[s] = dict(vs_bench=corr(s, BENCH[s]), vs_peer=corr(s, PEER[s]), bench=BENCH[s], peer=PEER[s],
                     by_fy={})
    for y in range(2017, 2027):
        mk = (fy == y)
        comove[s]['by_fy'][f'FY{y}'] = dict(vs_bench=corr(s, BENCH[s], mk), vs_peer=corr(s, PEER[s], mk))
# Pairs across bank/NBFC for context
comove['cross_HDFC_BAJAJ'] = corr('HDFC', 'BAJAJ')

# --- annual: price return vs change in credit indicators ---
import re, subprocess
node = subprocess.run(['node', '-e', "global.window={};require('%s/js/data/credit.js');console.log(JSON.stringify(window.FRA_CREDIT.observations))" % repo],
                      capture_output=True, text=True, check=True).stdout
obs = json.loads(node)
cv = {(o['entity'], o['period'], o['metric']): o['value'] for o in obs if o['kind'] == 'reported' and o['value'] is not None}

def fy_end(y):
    cut = pd.Timestamp(f'{y}-03-31')
    ok = [d for d in dates if d <= cut]
    return ok[-1] if ok else None
FYS = list(range(2017, 2027))
annual_px = {}
for s in STOCKS:
    annual_px[s] = {}
    for y in FYS:
        d = fy_end(y)
        v = P[s].get(d, np.nan) if d is not None else np.nan
        annual_px[s][f'FY{y}'] = dict(date=None if d is None else d.strftime('%Y-%m-%d'), px=None if np.isnan(v) else round(float(v), 2))
    prev = None
    for y in FYS:
        k = f'FY{y}'
        cur = annual_px[s][k]['px']; p0 = annual_px[s].get(f'FY{y-1}', {}).get('px')
        annual_px[s][k]['ret'] = None if (cur is None or p0 is None) else round(cur / p0 - 1, 4)
# FY2017: price base at 31 Mar 2016 not in data (data starts 3 Oct 2016) -> unavailable
annual_px_note = 'FY2017 return unavailable: price data starts 3 Oct 2016, so the 31 Mar 2016 base does not exist.'

def pairs(s, metric, lag=0, excl=()):
    xs, ys, lab = [], [], []
    for y in range(2018, 2027):
        yc = y + lag
        if yc > 2026 or f'FY{y}' in excl: continue
        r = annual_px[s][f'FY{y}']['ret']
        a = cv.get((s, f'FY{yc}', metric)); b = cv.get((s, f'FY{yc-1}', metric))
        if r is None or a is None or b is None: continue
        xs.append(r); ys.append(round(a - b, 4)); lab.append(f'FY{y}' if lag == 0 else f'ret FY{y} / d{metric} FY{yc}')
    return xs, ys, lab

def corr_block(xs, ys):
    n = len(xs)
    if n < 4: return dict(n=n, pearson=None, spearman=None)
    pr = stats.pearsonr(xs, ys); sr = stats.spearmanr(xs, ys)
    return dict(n=n, pearson=float(pr[0]), pearson_p=float(pr[1]), spearman=float(sr[0]), spearman_p=float(sr[1]))

annual = []
for s in STOCKS:
    for metric in ('GNPA', 'NNPA', 'PCR'):
        for lag in (0, 1):
            for excl_label, excl in (('all', ()), ('ex_FY2024', ('FY2024',) if s == 'HDFC' else ())):
                if excl_label == 'ex_FY2024' and s != 'HDFC': continue
                xs, ys, lab = pairs(s, metric, lag, excl)
                annual.append(dict(stock=s, metric=metric, lag=lag, sample=excl_label, **corr_block(xs, ys),
                                   points=[dict(label=l, ret=x, d=y) for l, x, y in zip(lab, xs, ys)]))

# levels (for contrast; NOT used for conclusions): price-level vs GNPA-level
levels = []
for s in STOCKS:
    xs, ys = [], []
    for y in FYS:
        p = annual_px[s][f'FY{y}']['px']; g = cv.get((s, f'FY{y}', 'GNPA'))
        if p is not None and g is not None: xs.append(p); ys.append(g)
    levels.append(dict(stock=s, **corr_block(xs, ys)))

out = dict(
  meta=dict(source='Yahoo-Finance-style daily history supplied by the team (13 securities), 3 Oct 2016 - 30 Sep 2026, cleaned by the team validation step',
            frequency='daily', base_date='2016-10-03', calendar_days=len(dates),
            adjustment='Equities: Adj Close (dividend and split adjusted, total-return style). Indices: Close (price indices, no dividends).',
            gaps='No forward-fill. Return is set to missing if either consecutive session is missing. Nifty Financial Services has 16 missing sessions.',
            estimation=f'Market model, estimation window [{EST_LO},{EST_HI}] sessions, minimum {MIN_EST} valid returns, other events within +/-20 sessions excluded',
            ),
  events=EVENTS, results=results, recovery={f'{k[0]}|{k[1]}': v for k, v in rec.items()},
  trough60={f'{k[0]}|{k[1]}': v for k, v in trough.items()}, intraday=intraday, comove=comove, annual_px=annual_px,
  annual_px_note=annual_px_note, annual=annual, levels=levels)
import os
os.makedirs(f'{repo}/data/outputs', exist_ok=True)
json.dump(out, open(f'{repo}/data/outputs/market_analysis.json', 'w'), indent=1, default=float)
js = 'window.FRA_MARKET = ' + json.dumps(dict(out, paths=paths, full=full), separators=(',', ':'), default=float) + ';\n'
open(f'{repo}/js/data/market.js', 'w').write('/* Market data + recomputed event study/correlations. Generated by market_analysis.py from data/cleaned/prices_cleaned.csv */\n' + js)
print('events', [(e['id'], e['t0']) for e in EVENTS])
