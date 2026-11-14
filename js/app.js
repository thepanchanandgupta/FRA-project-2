/* FRA Group Project 2 - Credit Risk Intelligence | app logic
   Data layers (all static, no backend): FRA_MARKET (prices), FRA_EVENTS (event-study outputs),
   FRA_CREDIT (verified credit observations + sources), FRA_VALIDATION (cleaning report). */
(function () {
'use strict';
const M = window.FRA_MARKET, E = window.FRA_EVENTS, C = window.FRA_CREDIT, V = window.FRA_VALIDATION;
const HAS_CHART = typeof Chart !== 'undefined';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAMES = M.names, DATES = M.dates, N = DATES.length;
const COL = { 'HDFCBANK.NS': '#4ea1ff', 'ICICIBANK.NS': '#a78bfa', 'BAJFINANCE.NS': '#22d3ee', 'CHOLAFIN.NS': '#2dd4bf', 'AXISBANK.NS': '#f59e0b', 'KOTAKBANK.NS': '#f472b6', 'INDUSINDBK.NS': '#94a3b8', 'SHRIRAMFIN.NS': '#fb923c', 'M&MFIN.NS': '#84cc16', 'LTF.NS': '#e879f9', '^NSEBANK': '#e8eefc', 'NIFTY_FIN_SERVICE.NS': '#fde68a', '^NSEI': '#9ca3af' };
const BENCH = ['^NSEBANK', 'NIFTY_FIN_SERVICE.NS', '^NSEI'];
const GROUP = { 'HDFCBANK.NS': 'bank', 'ICICIBANK.NS': 'bank', 'AXISBANK.NS': 'bank', 'KOTAKBANK.NS': 'bank', 'INDUSINDBK.NS': 'bank', 'BAJFINANCE.NS': 'nbfc', 'CHOLAFIN.NS': 'nbfc', 'SHRIRAMFIN.NS': 'nbfc', 'M&MFIN.NS': 'nbfc', 'LTF.NS': 'nbfc' };
const PRIMARY_BENCH = { bank: '^NSEBANK', nbfc: 'NIFTY_FIN_SERVICE.NS' };
const STUDY_STOCKS = ['HDFCBANK.NS', 'ICICIBANK.NS', 'BAJFINANCE.NS', 'CHOLAFIN.NS'];
const EVMETA = {
  E01: { ent: ['ALL'], ok: false }, E02: { ent: ['ALL'], ok: false }, E03: { ent: ['ICICI'], ok: false }, E04: { ent: ['ALL'], ok: false },
  E05: { ent: ['HDFC'], ok: true, src: ['S4'], text: 'RBI advised HDFC Bank to temporarily stop launches of digital business-generating activities under its Digital 2.0 programme and the sourcing of new credit-card customers, and asked the board to examine the lapses and fix accountability. Shares ended over 2% lower at Rs 1,377 on the BSE on 3 Dec 2020 (as reported).' },
  E06: { ent: ['HDFC'], ok: false }, E07: { ent: ['ALL'], ok: false },
  E08: { ent: ['BAJAJ'], ok: true, src: ['S3'], text: 'RBI prohibited Bajaj Finance from sanctioning and disbursing loans under its eCOM and Insta EMI Card products (direction dated 15 Nov 2023). Shares fell 4% intraday on 16 Nov 2023 but closed 1.9% higher at Rs 7,366 (as reported) - the raw headline fall did not hold at the close.' },
  E09: { ent: ['ALL'], ok: false }
};
if (HAS_CHART) {
  Chart.defaults.color = '#8fa0c4'; Chart.defaults.font.family = "Inter, system-ui, sans-serif"; Chart.defaults.font.size = 12;
  Chart.defaults.borderColor = 'rgba(255,255,255,.07)';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(8,14,30,.94)'; Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,.14)';
  Chart.defaults.plugins.tooltip.borderWidth = 1; Chart.defaults.plugins.tooltip.padding = 12; Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.legend.labels.usePointStyle = true; Chart.defaults.plugins.legend.labels.boxWidth = 8;
  if (REDUCED) Chart.defaults.animation = false;
}
const charts = {};
function mk(id, cfg) { if (!HAS_CHART) return null; if (charts[id]) charts[id].destroy(); const el = document.getElementById(id); if (!el) return null; charts[id] = new Chart(el, cfg); return charts[id]; }
document.addEventListener('DOMContentLoaded', () => { if (!HAS_CHART) $$('.chart-box').forEach(b => { b.innerHTML = '<p class="note warn">The charting library could not be loaded (offline?). Tables and figures remain available.</p>'; }); });

/* ---------- formatting ---------- */
const f1 = (x, d = 1) => x == null || isNaN(x) ? '-' : (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d);
const fx = (x, d = 2) => x == null || isNaN(x) ? '-' : x.toFixed(d);
const pc = (x, d = 1) => x == null || isNaN(x) ? '-' : x.toFixed(d) + '%';
const sgnCls = x => x == null ? '' : x >= 0 ? 'pos' : 'neg';
const nm = t => NAMES[t] || t;
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---------- market statistics (computed in-browser from FRA_MARKET) ---------- */
const retCache = {};
function rets(t) { if (retCache[t]) return retCache[t]; const p = M.index[t], r = new Array(N).fill(null); for (let i = 1; i < N; i++) if (p[i] != null && p[i - 1] != null) r[i] = p[i] / p[i - 1] - 1; return retCache[t] = r; }
function mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
function sd(a) { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); }
function pairStats(t, b) {
  const rt = rets(t), rb = rets(b), x = [], y = [];
  for (let i = 1; i < N; i++) if (rt[i] != null && rb[i] != null) { x.push(rb[i]); y.push(rt[i]); }
  const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return { beta: sxy / sxx, corr: sxy / Math.sqrt(sxx * syy), n: x.length };
}
function lastNN(a) { for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; }
function firstNN(a) { for (let i = 0; i < a.length; i++) if (a[i] != null) return i; return -1; }
function maxDD(p) { let peak = -Infinity, pk = 0, worst = 0, wi = 0, wp = 0; for (let i = 0; i < p.length; i++) { if (p[i] == null) continue; if (p[i] > peak) { peak = p[i]; pk = i; } const dd = p[i] / peak - 1; if (dd < worst) { worst = dd; wi = i; wp = pk; } } return { dd: worst, trough: wi, peak: wp }; }
function drawdownSeries(p) { let peak = -Infinity; return p.map(v => { if (v == null) return null; if (v > peak) peak = v; return (v / peak - 1) * 100; }); }
const yrs = (DATES[N - 1] ? (new Date(DATES[N - 1]) - new Date(DATES[0])) / 31557600000 : 10);
const STATS = {};
Object.keys(M.index).forEach(t => {
  const p = M.index[t], i0 = firstNN(p), i1 = lastNN(p), r = rets(t).filter(v => v != null);
  const s = { mult: p[i1] / p[i0], cagr: Math.pow(p[i1] / p[i0], 1 / yrs) - 1, vol: sd(r) * Math.sqrt(250), dd: maxDD(p) };
  if (GROUP[t]) Object.assign(s, pairStats(t, PRIMARY_BENCH[GROUP[t]]));
  STATS[t] = s;
});

/* ---------- event-study accessors ---------- */
const WINS = ['[-1,+1]', '[-3,+3]', '[-5,+5]', '[-10,+10]', '[-20,+20]'];
const evRec = (ev, st, role) => E.results.find(r => r.event === ev && r.stock === st && r.role === role);
function carOf(ev, st, win, role = 'primary') { const r = evRec(ev, st, role); if (!r) return null; const c = r.car[win]; if (!c) return null; return c.car_pct != null ? { v: c.car_pct, t: c.t, model: true } : { v: c.mkt_adj_cum_pct, t: null, model: false }; }
const evInfo = id => E.events.find(e => e.id === id);
const evShort = id => ({ E01: 'Demonetisation', E02: 'NBFC liquidity shock', E03: 'ICICI CEO exit', E04: 'COVID crash day', E05: 'HDFC RBI curbs', E06: 'HDFC merger news', E07: 'RBI rate hike', E08: 'Bajaj eCOM/Insta EMI ban', E09: 'RBI risk weights' }[id] || id);

/* ---------- reveal / nav / progress ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.querySelector('[data-count]')) countUp(e.target); } }), { threshold: .12 });
function watch() { $$('.reveal:not(.in)').forEach(el => io.observe(el)); }
function countUp(root) {
  $$('[data-count]', root).forEach(el => {
    if (el.dataset.done) return; el.dataset.done = 1;
    const to = parseFloat(el.dataset.count), d = parseInt(el.dataset.dec || 0), suf = el.dataset.suf || '';
    if (REDUCED) { el.textContent = to.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) + suf; return; }
    const t0 = performance.now(), dur = 1200;
    (function step(t) { const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) + suf; if (k < 1) requestAnimationFrame(step); })(t0);
  });
}
const links = $('#links');
$('#burger').addEventListener('click', e => { const o = links.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
$$('#links a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
const secs = $$('section[id]');
function onScroll() {
  const h = document.documentElement.scrollHeight - innerHeight; $('#progress').style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  $('#toTop').classList.toggle('show', scrollY > 600);
  let cur = secs[0].id; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
  $$('#links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
$('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));
document.addEventListener('mousemove', e => { const c = e.target.closest && e.target.closest('.spot'); if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); } });
document.addEventListener('click', e => { const t = e.target.closest('.tab[data-pane]'); if (!t) return; const box = t.closest('.tabhost'); $$('.tab', box).forEach(x => x.classList.toggle('on', x === t)); $$('.tabpane', box).forEach(p => p.classList.toggle('on', p.id === t.dataset.pane)); window.dispatchEvent(new Event('resize')); });

/* ---------- hero canvas (real indexed prices, log scale) ---------- */
function hero() {
  const cv = $('#heroCanvas'); if (!cv) return; const ser = ['HDFCBANK.NS', 'BAJFINANCE.NS', '^NSEBANK', '^NSEI'];
  $('#heroLegend').innerHTML = ser.map(t => `<span><i class="dot" style="background:${COL[t]}"></i> ${nm(t)} ${fx(STATS[t].mult, 1)}&times;</span>`).join('');
  let prog = REDUCED ? 1 : 0;
  function draw() {
    const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, w, h);
    const all = ser.flatMap(t => M.index[t].filter(v => v != null)), lo = Math.log(Math.min(...all) * .9), hi = Math.log(Math.max(...all) * 1.05), pad = { l: 8, r: 8, t: 10, b: 18 };
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { const y = pad.t + (h - pad.t - pad.b) * i / 4; g.beginPath(); g.moveTo(pad.l, y); g.lineTo(w - pad.r, y); g.stroke(); }
    const upto = Math.floor(N * prog);
    ser.forEach(t => {
      const p = M.index[t]; g.beginPath(); let st = false;
      for (let i = 0; i < upto; i++) { if (p[i] == null) continue; const x = pad.l + (w - pad.l - pad.r) * i / (N - 1), y = pad.t + (h - pad.t - pad.b) * (1 - (Math.log(p[i]) - lo) / (hi - lo)); if (!st) { g.moveTo(x, y); st = true; } else g.lineTo(x, y); }
      g.strokeStyle = COL[t]; g.lineWidth = t === 'HDFCBANK.NS' || t === 'BAJFINANCE.NS' ? 2.2 : 1.3; g.globalAlpha = t.startsWith('^') ? .55 : 1; g.shadowColor = COL[t]; g.shadowBlur = t.startsWith('^') ? 0 : 10; g.stroke(); g.globalAlpha = 1; g.shadowBlur = 0;
    });
    g.fillStyle = '#5d6c8f'; g.font = '11px Inter'; g.fillText('2016', pad.l, h - 4); g.fillText('2026', w - 34, h - 4);
  }
  (function loop() { draw(); if (prog < 1) { prog = Math.min(1, prog + .012); requestAnimationFrame(loop); } })();
  addEventListener('resize', draw);
}

/* ---------- executive ---------- */
function creditCounts() {
  const total = Object.keys(C.entities).length * C.periods.length * C.metrics.length;
  const ver = C.observations.filter(o => o.status === 'reported').length; return { ver, total };
}
function executive() {
  const cc = creditCounts();
  const k = [
    { v: 10.0, d: 1, l: 'Years analysed', s: '', sub: '3 Oct 2016 - 30 Sep 2026' },
    { v: V.calendar_days, d: 0, l: 'Trading days validated', s: '', sub: '13 securities, raw data untouched' },
    { v: STATS['HDFCBANK.NS'].mult, d: 1, l: 'HDFC Bank total return', s: 'x', sub: 'adjusted close, 10 years' },
    { v: STATS['BAJFINANCE.NS'].mult, d: 1, l: 'Bajaj Finance total return', s: 'x', sub: 'adjusted close, 10 years' },
    { v: E.events.length, d: 0, l: 'Events studied', s: '', sub: '2 source-verified, rest candidates' },
    { v: E.results.length, d: 0, l: 'Event-study tests', s: '', sub: 'events x stocks x benchmarks' },
    { v: cc.ver, d: 0, l: 'Verified credit observations', s: '', sub: 'of ' + cc.total + ' grid cells so far' },
    { v: STATS['^NSEBANK'].mult, d: 1, l: 'Nifty Bank (price index)', s: 'x', sub: 'benchmark for banks' }
  ];
  $('#kpis').innerHTML = k.map(x => `<div class="glass spot kpi"><div class="v" data-count="${x.v}" data-dec="${x.d}" data-suf="${x.s}">0</div><div class="l">${x.l}</div><div class="d">${x.sub}</div></div>`).join('');
  const rows = ['HDFCBANK.NS', 'ICICIBANK.NS', 'BAJFINANCE.NS', 'CHOLAFIN.NS', '^NSEBANK', 'NIFTY_FIN_SERVICE.NS', '^NSEI'];
  $('#retTable').innerHTML = '<thead><tr><th>Series</th><th class="num">Multiple</th><th class="num">CAGR</th><th class="num">Ann. vol</th><th class="num">Max drawdown</th></tr></thead><tbody>' +
    rows.map(t => { const s = STATS[t]; return `<tr><td><i class="dot" style="background:${COL[t]}"></i> ${nm(t)}</td><td class="num">${fx(s.mult)}x</td><td class="num">${pc(s.cagr * 100)}</td><td class="num">${pc(s.vol * 100)}</td><td class="num neg">${pc(s.dd.dd * 100)}</td></tr>`; }).join('') + '</tbody>';
  const g = (ev, st, w) => carOf(ev, st, w), pf = x => x ? `${f1(x.v)}%${x.t != null ? ` (t ${f1(x.t, 2)})` : ''}` : 'n/a';
  $('#execAnswer').innerHTML = `<h3>Current answer</h3>
    <p class="note warn" style="margin-top:12px"><strong>Credit-risk ranking: pending.</strong> Only ${cc.ver} of ${cc.total} credit-risk grid cells are backed by a verified source. A ranking on a handful of numbers would contradict the project's own rule against judging lenders on a single ratio, so none is made.</p>
    <p style="margin-top:12px"><strong>What the market data already shows</strong> (associations, not proven causes):</p>
    <ul style="margin:8px 0 0 18px;color:var(--muted);display:grid;gap:7px;font-size:.92rem">
      <li>NBFC liquidity shock, Sept 2018 (candidate date): Bajaj Finance CAR [-5,+5] ${pf(g('E02', 'BAJFINANCE.NS', '[-5,+5]'))} vs Cholamandalam ${pf(g('E02', 'CHOLAFIN.NS', '[-5,+5]'))} - a sector-wide shock hitting both NBFCs.</li>
      <li>HDFC Bank, RBI digital-launch curbs (3 Dec 2020, verified): CAR [-5,+5] ${pf(g('E05', 'HDFCBANK.NS', '[-5,+5]'))} vs ICICI ${pf(g('E05', 'ICICIBANK.NS', '[-5,+5]'))}.</li>
      <li>Bajaj Finance, RBI eCOM/Insta EMI restriction (16 Nov 2023, verified): CAR [-5,+5] ${pf(g('E08', 'BAJFINANCE.NS', '[-5,+5]'))} vs Cholamandalam ${pf(g('E08', 'CHOLAFIN.NS', '[-5,+5]'))}.</li>
    </ul>
    <p class="src">Market-model abnormal returns, primary benchmarks. t-statistics in brackets; |t| &gt; 1.96 indicates significance at about the 5% level.</p>`;
}

/* ---------- entity sections ---------- */
function obsFor(ent, metric, period) { return C.observations.find(o => o.entity === ent && o.metric === metric && o.period === period && o.status === 'reported'); }
function entitySection(id, main, peer, tMain, tPeer) {
  const bench = PRIMARY_BENCH[GROUP[tMain]], host = $('#entity' + id), ent = C.entities[main], pe = C.entities[peer];
  const gridRow = (e, lab) => C.metrics.map(m => `<tr><td>${lab} &middot; ${m.label} <span style="color:var(--faint)">(${m.unit})</span></td>${C.periods.map(p => { const o = obsFor(e, m.key, p); return o ? `<td class="num" title="${esc(o.basis)} | ${esc(C.sources[o.source].title)} | ${esc(o.page)}${o.source && C.sources[o.source].type === 'secondary' ? ' | SECONDARY SOURCE' : ''}"><b>${o.value}</b>${C.sources[o.source].type === 'secondary' ? '<sup>s</sup>' : ''}</td>` : '<td class="num na" title="Not yet verified from a source - not estimated">&ndash;</td>'; }).join('')}</tr>`).join('');
  const myObs = C.observations.filter(o => o.entity === main || o.entity === peer);
  const metricOpts = C.metrics.map(m => `<option value="${m.key}">${m.label} (${m.unit})</option>`).join('');
  host.innerHTML = `<div class="tabhost"><div class="tabs"><button class="tab on" data-pane="${id}-credit">Credit risk</button><button class="tab" data-pane="${id}-market">Market profile</button><button class="tab" data-pane="${id}-events">Events</button></div>
  <div class="tabpane on" id="${id}-credit">
    <div class="grid g2"><div class="glass chart-card"><h3>${ent.name} vs ${pe.name}</h3><div class="sub">Verified observations only. Gaps mean "not yet verified", never zero.</div>
      <div class="controls"><label class="field">Metric<select id="${id}-metric">${metricOpts}</select></label></div>
      <div class="chart-box"><canvas id="${id}-cc"></canvas></div><p class="src" id="${id}-ccmsg"></p></div>
    <div class="glass chart-card"><h3>Data completeness</h3><div class="sub">${C.metrics.length} metrics &times; ${C.periods.length} fiscal years per entity</div><div id="${id}-comp"></div>
      <p class="note warn">Slippages, write-offs, credit cost, restructured assets and provisions are being collected from annual reports and investor presentations. Until a value is read from a source it stays blank.</p></div></div>
    <div class="glass chart-card" style="margin-top:20px"><h3>Verified credit-risk grid</h3><div class="sub">Hover a value for basis, source and page. <sup>s</sup> = secondary source (to be replaced by the annual report).</div>
      <div class="tbl-wrap"><table><thead><tr><th>Entity &middot; metric</th>${C.periods.map(p => `<th class="num">${p}</th>`).join('')}</tr></thead><tbody>${gridRow(main, ent.name)}${gridRow(peer, pe.name)}</tbody></table></div></div>
    <div class="glass chart-card" style="margin-top:20px"><h3>Provenance</h3><div class="tbl-wrap"><table><thead><tr><th>Entity</th><th>Period</th><th>Metric</th><th class="num">Value</th><th>Basis</th><th>Source</th><th>Note</th></tr></thead><tbody>${myObs.map(o => `<tr><td>${C.entities[o.entity].name}</td><td>${o.period}</td><td>${o.metric}</td><td class="num">${o.value}${o.unit === '%' ? '%' : ''}</td><td>${esc(o.basis)}</td><td><a href="${C.sources[o.source].url}" target="_blank" rel="noopener">${o.source}</a> &middot; ${esc(o.page)}</td><td style="white-space:normal;min-width:240px">${esc(o.notes)}</td></tr>`).join('')}</tbody></table></div></div>
  </div>
  <div class="tabpane" id="${id}-market">
    <div class="grid g2"><div class="glass chart-card"><h3>Indexed price: ${nm(tMain)} vs ${nm(tPeer)} vs ${nm(bench)}</h3><div class="sub">3 Oct 2016 = 100, log scale</div><div class="chart-box"><canvas id="${id}-px"></canvas></div><p class="src">Source: supplied CSVs. No forward-fill.</p></div>
    <div class="glass chart-card"><h3>Drawdown from running peak (%)</h3><div class="sub">Equity drawdown, not credit loss</div><div class="chart-box"><canvas id="${id}-dd"></canvas></div></div></div>
  </div>
  <div class="tabpane" id="${id}-events"><div class="glass chart-card"><h3>Event reactions: ${nm(tMain)} vs ${nm(tPeer)}</h3><div class="sub">CAR [-5,+5] (%), market model vs ${nm(bench)}; dagger = benchmark-adjusted, no model</div><div class="tbl-wrap"><table id="${id}-evt"></table></div></div></div></div>`;
  // completeness
  const cnt = e => C.observations.filter(o => o.entity === e && o.status === 'reported').length, tot = C.metrics.length * C.periods.length;
  $('#' + id + '-comp').innerHTML = [main, peer].map(e => `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:.88rem"><span>${C.entities[e].name}</span><b>${cnt(e)} / ${tot}</b></div><div class="meter"><i style="width:${cnt(e) / tot * 100}%"></i></div></div>`).join('');
  // credit chart
  const draw = () => {
    const key = $('#' + id + '-metric').value, m = C.metrics.find(x => x.key === key);
    const ds = [main, peer].map(e => ({ label: C.entities[e].name, data: C.periods.map(p => { const o = obsFor(e, key, p); return o ? o.value : null; }), borderColor: C.entities[e].color, backgroundColor: C.entities[e].color, pointRadius: 6, pointHoverRadius: 8, borderWidth: 2.4, tension: .3, spanGaps: false }));
    const has = ds.some(d => d.data.some(v => v != null));
    $('#' + id + '-ccmsg').textContent = has ? 'Only verified points are plotted; unconnected points have neighbouring years not yet verified.' : 'No verified data points for this metric yet - nothing is plotted rather than estimated.';
    mk(id + '-cc', { type: 'line', data: { labels: C.periods, datasets: ds }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { title: { display: true, text: m.label + ' (' + m.unit + ')' }, beginAtZero: true }, x: { grid: { display: false } } }, plugins: { legend: { position: 'bottom' } } } });
  };
  $('#' + id + '-metric').addEventListener('change', draw); draw();
  // market tab
  const lineDs = (t, w = 2) => ({ label: nm(t), data: M.index[t], borderColor: COL[t], borderWidth: BENCH.includes(t) ? 1.2 : w, borderDash: BENCH.includes(t) ? [5, 4] : [], pointRadius: 0, tension: 0, spanGaps: false });
  const xopt = { ticks: { maxTicksLimit: 9, callback(v) { return DATES[v] ? DATES[v].slice(0, 7) : ''; } }, grid: { display: false } };
  const tip = { mode: 'index', intersect: false };
  mk(id + '-px', { type: 'line', data: { labels: DATES, datasets: [lineDs(tMain, 2.2), lineDs(tPeer, 1.6), lineDs(bench)] }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: tip, scales: { x: xopt, y: { type: 'logarithmic', title: { display: true, text: 'Index (base 100)' } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { title: it => DATES[it[0].dataIndex], label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'n/a' : c.parsed.y.toFixed(1)}` } } } } });
  mk(id + '-dd', { type: 'line', data: { labels: DATES, datasets: [tMain, tPeer].map(t => ({ label: nm(t), data: drawdownSeries(M.index[t]), borderColor: COL[t], backgroundColor: COL[t] + '22', fill: true, borderWidth: 1.4, pointRadius: 0, tension: 0 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: tip, scales: { x: xopt, y: { title: { display: true, text: 'Drawdown (%)' }, max: 0 } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { title: it => DATES[it[0].dataIndex], label: c => `${c.dataset.label}: ${c.parsed.y.toFixed(1)}%` } } } } });
  // events tab
  $('#' + id + '-evt').innerHTML = `<thead><tr><th>Event</th><th>Type</th><th>Reaction day</th><th class="num">${nm(tMain)}</th><th class="num">${nm(tPeer)}</th><th class="num">Spread</th></tr></thead><tbody>` + E.events.map(e => { const a = carOf(e.id, tMain, '[-5,+5]'), b = carOf(e.id, tPeer, '[-5,+5]'), cell = x => !x ? '<td class="num na">n/c</td>' : `<td class="num ${sgnCls(x.v)}">${f1(x.v)}%${x.model ? '' : '&dagger;'}${x.t != null ? ` <span style="color:var(--faint)">(${f1(x.t, 2)})</span>` : ''}</td>`; return `<tr><td>${e.id} ${evShort(e.id)}</td><td>${e.type.startsWith('sys') ? '<span class="tag sys">systematic</span>' : '<span class="tag idio">idiosyncratic</span>'}</td><td>${e.reaction}</td>${cell(a)}${cell(b)}<td class="num">${a && b ? f1(a.v - b.v) + ' pp' : '-'}</td></tr>`; }).join('') + '</tbody>';
}

/* ---------- comparison ---------- */
function compare() {
  const eq = Object.keys(GROUP);
  $('#scoreTable').innerHTML = '<thead><tr><th>Stock</th><th>Group</th><th>Role</th><th class="num">Total return</th><th class="num">CAGR</th><th class="num">Ann. vol</th><th class="num">Beta</th><th class="num">Corr.</th><th class="num">Max drawdown</th><th>Trough</th></tr></thead><tbody>' +
    eq.map(t => { const s = STATS[t], role = STUDY_STOCKS.includes(t) ? (t === 'HDFCBANK.NS' || t === 'BAJFINANCE.NS' ? 'Entity' : 'Primary peer') : 'Supporting'; return `<tr><td><i class="dot" style="background:${COL[t]}"></i> ${nm(t)}</td><td>${GROUP[t] === 'bank' ? 'Bank' : 'NBFC'}</td><td>${role}</td><td class="num">${fx(s.mult)}x</td><td class="num">${pc(s.cagr * 100)}</td><td class="num">${pc(s.vol * 100)}</td><td class="num">${fx(s.beta)}</td><td class="num">${fx(s.corr)}</td><td class="num neg">${pc(s.dd.dd * 100)}</td><td>${DATES[s.dd.trough]}</td></tr>`; }).join('') + '</tbody>';
  $('#compareCharts').innerHTML = `<div class="glass chart-card reveal"><h3>Annualised volatility (%)</h3><div class="sub">Daily adjusted returns, &radic;250 scaling</div><div class="chart-box"><canvas id="cmpVol"></canvas></div></div>
   <div class="glass chart-card reveal"><h3>Drawdown from peak: entities and primary peers (%)</h3><div class="sub">Peak-to-trough on adjusted close</div><div class="chart-box"><canvas id="cmpDD"></canvas></div></div>`;
  mk('cmpVol', { type: 'bar', data: { labels: eq.map(nm), datasets: [{ data: eq.map(t => +(STATS[t].vol * 100).toFixed(1)), backgroundColor: eq.map(t => COL[t] + 'cc'), borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Annualised volatility (%)' } }, y: { grid: { display: false } } } } });
  mk('cmpDD', { type: 'line', data: { labels: DATES, datasets: STUDY_STOCKS.map(t => ({ label: nm(t), data: drawdownSeries(M.index[t]), borderColor: COL[t], borderWidth: 1.4, pointRadius: 0 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false }, scales: { x: { ticks: { maxTicksLimit: 9, callback(v) { return DATES[v].slice(0, 7); } }, grid: { display: false } }, y: { max: 0, title: { display: true, text: 'Drawdown (%)' } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { title: it => DATES[it[0].dataIndex], label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'n/a' : c.parsed.y.toFixed(1) + '%'}` } } } } });
  const tot = C.metrics.length * C.periods.length;
  $('#completeness').innerHTML = '<div class="grid g4">' + Object.keys(C.entities).map(e => { const n = C.observations.filter(o => o.entity === e && o.status === 'reported').length; return `<div><div style="display:flex;justify-content:space-between"><span>${C.entities[e].name}</span><b>${n}/${tot}</b></div><div class="meter"><i style="width:${n / tot * 100}%"></i></div><div class="src">${(n / tot * 100).toFixed(0)}% verified</div></div>`; }).join('') + '</div>';
}

/* ---------- events list ---------- */
function eventList() {
  const years = [...new Set(E.events.map(e => e.reaction.slice(0, 4)))]; $('#fYear').innerHTML += years.map(y => `<option>${y}</option>`).join('');
  const render = () => {
    const ty = $('#fType').value, en = $('#fEnt').value, yr = $('#fYear').value, ve = $('#fVer').value;
    const list = E.events.filter(e => { const m = EVMETA[e.id], sys = e.type.startsWith('sys'); return (ty === 'all' || (ty === 'sys') === sys) && (en === 'all' || m.ent.includes(en) || m.ent.includes('ALL')) && (yr === 'all' || e.reaction.startsWith(yr)) && (ve === 'all' || (ve === 'ok') === m.ok); });
    $('#evList').innerHTML = list.length ? list.map(e => { const m = EVMETA[e.id], sys = e.type.startsWith('sys');
      const rows = STUDY_STOCKS.map(t => { const a = carOf(e.id, t, '[-1,+1]'), b = carOf(e.id, t, '[-5,+5]'), fm = x => !x ? 'n/c' : `${f1(x.v)}%${x.model ? '' : '&dagger;'}${x.t != null ? ` (t ${f1(x.t, 2)})` : ''}`; return `<tr><td>${nm(t)}</td><td class="num ${sgnCls(a && a.v)}">${fm(a)}</td><td class="num ${sgnCls(b && b.v)}">${fm(b)}</td></tr>`; }).join('');
      return `<details class="glass ev reveal in"><summary><span class="tag ${sys ? 'sys' : 'idio'}">${sys ? 'Systematic' : 'Idiosyncratic'}</span><span class="t">${e.id} &middot; ${esc(e.label)}</span><span class="tag ${m.ok ? 'ok' : 'pend'}">${m.ok ? 'Source-verified' : 'Candidate'}</span><span class="when">Reaction day ${e.reaction}</span></summary>
        <div class="body"><p style="color:var(--ink)">${m.ok ? esc(m.text) : 'Candidate event. The date and description were used to test data coverage and still need to be verified against a primary source (RBI or exchange disclosure) before being treated as a finding.'}</p>
        <p class="src">Announcement ${e.announcement} &middot; reaction day ${e.reaction} &middot; ${esc(e.status)}</p>
        ${m.ok ? '<p class="src">Source: ' + m.src.map(s => `<a href="${C.sources[s].url}" target="_blank" rel="noopener">${esc(C.sources[s].title)}</a>`).join(' ; ') + '</p>' : ''}
        <div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Stock</th><th class="num">CAR [-1,+1]</th><th class="num">CAR [-5,+5]</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div style="margin-top:12px"><button class="btn ghost" data-open="${e.id}" type="button">Inspect market reaction &rarr;</button></div></div></details>`; }).join('') : '<p class="note">No events match these filters.</p>';
    $$('[data-open]').forEach(b => b.addEventListener('click', () => { $('#esEvent').value = b.dataset.open; studyDraw(); document.getElementById('studyCard').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); }));
  };
  ['fType', 'fEnt', 'fYear', 'fVer'].forEach(i => $('#' + i).addEventListener('change', render)); render();
}

/* ---------- indexed price explorer ---------- */
const evMarks = { id: 'evMarks', afterDatasetsDraw(ch) { const o = ch.options.plugins.evMarks; if (!o || !o.on) return; const { ctx, chartArea: a, scales } = ch, lab = ch.data.labels; ctx.save(); ctx.setLineDash([4, 4]); ctx.font = '600 10px Inter'; o.list.forEach(ev => { const i = lab.indexOf(ev.reaction); if (i < 0) return; const x = scales.x.getPixelForValue(i); ctx.strokeStyle = EVMETA[ev.id].ok ? 'rgba(251,191,36,.9)' : 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke(); ctx.fillStyle = EVMETA[ev.id].ok ? '#fbbf24' : '#8fa0c4'; ctx.fillText(ev.id, x + 3, a.top + 10); }); ctx.restore(); } };
const sel = { on: new Set(['HDFCBANK.NS', 'BAJFINANCE.NS', 'ICICIBANK.NS', 'CHOLAFIN.NS', '^NSEBANK', 'NIFTY_FIN_SERVICE.NS']) };
function idxChart() {
  const from = $('#rFrom'), to = $('#rTo'); from.min = to.min = DATES[0]; from.max = to.max = DATES[N - 1]; from.value = DATES[0]; to.value = DATES[N - 1];
  const keys = Object.keys(M.index); $('#idxChips').innerHTML = keys.map(t => `<span class="chip ${sel.on.has(t) ? 'on' : ''}" data-t="${t}"><i class="dot" style="background:${COL[t]}"></i>${nm(t)}</span>`).join('');
  const presets = [['Full 10 years', DATES[0], DATES[N - 1]], ['NBFC stress 2018-19', '2018-04-02', '2019-12-31'], ['COVID 2020-21', '2020-01-01', '2021-12-31'], ['2022-24', '2022-01-03', '2024-12-31'], ['Last 3 years', '2023-10-02', DATES[N - 1]]];
  $('#rPresets').innerHTML = presets.map((p, i) => `<span class="chip" data-p="${i}">${p[0]}</span>`).join('');
  const draw = () => {
    let a = DATES.findIndex(d => d >= from.value); if (a < 0) a = 0; let b = N - 1; while (b > 0 && DATES[b] > to.value) b--; if (b <= a) b = Math.min(N - 1, a + 1);
    const lab = DATES.slice(a, b + 1), rebase = $('#rRebase').checked, log = true;
    const ds = [...sel.on].map(t => { const arr = M.index[t].slice(a, b + 1); let base = arr.find(v => v != null); const data = arr.map(v => v == null ? null : rebase ? v / base * 100 : v); return { label: nm(t), data, borderColor: COL[t], borderWidth: BENCH.includes(t) ? 1.3 : 2, borderDash: BENCH.includes(t) ? [5, 4] : [], pointRadius: 0, tension: 0, spanGaps: false }; });
    $('#idxSub').textContent = `${lab[0]} to ${lab[lab.length - 1]} - ${rebase ? 'rebased to 100 at range start' : 'base 100 = 3 Oct 2016'}; log scale`;
    mk('idxChart', { type: 'line', data: { labels: lab, datasets: ds }, plugins: [evMarks], options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false }, scales: { x: { ticks: { maxTicksLimit: 10, callback(v) { return lab[v] ? lab[v].slice(0, 7) : ''; } }, grid: { display: false } }, y: { type: 'logarithmic', title: { display: true, text: 'Indexed adjusted close' } } }, plugins: { legend: { display: false }, evMarks: { on: $('#rMarks').checked, list: E.events }, tooltip: { itemSort: (x, y) => y.parsed.y - x.parsed.y, callbacks: { title: it => lab[it[0].dataIndex], label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'n/a' : c.parsed.y.toFixed(1)}` } } } } });
  };
  $('#idxChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; const t = c.dataset.t; if (sel.on.has(t)) { if (sel.on.size > 1) sel.on.delete(t); } else sel.on.add(t); c.classList.toggle('on', sel.on.has(t)); draw(); });
  $('#rPresets').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; const p = presets[c.dataset.p]; from.value = p[1]; to.value = p[2]; draw(); });
  [from, to, $('#rRebase'), $('#rMarks')].forEach(el => el.addEventListener('change', draw)); draw();
}

/* ---------- event-study explorer ---------- */
function studyInit() {
  $('#esEvent').innerHTML = E.events.map(e => `<option value="${e.id}">${e.id} - ${esc(e.label)}${EVMETA[e.id].ok ? ' (verified)' : ' (candidate)'}</option>`).join('');
  $('#esEvent').value = 'E08';
  $('#esStock').innerHTML = STUDY_STOCKS.map(t => `<option value="${t}">${nm(t)}</option>`).join(''); $('#esStock').value = 'BAJFINANCE.NS';
  $('#esWin').innerHTML = WINS.map(w => `<option>${w}</option>`).join(''); $('#esWin').value = '[-5,+5]';
  const setBench = () => { const t = $('#esStock').value, pb = PRIMARY_BENCH[GROUP[t]], cur = $('#esBench').value; $('#esBench').innerHTML = `<option value="primary">${nm(pb)} (primary)</option><option value="robustness">Nifty 50 (robustness)</option>`; if (cur) $('#esBench').value = cur; };
  setBench(); $('#esStock').addEventListener('change', () => { setBench(); studyDraw(); });
  ['esEvent', 'esBench', 'esWin'].forEach(i => $('#' + i).addEventListener('change', studyDraw));
  $('#esTabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; $$('#esTabs .tab').forEach(x => x.classList.toggle('on', x === b)); studyDraw(); });
  studyDraw();
  // cross-table
  $('#xtWin').innerHTML = WINS.map(w => `<option>${w}</option>`).join(''); $('#xtWin').value = '[-1,+1]';
  const xt = () => { const w = $('#xtWin').value, role = $('#xtRole').value;
    $('#xTable').innerHTML = '<thead><tr><th>Event</th><th>Type</th><th>Reaction day</th>' + STUDY_STOCKS.map(t => `<th class="num">${nm(t)}</th>`).join('') + '</tr></thead><tbody>' +
      E.events.map(e => `<tr><td>${e.id} ${evShort(e.id)} ${EVMETA[e.id].ok ? '<span class="tag ok">verified</span>' : ''}</td><td>${e.type.startsWith('sys') ? '<span class="tag sys">sys</span>' : '<span class="tag idio">idio</span>'}</td><td>${e.reaction}</td>` + STUDY_STOCKS.map(t => { const x = carOf(e.id, t, w, role); if (!x) return '<td class="num na" title="Window incomplete (missing index day) - not computed">n/c</td>'; if (!x.model) return `<td class="num"><i title="Benchmark-adjusted return, no market model (insufficient estimation window)">${f1(x.v)}%&dagger;</i></td>`; const sig = Math.abs(x.t) > 1.96, a = Math.min(.55, Math.abs(x.v) / 30 + .08); return `<td class="num"><span class="heat" style="background:${sig ? (x.v >= 0 ? `rgba(52,211,153,${a})` : `rgba(251,113,133,${a})`) : 'rgba(255,255,255,.05)'}" title="t = ${x.t}">${f1(x.v)}%</span></td>`; }).join('') + '</tr>').join('') + '</tbody>';
  };
  $('#xtWin').addEventListener('change', xt); $('#xtRole').addEventListener('change', xt); xt();
}
function cum(arr) { return arr.some(v => v == null) ? null : (arr.reduce((p, v) => p * (1 + v / 100), 1) - 1) * 100; }
function studyDraw() {
  const ev = $('#esEvent').value, st = $('#esStock').value, role = $('#esBench').value, win = $('#esWin').value, tab = ($('#esTabs .tab.on') || {}).dataset.t || 'ar';
  const r = evRec(ev, st, role), w = parseInt(win.match(/\d+/)[0]), days = E.days, bn = role === 'primary' ? nm(PRIMARY_BENCH[GROUP[st]]) : 'Nifty 50';
  if (!r) return; const inWin = days.map(d => Math.abs(d) <= w), model = r.model === 'market_model';
  const ar = model ? r.ar_pct : r.mkt_adj_ar_pct, lbl = model ? 'Abnormal return (market model)' : 'Benchmark-adjusted return (no model)';
  const carw = r.car[win], sIdx = days.map((d, i) => i).filter(i => inWin[i]);
  const sObs = cum(sIdx.map(i => r.obs_stock_ret_pct[i])), bObs = cum(sIdx.map(i => r.obs_bench_ret_pct[i]));
  const S = (v, l, cls = '') => `<div class="stat"><span>${l}</span><b class="${cls}">${v}</b></div>`;
  $('#esStats').innerHTML = (model ? S(fx(r.beta, 2), 'Beta') + S(pc(r.alpha * 100, 3), 'Alpha (daily)') + S(fx(r.r2, 2), 'Model R²') + S(r.n_est + ' obs', 'Estimation sample') : S('none', 'Market model') + S(r.n_est + ' obs', 'Estimation sample')) +
    S(carw ? (carw.car_pct != null ? f1(carw.car_pct) + '%' : f1(carw.mkt_adj_cum_pct) + '%') : 'n/c', (model ? 'CAR ' : 'Benchmark-adj. ') + win, carw ? sgnCls(carw.car_pct != null ? carw.car_pct : carw.mkt_adj_cum_pct) : '') + (carw && carw.t != null ? S(f1(carw.t, 2), 't-statistic', Math.abs(carw.t) > 1.96 ? 'warn' : '') : '') +
    S(sObs == null ? 'n/c' : f1(sObs) + '%', 'Observed stock return', sgnCls(sObs)) + S(bObs == null ? 'n/c' : f1(bObs) + '%', 'Observed benchmark', sgnCls(bObs));
  const cfg = (type, ds, ytitle) => ({ type, data: { labels: days.map(d => d === 0 ? 'Day 0' : (d > 0 ? '+' : '') + d), datasets: ds }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { display: false }, title: { display: true, text: 'Trading days relative to reaction day (' + E.events.find(e => e.id === ev).reaction + ')' } }, y: { title: { display: true, text: ytitle } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'n/a (missing observation)' : c.parsed.y.toFixed(2) + '%'}` } } } } });
  if (tab === 'ar') mk('esChart', cfg('bar', [{ label: lbl, data: ar, backgroundColor: ar.map((v, i) => v == null ? 'transparent' : (v >= 0 ? 'rgba(52,211,153,' : 'rgba(251,113,133,') + (inWin[i] ? '.95)' : '.35)')), borderRadius: 4 }], 'Return (%)'));
  else if (tab === 'car') { const path = model ? r.car_path_pct : (() => { let s = 0; return r.mkt_adj_ar_pct.map(v => { if (v == null || s == null) { s = null; return null; } s += v; return +s.toFixed(3); }); })(); mk('esChart', cfg('line', [{ label: model ? 'CAR from day -20 (market model)' : 'Cumulative benchmark-adjusted return from day -20', data: path, borderColor: '#4ea1ff', backgroundColor: 'rgba(78,161,255,.15)', fill: true, borderWidth: 2.4, pointRadius: 2, tension: .2 }], 'Cumulative (%)')); }
  else mk('esChart', cfg('bar', [{ type: 'bar', label: nm(st) + ' daily return (observed)', data: r.obs_stock_ret_pct, backgroundColor: 'rgba(78,161,255,.8)', borderRadius: 4 }, { type: 'line', label: bn + ' daily return (observed)', data: r.obs_bench_ret_pct, borderColor: '#fbbf24', borderWidth: 2, pointRadius: 2, tension: .2 }], 'Daily return (%)'));
  let note = '';
  if (!model) note += `<p class="note bad">${esc(r.reason)}. Values shown are observed returns minus the benchmark return; they are <b>not</b> model-adjusted abnormal returns and no t-statistic is reported.</p>`;
  if (carw === null) note += `<p class="note warn">The ${win} window contains a missing benchmark observation, so it was not computed. The next available day is never substituted.</p>`;
  if (ev === 'E08' || ev === 'E09') note += '<p class="note warn">E08 and E09 share the same reaction day, so their results are identical: the daily data cannot separate Bajaj Finance\'s own RBI restriction from the sector-wide risk-weight circular.</p>';
  if (!EVMETA[ev].ok) note += '<p class="note">This event is a <b>candidate</b>: its date still needs verification against a primary source.</p>';
  if (r.n_est_excluded_other_events) note += `<p class="src">${r.n_est_excluded_other_events} days in the estimation window fall inside other events' &plusmn;20-day windows and were excluded from the regression.</p>`;
  const peers = STUDY_STOCKS.filter(t => t !== st).map(t => { const x = carOf(ev, t, win, role); return `${nm(t)} ${x ? f1(x.v) + '%' + (x.t != null ? ` (t ${f1(x.t, 2)})` : '') + (x.model ? '' : '†') : 'n/c'}`; }).join(' &middot; ');
  $('#esNote').innerHTML = note + `<p class="src">Same event and window, other stocks: ${peers}</p><p class="note">Abnormal returns around an event are consistent with, but do not prove, a market reaction to the news: other information released on the same days can move the stock.</p>`;
}

/* ---------- methodology ---------- */
function method() {
  $('#mRaw').textContent = V.raw_files; $('#mCal').textContent = V.calendar_days.toLocaleString('en-IN');
  $('#exTable').innerHTML = '<thead><tr><th>Date</th><th>Treatment</th><th class="num">Rows</th><th>Securities</th></tr></thead><tbody>' + V.exclusions.map(x => `<tr><td>${x.date}</td><td>${x.category.replace(/_/g, ' ').toLowerCase()}</td><td class="num">${x.n}</td><td style="white-space:normal;min-width:180px">${esc(x.securities)}</td></tr>`).join('') + '</tbody>';
  const cov = V.pair_coverage;
  $('#covBox').innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>Stock</th><th>Benchmark</th><th class="num">Obs. coverage</th><th class="num">Return coverage</th></tr></thead><tbody>${cov.map(c => `<tr><td>${nm(c.stock)}</td><td>${nm(c.benchmark)} <span class="tag pend">${c.benchmark_role}</span></td><td class="num">${c.common_coverage_pct.toFixed(2)}%</td><td class="num">${c.return_coverage_pct.toFixed(2)}%</td></tr>`).join('')}</tbody></table></div>
   <p class="note" style="margin-top:12px"><b>${V.window_complete} of ${V.window_tests}</b> event-window tests are complete. Incomplete: ${V.window_incomplete.map(x => `${x.event_id} ${nm(x.stock)} ${x.window} (missing ${x.missing_dates})`).join('; ') || 'none'}. Presumed market holidays: ${V.presumed_holidays} weekdays (inferred from the data, not checked against the official NSE list).</p>`;
  const srcRows = [['Market data', 'primary-download', 'Daily price CSVs supplied by the team (Yahoo Finance download, 13 securities, 3 Oct 2016 - 30 Sep 2026)', '']].map(r => `<tr><td>${r[1]}</td><td style="white-space:normal">${r[2]}</td></tr>`).join('') +
    Object.entries(C.sources).map(([k, s]) => `<tr><td>${k} &middot; ${s.type}</td><td style="white-space:normal"><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a></td></tr>`).join('');
  $('#srcTable').innerHTML = '<thead><tr><th>ID</th><th>Source</th></tr></thead><tbody>' + srcRows + '</tbody>';
  $('#breaks').innerHTML = C.data_breaks.map(b => `<p class="note warn"><b>${b.entity === 'ALL' ? 'All lenders' : C.entities[b.entity].name} &middot; ${b.when}:</b> ${esc(b.what)}</p>`).join('');
}

/* ---------- verdict (evidence-driven) ---------- */
function verdict() {
  const cc = creditCounts(), g = (ev, st, w) => carOf(ev, st, w), fm = x => x ? `${f1(x.v)}%${x.t != null ? ' (t ' + f1(x.t, 2) + ')' : ''}` : 'n/c';
  const card = (q, a, cls = '') => `<div class="glass reveal in"><h3>${q}</h3><p class="note ${cls}" style="margin-top:12px;color:var(--muted)">${a}</p></div>`;
  $('#verdictBox').innerHTML =
    card('1. Which entity demonstrates stronger credit-risk management?', `Not yet determinable. ${cc.ver} of ${cc.total} credit-risk grid cells are verified. The project rule is never to rank lenders on a single ratio; this answer will be written once GNPA, NNPA, PCR, slippages, write-offs and credit cost are sourced for all four lenders.`, 'warn') +
    card('2. Which entity experienced more severe idiosyncratic stress?', `Market evidence only. Around the two source-verified regulatory events, CAR [-5,+5] was ${fm(g('E05', 'HDFCBANK.NS', '[-5,+5]'))} for HDFC Bank (3 Dec 2020) and ${fm(g('E08', 'BAJFINANCE.NS', '[-5,+5]'))} for Bajaj Finance (16 Nov 2023). Neither is individually significant at the 5% level, and the Bajaj window is confounded by a same-day sector circular. Credit-quality impact is pending the credit data.`) +
    card('3. How did systematic shocks affect both entities?', `COVID-19 crash day (candidate date, 23 Mar 2020): CAR [-5,+5] ${fm(g('E04', 'BAJFINANCE.NS', '[-5,+5]'))} for Bajaj Finance, ${fm(g('E04', 'CHOLAFIN.NS', '[-5,+5]'))} for Cholamandalam, ${fm(g('E04', 'HDFCBANK.NS', '[-5,+5]'))} for HDFC Bank and ${fm(g('E04', 'ICICIBANK.NS', '[-5,+5]'))} for ICICI Bank. NBFC stocks fell more than the benchmark-adjusted bank stocks in this window; whether credit deterioration, funding fears or both drove this needs the credit series.`) +
    card('4. Did the equity market correctly reflect the underlying credit risk?', 'Cannot be answered yet. It requires comparing the timing of stock reactions with the timing of reported GNPA, NNPA and credit-cost changes, which depends on the pending credit data. The event study will then show whether prices moved before, at, or after the reported deterioration.', 'warn') +
    card('5. What are the lessons for lenders and investors?', 'To be written from the verified evidence once the credit and event data are complete. Preliminary, market-only lesson: regulatory and sector events produce reactions that must be read against the right benchmark and peer, because raw price moves mix sector-wide and lender-specific effects.');
}

/* ---------- QR ---------- */
function qr() {
  let url = location.protocol === 'file:' ? location.href.split('#')[0] : (location.origin + location.pathname).replace(/index\.html$/, '');
  const host = location.hostname, local = location.protocol === 'file:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host), gh = /\.github\.io$/.test(host);
  $('#qrUrl').textContent = url; const v = $('#visitBtn'); v.href = url; v.target = '_blank'; v.rel = 'noopener';
  $('#deployState').innerHTML = gh ? '<i class="dot" style="background:var(--green)"></i> Served from GitHub Pages' : local ? '<i class="dot" style="background:var(--amber)"></i> Local preview - not a public deployment' : '<i class="dot" style="background:var(--cyan)"></i> Served from ' + esc(host);
  $('#qrNote').textContent = local ? 'This QR currently encodes the local address shown above. It will encode the public GitHub Pages address automatically once the site is deployed - nothing is hard-coded.' : 'The QR encodes this page\'s own address (origin + path), generated in your browser on load.';
  const box = $('#qrBox');
  try { if (typeof QRCode === 'undefined') throw new Error('qr lib missing'); box.innerHTML = ''; new QRCode(box, { text: url, width: 220, height: 220, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); box.dataset.encoded = url; }
  catch (e) { box.innerHTML = '<span style="color:#222;font-size:.85rem;text-align:center;padding:8px">QR library unavailable. Use the link beside this box.</span>'; }
  $('#copyBtn').addEventListener('click', async e => { const b = e.currentTarget; try { await navigator.clipboard.writeText(url); } catch (_) { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } b.textContent = 'Copied ✓'; setTimeout(() => b.textContent = 'Copy Website Link', 1800); });
}

/* ---------- boot ---------- */
function boot() {
  hero(); executive(); entitySection('HDFC', 'HDFC', 'ICICI', 'HDFCBANK.NS', 'ICICIBANK.NS'); entitySection('BAJAJ', 'BAJAJ', 'CHOLA', 'BAJFINANCE.NS', 'CHOLAFIN.NS');
  compare(); eventList(); idxChart(); studyInit(); method(); verdict(); qr(); watch();
}
if (!M || !E || !C || !V) document.body.insertAdjacentHTML('afterbegin', '<p style="padding:90px 20px;color:#fb7185">A data file failed to load.</p>'); else boot();
})();
