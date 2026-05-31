/* ============================================================
   CalcHubApp — modules/time-converter.js
   Time Converter
   Tab 1 — Original: 4 input blocks (hr/min/sec/HMS) + live clock + quick reference
   Tab 2 — Advanced: universal picker + world clock + timezone
   ============================================================ */

export const timeConverterModule = {
  id:    'time-converter',
  label: 'Time',
  icon:  '⏱️',
  desc:  'Time Converter',
  accent: '#c084fc',
  accentRgb: '192,132,252',
  _clockTimer: null,

  render() {
    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#c084fc;background:rgba(192,132,252,.1);border-color:rgba(192,132,252,.3)">TOOL · TIME</span>
      <h2 class="mod-title" style="color:#c084fc">Time Converter</h2>
    </div>

    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="tc-tab-orig" onclick="__tc.switchTab('orig')">📐 Original</button>
      <button class="sub-tab-btn" id="tc-tab-adv" onclick="__tc.switchTab('adv')">🔬 Advanced</button>
    </div>

    <!-- ══ TAB 1: ORIGINAL ══ -->
    <div id="tc-panel-orig">
      <!-- Live clock -->
      <div class="time-clock-display">
        <div>
          <div style="font-size:10px;color:var(--text-muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Current Time</div>
          <div class="clock-hms" id="live-clock">--:--:--</div>
          <div class="clock-sub" id="live-date">—</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;color:var(--text-muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Today's Total</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--text);" id="live-sec-today">—</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);">seconds elapsed today</div>
        </div>
      </div>

      <!-- ① Hours -->
      <div class="time-input-block">
        <div class="time-input-title">① Enter Hours → convert to everything</div>
        <div class="time-row">
          <label>Hours</label>
          <input type="number" id="t-hr" min="0" value="1" oninput="__tc.fromHr()">
          <span class="unit-tag">hrs</span>
        </div>
        <div class="time-results-grid">
          <div class="time-res-box hi"><div class="time-res-label">Minutes</div><div class="time-res-value" id="t-hr-min">60</div></div>
          <div class="time-res-box hi"><div class="time-res-label">Seconds</div><div class="time-res-value" id="t-hr-sec">3,600</div></div>
          <div class="time-res-box"><div class="time-res-label">Milliseconds</div><div class="time-res-value" id="t-hr-ms">3,600,000</div></div>
          <div class="time-res-box"><div class="time-res-label">Days</div><div class="time-res-value" id="t-hr-days">0.0417</div></div>
        </div>
      </div>

      <!-- ② Minutes -->
      <div class="time-input-block">
        <div class="time-input-title">② Enter Minutes → convert to everything</div>
        <div class="time-row">
          <label>Minutes</label>
          <input type="number" id="t-min" min="0" value="60" oninput="__tc.fromMin()">
          <span class="unit-tag">min</span>
        </div>
        <div class="time-results-grid">
          <div class="time-res-box hi"><div class="time-res-label">Hours</div><div class="time-res-value" id="t-min-hr">1</div></div>
          <div class="time-res-box hi"><div class="time-res-label">Seconds</div><div class="time-res-value" id="t-min-sec">3,600</div></div>
          <div class="time-res-box"><div class="time-res-label">Milliseconds</div><div class="time-res-value" id="t-min-ms">3,600,000</div></div>
          <div class="time-res-box"><div class="time-res-label">Days</div><div class="time-res-value" id="t-min-days">0.0417</div></div>
        </div>
      </div>

      <!-- ③ Seconds -->
      <div class="time-input-block">
        <div class="time-input-title">③ Enter Seconds → convert to everything</div>
        <div class="time-row">
          <label>Seconds</label>
          <input type="number" id="t-sec" min="0" value="3600" oninput="__tc.fromSec()">
          <span class="unit-tag">sec</span>
        </div>
        <div class="time-results-grid">
          <div class="time-res-box hi"><div class="time-res-label">Hours</div><div class="time-res-value" id="t-sec-hr">1</div></div>
          <div class="time-res-box hi"><div class="time-res-label">Minutes</div><div class="time-res-value" id="t-sec-min">60</div></div>
          <div class="time-res-box"><div class="time-res-label">Milliseconds</div><div class="time-res-value" id="t-sec-ms">3,600,000</div></div>
          <div class="time-res-box"><div class="time-res-label">Days</div><div class="time-res-value" id="t-sec-days">0.0417</div></div>
        </div>
      </div>

      <!-- ④ HH:MM:SS -->
      <div class="time-input-block">
        <div class="time-input-title">④ HH : MM : SS Breakdown — total in every unit</div>
        <div class="time-row" style="flex-wrap:wrap;">
          <label>Hours</label><input type="number" id="t-hms-h" min="0" value="2" oninput="__tc.fromHMS()"><span class="unit-tag">hrs</span>
          <label style="min-width:52px;">Minutes</label><input type="number" id="t-hms-m" min="0" max="59" value="30" oninput="__tc.fromHMS()"><span class="unit-tag">min</span>
          <label style="min-width:52px;">Seconds</label><input type="number" id="t-hms-s" min="0" max="59" value="45" oninput="__tc.fromHMS()"><span class="unit-tag">sec</span>
        </div>
        <div class="time-results-grid">
          <div class="time-res-box hi"><div class="time-res-label">Total Hours</div><div class="time-res-value" id="t-hms-hr">2.5125</div></div>
          <div class="time-res-box hi"><div class="time-res-label">Total Minutes</div><div class="time-res-value" id="t-hms-min">150.75</div></div>
          <div class="time-res-box hi"><div class="time-res-label">Total Seconds</div><div class="time-res-value" id="t-hms-sec">9,045</div></div>
          <div class="time-res-box"><div class="time-res-label">Milliseconds</div><div class="time-res-value" id="t-hms-ms">9,045,000</div></div>
          <div class="time-res-box"><div class="time-res-label">Days</div><div class="time-res-value" id="t-hms-days">0.1047</div></div>
          <div class="time-res-box"><div class="time-res-label">Formatted</div><div class="time-res-value" id="t-hms-fmt" style="font-size:.95rem;">02:30:45</div></div>
        </div>
      </div>

      <!-- Quick reference -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.9rem 1.1rem;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#c084fc;margin-bottom:10px;">📋 Quick Reference</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);line-height:1.9;">
          <div><span style="color:#c084fc;">1 min</span> = 60 sec</div>
          <div><span style="color:#c084fc;">1 hr</span> = 60 min = 3,600 sec</div>
          <div><span style="color:#c084fc;">1 day</span> = 24 hr = 1,440 min = 86,400 sec</div>
          <div><span style="color:#c084fc;">1 week</span> = 7 days = 168 hr = 604,800 sec</div>
          <div><span style="color:#c084fc;">1 month</span> ≈ 30 days = 720 hr = 2,592,000 sec</div>
          <div><span style="color:#c084fc;">1 year</span> = 365 days = 8,760 hr = 31,536,000 sec</div>
        </div>
      </div>
    </div>

    <!-- ══ TAB 2: ADVANCED ══ -->
    <div id="tc-panel-adv" style="display:none">
      <div class="clock-display" id="tc-clock">
        <div>
          <div class="clock-time" id="tc-time">--:--:--</div>
          <div class="clock-date" id="tc-date">Loading…</div>
        </div>
        <div class="clock-info">
          <div id="tc-tz" style="color:var(--text-muted);font-size:12px;font-family:'JetBrains Mono',monospace;"></div>
          <div id="tc-utc" style="color:var(--text-muted);font-size:11px;margin-top:2px;"></div>
        </div>
      </div>

      <div class="field-card" style="margin-bottom:1rem">
        <div class="field-label" style="color:#c084fc;border-left:3px solid #c084fc;padding-left:8px;margin-bottom:12px">Enter a time value to convert</div>
        <div class="field-row" style="gap:10px;flex-wrap:wrap">
          <input type="number" id="tc-value" class="field-input" value="1" min="0" step="any" style="flex:2;min-width:120px" oninput="__tc.convert()">
          <select id="tc-unit" class="field-select" style="flex:1;min-width:140px" onchange="__tc.convert()">
            <option value="ms">Milliseconds</option>
            <option value="s" selected>Seconds</option>
            <option value="min">Minutes</option>
            <option value="hr">Hours</option>
            <option value="day">Days</option>
            <option value="week">Weeks</option>
            <option value="month">Months (avg)</option>
            <option value="year">Years (avg)</option>
          </select>
        </div>
      </div>
      <div id="tc-results" class="uc-results-grid tc-grid" style="margin-bottom:1rem;"></div>

      <div class="field-card" style="margin-top:.5rem">
        <div class="field-label" style="color:#c084fc;border-left:3px solid #c084fc;padding-left:8px;margin-bottom:12px">World Clock</div>
        <div class="world-clock-grid" id="tc-world"></div>
      </div>
    </div>`;
  },

  init() {
    window.__tc = this;
    this.fromHr(); this.fromMin(); this.fromSec(); this.fromHMS();
    this._startOrigClock();
    this.convert();
    this._buildWorldClock();
  },

  cleanup() {
    if (this._clockTimer) { clearInterval(this._clockTimer); this._clockTimer = null; }
    delete window.__tc;
  },

  switchTab(tab) {
    ['orig','adv'].forEach(t => {
      document.getElementById(`tc-tab-${t}`)?.classList.toggle('active', t === tab);
      const p = document.getElementById(`tc-panel-${t}`);
      if (p) p.style.display = t === tab ? 'block' : 'none';
    });
  },

  /* ── Original helpers ── */
  tfmt(n, decimals=4) {
    if (Number.isInteger(n) || decimals===0) return n.toLocaleString();
    return parseFloat(n.toFixed(decimals)).toLocaleString(undefined,{maximumFractionDigits:decimals});
  },

  fromHr() {
    const h = parseFloat(document.getElementById('t-hr')?.value)||0;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('t-hr-min',  this.tfmt(h*60,4));
    set('t-hr-sec',  this.tfmt(h*3600,0));
    set('t-hr-ms',   this.tfmt(h*3600000,0));
    set('t-hr-days', this.tfmt(h/24,6));
  },
  fromMin() {
    const m = parseFloat(document.getElementById('t-min')?.value)||0;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('t-min-hr',   this.tfmt(m/60,6));
    set('t-min-sec',  this.tfmt(m*60,0));
    set('t-min-ms',   this.tfmt(m*60000,0));
    set('t-min-days', this.tfmt(m/1440,6));
  },
  fromSec() {
    const s = parseFloat(document.getElementById('t-sec')?.value)||0;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('t-sec-hr',   this.tfmt(s/3600,6));
    set('t-sec-min',  this.tfmt(s/60,4));
    set('t-sec-ms',   this.tfmt(s*1000,0));
    set('t-sec-days', this.tfmt(s/86400,6));
  },
  fromHMS() {
    const h=parseFloat(document.getElementById('t-hms-h')?.value)||0;
    const m=parseFloat(document.getElementById('t-hms-m')?.value)||0;
    const s=parseFloat(document.getElementById('t-hms-s')?.value)||0;
    const total=h*3600+m*60+s;
    const pad=n=>String(Math.floor(n)).padStart(2,'0');
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('t-hms-hr',   this.tfmt(total/3600,6));
    set('t-hms-min',  this.tfmt(total/60,4));
    set('t-hms-sec',  this.tfmt(total,0));
    set('t-hms-ms',   this.tfmt(total*1000,0));
    set('t-hms-days', this.tfmt(total/86400,6));
    set('t-hms-fmt',  `${pad(h)}:${pad(m)}:${pad(s)}`);
  },

  _startOrigClock() {
    if (this._clockTimer) clearInterval(this._clockTimer);
    const tick = () => {
      const now=new Date(), pad=n=>String(n).padStart(2,'0');
      const lc=document.getElementById('live-clock');
      if (!lc) { clearInterval(this._clockTimer); return; }
      lc.textContent=`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const ld=document.getElementById('live-date');
      if(ld) ld.textContent=now.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
      const st=new Date(now); st.setHours(0,0,0,0);
      const sel=document.getElementById('live-sec-today');
      if(sel) sel.textContent=Math.floor((now-st)/1000).toLocaleString();
      // Also update advanced tab clock
      const tc=document.getElementById('tc-time');
      if(tc) { tc.textContent=lc.textContent;
        const td=document.getElementById('tc-date'); if(td) td.textContent=ld?.textContent||'';
        const tz=document.getElementById('tc-tz'); if(tz) tz.textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;
        const utc=document.getElementById('tc-utc'); if(utc) utc.textContent='UTC'+(now.getTimezoneOffset()<=0?'+':'-')+String(Math.abs(now.getTimezoneOffset()/60)).padStart(2,'0')+':00';
      }
      // World clocks
      document.querySelectorAll('[data-wc-tz]').forEach(el=>{
        try { el.textContent=now.toLocaleTimeString('en-US',{timeZone:el.dataset.wcTz,hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}); } catch{}
      });
    };
    tick();
    this._clockTimer=setInterval(tick,1000);
  },

  /* ── Advanced ── */
  TUNITS: [
    {key:'ms',label:'Milliseconds',factor:.001},
    {key:'s', label:'Seconds',     factor:1},
    {key:'min',label:'Minutes',    factor:60},
    {key:'hr', label:'Hours',      factor:3600},
    {key:'day',label:'Days',       factor:86400},
    {key:'week',label:'Weeks',     factor:604800},
    {key:'month',label:'Months',   factor:2629800},
    {key:'year',label:'Years',     factor:31557600},
  ],

  convert() {
    const val=parseFloat(document.getElementById('tc-value')?.value)||0;
    const unit=document.getElementById('tc-unit')?.value||'s';
    const from=this.TUNITS.find(u=>u.key===unit);
    if(!from) return;
    const sec=val*from.factor;
    const container=document.getElementById('tc-results');
    if(!container) return;
    container.innerHTML=this.TUNITS.map(u=>{
      const cv=sec/u.factor;
      const isActive=u.key===unit;
      const fmt=Math.abs(cv)>=1e12?cv.toExponential(3):Math.abs(cv)>=.001?parseFloat(cv.toPrecision(8)).toString():cv.toExponential(3);
      return `<div class="uc-res-box ${isActive?'uc-active-purple':''}">
        <div class="res-label">${u.label}</div>
        <div class="res-value mono">${fmt}</div>
        <div class="res-hint">${u.key.toUpperCase()}</div>
      </div>`;
    }).join('');
  },

  _buildWorldClock() {
    const zones=[
      {name:'New York', tz:'America/New_York'},{name:'London',tz:'Europe/London'},
      {name:'Dubai',tz:'Asia/Dubai'},{name:'Mumbai',tz:'Asia/Kolkata'},
      {name:'Singapore',tz:'Asia/Singapore'},{name:'Tokyo',tz:'Asia/Tokyo'},
      {name:'Sydney',tz:'Australia/Sydney'},{name:'UTC',tz:'UTC'},
    ];
    const grid=document.getElementById('tc-world');
    if(!grid) return;
    grid.innerHTML=zones.map(z=>`
      <div class="world-clock-box">
        <div class="wc-name">${z.name}</div>
        <div class="wc-time" data-wc-tz="${z.tz}">--:--:--</div>
        <div class="wc-tz">${z.tz}</div>
      </div>`).join('');
  }
};
