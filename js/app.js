(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const money = v => v == null ? 'Not separately disclosed' : `₹${Number(v).toLocaleString('en-IN',{maximumFractionDigits:2})} cr`;
  const pct = v => v == null ? '—' : `${Number(v).toFixed(2)}%`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtCorr = v => v == null ? 'n/a' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
  const COLORS = {blue:'#3977e8',violet:'#8a63d2',cyan:'#16a6c5',teal:'#1b9c8a',red:'#d85454',amber:'#cf9233',grey:'#9aa8ba'};
  let DATA = null;

  async function boot(){
    try {
      const res = await fetch('data/dashboard-data.json');
      if(!res.ok) throw new Error(`Data fetch failed: ${res.status}`);
      DATA = await res.json();
      render();
      initCharts();
      initNavigation();
    } catch(err) {
      console.error(err);
      const n = document.createElement('div'); n.className='coverage-note';
      n.textContent='Dashboard data could not be loaded. Please run this folder through a local static server or host it on GitHub Pages.';
      $('main').prepend(n);
    }
  }

  function render(){
    renderPeerTable('bankPeerTable',DATA.peer_banks,'bank');
    renderPeerTable('nbfcPeerTable',DATA.peer_nbfcs,'nbfc');
    renderFlows(); renderEvents(); renderCorrelations(); renderSources(); renderTeam();
    $('#sourceCount').textContent = `${DATA.sources.length} references`;
  }

  function renderPeerTable(id, rows, sector){
    const tbody = $(`#${id} tbody`);
    tbody.innerHTML = rows.map(r => {
      const cls = r.is_focus ? ' class="focus-row"' : '';
      const status = r.data_status === 'SIMULATED_ACADEMIC_ESTIMATE' ? '<span class="basis simulated-tag">Modelled academic estimate</span>' : '';
      if(sector==='bank'){
        return `<tr${cls}><td><strong>${esc(r.name)}</strong>${r.is_focus?'<span class="basis">Selected entity</span>':''}${status}</td><td>${pct(r.gnpa)}</td><td>${pct(r.nnpa)}</td><td>${pct(r.pcr)}</td><td>${esc(r.other)}</td></tr>`;
      }
      const measure = r.asset_quality_type || 'Not stated';
      const gross = r.gnpa != null ? `${pct(r.gnpa)} GNPA` : `${pct(r.stage3_gross)} GS3`;
      const net = r.nnpa != null ? `${pct(r.nnpa)} NNPA` : `${pct(r.stage3_net)} NS3`;
      const coverage = pct(r.pcr);
      const basis = r.source_quality ? `${r.other} Source quality: secondary / requires validation.` : r.other;
      return `<tr${cls}><td><strong>${esc(r.name)}</strong>${r.is_focus?'<span class="basis">Selected entity</span>':''}${status}</td><td>${esc(measure)}</td><td>${gross}</td><td>${net}</td><td>${coverage}</td><td>${esc(basis)}</td></tr>`;
    }).join('');
  }

  function renderFlows(){
    const tbody=$('#flowTable tbody');
    tbody.innerHTML=DATA.flows.map(f=>{
      const writes=f.writeoffs==null?'Not separately isolated':`${money(f.writeoffs)}<span class="basis">${esc(f.writeoff_label||'')}</span>`;
      const status=f.data_status==='SIMULATED_ACADEMIC_ESTIMATE'?' <span class="basis simulated-tag">Modelled estimate</span>':'';
      const sym=({ 'HDFC Bank':'HDFC','ICICI Bank':'ICICI','Axis Bank':'AXIS','Kotak Mahindra Bank':'KOTAK','IndusInd Bank':'INDUSIND','Bajaj Finance':'BAJAJ','Cholamandalam':'CHOLA','Shriram Finance':'SHRIRAM','L&T Finance':'LTF','Mahindra & Mahindra Financial Services':'MMFSL'})[f.company];
      const model=DATA.modelled_flows?.[sym]||{}; const fy='FY2026';
      return `<tr><td><strong>${esc(f.company)}</strong><span class="basis">${esc(f.sector)}</span>${status}</td><td>${money(f.gross_additions)}</td><td>${money(f.gross_reductions)}</td><td>${writes}</td><td>${pct(model.slippage_ratio?.[fy])}</td><td>${pct(model.writeoff_ratio?.[fy])}</td><td>${pct(model.credit_cost?.[fy])}</td><td>${esc(f.notes)}</td></tr>`;
    }).join('');
  }

  function renderEvents(){
    $('#eventTable tbody').innerHTML=DATA.events.map(e=>{
      const h0=e.returns?.HDFC?.day0_excess, h5=e.returns?.HDFC?.window5_excess;
      const b0=e.returns?.BAJAJ?.day0_excess, b5=e.returns?.BAJAJ?.window5_excess;
      const cv=v=>v==null?'n/a':`${v>0?'+':''}${v.toFixed(2)}%`;
      return `<tr><td><strong>${esc(e.name)}</strong><span class="basis">${esc(e.date)}</span></td><td>${esc(e.class)}</td><td>${cv(h0)}</td><td>${cv(h5)}</td><td>${cv(b0)}</td><td>${cv(b5)}</td></tr>`;
    }).join('');
  }

  function renderCorrelations(){
    const labels={HDFC:'HDFC Bank',ICICI:'ICICI Bank',AXIS:'Axis Bank',KOTAK:'Kotak Mahindra',INDUSIND:'IndusInd Bank',BAJAJ:'Bajaj Finance',CHOLA:'Cholamandalam',SHRIRAM:'Shriram Finance',LTF:'L&T Finance',MMFSL:'Mahindra Finance'};
    $('#corrCards').innerHTML=Object.entries(DATA.annual_ret_corr).map(([k,v])=>`<div class="corr-card"><small>${labels[k]}</small><b>${fmtCorr(v.pearson)}</b><span>Pearson · n=${v.n}</span></div>`).join('');
  }

  function renderSources(){
    $('#sourceList').innerHTML=DATA.sources.map(s=>`<a class="source-link" href="${esc(s.url||'#')}" ${s.url?'target="_blank" rel="noopener noreferrer"':''}><div><b>${esc(s.label)}</b><small>${esc(s.note)}</small></div><span>↗</span></a>`).join('');
  }
  function renderTeam(){
    $('#teamList').innerHTML=DATA.team.map(n=>`<span class="team-chip">${esc(n)}</span>`).join('');
  }

  function makeLineChart(id, labels, sets, extra={}){
    if(!window.Chart) return null;
    return new Chart($(id),{
      type:'line',data:{labels,datasets:sets.map(s=>({label:s.label,data:s.data,borderColor:s.color,backgroundColor:s.color,pointRadius:0,pointHoverRadius:4,borderWidth:s.width||2,tension:.22,spanGaps:false,borderDash:s.dash||[]}))},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#14243b',padding:10,titleFont:{size:10},bodyFont:{size:10}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:9,color:'#8a97a9',font:{size:9}}},y:{grid:{color:'#edf1f5'},ticks:{color:'#8a97a9',font:{size:9},callback:v=>`${v}${extra.unit||''}`},title:{display:!!extra.yTitle,text:extra.yTitle,color:'#8996a7',font:{size:9}}}},...extra.options}
    });
  }

  function initCharts(){
    trendChart('bank','GNPA');
    trendChart('nbfc','GNPA');
    $$('.metric').forEach(btn=>btn.addEventListener('click',()=>{
      const group=btn.closest('.metric-switch').dataset.chartGroup;
      const metric=btn.dataset.metric;
      btn.closest('.metric-switch').querySelectorAll('.metric').forEach(b=>b.classList.toggle('active',b===btn));
      trendChart(group,metric);
    }));
    priceChart('bank');
  }

  const trendInstances={bank:null,nbfc:null};
  function trendChart(group,metric){
    const periods=Array.from({length:10},(_,i)=>`FY${2017+i}`);
    const cfg=group==='bank' ? [
      ['HDFC','HDFC Bank',COLORS.blue],['ICICI','ICICI Bank',COLORS.violet],['AXIS','Axis Bank','#25a58b'],['KOTAK','Kotak Mahindra','#df9853'],['INDUSIND','IndusInd Bank','#6b83a8']
    ] : [
      ['BAJAJ','Bajaj Finance',COLORS.cyan],['CHOLA','Cholamandalam',COLORS.teal],['SHRIRAM','Shriram Finance',COLORS.violet],['LTF','L&T Finance','#d39448'],['MMFSL','M&M Financial','#6586b9']
    ];
    const sets=cfg.map(([k,label,color])=>({label,data:periods.map(p=>DATA.annual[k][metric]?.[p]??null),color,width:2.4}));
    const id=group==='bank'?'#bankTrend':'#nbfcTrend';
    if(trendInstances[group]) trendInstances[group].destroy();
    trendInstances[group]=makeLineChart(id,periods,sets,{unit:'%'});
  }

  let priceChartInstance=null;
  const groups={
    bank:[['HDFC','HDFC Bank',COLORS.blue],['ICICI','ICICI Bank',COLORS.violet],['AXIS','Axis Bank','#25a58b'],['KOTAK','Kotak Mahindra','#df9853'],['INDUSIND','IndusInd Bank','#6b83a8'],['NIFTYBANK','Nifty Bank',COLORS.grey,true]],
    nbfc:[['BAJAJ','Bajaj Finance',COLORS.cyan],['CHOLA','Cholamandalam',COLORS.teal],['SHRIRAM','Shriram Finance',COLORS.violet],['LTF','L&T Finance','#d39448'],['MMFSL','M&M Financial','#6586b9'],['NIFTYFIN','Nifty Financial Services',COLORS.grey,true]]
  };
  function priceChart(sector){
    const g=groups[sector];
    const ref=DATA.prices[g[0][0]];
    const labels=ref.monthly_dates;
    const sets=g.map(([sym,label,color,dash])=>{
      const p=DATA.prices[sym];
      const map=new Map(p.monthly_dates.map((d,i)=>[d,p.monthly_index[i]]));
      return {label,data:labels.map(d=>map.has(d)?map.get(d):null),color,dash:dash?[5,4]:[],width:dash?1.7:2.0};
    });
    if(priceChartInstance) priceChartInstance.destroy();
    priceChartInstance=makeLineChart('#priceChart',labels,sets,{unit:'',options:{scales:{y:{grid:{color:'#edf1f5'},ticks:{color:'#8a97a9',font:{size:9}},title:{display:true,text:'Indexed price (base = 100)',color:'#8996a7',font:{size:9}}}}}});
    $('#priceChartTitle').textContent=sector==='bank'?'Ten-year bank share-price performance':'Ten-year NBFC share-price performance';
    $$('.switch').forEach(b=>b.classList.toggle('active',b.dataset.sector===sector));
  }

  function initNavigation(){
    $('#menuToggle').addEventListener('click',()=>{
      const nav=$('#mainNav'); const open=nav.classList.toggle('open'); $('#menuToggle').setAttribute('aria-expanded',String(open));
    });
    $$('#mainNav a').forEach(a=>a.addEventListener('click',()=>$('#mainNav').classList.remove('open')));
    $$('.switch').forEach(b=>b.addEventListener('click',()=>priceChart(b.dataset.sector)));
    const sections=$$('main section[id]');
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){
        $$('#mainNav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${e.target.id}`));
      }}),{rootMargin:'-35% 0px -55% 0px'});
      sections.forEach(s=>io.observe(s));
    }
  }

  boot();
})();