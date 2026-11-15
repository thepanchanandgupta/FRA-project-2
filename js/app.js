/* FRA Group Project 2 - Credit Risk Intelligence | annual credit-risk dashboard (FY2017-FY2026) */
(function () {
'use strict';
const C = window.FRA_CREDIT;
const HAS_CHART = typeof Chart !== 'undefined';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
if (HAS_CHART) {
  Chart.defaults.color = '#8fa0c4'; Chart.defaults.font.family = 'Inter, system-ui, sans-serif'; Chart.defaults.font.size = 12;
  Chart.defaults.borderColor = 'rgba(255,255,255,.07)';
  const t = Chart.defaults.plugins.tooltip; t.backgroundColor = 'rgba(8,14,30,.94)'; t.borderColor = 'rgba(255,255,255,.14)'; t.borderWidth = 1; t.padding = 12; t.cornerRadius = 10;
  Chart.defaults.plugins.legend.labels.usePointStyle = true; Chart.defaults.plugins.legend.labels.boxWidth = 8;
  if (REDUCED) Chart.defaults.animation = false;
}
const charts = {};
function mk(id, cfg) { if (!HAS_CHART) return null; if (charts[id]) charts[id].destroy(); const el = document.getElementById(id); if (!el) return null; return charts[id] = new Chart(el, cfg); }
if (!HAS_CHART) document.addEventListener('DOMContentLoaded', () => $$('.chart-box').forEach(b => { b.innerHTML = '<p class="note warn">The charting library could not be loaded. Tables remain available.</p>'; }));

/* ---------- data helpers ---------- */
const E = C.entities, P = C.periods;
const find = (e, m, p) => C.observations.find(o => o.entity === e && o.metric === m && o.period === p);
const cv = (e, m, p) => { const o = find(e, m, p); return o ? o.value : null; };
const series = (e, m) => P.map(p => ({ p, v: cv(e, m, p) })).filter(x => x.v != null);
const range = (e, m) => { const a = series(e, m); if (!a.length) return null; return { lo: a.reduce((x, y) => y.v < x.v ? y : x), hi: a.reduce((x, y) => y.v > x.v ? y : x) }; };
const mlabel = k => C.metrics.find(m => m.key === k);
const fmt = v => v == null ? 'n/a' : String(v);
const sc = (e, p) => (C.scale[e] || {})[p];

/* ---------- page mechanics ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); countUp(e.target); } }), { threshold: .12 });
function countUp(root) {
  $$('[data-count]', root).forEach(el => {
    if (el.dataset.done) return; el.dataset.done = 1;
    const to = parseFloat(el.dataset.count), d = parseInt(el.dataset.dec || 0), suf = el.dataset.suf || '', f = v => v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) + suf;
    if (REDUCED) { el.textContent = f(to); return; }
    const t0 = performance.now(); (function step(t) { const k = Math.min(1, (t - t0) / 1100); el.textContent = f(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
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

/* ---------- hero, lenders, KPIs ---------- */
function intro() {
  const keys = ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA'];
  $('#heroStats').innerHTML = keys.map(k => `<div class="stat"><span><i class="dot" style="background:${E[k].color}"></i> ${E[k].name}</span><b>${fmt(cv(k, 'GNPA', 'FY2026'))}%</b></div>`).join('');
  const role = { HDFC: 'Bank', ICICI: 'Bank (peer)', BAJAJ: 'NBFC', CHOLA: 'NBFC (peer)' };
  $('#lenders').innerHTML = keys.map(k => `<div class="glass spot reveal" style="border-top:2px solid ${E[k].color}"><span class="tag ${k === 'HDFC' || k === 'BAJAJ' ? 'ok' : 'pend'}">${role[k]}</span><h3 style="margin-top:8px">${E[k].name}</h3><p class="src" style="margin:6px 0 0">${esc(E[k].type)}</p><p style="margin-top:10px;font-size:.88rem;color:var(--muted)">FY2026: GNPA <b style="color:var(--ink)">${fmt(cv(k, 'GNPA', 'FY2026'))}%</b> &middot; NNPA <b style="color:var(--ink)">${fmt(cv(k, 'NNPA', 'FY2026'))}%</b></p></div>`).join('');
  const rep = C.observations.filter(o => o.kind === 'reported').length, cal = C.observations.length - rep;
  const k = [{ v: 4, l: 'Lenders', s: 'Two banks, two NBFCs' }, { v: 10, l: 'Financial years', s: 'FY2017 to FY2026' }, { v: rep, l: 'Reported data points', s: cal + ' more calculated (growth)' }, { v: 5, l: 'Metrics', s: 'GNPA, NNPA, PCR, growth, CRAR' }];
  $('#kpis').innerHTML = k.map(x => `<div class="glass spot kpi"><div class="v" data-count="${x.v}">0</div><div class="l">${x.l}</div><div class="d">${x.s}</div></div>`).join('');
}

/* ---------- peer sections ---------- */
const mergerMark = { id: 'mergerMark', afterDatasetsDraw(ch) { const o = ch.options.plugins.mergerMark; if (!o || !o.on) return; const i = ch.data.labels.indexOf('FY2024'); if (i < 0) return; const { ctx, chartArea: a, scales } = ch, x = scales.x.getPixelForValue(i); ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(251,191,36,.85)'; ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke(); ctx.fillStyle = '#fbbf24'; ctx.font = '600 11px Inter'; ctx.textAlign = 'right'; ctx.fillText('HDFC merger (1 Jul 2023)', x - 6, a.top + 12); ctx.restore(); } };
function peer(host, a, b, bullets, merger) {
  const id = host;
  const el = $('#' + host); const sel = { m: 'GNPA', on: { [a]: true, [b]: true } };
  el.innerHTML = `<div class="grid g2" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)">
    <div class="glass chart-card reveal"><h3 id="${id}-t"></h3><div class="sub" id="${id}-s"></div>
      <div class="chips" id="${id}-m" style="margin:10px 0"></div><div class="chips" id="${id}-e" style="margin:0 0 6px"></div>
      <div class="chart-box"><canvas id="${id}-c"></canvas></div><p class="src" id="${id}-src"></p></div>
    <div class="glass chart-card reveal"><h3>Main findings</h3><ul style="margin:10px 0 0 18px;color:var(--muted);display:grid;gap:9px;font-size:.92rem">${bullets.map(x => `<li>${x}</li>`).join('')}</ul></div></div>`;
  $('#' + id + '-m').innerHTML = C.metrics.map(m => `<span class="chip ${m.key === sel.m ? 'on' : ''}" data-m="${m.key}">${m.label.replace(' (calculated)', '')}</span>`).join('');
  $('#' + id + '-e').innerHTML = [a, b].map(k => `<span class="chip on" data-e="${k}"><i class="dot" style="background:${E[k].color}"></i>${E[k].name}</span>`).join('');
  const draw = () => {
    const m = mlabel(sel.m), ks = [a, b].filter(k => sel.on[k]);
    $('#' + id + '-t').textContent = `${m.label}, FY2017–FY2026 (${m.unit})`;
    $('#' + id + '-s').textContent = ks.map(k => { const o = C.observations.find(x => x.entity === k && x.metric === sel.m); return o ? `${E[k].name}: ${o.basis}` : `${E[k].name}: no data for this metric`; }).join(' | ');
    const ds = ks.map(k => ({ label: E[k].name, data: P.map(p => cv(k, sel.m, p)), borderColor: E[k].color, backgroundColor: E[k].color, pointRadius: 5, pointHoverRadius: 8, borderWidth: 2.4, tension: .25, spanGaps: false }));
    const has = ds.some(d => d.data.some(v => v != null));
    const miss = ks.filter(k => P.some(p => cv(k, sel.m, p) == null)).map(k => E[k].name);
    $('#' + id + '-src').textContent = (has ? 'Source: team extraction from annual reports (page references in the data grid). ' : 'No data points for this selection. ') + (miss.length ? 'Gaps for ' + miss.join(' and ') + ' mean not disclosed or not extracted, never zero.' : '') + (sel.m === 'ADV_GROWTH' ? ' Growth is calculated from advances (banks) or AUM (NBFCs).' : '');
    mk(id + '-c', { type: 'line', data: { labels: P, datasets: ds }, plugins: [mergerMark], options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { title: { display: true, text: m.label.replace(' (calculated)', '') + ' (' + m.unit + ')' }, beginAtZero: sel.m !== 'PCR' }, x: { grid: { display: false } } }, plugins: { legend: { position: 'bottom' }, mergerMark: { on: !!merger && sel.m !== 'CRAR' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'not available' : c.parsed.y + m.unit}` } } } } });
  };
  $('#' + id + '-m').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; sel.m = c.dataset.m; $$('.chip', $('#' + id + '-m')).forEach(x => x.classList.toggle('on', x === c)); draw(); });
  $('#' + id + '-e').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return; const k = c.dataset.e, n = Object.values(sel.on).filter(Boolean).length; if (sel.on[k] && n === 1) return; sel.on[k] = !sel.on[k]; c.classList.toggle('on', sel.on[k]); draw(); });
  draw();
}
function peers() {
  const rh = range('HDFC', 'GNPA'), ri = range('ICICI', 'GNPA'), rb = range('BAJAJ', 'GNPA'), rc = range('CHOLA', 'GNPA');
  const gr = (e, p) => cv(e, 'ADV_GROWTH', p);
  peer('peerBanks', 'HDFC', 'ICICI', [
    `<b>HDFC Bank</b> kept GNPA in a narrow band, ${rh.lo.v}% (${rh.lo.p}) to ${rh.hi.v}% (${rh.hi.p}); FY2026 is ${cv('HDFC', 'GNPA', 'FY2026')}% with NNPA ${cv('HDFC', 'NNPA', 'FY2026')}%.`,
    `<b>ICICI Bank</b> fell from ${ri.hi.v}% GNPA (${ri.hi.p}) to ${cv('ICICI', 'GNPA', 'FY2026')}% (FY2026); its net NPA ratio fell from ${cv('ICICI', 'NNPA', 'FY2017')}% (FY2017) to ${cv('ICICI', 'NNPA', 'FY2026')}% (FY2026). ICICI's GNPA before FY2021 was not extracted.`,
    `<b>Coverage:</b> FY2026 PCR is ${cv('ICICI', 'PCR', 'FY2026')}% for ICICI and ${cv('HDFC', 'PCR', 'FY2026')}% for HDFC (HDFC's PCR excludes written-off assets, so it is not strictly comparable). HDFC's PCR is ${(cv('HDFC', 'PCR', 'FY2023') - cv('HDFC', 'PCR', 'FY2026')).toFixed(1)} points below its FY2023 level of ${cv('HDFC', 'PCR', 'FY2023')}%.`,
    `<b>Merger:</b> HDFC's advances growth of ${gr('HDFC', 'FY2024')}% in FY2024 is mostly structural, from the HDFC Ltd merger, not organic lending growth.`,
    `<b>Caveat:</b> ICICI's ratios use customer-asset denominators, so they are slightly different from HDFC's headline ratios.`], true);
  peer('peerNbfcs', 'BAJAJ', 'CHOLA', [
    `<b>Bajaj Finance</b> GNPA ranged ${rb.lo.v}%–${rb.hi.v}% (peak ${rb.hi.p}); FY2026 is ${cv('BAJAJ', 'GNPA', 'FY2026')}% with NNPA ${cv('BAJAJ', 'NNPA', 'FY2026')}%.`,
    `<b>Cholamandalam</b> GNPA ranged ${rc.lo.v}%–${rc.hi.v}% (peak ${rc.hi.p}, with NNPA ${cv('CHOLA', 'NNPA', 'FY2022')}%); FY2026 is ${cv('CHOLA', 'GNPA', 'FY2026')}%, up from ${cv('CHOLA', 'GNPA', 'FY2024')}% in FY2024.`,
    `<b>Growth with quality:</b> Bajaj's AUM grew ${(sc('BAJAJ', 'FY2026') / sc('BAJAJ', 'FY2021')).toFixed(1)}× from FY2021 to FY2026 and Cholamandalam's ${(sc('CHOLA', 'FY2026') / sc('CHOLA', 'FY2021')).toFixed(1)}× (AUM is a different measure from advances).`,
    `<b>Coverage:</b> Bajaj's PCR slipped from ${cv('BAJAJ', 'PCR', 'FY2018')}% (FY2018) to ${cv('BAJAJ', 'PCR', 'FY2025')}% (FY2025), then ${cv('BAJAJ', 'PCR', 'FY2026')}% in FY2026. A comparable Chola PCR series was not extracted.`,
    `<b>Caveat:</b> Bajaj's ratios are consolidated; Chola's are standalone. Chola's FY2017 is IGAAP and FY2018–19 Ind AS, so early years are not strictly comparable.`], false);
}

/* ---------- comparison ---------- */
function compare() {
  const keys = ['HDFC', 'ICICI', 'BAJAJ', 'CHOLA'];
  mk('cmpChart', { type: 'bar', data: { labels: keys.map(k => E[k].name), datasets: [{ label: 'GNPA %', data: keys.map(k => cv(k, 'GNPA', 'FY2026')), backgroundColor: 'rgba(78,161,255,.85)', borderRadius: 6 }, { label: 'NNPA %', data: keys.map(k => cv(k, 'NNPA', 'FY2026')), backgroundColor: 'rgba(167,139,250,.85)', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label.replace(' %', '')}: ${c.parsed.y}%` } } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Ratio (%)' } }, x: { grid: { display: false } } } } });
  const row = (lab, m) => `<tr><td>${lab}</td>${keys.map(k => { const v = cv(k, m, 'FY2026'); return `<td class="num">${v == null ? '<span class="na">n/a</span>' : v + '%'}</td>`; }).join('')}</tr>`;
  $('#snapTable').innerHTML = `<thead><tr><th>FY2026</th>${keys.map(k => `<th class="num">${E[k].name}</th>`).join('')}</tr></thead><tbody>${row('GNPA', 'GNPA')}${row('NNPA', 'NNPA')}${row('PCR', 'PCR')}${row('CRAR', 'CRAR')}${row('Advances / AUM growth', 'ADV_GROWTH')}<tr><td>Basis</td><td class="num">Standalone</td><td class="num">Standalone*</td><td class="num">Consol.; CRAR standalone</td><td class="num">Standalone</td></tr></tbody>`;
  $('#factsTable').innerHTML = '<thead><tr><th>Lender</th><th>Measure</th><th>Value</th><th>Note</th><th>Source</th></tr></thead><tbody>' + C.facts.map(f => `<tr><td>${E[f.entity].name}</td><td style="white-space:normal">${esc(f.label)}</td><td style="white-space:normal;min-width:140px"><b>${esc(f.value)}</b></td><td style="white-space:normal;min-width:220px">${esc(f.note)}</td><td style="white-space:normal;min-width:200px">${esc(f.source)}</td></tr>`).join('') + '</tbody>';
  $('#evList').innerHTML = C.events.map(e => `<div class="glass reveal in" style="padding:14px 20px"><span class="tag ${e.entity === 'ALL' ? 'sys' : 'idio'}">${e.entity === 'ALL' ? 'All lenders' : E[e.entity].name}</span> <b style="margin-left:8px">${esc(e.when)}</b><p style="margin-top:6px;color:var(--muted);font-size:.9rem">${esc(e.text)}</p></div>`).join('');
}

/* ---------- findings and limits ---------- */
function findings() {
  const rh = range('HDFC', 'GNPA'), ri = range('ICICI', 'GNPA'), rb = range('BAJAJ', 'GNPA'), rc = range('CHOLA', 'GNPA');
  const f = [
    ['1. Banks ended FY2026 with low, similar NPAs by different routes', `HDFC stayed within ${rh.lo.v}%–${rh.hi.v}% GNPA throughout; ICICI recovered from ${ri.hi.v}% (${ri.hi.p}) to ${cv('ICICI', 'GNPA', 'FY2026')}%.`],
    ['2. Bajaj reports lower NPAs than Cholamandalam', `Bajaj GNPA stayed at or below ${rb.hi.v}% while Cholamandalam peaked at ${rc.hi.v}% (${rc.hi.p}) and was ${cv('CHOLA', 'GNPA', 'FY2026')}% in FY2026. Their loan books differ (consumer-led vs vehicle-led secured), so this is not a pure quality ranking.`],
    ['3. Coverage and capital differ by measure', `FY2026 PCR: ICICI ${cv('ICICI', 'PCR', 'FY2026')}%, HDFC ${cv('HDFC', 'PCR', 'FY2026')}%, Bajaj ${cv('BAJAJ', 'PCR', 'FY2026')}%. FY2026 CRAR: HDFC ${cv('HDFC', 'CRAR', 'FY2026')}%, ICICI ${cv('ICICI', 'CRAR', 'FY2026')}%, Bajaj ${cv('BAJAJ', 'CRAR', 'FY2026')}%, Cholamandalam ${cv('CHOLA', 'CRAR', 'FY2026')}%. Definitions differ, so these show each lender's own cushion, not a league table.`],
    ['4. Shared shocks and one-off events shaped the trends', 'COVID-19 and the moratorium period lifted NPAs for NBFCs (Bajaj FY2021, Cholamandalam FY2022); ICICI\'s decline reflects clean-up of earlier corporate stress; HDFC\'s FY2024 balance sheet reflects its merger. Descriptions, not proof of cause.']
  ];
  $('#findBox').innerHTML = f.map(x => `<div class="glass reveal in"><h3>${x[0]}</h3><p style="margin-top:10px;color:var(--muted);font-size:.93rem">${x[1]}</p></div>`).join('');
  $('#concl').innerHTML = `<h3>Conclusion</h3><p style="margin-top:10px">On the reported ratios, all four lenders ended FY2026 with healthy asset quality for their business models, and the evidence does not support naming one lender the winner. Within banks, HDFC is the steadier performer and ICICI the stronger recoverer with higher provision coverage. Within NBFCs, Bajaj shows lower reported NPAs than Cholamandalam, which serves a more secured, vehicle-led segment. A fuller verdict needs slippages and credit cost, which were not collected.</p>`;
  const lim = [
    ['Banks vs NBFCs', 'Advances and AUM, capital rules and PCR definitions differ, so only peers within a group are compared.'],
    ['Standalone vs consolidated', 'HDFC, ICICI and Cholamandalam are standalone; Bajaj asset-quality ratios are consolidated (its CRAR is standalone).'],
    ['HDFC merger', 'HDFC Ltd merged on 1 Jul 2023, so FY2024 onward is not like-for-like with earlier years.'],
    ['Definitions change', 'ICICI uses customer-asset denominators; Chola\'s early years mix IGAAP and Ind AS; NPA and Stage 3 are different measures.'],
    ['Missing data', 'No slippages, write-offs, credit cost or quarterly series. ICICI GNPA before FY2021 is not extracted. Blank means not available, never zero.'],
    ['Verification', 'Values are a team extraction from annual reports. Selected values were spot-checked against company disclosures (see data checks); not every figure was re-verified.']];
  $('#limits').innerHTML = lim.map(x => `<div class="glass reveal in"><h3>${x[0]}</h3><p style="margin-top:8px;color:var(--muted);font-size:.9rem">${x[1]}</p></div>`).join('');
  $('#checkTable').innerHTML = '<thead><tr><th>Value checked</th><th>Checked against</th><th>Result</th></tr></thead><tbody>' + C.crosschecks.map(c => `<tr><td style="white-space:normal;min-width:200px">${esc(c.item)}</td><td style="white-space:normal;min-width:200px">${esc(c.against)}</td><td style="white-space:normal;min-width:200px">${esc(c.result)}</td></tr>`).join('') + '</tbody>';
  $('#unres').innerHTML = '<b>Unresolved:</b><br>' + C.unresolved.map(esc).join('<br>');
  $('#breaks').innerHTML = C.data_breaks.map(b => `<p class="note warn"><b>${b.entity === 'ALL' ? 'All lenders' : E[b.entity].name} &middot; ${esc(b.when)}:</b> ${esc(b.what)}</p>`).join('') + `<p class="note" style="margin-top:12px"><b>Not collected:</b> ${C.not_collected.map(esc).join('; ')}.</p>`;
  $('#srcTable').innerHTML = '<thead><tr><th>ID</th><th>Source</th></tr></thead><tbody>' + Object.entries(C.sources).map(([k, s]) => `<tr><td>${k} &middot; ${esc(s.type)}</td><td style="white-space:normal">${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</td></tr>`).join('') + '</tbody>';
  const keys = Object.keys(E);
  $('#gridTable').innerHTML = `<thead><tr><th>Lender &middot; metric</th>${P.map(p => `<th class="num">${p}</th>`).join('')}</tr></thead><tbody>` + keys.map(k => C.metrics.map(m => `<tr><td>${E[k].name} &middot; ${m.label.replace(' (calculated)', '')}</td>${P.map(p => { const o = find(k, m.key, p); return o ? `<td class="num" title="${esc(o.basis)} | ${esc(C.sources[o.source].title)} | ${esc(o.page)}"><b>${o.value}</b>${o.kind === 'calculated' ? '<sup>c</sup>' : ''}</td>` : '<td class="num na" title="Not disclosed / not extracted">&ndash;</td>'; }).join('')}</tr>`).join('')).join('') + '</tbody>';
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
if (!C) document.body.insertAdjacentHTML('afterbegin', '<p style="padding:90px 20px;color:#fb7185">The credit data file failed to load.</p>');
else { intro(); peers(); compare(); findings(); qr(); $$('.reveal:not(.in)').forEach(el => io.observe(el)); }
})();
