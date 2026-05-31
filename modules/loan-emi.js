/* ============================================================
   CalcHubApp — modules/loan-emi.js
   Loan EMI Calculator
   Tab 1 — Original: 3 inputs + summary + amortisation table
   Tab 2 — Advanced: full options + donut + schedule toggle
   ============================================================ */

export const loanEmiModule = {
  id:    'loan-emi',
  label: 'Loan EMI',
  icon:  '💰',
  desc:  'Personal Loan EMI Calculator',
  accent: '#f97316',
  accentRgb: '249,115,22',

  render() {
    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#f97316;background:rgba(249,115,22,.1);border-color:rgba(249,115,22,.3)">FINANCE · EMI</span>
      <h2 class="mod-title" style="color:#f97316">Loan EMI Calculator</h2>
    </div>

    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="emi-tab-orig" onclick="__emi.switchTab('orig')">📐 Original</button>
      <button class="sub-tab-btn" id="emi-tab-adv" onclick="__emi.switchTab('adv')">🔬 Advanced</button>
    </div>

    <!-- ══ TAB 1: ORIGINAL ══ -->
    <div id="emi-panel-orig">
      <div class="tool-card">
        <div class="tool-card-title" style="color:#f97316;border-left:3px solid #f97316;padding-left:8px;">Loan Details</div>
        <div class="orig-row3">
          <div class="orig-card">
            <label>Principal (₹)</label>
            <input type="number" class="orig-input" style="border-color:rgba(249,115,22,.3);" id="emi-principal" value="500000" oninput="__emi.calcOrig()">
          </div>
          <div class="orig-card">
            <label>Annual Interest Rate (%)</label>
            <input type="number" class="orig-input" style="border-color:rgba(249,115,22,.3);" id="emi-rate" value="8.5" step="0.01" oninput="__emi.calcOrig()">
          </div>
          <div class="orig-card">
            <label>Tenure (months)</label>
            <input type="number" class="orig-input" style="border-color:rgba(249,115,22,.3);" id="emi-tenure" value="60" oninput="__emi.calcOrig()">
          </div>
        </div>
      </div>

      <div class="emi-summary">
        <div class="emi-box hi-emi">
          <div class="emi-box-label">Monthly EMI</div>
          <div class="emi-box-value" id="emi-monthly">—</div>
        </div>
        <div class="emi-box">
          <div class="emi-box-label">Total Payment</div>
          <div class="emi-box-value" id="emi-total">—</div>
        </div>
        <div class="emi-box">
          <div class="emi-box-label">Total Interest</div>
          <div class="emi-box-value" id="emi-interest">—</div>
        </div>
      </div>

      <div class="tool-card" style="margin-top:1rem;">
        <div class="tool-card-title" style="color:#f97316;border-left:3px solid #f97316;padding-left:8px;">Amortization Schedule</div>
        <div class="amort-wrap">
          <table class="amort-table">
            <thead><tr><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
            <tbody id="amort-body"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══ TAB 2: ADVANCED ══ -->
    <div id="emi-panel-adv" style="display:none">
      <div class="calc-grid">
        <div class="field-card">
          <div class="field-label">Loan Amount (Principal)</div>
          <div class="field-row"><span class="field-prefix">₹</span><input type="number" id="emi-adv-principal" class="field-input" value="500000" min="1000" step="1000"></div>
          <div class="field-hint">Total loan amount requested</div>
        </div>
        <div class="field-card">
          <div class="field-label">Annual Interest Rate</div>
          <div class="field-row"><input type="number" id="emi-adv-rate" class="field-input" value="10.5" min="0.1" max="50" step="0.1"><span class="field-unit">% p.a.</span></div>
          <div class="field-hint">Annual interest rate (reducing balance)</div>
        </div>
        <div class="field-card">
          <div class="field-label">Loan Tenure</div>
          <div class="field-row">
            <input type="number" id="emi-adv-tenure" class="field-input" value="60" min="1" max="360">
            <select id="emi-adv-tenure-unit" class="field-select" style="max-width:100px">
              <option value="months" selected>Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>
        <div class="field-card">
          <div class="field-label">Processing Fee</div>
          <div class="field-row"><input type="number" id="emi-adv-fee" class="field-input" value="1" min="0" max="10" step="0.1"><span class="field-unit">%</span></div>
          <div class="field-hint">One-time processing / disbursal fee</div>
        </div>
        <div class="field-card">
          <div class="field-label">Pre-payment per Year</div>
          <div class="field-row"><span class="field-prefix">₹</span><input type="number" id="emi-adv-prepay" class="field-input" value="0" min="0" step="1000"></div>
          <div class="field-hint">Optional annual lump-sum pre-payment</div>
        </div>
        <div class="field-card">
          <div class="field-label">Loan Start</div>
          <input type="month" id="emi-adv-start" class="field-input">
          <div class="field-hint">First EMI payment month</div>
        </div>
      </div>

      <button class="calc-btn orange" onclick="__emi.calcAdv()">CALCULATE EMI</button>

      <div id="emi-adv-results" style="display:none">
        <div class="results-grid" id="emi-adv-grid" style="margin-bottom:1rem;"></div>

        <div class="emi-donut-wrap">
          <div class="emi-donut" id="emi-donut">
            <div class="emi-donut-hole">
              <div class="emi-donut-label">Total</div>
              <div class="emi-donut-val" id="emi-donut-val">—</div>
            </div>
          </div>
          <div class="emi-legend" id="emi-adv-legend"></div>
        </div>

        <div style="margin-top:1rem;margin-bottom:8px;display:flex;gap:8px;align-items:center;">
          <button class="calc-btn-sm orange" id="emi-adv-toggle">Show Schedule</button>
          <span style="color:var(--text-muted);font-size:12px;">Monthly breakdown</span>
        </div>
        <div id="emi-adv-schedule-wrap" style="display:none">
          <div class="table-wrap" style="max-height:320px;overflow-y:auto">
            <table class="ref-table">
              <thead><tr><th>#</th><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
              <tbody id="emi-adv-schedule-body"></tbody>
            </table>
          </div>
        </div>
        <div class="results-note" id="emi-adv-note"></div>
      </div>
    </div>`;
  },

  init() {
    window.__emi = this;
    this.calcOrig();
    // Set default start month for advanced
    const now=new Date();
    const el=document.getElementById('emi-adv-start');
    if(el) el.value=`${now.getFullYear()}-${String(now.getMonth()+2).padStart(2,'0')}`;
    document.getElementById('emi-adv-toggle')?.addEventListener('click',()=>{
      const sw=document.getElementById('emi-adv-schedule-wrap');
      if(!sw) return;
      const open=sw.style.display!=='none';
      sw.style.display=open?'none':'block';
      document.getElementById('emi-adv-toggle').textContent=open?'Show Schedule':'Hide Schedule';
    });
  },
  cleanup() { delete window.__emi; },

  switchTab(tab) {
    ['orig','adv'].forEach(t=>{
      document.getElementById(`emi-tab-${t}`)?.classList.toggle('active',t===tab);
      const p=document.getElementById(`emi-panel-${t}`);
      if(p) p.style.display=t===tab?'block':'none';
    });
  },

  fmt2(n) { return n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); },

  /* ── Original ── */
  calcOrig() {
    const P=parseFloat(document.getElementById('emi-principal')?.value)||0;
    const annualRate=parseFloat(document.getElementById('emi-rate')?.value)||0;
    const months=parseInt(document.getElementById('emi-tenure')?.value)||0;
    const r=annualRate/12/100;
    if(!P||!months){this._clearOrig();return;}
    const emi=r===0?P/months:P*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);
    const total=emi*months, interest=total-P;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('emi-monthly','₹ '+this.fmt2(emi));
    set('emi-total',  '₹ '+this.fmt2(total));
    set('emi-interest','₹ '+this.fmt2(interest));
    let bal=P, html='';
    for(let m=1;m<=months;m++){
      const int=bal*r, prin=emi-int;
      bal=Math.max(0,bal-prin);
      html+=`<tr><td>${m}</td><td>₹${this.fmt2(emi)}</td><td>₹${this.fmt2(prin)}</td><td>₹${this.fmt2(int)}</td><td>₹${this.fmt2(bal)}</td></tr>`;
    }
    const tb=document.getElementById('amort-body'); if(tb) tb.innerHTML=html;
  },
  _clearOrig() {
    ['emi-monthly','emi-total','emi-interest'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—';});
    const tb=document.getElementById('amort-body'); if(tb) tb.innerHTML='';
  },

  /* ── Advanced ── */
  fmtIN(n){
    if(n>=1e7) return (n/1e7).toFixed(2)+' Cr';
    if(n>=1e5) return (n/1e5).toFixed(2)+' L';
    if(n>=1e3) return (n/1e3).toFixed(1)+'K';
    return Math.round(n).toLocaleString('en-IN');
  },

  calcAdv() {
    const P=parseFloat(document.getElementById('emi-adv-principal')?.value)||500000;
    const annualR=parseFloat(document.getElementById('emi-adv-rate')?.value)||10.5;
    let N=parseFloat(document.getElementById('emi-adv-tenure')?.value)||60;
    const tenureUnit=document.getElementById('emi-adv-tenure-unit')?.value||'months';
    const feeP=parseFloat(document.getElementById('emi-adv-fee')?.value)||1;
    const prepay=parseFloat(document.getElementById('emi-adv-prepay')?.value)||0;
    if(tenureUnit==='years') N=N*12;
    const r=annualR/100/12;
    const emi=r===0?P/N:(P*r*Math.pow(1+r,N))/(Math.pow(1+r,N)-1);
    const processingFee=P*feeP/100;
    let balance=P, totalInt=0, months=0;
    const schedule=[];
    const startEl=document.getElementById('emi-adv-start');
    const startDate=startEl?.value?new Date(startEl.value+'-01'):new Date();
    while(balance>0.01&&months<N+120){
      const interest=balance*r;
      let principal=emi-interest;
      if(principal>balance)principal=balance;
      balance-=principal;
      if(prepay>0&&months>0&&months%12===0){const extra=Math.min(prepay,balance);balance-=extra;}
      const d=new Date(startDate);d.setMonth(d.getMonth()+months);
      totalInt+=interest; months++;
      schedule.push({n:months,month:d.toLocaleDateString('en-IN',{month:'short',year:'numeric'}),emi,principal,interest,balance:Math.max(0,balance)});
      if(balance<=0.01)break;
    }
    const totalPayment=emi*months+prepay*Math.floor(months/12);
    const effectiveCost=totalPayment-P+processingFee;
    const grid=document.getElementById('emi-adv-grid');
    if(grid)grid.innerHTML=`
      ${this._metric('Monthly EMI','₹'+this.fmtIN(emi),'Fixed monthly instalment',true)}
      ${this._metric('Total Interest','₹'+this.fmtIN(totalInt),'Interest paid over tenure')}
      ${this._metric('Processing Fee','₹'+this.fmtIN(processingFee),`${feeP}% one-time fee`)}
      ${this._metric('Total Cost','₹'+this.fmtIN(effectiveCost),'Interest + Fees')}
      ${this._metric('Total Payment','₹'+this.fmtIN(totalPayment+processingFee),'Principal + Interest + Fees')}
      ${this._metric('Actual Months',months+' mo',`Closes in ${(months/12).toFixed(1)} years`)}`;
    const pPct=Math.round((P/(P+totalInt))*100);
    const donut=document.getElementById('emi-donut');
    if(donut)donut.style.background=`conic-gradient(#f97316 0% ${pPct}%, rgba(249,115,22,0.25) ${pPct}% 100%)`;
    const dv=document.getElementById('emi-donut-val'); if(dv)dv.textContent='₹'+this.fmtIN(P+totalInt);
    const legend=document.getElementById('emi-adv-legend');
    if(legend)legend.innerHTML=`
      <div class="legend-item"><span class="legend-dot" style="background:#f97316"></span>Principal <strong>${pPct}%</strong></div>
      <div class="legend-item"><span class="legend-dot" style="background:rgba(249,115,22,0.3)"></span>Interest <strong>${100-pPct}%</strong></div>`;
    const tbody=document.getElementById('emi-adv-schedule-body');
    if(tbody)tbody.innerHTML=schedule.slice(0,360).map(r=>`
      <tr><td>${r.n}</td><td>${r.month}</td><td class="mono">₹${this.fmt2(r.emi)}</td>
      <td class="mono" style="color:#34d399">₹${this.fmt2(r.principal)}</td>
      <td class="mono" style="color:#f97316">₹${this.fmt2(r.interest)}</td>
      <td class="mono">₹${this.fmt2(r.balance)}</td></tr>`).join('');
    const note=document.getElementById('emi-adv-note');
    if(note)note.innerHTML=`<strong>Formula:</strong> EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1) where r = monthly rate, n = months`;
    const rp=document.getElementById('emi-adv-results'); if(rp)rp.style.display='block';
  },

  _metric(label,value,hint,highlight=false){
    return `<div class="res-box ${highlight?'hi-orange':''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint?`<div class="res-hint">${hint}</div>`:''}
    </div>`;
  }
};
