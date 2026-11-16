/* Added analysis sections: six-metric panels, events, share-price reactions, correlations, expanded findings, breaks and sources. */
(function () {
'use strict';
const C = window.FRA_CREDIT, M = window.FRA_MARKET, EV = window.FRA_EVENTS;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
if (!C || !M || !EV) { const h = $('#evCards'); if (h) h.innerHTML = '<p class="note warn">Analysis data failed to load.</p>'; return; }
const HAS = typeof Chart !== 'undefined';
const E = C.entities, P = C.periods;
const cv = (e, m, p) => { const o = C.observations.find(x => x.entity === e && x.metric === m && x.period === p); return o ? o.value : null; };
const ser = (e, m) => P.map(p => ({ p, v: cv(e, m, p) })).filter(x => x.v != null);
const COL = { HDFC: E.HDFC.color, ICICI: E.ICICI.color, BAJAJ: E.BAJAJ.color, CHOLA: E.CHOLA.color, NBANK: '#8fa0c4', NFIN: '#8fa0c4', N50: '#64748b' };
const NAME = { HDFC: 'HDFC Bank', ICICI: 'ICICI Bank', BAJAJ: 'Bajaj Finance', CHOLA: 'Cholamandalam', NBANK: 'Nifty Bank', NFIN: 'Nifty Fin. Services', N50: 'Nifty 50' };
const pct = (v, d = 1) => v == null ? 'n/a' : (v * 100 >= 0 ? '+' : '') + (v * 100).toFixed(d) + '%';
const num = (v, d = 2) => v == null ? 'n/a' : (v >= 0 ? '+' : '') + v.toFixed(d);
const charts = {};
function mk(id, cfg) { if (!HAS) return; const el = document.getElementById(id); if (!el) return; if (charts[id]) charts[id].destroy(); charts[id] = new Chart(el, cfg); }
const trend = (k, m, u = '%') => { const s = ser(k, m); if (!s.length) return '<span class="na">unavailable</span>'; const lo = Math.min(...s.map(x => x.v)), hi = Math.max(...s.map(x => x.v)); return `${s[0].v}${u} (${s[0].p.slice(2)}) &rarr; ${s[s.length - 1].v}${u} (${s[s.length - 1].p.slice(2)}); range ${lo}&ndash;${hi}${u}${s.length < P.length ? `; ${s.length} of ${P.length} years` : ''}`; };

/* ---------- six-metric panels ---------- */
const DEFS = [
  ['GNPA', 'Gross NPA ratio', 'Share of loans overdue 90+ days, before provisions. The headline measure of bad loans.'],
  ['NNPA', 'Net NPA ratio', 'GNPA after deducting provisions. Shows the loss not yet covered.'],
  ['PCR', 'Provision coverage ratio', 'Provisions as a share of gross NPAs. Higher means a bigger cushion; definitions differ (see breaks).'],
  ['SLIP', 'Slippages', 'New loans turning non-performing in the period, as % of opening loans. An early signal, before provisions.'],
  ['WO', 'Write-offs', 'Bad loans removed from the books. Can lower GNPA without any recovery, so read with PCR.'],
  ['CC', 'Credit cost', 'Annual credit-loss provisions as % of average loans. The P&L cost of risk.']];
function six(host, a, b, grp) {
  const rows = DEFS.map(([k, n, d]) => {
    const av = ['GNPA', 'NNPA', 'PCR'].includes(k);
    const cell = x => av ? `<div><b style="color:${E[x].color}">${E[x].name}:</b> ${trend(x, k)}</div>` : `<div><b style="color:${E[x].color}">${E[x].name}:</b> <span class="na">Verified data unavailable</span></div>`;
    return `<tr><td style="white-space:normal;min-width:130px"><b>${n}</b></td><td style="white-space:normal;min-width:220px">${d}</td><td style="white-space:normal;min-width:300px">${cell(a)}${cell(b)}</td><td style="white-space:normal;min-width:180px">${av ? 'Team extraction from annual reports; page for every value in the data grid (Method).' : 'No page-referenced series in the research pack.'}</td></tr>`;
  }).join('');
  let extra;
  if (grp === 'bank') extra = `<p class="note warn"><b>Slippages, write-offs and credit cost are unavailable for HDFC Bank and ICICI Bank.</b> The research pack does not contain a verified series, and the earlier draft's figures had no page reference. FY2026 provisioning stocks that were verified (not flows): HDFC floating provisions Rs 21,351.28 crore (AR 2025-26 p.400); ICICI provision for NPA closing stock Rs 171,189.1 million (AR 2025-26). ICICI's FY2026 P&L provision figure conflicts between pack documents (Rs 6,208.1 crore vs 5,380 crore) and is not used.</p>`;
  else {
    const open = C.scale.CHOLA.FY2025, add = 9832.99, avg = (C.scale.BAJAJ.FY2025 + C.scale.BAJAJ.FY2026) / 2;
    extra = `<p class="note warn"><b>Slippages, write-offs and credit cost are unavailable as time series for Bajaj Finance and Cholamandalam.</b> Only FY2026 single points exist. These are calculated proxies, not the reported metrics, and are not comparable across the two lenders:</p><ul style="margin:8px 0 0 18px;color:var(--muted);font-size:.9rem;display:grid;gap:6px"><li><b>Chola gross NPA additions, FY2026:</b> Rs 9,832.99 crore (AR 2025-26 PDF p.249; opening 7,357.62, reductions 7,503.98, closing 9,686.63, which reconciles). Additions as % of opening AUM Rs ${open.toLocaleString('en-IN')} crore = <b>${(add / open * 100).toFixed(2)}%</b> (calculated proxy for gross slippage; AUM is not advances). Reductions mix recoveries, upgrades and write-offs, so write-offs cannot be separated.</li><li><b>Bajaj impairment on financial instruments, FY2026:</b> Rs 9,482 crore (AR 2025-26 MD&amp;A p.31), including Rs 1,406 crore accelerated ECL provision. Over average AUM = <b>${(9482 / avg * 100).toFixed(2)}%</b> (calculated proxy; the reported credit-cost definition may differ).</li></ul>`;
  }
  $('#' + host).innerHTML = `<div class="glass chart-card reveal in" style="margin-top:20px"><h3>All six required measures</h3><div class="sub">Meaning, historical trend for both lenders and source. Missing values are shown as unavailable, never as zero.</div><div class="tbl-wrap"><table><thead><tr><th>Measure</th><th>What it tells you</th><th>Trend FY2017&ndash;FY2026</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div>${extra}</div>`;
}

/* ---------- events ---------- */
const evRes = (id, s, role = 'primary') => M.results.find(r => r.event === id && r.stock === s && r.bench_role === role);
function indic(ev) {
  if (!ev.ind || !ev.ind.length) return '';
  return ev.ind.map(g => {
    const mlab = (C.metrics.find(m => m.key === g.m) || { label: g.m }).label.replace(' (calculated)', '');
    return `<tr><td>${esc(mlab)}</td>${g.e.map(e => `<td style="white-space:normal"><b style="color:${E[e].color}">${E[e].name}</b>: ` + g.p.map(p => `${p.slice(2)} ${cv(e, g.m, p) == null ? '<span class="na">n/a</span>' : cv(e, g.m, p) + '%'}`).join(' &rarr; ') + '</td>').join('')}</tr>`;
  }).join('');
}
function events() {
  $('#evCards').innerHTML = EV.map(ev => {
    const rows = ev.ind.map(g => {
      const mlab = (C.metrics.find(m => m.key === g.m) || { label: g.m }).label.replace(' (calculated)', '');
      return `<div style="margin-top:4px"><b>${esc(mlab)}:</b> ` + g.e.map(e => `<span style="color:${E[e].color}">${E[e].name}</span> ` + g.p.map(p => `${p.slice(2)} ${cv(e, g.m, p) == null ? 'n/a' : cv(e, g.m, p) + '%'}`).join(' &rarr; ')).join(' &nbsp;|&nbsp; ') + '</div>';
    }).join('');
    const src = ev.src.map(s => s.u ? `<a href="${s.u}" target="_blank" rel="noopener">${esc(s.t)}</a>` : esc(s.t)).join(' &middot; ');
    return `<details class="glass ev" ${ev.id === 'E04' ? 'open' : ''}><summary><span class="tag ${ev.cls === 'systematic' ? 'sys' : 'idio'}">${ev.cls}</span> <span class="t"><b>${ev.id}</b> ${esc(ev.name)} <span style="color:var(--muted);font-weight:400">&middot; ${esc(ev.date)}</span></span></summary><div class="body" style="display:grid;gap:8px;font-size:.9rem;color:var(--muted)">
      <div><b style="color:var(--ink)">Why ${ev.cls}:</b> ${esc(ev.why)}</div>
      <div><b style="color:var(--ink)">Mechanism:</b> ${esc(ev.mech)}</div>
      <div><b style="color:var(--ink)">Lenders affected and why:</b> ${esc(ev.lenders)}</div>
      <div><b style="color:var(--ink)">Credit indicators before &rarr; after (annual, as reported):</b>${rows}</div>
      <div class="note warn">${esc(ev.note)} Annual data and event timing cannot establish cause.</div>
      <div class="src">Sources: ${src}</div></div></details>`;
  }).join('');
}

/* ---------- event price reactions ---------- */
const sel = { ev: 'E04' };
function pricePanel() {
  $('#evChips').innerHTML = EV.map(e => `<span class="chip ${e.id === sel.ev ? 'on' : ''}" data-ev="${e.id}">${e.id} &middot; ${esc(e.name.split(' (')[0].slice(0, 26))}</span>`).join('');
  $('#evChips').onclick = e => { const c = e.target.closest('.chip'); if (!c) return; sel.ev = c.dataset.ev; $$('.chip', $('#evChips')).forEach(x => x.classList.toggle('on', x === c)); drawEvent(); };
  drawEvent();
}
function drawEvent() {
  const ev = EV.find(e => e.id === sel.ev), pa = M.paths[sel.ev], meta = M.events.find(e => e.id === sel.ev);
  $('#evTitle').innerHTML = `<span class="tag ${ev.cls === 'systematic' ? 'sys' : 'idio'}">${ev.cls}</span> ${sel.ev} &middot; ${esc(ev.name)}`;
  const ds = ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA'].map(s => ({ label: NAME[s], data: pa.series[s], borderColor: COL[s], backgroundColor: COL[s], borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: .15, spanGaps: false }));
  ds.push({ label: NAME.NBANK, data: pa.series.NBANK, borderColor: '#8fa0c4', borderDash: [5, 4], borderWidth: 1.6, pointRadius: 0 });
  ds.push({ label: NAME.NFIN, data: pa.series.NFIN, borderColor: '#cbd5e1', borderDash: [2, 3], borderWidth: 1.6, pointRadius: 0 });
  mk('evChart', { type: 'line', data: { labels: pa.offsets, datasets: ds }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { title: { display: true, text: 'Trading sessions from reaction day (0 = ' + pa.date0 + ')' }, grid: { display: false }, ticks: { maxTicksLimit: 12 } }, y: { title: { display: true, text: 'Index, close before event = 100' } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'n/a' : c.parsed.y}` } } } } });
  const W = ['[-1,+1]', '[-5,+5]', '[0,+20]'];
  const rows = ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA'].map(s => {
    const r = evRes(sel.ev, s), id = M.intraday[sel.ev + '|' + s], rec = M.recovery[sel.ev + '|' + s];
    const d0 = r['[0,0]'];
    const cells = W.map(w => { const x = r[w]; if (!x) return '<td class="num"><span class="na">n/a</span></td>'; if (x.car == null) return `<td class="num">raw ${pct(x.raw)}<br><span class="na">no estimate</span></td>`; return `<td class="num">${pct(x.car)}<br><span class="src" style="margin:0">t ${num(x.t)} &middot; placebo p ${x.placebo_p == null ? 'n/a' : x.placebo_p.toFixed(2)}</span></td>`; }).join('');
    const rtxt = !rec ? 'n/a' : rec.status === 'recovered' ? rec.days + ' sessions' : rec.status === 'no_decline_day0' ? 'no day-0 fall' : '&gt;250';
    return `<tr><td><b style="color:${COL[s]}">${NAME[s]}</b>${(ev.cls === 'idiosyncratic' && meta.lender === s) ? ' <span class="tag idio">event lender</span>' : ''}</td><td class="num">${pct(d0 && d0.raw)}</td><td class="num">${pct(id.open_gap)}</td>${cells}<td class="num">${r.beta == null ? '<span class="na">n/a</span>' : r.beta.toFixed(2) + ' (n=' + r.est_n + ')'}</td><td class="num">${rtxt}</td></tr>`;
  }).join('');
  $('#evTable').innerHTML = `<thead><tr><th>Stock</th><th class="num">Day-0 close return</th><th class="num">Day-0 open gap</th><th class="num">CAR [-1,+1]</th><th class="num">CAR [-5,+5]</th><th class="num">CAR [0,+20]</th><th class="num">Beta (est. n)</th><th class="num">Back to pre-event close</th></tr></thead><tbody>${rows}</tbody>`;
  let n = '';
  if (sel.ev === 'E01') n = 'Price data starts 3 Oct 2016, so there are only 24 sessions before the event and no market-model estimate. Raw returns only. It also coincided with the US election result.';
  if (sel.ev === 'E08' || sel.ev === 'E09') n = 'E08 and E09 share the same reaction day (16 Nov 2023). The figures are identical and cannot separate the two announcements. Bajaj opened about 3.9% lower on 16 Nov but closed up 1.9%, so the day-0 close return understates the intraday reaction.';
  if (sel.ev === 'E04') n = 'Benchmark-adjusted CARs are close to zero for banks because the whole sector fell with the market; read the indexed lines for the actual fall.';
  $('#evNote').innerHTML = n ? `<p class="note warn" style="margin-top:10px">${esc(n)}</p>` : '';
  $('#evWin').innerHTML = `Reaction day 0 = first session in which the news could be priced. CAR = cumulative abnormal return versus the benchmark (${NAME.NBANK} for banks, ${NAME.NFIN} for NBFCs) using a market model fitted on sessions -250 to -31, excluding other events' &plusmn;20 sessions. t uses the prediction-error variance; the placebo p is the share of same-length windows in the estimation period with an equal or larger absolute sum (a distribution-free check). With many windows and stocks, some "significant" results will arise by chance.`;
}
function fullCharts() {
  const f = M.full, dates = f.dates, ev = M.events;
  const mkc = (id, keys, bench) => mk(id, { type: 'line', data: { labels: dates, datasets: keys.map(s => ({ label: NAME[s], data: f[s], borderColor: COL[s], backgroundColor: COL[s], borderWidth: 1.6, pointRadius: 0, spanGaps: false })).concat([{ label: NAME[bench] + ' (price index)', data: f[bench], borderColor: '#8fa0c4', borderDash: [4, 4], borderWidth: 1.2, pointRadius: 0 }]) }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { ticks: { maxTicksLimit: 10, callback: function (v) { return dates[v] ? dates[v].slice(0, 4) : ''; } }, grid: { display: false } }, y: { title: { display: true, text: 'Index, 3 Oct 2016 = 100' } } }, plugins: { legend: { position: 'bottom' } } } });
  mkc('fullBanks', ['HDFC', 'ICICI'], 'NBANK'); mkc('fullNbfc', ['BAJAJ', 'CHOLA'], 'NFIN');
}

/* ---------- correlation ---------- */
const AN = (s, m, lag, sample = 'all') => M.annual.find(a => a.stock === s && a.metric === m && a.lag === lag && a.sample === sample);
function corrTables() {
  const cm = M.comove;
  $('#cmTable').innerHTML = '<thead><tr><th>Stock</th><th class="num">vs own benchmark</th><th class="num">vs peer</th></tr></thead><tbody>' + ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA'].map(s => `<tr><td><b style="color:${COL[s]}">${NAME[s]}</b></td><td class="num">${cm[s].vs_bench.r.toFixed(2)} <span class="src" style="margin:0">(${NAME[cm[s].bench]}, n=${cm[s].vs_bench.n})</span></td><td class="num">${cm[s].vs_peer.r.toFixed(2)} <span class="src" style="margin:0">(${NAME[cm[s].peer]}, n=${cm[s].vs_peer.n})</span></td></tr>`).join('') + '</tbody>';
  const rows = [];
  ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA'].forEach(s => ['GNPA', 'NNPA', 'PCR'].forEach(m => [0, 1].forEach(l => {
    const a = AN(s, m, l); if (!a || a.pearson == null) { if (!(m === 'PCR' && s === 'CHOLA')) rows.push(`<tr><td>${NAME[s]}</td><td>${m}</td><td>${l ? 'next year' : 'same year'}</td><td class="num">${a ? a.n : 0}</td><td colspan="4" class="na">too few points</td></tr>`); else rows.push(`<tr><td>${NAME[s]}</td><td>PCR</td><td>${l ? 'next year' : 'same year'}</td><td class="num">0</td><td colspan="4" class="na">unavailable: no Chola PCR series</td></tr>`); return; }
    const ok = a.pearson_p < .05; rows.push(`<tr ${ok ? 'style="background:rgba(251,191,36,.07)"' : ''}><td>${NAME[s]}</td><td>${m}</td><td>${l ? 'next year' : 'same year'}</td><td class="num">${a.n}</td><td class="num">${a.pearson.toFixed(2)}</td><td class="num">${a.pearson_p.toFixed(2)}</td><td class="num">${a.spearman.toFixed(2)}</td><td class="num">${a.spearman_p.toFixed(2)}</td></tr>`);
  })));
  const hx = AN('HDFC', 'GNPA', 0, 'ex_FY2024'), hx1 = AN('HDFC', 'GNPA', 1, 'ex_FY2024');
  $('#anTable').innerHTML = '<thead><tr><th>Stock</th><th>Credit change</th><th>Timing</th><th class="num">n</th><th class="num">Pearson r</th><th class="num">p</th><th class="num">Spearman</th><th class="num">p</th></tr></thead><tbody>' + rows.join('') + `<tr><td>HDFC (excl. FY2024 merger year)</td><td>GNPA</td><td>same year</td><td class="num">${hx.n}</td><td class="num">${hx.pearson.toFixed(2)}</td><td class="num">${hx.pearson_p.toFixed(2)}</td><td class="num">${hx.spearman.toFixed(2)}</td><td class="num">${hx.spearman_p.toFixed(2)}</td></tr><tr><td>HDFC (excl. FY2024 merger year)</td><td>GNPA</td><td>next year</td><td class="num">${hx1.n}</td><td class="num">${hx1.pearson.toFixed(2)}</td><td class="num">${hx1.pearson_p.toFixed(2)}</td><td class="num">${hx1.spearman.toFixed(2)}</td><td class="num">${hx1.spearman_p.toFixed(2)}</td></tr></tbody>`;
  $('#lvTable').innerHTML = '<thead><tr><th>Stock</th><th class="num">n</th><th class="num">r (price level vs GNPA level)</th><th class="num">p</th></tr></thead><tbody>' + M.levels.map(l => `<tr><td>${NAME[l.stock]}</td><td class="num">${l.n}</td><td class="num">${l.pearson.toFixed(2)}</td><td class="num">${l.pearson_p.toFixed(2)}</td></tr>`).join('') + '</tbody>';
}
const cs = { s: 'HDFC', m: 'GNPA' };
function scatter() {
  $('#scS').innerHTML = ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA'].map(s => `<span class="chip ${s === cs.s ? 'on' : ''}" data-s="${s}">${NAME[s]}</span>`).join('');
  $('#scM').innerHTML = ['GNPA', 'NNPA', 'PCR'].map(m => `<span class="chip ${m === cs.m ? 'on' : ''}" data-m="${m}">&Delta; ${m} (pp)</span>`).join('');
  const draw = () => {
    const a = AN(cs.s, cs.m, 0);
    $('#scT').textContent = `${NAME[cs.s]}: financial-year share-price return vs change in ${cs.m}`;
    $('#scSub').textContent = a && a.n ? `n = ${a.n}; Pearson ${a.pearson == null ? 'n/a' : a.pearson.toFixed(2)}, Spearman ${a.spearman == null ? 'n/a' : a.spearman.toFixed(2)}. Each point is one financial year (Apr-Mar).` : 'No data points for this selection (unavailable, not zero).';
    mk('scChart', { type: 'scatter', data: { datasets: [{ label: NAME[cs.s], data: a ? a.points.map(p => ({ x: p.ret * 100, y: p.d, l: p.label })) : [], backgroundColor: COL[cs.s], pointRadius: 6, pointHoverRadius: 9 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Share-price return in the financial year (%, Adj Close)' } }, y: { title: { display: true, text: 'Change in ' + cs.m + ' (percentage points)' } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw.l}: price ${c.parsed.x.toFixed(1)}%, change ${c.parsed.y} pp` } } } } });
  };
  $('#scS').onclick = e => { const c = e.target.closest('.chip'); if (!c) return; cs.s = c.dataset.s; $$('.chip', $('#scS')).forEach(x => x.classList.toggle('on', x === c)); draw(); };
  $('#scM').onclick = e => { const c = e.target.closest('.chip'); if (!c) return; cs.m = c.dataset.m; $$('.chip', $('#scM')).forEach(x => x.classList.toggle('on', x === c)); draw(); };
  draw();
}

/* ---------- findings ---------- */
function findings2() {
  const lastIdx = s => { const a = M.full[s]; for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i]; };
  const r = (id, s, w) => evRes(id, s)[w];
  const g = (k, p) => cv(k, 'GNPA', p), n = (k, p) => cv(k, 'NNPA', p), pc = (k, p) => cv(k, 'PCR', p);
  const pos = ['ICICI GNPA (next-year change)', 'Chola NNPA (next-year change)'];
  const items = [
    ['How did HDFC Bank perform relative to ICICI Bank?', `HDFC held GNPA between 1.05% and 1.36% for all ten years, FY2026 ${g('HDFC', 'FY2026')}%. ICICI's net NPA fell from ${n('ICICI', 'FY2017')}% (FY2017) to ${n('ICICI', 'FY2026')}% (FY2026) and its GNPA from ${g('ICICI', 'FY2021')}% (FY2021, first year extracted) to ${g('ICICI', 'FY2026')}%. FY2026 PCR is ICICI ${pc('ICICI', 'FY2026')}% vs HDFC ${pc('HDFC', 'FY2026')}%, though HDFC's PCR excludes written-off assets. HDFC was steadier; ICICI recovered from a worse start. From 3 Oct 2016 to 30 Sep 2026 the indexed share prices ended at ${lastIdx('HDFC')} (HDFC) and ${lastIdx('ICICI')} (ICICI), with Nifty Bank at ${lastIdx('NBANK')} (price index, base 100). Price outcomes reflect many factors beyond credit quality. HDFC FY2024 onward includes the merger.`],
    ['How did Bajaj Finance perform relative to Cholamandalam?', `Bajaj GNPA stayed between 0.85% and 1.79% (FY2026 ${g('BAJAJ', 'FY2026')}%, NNPA ${n('BAJAJ', 'FY2026')}%). Chola ran higher, 2.7% to 6.8% (peak FY2022), FY2026 ${g('CHOLA', 'FY2026')}%, NNPA ${n('CHOLA', 'FY2026')}%. The books differ (consumer-led vs vehicle-led secured), and Bajaj is consolidated while Chola is standalone, so the gap is not a pure quality ranking. Indexed prices ended at ${lastIdx('BAJAJ')} (Bajaj) and ${lastIdx('CHOLA')} (Chola), base 100 on 3 Oct 2016.`],
    ['What happened to credit quality in downturns?', `Around COVID-19 (FY2021-FY2022) NBFC GNPA rose: Bajaj ${g('BAJAJ', 'FY2020')}% (FY2020) to ${g('BAJAJ', 'FY2021')}% (FY2021); Chola ${g('CHOLA', 'FY2021')}% (FY2021) to ${g('CHOLA', 'FY2022')}% (FY2022). HDFC moved only ${g('HDFC', 'FY2020')}% to ${g('HDFC', 'FY2021')}%, and ICICI's GNPA was already falling from ${g('ICICI', 'FY2021')}%. Moratorium and Supreme Court standstill rules delayed recognition, so FY2021 understates stress and the FY2022 rise partly reflects catch-up.`],
    ['Which risks were systematic and which lender-specific?', `Systematic (all lenders): demonetisation, the 2018 NBFC liquidity squeeze, COVID-19, the May 2022 rate hike and the Nov 2023 risk-weight rule. Lender-specific: ICICI CEO exit, RBI curbs on HDFC Bank, the HDFC merger and the RBI order on Bajaj. In the data, systematic events moved all stocks together (daily correlation with own benchmark: HDFC ${M.comove.HDFC.vs_bench.r.toFixed(2)}, ICICI ${M.comove.ICICI.vs_bench.r.toFixed(2)}, Bajaj ${M.comove.BAJAJ.vs_bench.r.toFixed(2)}, Chola ${M.comove.CHOLA.vs_bench.r.toFixed(2)}), while NBFCs fell more than banks in the 2018 and 2020 windows (and Bajaj in 2022). Idiosyncratic events were mostly regulatory or governance news, with no visible jump in annual NPAs for the affected lender.`],
    ['How did share prices react?', `COVID day (23 Mar 2020): HDFC ${pct(r('E04', 'HDFC', '[0,0]').raw)}, ICICI ${pct(r('E04', 'ICICI', '[0,0]').raw)}, Bajaj ${pct(r('E04', 'BAJAJ', '[0,0]').raw)}, Chola ${pct(r('E04', 'CHOLA', '[0,0]').raw)}. RBI curbs on HDFC (E05): CAR [-5,+5] ${pct(r('E05', 'HDFC', '[-5,+5]').car)} (t ${num(r('E05', 'HDFC', '[-5,+5]').t)}, placebo p ${r('E05', 'HDFC', '[-5,+5]').placebo_p.toFixed(2)}), recovered the pre-event close in ${M.recovery['E05|HDFC'].days} sessions. Bajaj RBI order (E08): opened ${pct(M.intraday['E08|BAJAJ'].open_gap)} but closed ${pct(r('E08', 'BAJAJ', '[0,0]').raw)}; CAR [-5,+5] ${pct(r('E08', 'BAJAJ', '[-5,+5]').car)} (t ${num(r('E08', 'BAJAJ', '[-5,+5]').t)}, not significant). HDFC merger announcement (E06): ${pct(r('E06', 'HDFC', '[0,0]').raw)} on the day. IL&FS (E02): Bajaj CAR [-1,+1] ${pct(r('E02', 'BAJAJ', '[-1,+1]').car)} (t ${num(r('E02', 'BAJAJ', '[-1,+1]').t)}).`],
    ['Is there evidence of correlation between credit developments and market performance?', `Little. Annual share-price returns vs changes in GNPA/NNPA/PCR use n = 5 to 9 and no relationship holds consistently across lenders: for same-year GNPA, HDFC r = ${AN('HDFC', 'GNPA', 0).pearson.toFixed(2)} and Bajaj r = ${AN('BAJAJ', 'GNPA', 0).pearson.toFixed(2)} (positive, p &gt; 0.05), the opposite sign to what "bad news lowers price" would give. Two of 22 main tests reach p &lt; 0.05 (${pos.join(' and ')}), on n = 5 and 8 and with opposite signs, which is what chance across many tests would produce. Price-level vs GNPA-level correlations are shown only as a contrast: they mix trend and are not evidence. The earlier draft's -0.62 and -0.74 have been removed. Co-movement is not causation.`],
    ['Limitations', 'Annual credit data (10 points) against daily prices; unavailable slippages, write-offs and credit cost; data breaks (merger, definitions, moratorium); small samples; overlapping events (E08/E09); no estimation window for E01; benchmarks are price indices without dividends; event dates for E03, E05, E06 and E09 rely on press reports whose URLs were not retained; bank and NBFC measures are not comparable, so no overall winner is named.']
  ];
  $('#findBox').innerHTML = items.map((x, i) => `<div class="glass reveal in"><h3>${i + 1}. ${x[0]}</h3><p style="margin-top:10px;color:var(--muted);font-size:.92rem">${x[1]}</p></div>`).join('');
  $('#concl').innerHTML = `<h3>Conclusion</h3><p style="margin-top:10px">Within banks, HDFC Bank showed the steadier reported asset quality and ICICI Bank the stronger improvement and higher coverage. Within NBFCs, Bajaj Finance reported lower NPAs than Cholamandalam, whose book is more secured and vehicle-led. Shocks that hit the whole system (COVID-19, funding stress, policy changes) moved every stock and hurt NBFCs most; lender-specific events produced short-lived price reactions without a visible change in annual NPAs. Share-price moves and credit indicators show no reliable statistical link in this small sample. Banks and NBFCs are not ranked against each other. Slippages, write-offs and credit cost remain unavailable, so a complete verdict on credit cost is not possible.</p>`;
}

/* ---------- method additions ---------- */
function method() {
  $('#brk2').innerHTML = window.FRA_BREAKS.map(b => `<p class="note warn"><b>${esc(b[0])}:</b> ${esc(b[1])}</p>`).join('');
  $('#removed').innerHTML = '<ul style="margin:0 0 0 18px;display:grid;gap:7px;color:var(--muted);font-size:.9rem">' + window.FRA_REMOVED.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>';
  $('#src2').innerHTML = '<thead><tr><th>ID</th><th>Event / price / regulatory source</th></tr></thead><tbody>' + window.FRA_SRC_EXTRA.map(s => `<tr><td>${s[0]} &middot; ${esc(s[1])}</td><td style="white-space:normal">${s[3] ? `<a href="${s[3]}" target="_blank" rel="noopener">${esc(s[2])}</a>` : esc(s[2])}</td></tr>`).join('') + '</tbody>';
  $('#pxMeta').innerHTML = `<b>Price data:</b> ${esc(M.meta.source)}. Frequency ${M.meta.frequency}, base date ${M.meta.base_date}, ${M.meta.calendar_days} sessions. ${esc(M.meta.adjustment)} ${esc(M.meta.gaps)} ${esc(M.meta.estimation)}. Annual returns use the last session on or before 31 March; ${esc(M.annual_px_note)}`;
}

/* ---------- peer rationale + metrics in intro ---------- */
function intro2() {
  $('#rationale').innerHTML = `<div class="glass reveal in"><h3>Bank peer set: HDFC Bank (focal) &amp; ICICI Bank (peer)</h3><p style="margin-top:8px;color:var(--muted);font-size:.9rem">Two large private-sector banks under the same RBI rules, similar scale and mix of retail and corporate lending, and comparable disclosures. Banks are compared only with banks.</p></div><div class="glass reveal in"><h3>NBFC peer set: Bajaj Finance (focal) &amp; Cholamandalam (peer)</h3><p style="margin-top:8px;color:var(--muted);font-size:.9rem">Two large listed lending NBFCs under the same RBI NBFC framework. Bajaj is consumer-led and unsecured-heavy; Chola is vehicle-led and secured, which is a stated difference in risk profile. NBFCs are compared only with NBFCs.</p></div>`;
  $('#metricDefs').innerHTML = DEFS.map(d => `<div class="glass reveal in"><h3 style="font-size:1rem">${d[1]}</h3><p style="margin-top:6px;color:var(--muted);font-size:.86rem">${d[2]}</p><span class="tag ${['GNPA', 'NNPA', 'PCR'].includes(d[0]) ? 'ok' : 'pend'}" style="margin-top:8px">${['GNPA', 'NNPA', 'PCR'].includes(d[0]) ? 'data available' : 'unavailable'}</span></div>`).join('');
}


/* ---------- ILLUSTRATIVE (hypothetical) charts: methodology only, never used in findings ---------- */
const FY5 = ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'FY2026'];
const ILL = {
  SLIP: { HDFC: [1.1, 1.0, 1.2, 1.3, 1.2], ICICI: [1.6, 1.3, 1.2, 1.1, 1.1], BAJAJ: [2.4, 1.8, 1.9, 2.1, 2.3], CHOLA: [3.9, 3.0, 2.8, 3.4, 3.6] },
  WO: { HDFC: [9000, 10500, 11500, 13000, 14500], ICICI: [3800, 4200, 4500, 4800, 5000], BAJAJ: [1400, 1100, 1500, 2300, 2900], CHOLA: [900, 800, 950, 1300, 1700] },
  CC: { HDFC: [0.9, 0.7, 0.8, 0.9, 1.0], ICICI: [0.7, 0.5, 0.4, 0.5, 0.6], BAJAJ: [3.0, 1.6, 1.5, 1.8, 2.1], CHOLA: [1.5, 1.1, 1.0, 1.3, 1.5] }
};
function illus(host, a, b, grp) {
  const den = grp === 'bank' ? 'advances' : 'AUM', id = 'ill-' + host, st = { m: 'SLIP' };
  const INFO = {
    SLIP: { t: 'Slippages', u: '% of opening ' + den, def: `Slippage ratio = fresh slippages during the period &divide; opening standard ${den}.`, ex: `Fresh slippages Rs 1,200 crore &divide; opening standard ${den} Rs 100,000 crore = <b>1.20%</b>.` },
    WO: { t: 'Write-offs', u: 'Rs crore (hypothetical amounts)', def: 'Write-offs = amount of loans written off during the period. It is an amount in Rs crore, not a ratio.', ex: 'Opening GNPA 5,000 + fresh slippages 1,200 &minus; recoveries and upgrades 700 &minus; write-offs 900 = closing GNPA 4,600 (Rs crore). Write-offs for the period = <b>Rs 900 crore</b>.' },
    CC: { t: 'Credit cost', u: '% of average ' + den, def: `Credit cost = credit impairment / provisions charged to the P&amp;L during the period &divide; average ${den} ((opening + closing) &divide; 2).`, ex: `Provisions charged Rs 800 crore &divide; average ${den} ((95,000 + 105,000) &divide; 2 = 100,000) = <b>0.80%</b>.` }
  };
  const el = $('#' + host);
  el.insertAdjacentHTML('beforeend', `<div class="glass chart-card reveal in" style="margin-top:20px;border:1px dashed var(--amber,#fbbf24)"><span class="tag pend">Illustrative example &mdash; not actual company data</span><h3 style="margin-top:8px">How slippages, write-offs and credit cost work (hypothetical values)</h3><p class="note warn" style="margin-top:8px">Dummy numbers for ${E[a].name} and ${E[b].name}, FY2022&ndash;FY2026, to explain the methodology. They are not reported figures and are excluded from every trend, event study, correlation and conclusion on this site. Verified data for these three measures is unavailable (see table above).</p><div class="chips" id="${id}-m" style="margin:10px 0"></div><div class="chart-box"><canvas id="${id}-c"></canvas></div><p class="src" id="${id}-d"></p><div class="note" id="${id}-x" style="margin-top:10px"></div></div>`);
  const draw = () => {
    const i = INFO[st.m], bar = st.m === 'WO';
    $('#' + id + '-m').innerHTML = Object.keys(INFO).map(k => `<span class="chip ${k === st.m ? 'on' : ''}" data-m="${k}">${INFO[k].t}</span>`).join('');
    mk(id + '-c', { type: bar ? 'bar' : 'line', data: { labels: FY5, datasets: [a, b].map(k => ({ label: E[k].name + ' (hypothetical)', data: ILL[st.m][k], borderColor: COL[k], backgroundColor: COL[k], borderWidth: 2.2, pointRadius: 4, tension: .25, borderRadius: 5 })) }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { beginAtZero: true, title: { display: true, text: i.t + ' (' + i.u + ') - ILLUSTRATIVE' } }, x: { grid: { display: false } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y}${bar ? ' Rs crore' : '%'}` } } } } });
    $('#' + id + '-d').innerHTML = '<b>Definition:</b> ' + i.def;
    $('#' + id + '-x').innerHTML = '<b>Worked example (hypothetical inputs, not a company\'s reported figures):</b><br>' + i.ex;
  };
  $('#' + id + '-m').onclick = e => { const c = e.target.closest('.chip'); if (!c) return; st.m = c.dataset.m; draw(); };
  draw();
}
function narrative() {
  const h = $('#narr'); if (!h) return;
  const li = x => `<li>${x}</li>`;
  h.innerHTML = `<h3>How to read this dashboard</h3><ul style="margin:10px 0 0 18px;color:var(--muted);display:grid;gap:8px;font-size:.92rem">${[
    '<b>Six metrics:</b> GNPA, NNPA and PCR show the stock of bad loans and the cushion against them; slippages show new bad loans, write-offs the loans removed, and credit cost the P&amp;L charge. The first three are verified data. The last three are unavailable as verified series.',
    '<b>Banks and NBFCs are separate:</b> they report advances vs AUM, follow different capital rules and define coverage differently, so each focal lender is compared only with its own peer.',
    '<b>The nine events:</b> shocks that hit everyone (COVID-19, funding stress, rate and risk-weight changes) moved every stock and hit NBFCs hardest; lender-specific regulatory or governance news produced short-lived reactions without a visible change in annual NPAs.',
    '<b>What the event study and correlations can show:</b> the size and timing of price moves and whether co-movement exists. <b>What they cannot show:</b> cause. Annual credit data gives only 5 to 9 points per lender, so even a strong correlation would not prove that credit quality moves prices.',
    '<b>Data breaks:</b> HDFC Bank FY2024 onward includes the HDFC Ltd merger (1 Jul 2023), and ratios also differ by denominator, consolidation, IGAAP/Ind AS and the COVID moratorium, so years are not always like-for-like.',
    '<b>Verified vs illustrative:</b> every empirical finding uses verified data only. The dashed "Illustrative example" charts use dummy values to explain methodology and are excluded from all findings.'].map(li).join('')}</ul>`;
}

try { intro2(); six('sixBanks', 'HDFC', 'ICICI', 'bank'); six('sixNbfcs', 'BAJAJ', 'CHOLA', 'nbfc'); illus('sixBanks', 'HDFC', 'ICICI', 'bank'); illus('sixNbfcs', 'BAJAJ', 'CHOLA', 'nbfc'); narrative(); events(); pricePanel(); fullCharts(); corrTables(); scatter(); findings2(); method(); }
catch (e) { console.error(e); }
})();
