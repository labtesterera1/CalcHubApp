/* ============================================================
   CalcHubApp — modules/date-age.js
   Date & Age Calculator
   Tab 1 — Original: start/end date → Years/Months/Days + totals
   Tab 2 — Advanced: Age calc, Date diff, Future date, Work days
   ============================================================ */

export const dateAgeModule = {
  id:    'date-age',
  label: 'Date / Age',
  icon:  '📅',
  desc:  'Date And Age Calculation',
  accent: '#34d399',
  accentRgb: '52,211,153',

  render() {
    const today = this._fmtDate(new Date());
    const past  = new Date(); past.setFullYear(past.getFullYear()-1);
    const pastFmt = this._fmtDate(past);

    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#34d399;background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3)">CALC · DATE & AGE</span>
      <h2 class="mod-title" style="color:#34d399">Date & Age Calculator</h2>
    </div>

    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="dt-tab-orig" onclick="__dt.switchTab('orig')">📐 Original</button>
      <button class="sub-tab-btn" id="dt-tab-adv" onclick="__dt.switchTab('adv')">🔬 Advanced</button>
    </div>

    <!-- ══ TAB 1: ORIGINAL ══ -->
    <div id="dt-panel-orig">
      <div class="tool-card">
        <div class="tool-card-title" style="color:#34d399;border-left:3px solid #34d399;padding-left:8px;">Select Date Range</div>
        <div class="orig-row2">
          <div class="orig-card">
            <label>Start Date</label>
            <input type="date" class="orig-input date-color" id="date-start" value="${pastFmt}" oninput="__dt.calcOrig()">
          </div>
          <div class="orig-card">
            <label>End Date</label>
            <input type="date" class="orig-input date-color" id="date-end" value="${today}" oninput="__dt.calcOrig()">
          </div>
        </div>
      </div>

      <div id="date-result-wrap">
        <div class="date-big">
          <div class="date-chip"><div class="date-chip-value" id="dc-years">0</div><div class="date-chip-label">Years</div></div>
          <div class="date-chip"><div class="date-chip-value" id="dc-months">0</div><div class="date-chip-label">Months</div></div>
          <div class="date-chip"><div class="date-chip-value" id="dc-days">0</div><div class="date-chip-label">Days</div></div>
        </div>
        <div class="date-total-bar"><span>Total Days</span><strong id="dc-tdays">—</strong></div>
        <div class="date-total-bar"><span>Total Weeks</span><strong id="dc-tweeks">—</strong></div>
        <div class="date-total-bar"><span>Total Months</span><strong id="dc-tmonths">—</strong></div>
        <div class="date-total-bar"><span>Total Hours</span><strong id="dc-thours">—</strong></div>
      </div>
    </div>

    <!-- ══ TAB 2: ADVANCED ══ -->
    <div id="dt-panel-adv" style="display:none">
      <!-- Sub-tabs inside advanced -->
      <div class="sub-tabs-row">
        <button class="sub-tab active-green" data-dtsub="age"      onclick="__dt.switchSub('age')">Age</button>
        <button class="sub-tab"             data-dtsub="diff"     onclick="__dt.switchSub('diff')">Date Diff</button>
        <button class="sub-tab"             data-dtsub="future"   onclick="__dt.switchSub('future')">Future Date</button>
        <button class="sub-tab"             data-dtsub="workdays" onclick="__dt.switchSub('workdays')">Work Days</button>
      </div>

      <!-- Age -->
      <div id="dtsub-age">
        <div class="calc-grid">
          <div class="field-card"><div class="field-label">Date of Birth</div><input type="date" id="age-dob" class="field-input" value="1990-01-01"></div>
          <div class="field-card"><div class="field-label">As on Date</div><input type="date" id="age-ref" class="field-input" value="${today}"></div>
        </div>
        <button class="calc-btn green" onclick="__dt.calcAge()">CALCULATE AGE</button>
        <div id="age-results" class="results-panel" style="display:none">
          <div class="results-grid" id="age-grid"></div>
          <div id="age-milestones"></div>
        </div>
      </div>

      <!-- Diff -->
      <div id="dtsub-diff" style="display:none">
        <div class="calc-grid">
          <div class="field-card"><div class="field-label">Start Date</div><input type="date" id="diff-start" class="field-input" value="${today}"></div>
          <div class="field-card"><div class="field-label">End Date</div><input type="date" id="diff-end" class="field-input" value="${today}"></div>
        </div>
        <button class="calc-btn green" onclick="__dt.calcDiff()">CALCULATE DIFFERENCE</button>
        <div id="diff-results" class="results-panel" style="display:none"><div class="results-grid" id="diff-grid"></div></div>
      </div>

      <!-- Future -->
      <div id="dtsub-future" style="display:none">
        <div class="calc-grid">
          <div class="field-card"><div class="field-label">Start Date</div><input type="date" id="fut-start" class="field-input" value="${today}"></div>
          <div class="field-card"><div class="field-label">Add Days</div><div class="field-row"><input type="number" id="fut-days" class="field-input" value="30" min="0"><span class="field-unit">days</span></div></div>
          <div class="field-card"><div class="field-label">Add Months</div><div class="field-row"><input type="number" id="fut-months" class="field-input" value="0" min="0"><span class="field-unit">months</span></div></div>
          <div class="field-card"><div class="field-label">Add Years</div><div class="field-row"><input type="number" id="fut-years" class="field-input" value="0" min="0"><span class="field-unit">years</span></div></div>
        </div>
        <button class="calc-btn green" onclick="__dt.calcFuture()">FIND FUTURE DATE</button>
        <div id="fut-results" class="results-panel" style="display:none"><div class="results-grid" id="fut-grid"></div></div>
      </div>

      <!-- Work Days -->
      <div id="dtsub-workdays" style="display:none">
        <div class="calc-grid">
          <div class="field-card"><div class="field-label">From Date</div><input type="date" id="wd-start" class="field-input" value="${today}"></div>
          <div class="field-card"><div class="field-label">To Date</div><input type="date" id="wd-end" class="field-input" value="${today}"></div>
          <div class="field-card"><div class="field-label">Holidays (count)</div><div class="field-row"><input type="number" id="wd-holidays" class="field-input" value="0" min="0"><span class="field-unit">days</span></div></div>
        </div>
        <button class="calc-btn green" onclick="__dt.calcWorkdays()">CALCULATE WORK DAYS</button>
        <div id="wd-results" class="results-panel" style="display:none"><div class="results-grid" id="wd-grid"></div></div>
      </div>
    </div>`;
  },

  init() {
    window.__dt = this;
    this.calcOrig();
  },
  cleanup() { delete window.__dt; },

  _fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  switchTab(tab) {
    ['orig','adv'].forEach(t=>{
      document.getElementById(`dt-tab-${t}`)?.classList.toggle('active',t===tab);
      const p=document.getElementById(`dt-panel-${t}`);
      if(p) p.style.display=t===tab?'block':'none';
    });
  },

  switchSub(sub) {
    ['age','diff','future','workdays'].forEach(s=>{
      const btn=document.querySelector(`[data-dtsub="${s}"]`);
      const panel=document.getElementById(`dtsub-${s}`);
      if(btn) btn.classList.toggle('active-green',s===sub);
      if(panel) panel.style.display=s===sub?'block':'none';
    });
  },

  /* ── Original ── */
  calcOrig() {
    const sv=document.getElementById('date-start')?.value;
    const ev=document.getElementById('date-end')?.value;
    if(!sv||!ev) return;
    const start=new Date(sv), end=new Date(ev);
    if(end<start){
      const w=document.getElementById('date-result-wrap');
      if(w) w.innerHTML='<div style="color:#f87171;font-size:13px;padding:8px;">⚠ End date must be after start date.</div>';
      return;
    }
    let y=end.getFullYear()-start.getFullYear();
    let mo=end.getMonth()-start.getMonth();
    let d=end.getDate()-start.getDate();
    if(d<0){mo--;const prev=new Date(end.getFullYear(),end.getMonth(),0);d+=prev.getDate();}
    if(mo<0){y--;mo+=12;}
    const diffMs=end-start;
    const totalDays=Math.floor(diffMs/86400000);
    const totalWeeks=Math.floor(totalDays/7);
    const totalMonths=y*12+mo;
    const totalHours=totalDays*24;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('dc-years',y); set('dc-months',mo); set('dc-days',d);
    set('dc-tdays',totalDays.toLocaleString());
    set('dc-tweeks',totalWeeks.toLocaleString());
    set('dc-tmonths',totalMonths.toLocaleString());
    set('dc-thours',totalHours.toLocaleString());
    const w=document.getElementById('date-result-wrap');
    if(w) w.style.display='block';
  },

  /* ── Advanced ── */
  calcAge() {
    const dob=new Date(document.getElementById('age-dob')?.value);
    const ref=new Date(document.getElementById('age-ref')?.value);
    if(isNaN(dob)||isNaN(ref)) return;
    let y=ref.getFullYear()-dob.getFullYear(),mo=ref.getMonth()-dob.getMonth(),d=ref.getDate()-dob.getDate();
    if(d<0){mo--;const pm=new Date(ref.getFullYear(),ref.getMonth(),0);d+=pm.getDate();}
    if(mo<0){y--;mo+=12;}
    const totalDays=Math.floor((ref-dob)/864e5),totalWeeks=Math.floor(totalDays/7),totalHours=totalDays*24,totalMonths=y*12+mo;
    const nextBday=new Date(ref.getFullYear(),dob.getMonth(),dob.getDate());
    if(nextBday<=ref)nextBday.setFullYear(nextBday.getFullYear()+1);
    const daysToNext=Math.ceil((nextBday-ref)/864e5);
    const grid=document.getElementById('age-grid');
    if(grid)grid.innerHTML=`
      ${this._metric('Age',`${y}y ${mo}m ${d}d`,'Years, months, days',true)}
      ${this._metric('Total Days',totalDays.toLocaleString(),'Days lived')}
      ${this._metric('Total Weeks',totalWeeks.toLocaleString(),'Complete weeks')}
      ${this._metric('Total Months',totalMonths.toLocaleString(),'Complete months')}
      ${this._metric('Total Hours',totalHours.toLocaleString(),'Approximate hours')}
      ${this._metric('Next Birthday',`in ${daysToNext} days`,nextBday.toDateString())}`;
    const mil=document.getElementById('age-milestones');
    if(mil)mil.innerHTML=`<div style="margin-top:1rem;font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">AGE MILESTONES</div>`+
      [25,30,40,50,60,75,100].map(age=>{
        const md=new Date(dob.getFullYear()+age,dob.getMonth(),dob.getDate());
        const diff=Math.ceil((md-ref)/864e5),past=diff<=0;
        return `<div class="milestone-row"><span class="milestone-age">${age} yrs</span><span class="milestone-date">${md.toDateString()}</span><span class="milestone-status ${past?'past':'future'}">${past?Math.abs(diff)+' days ago':'in '+diff+' days'}</span></div>`;
      }).join('');
    const panel=document.getElementById('age-results');if(panel)panel.style.display='block';
  },

  calcDiff() {
    const s=new Date(document.getElementById('diff-start')?.value);
    const e=new Date(document.getElementById('diff-end')?.value);
    if(isNaN(s)||isNaN(e)) return;
    const [a,b]=e>=s?[s,e]:[e,s];
    const totalDays=Math.floor((b-a)/864e5);
    let y=b.getFullYear()-a.getFullYear(),mo=b.getMonth()-a.getMonth(),d=b.getDate()-a.getDate();
    if(d<0){mo--;d+=new Date(b.getFullYear(),b.getMonth(),0).getDate();}
    if(mo<0){y--;mo+=12;}
    const grid=document.getElementById('diff-grid');
    if(grid)grid.innerHTML=`
      ${this._metric('Difference',`${y}y ${mo}m ${d}d`,'',true)}
      ${this._metric('Total Days',totalDays.toLocaleString(),'')}
      ${this._metric('Weeks',Math.floor(totalDays/7)+' weeks','')}
      ${this._metric('Hours',(totalDays*24).toLocaleString(),'Approximate')}
      ${this._metric('Minutes',(totalDays*1440).toLocaleString(),'Approximate')}
      ${this._metric('Months',(y*12+mo).toLocaleString(),'Complete months')}`;
    const p=document.getElementById('diff-results');if(p)p.style.display='block';
  },

  calcFuture() {
    const start=new Date(document.getElementById('fut-start')?.value);
    const days=parseInt(document.getElementById('fut-days')?.value)||0;
    const months=parseInt(document.getElementById('fut-months')?.value)||0;
    const years=parseInt(document.getElementById('fut-years')?.value)||0;
    if(isNaN(start)) return;
    const r=new Date(start);
    r.setFullYear(r.getFullYear()+years);r.setMonth(r.getMonth()+months);r.setDate(r.getDate()+days);
    const dow=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const grid=document.getElementById('fut-grid');
    if(grid)grid.innerHTML=`
      ${this._metric('Future Date',r.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),'',true)}
      ${this._metric('Day of Week',dow[r.getDay()],'')}
      ${this._metric('Total Added',`${years}y ${months}m ${days}d`,'Combined addition')}
      ${this._metric('Quarter','Q'+Math.ceil((r.getMonth()+1)/3),r.getFullYear().toString())}`;
    const p=document.getElementById('fut-results');if(p)p.style.display='block';
  },

  calcWorkdays() {
    const s=new Date(document.getElementById('wd-start')?.value);
    const e=new Date(document.getElementById('wd-end')?.value);
    const holidays=parseInt(document.getElementById('wd-holidays')?.value)||0;
    if(isNaN(s)||isNaN(e)) return;
    const [a,b]=s<=e?[s,e]:[e,s];
    let total=0,weekends=0,workdays=0;
    const cur=new Date(a);
    while(cur<=b){total++;const wd=cur.getDay();if(wd===0||wd===6)weekends++;else workdays++;cur.setDate(cur.getDate()+1);}
    const eff=Math.max(0,workdays-holidays);
    const grid=document.getElementById('wd-grid');
    if(grid)grid.innerHTML=`
      ${this._metric('Work Days',eff.toString(),'Excl. weekends & holidays',true)}
      ${this._metric('Calendar Days',total.toString(),'Total span')}
      ${this._metric('Weekends',weekends.toString(),'Sat + Sun')}
      ${this._metric('Weekdays',workdays.toString(),'Mon – Fri')}
      ${this._metric('Holidays',holidays.toString(),'Entered by you')}
      ${this._metric('Weeks',Math.floor(total/7).toString(),'Complete weeks')}`;
    const p=document.getElementById('wd-results');if(p)p.style.display='block';
  },

  _metric(label,value,hint,highlight=false){
    return `<div class="res-box ${highlight?'hi-green':''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint?`<div class="res-hint">${hint}</div>`:''}
    </div>`;
  }
};
