/* ============================================================
   CalcHubApp — modules/psm.js
   NIK PSM Server — Storage Sizing Calculator
   Two methods:
     Tab 1 — Original formula: S = (C × t × R) + 20 GB
     Tab 2 — Advanced multi-variable sizing
   ============================================================ */

export const psmModule = {
  id:    'psm',
  label: 'PSM Server',
  icon:  '🖥️',
  desc:  'NIK PSM Storage Sizing (Vault + PAReplicate)',
  accent: '#d4ff3a',
  accentRgb: '212,255,58',

  render() {
    return `
    <div class="mod-header">
      <div class="mod-header-top">
        <button class="mod-back-btn" onclick="window.__goHome()" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#d4ff3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Home
        </button>
        <span class="mod-badge" style="color:#d4ff3a;background:#d4ff3a1a;border-color:#d4ff3a4d">NIK · PSM SERVER</span>
      </div>
      <h2 class="mod-title" style="color:#d4ff3a">PSM Storage Sizing</h2>
    </div>

    <!-- Method tabs -->
    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="psm-tab-orig" onclick="__psm.switchTab('orig')">📐 Original Formula</button>
      <button class="sub-tab-btn" id="psm-tab-adv" onclick="__psm.switchTab('adv')">🔬 Advanced Sizing</button>
    </div>

    <!-- ══ TAB 1: ORIGINAL ══ -->
    <div id="psm-panel-orig">

      <div class="sec-title-formula">
        S<sub>PSM</sub> = (t<sub>retention</sub>) × (N<sub>session</sub>) × (t<sub>session</sub>) × (R<sub>recording</sub>) + 20 GB
      </div>

      <div class="formula-box-orig psm-orig">
        <span class="em-psm">S<sub>PSM</sub></span> = Required storage on PSM Server &nbsp;|&nbsp;
        <span class="em-psm">t<sub>retention</sub></span> = Retention period (days) &nbsp;|&nbsp;
        <span class="em-psm">N<sub>session</sub></span> = Sessions per day &nbsp;|&nbsp;
        <span class="em-psm">t<sub>session</sub></span> = Avg session length (min) &nbsp;|&nbsp;
        <span class="em-psm">R<sub>recording</sub></span> = Avg bit rate (KB/min)
      </div>

      <div class="orig-row3">
        <div class="orig-card">
          <label>Retention period — days (t<sub>retention</sub>)</label>
          <input type="number" class="orig-input psm-color" id="p-retention" min="1" value="90" oninput="__psm.calcOrig()">
        </div>
        <div class="orig-card">
          <label>Sessions per day (N<sub>session</sub>)</label>
          <input type="number" class="orig-input psm-color" id="p-sessions" min="1" value="25" oninput="__psm.calcOrig()">
        </div>
        <div class="orig-card">
          <label>Session length — minutes (t<sub>session</sub>)</label>
          <input type="number" class="orig-input psm-color" id="p-duration" min="1" value="180" oninput="__psm.calcOrig()">
        </div>
      </div>

      <div class="rate-card-orig">
        <div class="rate-section-label">Recording bit rate — R<sub>recording</sub></div>
        <div class="rate-grid-orig" id="p-rate-group">
          <label class="rate-opt" onclick="__psm.pSetRate(this)">
            <input type="radio" name="p-rate" value="100" onchange="__psm.calcOrig()">
            <span class="rate-lbl"><span class="kb-psm">100 KB/min</span><span class="rate-desc">Average SSH session</span></span>
          </label>
          <label class="rate-opt" onclick="__psm.pSetRate(this)">
            <input type="radio" name="p-rate" value="200" onchange="__psm.calcOrig()">
            <span class="rate-lbl"><span class="kb-psm">200 KB/min</span><span class="rate-desc">Low activity RDP session</span></span>
          </label>
          <label class="rate-opt active-psm" onclick="__psm.pSetRate(this)">
            <input type="radio" name="p-rate" value="300" checked onchange="__psm.calcOrig()">
            <span class="rate-lbl"><span class="kb-psm">300 KB/min</span><span class="rate-desc">High activity RDP with rich wallpaper</span></span>
          </label>
          <label class="rate-opt" onclick="__psm.pSetRate(this)">
            <input type="radio" name="p-rate" value="custom" onchange="__psm.calcOrig()">
            <span class="rate-lbl">
              <span class="kb-psm" style="color:var(--text-muted);">Custom</span>
              <span class="custom-rate-wrap">
                <input type="number" id="p-custom" min="1" value="300" oninput="__psm.pCustomActive();__psm.calcOrig()" onclick="__psm.pCustomActive()">
                <span>KB/min</span>
              </span>
            </span>
          </label>
        </div>
      </div>

      <div class="results-3-orig" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-orig">
          <div class="stat-orig-label">Raw recording</div>
          <div class="stat-orig-value" id="p-raw">—</div>
          <div class="stat-orig-unit" id="p-raw-unit">GB</div>
        </div>
        <div class="stat-orig">
          <div class="stat-orig-label">OS overhead</div>
          <div class="stat-orig-value">20</div>
          <div class="stat-orig-unit">GB (fixed)</div>
        </div>
        <div class="stat-orig hi-psm-stat">
          <div class="stat-orig-label">Vault (S<sub>PSM</sub>)</div>
          <div class="stat-orig-value" id="p-total">—</div>
          <div class="stat-orig-unit" id="p-total-unit">GB</div>
        </div>
        <div class="stat-orig hi-psm-stat">
          <div class="stat-orig-label">PAReplicate</div>
          <div class="stat-orig-value" id="p-pareplicate">—</div>
          <div class="stat-orig-unit" id="p-pareplicate-unit">GB</div>
        </div>
      </div>

      <div class="formula-live-orig" id="p-live">
        ( 90 days ) × ( 25 sessions/day ) × ( 180 min ) × ( 300 KB/min ) + 20 GB = <span class="hl-psm">— GB</span>
      </div>

      <div class="note-box-orig psm-note">
        <strong>Reference:</strong> 250 GB of storage is sufficient for recording 10 hours of activities per day retained for 5 years.
      </div>
    </div>

    <!-- ══ TAB 2: ADVANCED ══ -->
    <div id="psm-panel-adv" style="display:none">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:1rem;">Multi-variable sizing — accounts for daily volume, retention, buffer and backup replicas.</p>

      <div class="calc-grid">
        <div class="field-card">
          <div class="field-label">Concurrent Sessions</div>
          <div class="field-row">
            <input type="number" id="psm-sessions" class="field-input" value="100" min="1">
            <span class="field-unit">sessions</span>
          </div>
          <div class="field-hint">Active simultaneous PSM sessions at peak</div>
        </div>
        <div class="field-card">
          <div class="field-label">Avg Session Duration</div>
          <div class="field-row">
            <input type="number" id="psm-duration" class="field-input" value="60" min="1">
            <span class="field-unit">min</span>
          </div>
          <div class="field-hint">Average duration of each recorded session</div>
        </div>
        <div class="field-card">
          <div class="field-label">Recording Quality</div>
          <div class="field-row">
            <select id="psm-quality" class="field-select">
              <option value="0.5">Low — 0.5 GB/hr</option>
              <option value="1" selected>Medium — 1 GB/hr</option>
              <option value="2">High — 2 GB/hr</option>
              <option value="4">Ultra — 4 GB/hr</option>
            </select>
          </div>
          <div class="field-hint">Video recording bit-rate preset</div>
        </div>
        <div class="field-card">
          <div class="field-label">Retention Period</div>
          <div class="field-row">
            <input type="number" id="psm-retention" class="field-input" value="90" min="1">
            <span class="field-unit">days</span>
          </div>
          <div class="field-hint">How long session recordings are kept</div>
        </div>
        <div class="field-card">
          <div class="field-label">Daily Session Count</div>
          <div class="field-row">
            <input type="number" id="psm-daily" class="field-input" value="500" min="1">
            <span class="field-unit">sessions/day</span>
          </div>
          <div class="field-hint">Total new sessions recorded per day</div>
        </div>
        <div class="field-card">
          <div class="field-label">OS / System Buffer</div>
          <div class="field-row">
            <input type="number" id="psm-buffer" class="field-input" value="20" min="0" max="50">
            <span class="field-unit">%</span>
          </div>
          <div class="field-hint">Additional headroom for OS and system files</div>
        </div>
      </div>

      <button class="calc-btn lime" id="psm-calc-adv" onclick="__psm.calcAdv()">CALCULATE STORAGE</button>

      <div id="psm-results-adv" class="results-panel" style="display:none">
        <div class="results-grid" id="psm-grid-adv"></div>
        <div class="results-note" id="psm-note-adv"></div>
      </div>
    </div>
    `;
  },

  init() {
    window.__psm = this;
    this.calcOrig();
  },

  cleanup() { delete window.__psm; },

  switchTab(tab) {
    ['orig','adv'].forEach(t => {
      document.getElementById(`psm-tab-${t}`)?.classList.toggle('active', t === tab);
      const panel = document.getElementById(`psm-panel-${t}`);
      if (panel) panel.style.display = t === tab ? 'block' : 'none';
    });
  },

  /* ── Original Method ── */
  pSetRate(el) {
    document.querySelectorAll('#p-rate-group .rate-opt').forEach(o => o.classList.remove('active-psm'));
    el.classList.add('active-psm');
  },

  pCustomActive() {
    const opts = document.querySelectorAll('#p-rate-group .rate-opt');
    opts[3]?.querySelector('input[type=radio]').click();
    this.pSetRate(opts[3]);
  },

  getPRate() {
    const sel = document.querySelector('input[name="p-rate"]:checked');
    if (!sel) return 300;
    return sel.value === 'custom'
      ? (parseFloat(document.getElementById('p-custom')?.value) || 0)
      : parseFloat(sel.value);
  },

  calcOrig() {
    const retention = parseFloat(document.getElementById('p-retention')?.value) || 0;
    const sessions  = parseFloat(document.getElementById('p-sessions')?.value)  || 0;
    const duration  = parseFloat(document.getElementById('p-duration')?.value)  || 0;
    const rate      = this.getPRate();

    // Full formula: t_retention × N_session × t_session × R_recording + 20 GB
    const rawKB   = retention * sessions * duration * rate;
    const rawGB   = rawKB / (1000 * 1000);
    const totalGB = rawGB + 20;  // Vault storage
    // PAReplicate = same as Vault (exact mirror)
    const pareplicateGB = totalGB;

    const el  = id => document.getElementById(id);
    const fmt = this.fmtGB(rawGB);
    const fmtTotal = this.fmtGB(totalGB);

    if (el('p-raw'))              el('p-raw').textContent              = fmt.val;
    if (el('p-raw-unit'))         el('p-raw-unit').textContent         = fmt.unit;
    if (el('p-total'))            el('p-total').textContent            = fmtTotal.val;
    if (el('p-total-unit'))       el('p-total-unit').textContent       = fmtTotal.unit;
    if (el('p-pareplicate'))      el('p-pareplicate').textContent      = fmtTotal.val;
    if (el('p-pareplicate-unit')) el('p-pareplicate-unit').textContent = fmtTotal.unit;

    if (el('p-live')) el('p-live').innerHTML =
      `( ${retention} days ) × ( ${sessions} sessions/day ) × ( ${duration} min ) × ( ${rate} KB/min ) + 20 GB`
      + ` = <span class="hl-psm">${fmtTotal.val} ${fmtTotal.unit}</span>`
      + ` &nbsp;·&nbsp; PAReplicate: <span class="hl-psm">${fmtTotal.val} ${fmtTotal.unit}</span>`;
  },

  fmtGB(gb) {
    if (gb >= 1000) return { val: (gb / 1000).toFixed(2), unit: 'TB' };
    return { val: gb.toFixed(2), unit: 'GB' };
  },

  /* ── Advanced Method ── */
  calcAdv() {
    const sessions  = parseFloat(document.getElementById('psm-sessions')?.value)  || 100;
    const duration  = parseFloat(document.getElementById('psm-duration')?.value)   || 60;
    const quality   = parseFloat(document.getElementById('psm-quality')?.value)    || 1;
    const retention = parseFloat(document.getElementById('psm-retention')?.value)  || 90;
    const daily     = parseFloat(document.getElementById('psm-daily')?.value)      || 500;
    const buffer    = parseFloat(document.getElementById('psm-buffer')?.value)     || 20;

    const perSession = quality * (duration / 60);
    const dailyGB    = daily * perSession;
    const rawGB      = dailyGB * retention;
    const totalGB    = rawGB * (1 + buffer / 100);
    const totalTB    = totalGB / 1024;
    const liveGB     = sessions * perSession;
    const recommended = totalTB < 2 ? 'Single 2 TB SSD' : `RAID-5 array — ${Math.ceil(totalTB * 1.5)} TB usable`;

    const grid  = document.getElementById('psm-grid-adv');
    const panel = document.getElementById('psm-results-adv');
    if (!grid || !panel) return;
    panel.style.display = 'block';

    grid.innerHTML = `
      ${this._metric('Per Session', perSession.toFixed(3)+' GB', 'Storage per recorded session')}
      ${this._metric('Daily Total', dailyGB.toFixed(2)+' GB', 'Storage consumed each day')}
      ${this._metric('Live Buffer', liveGB.toFixed(2)+' GB', 'Active concurrent session space')}
      ${this._metric('Raw ('+retention+'d)', rawGB.toFixed(2)+' GB', 'Before OS buffer')}
      ${this._metric('Required', totalGB<1024 ? totalGB.toFixed(1)+' GB' : totalTB.toFixed(2)+' TB', 'Total recommended storage', true)}
      ${this._metric('Disk Config', recommended, 'Suggested hardware')}
    `;

    document.getElementById('psm-note-adv').innerHTML =
      `<strong>Formula:</strong> (Daily Sessions × Avg Duration × Quality Rate / 60) × Retention Days × (1 + Buffer%)<br>
       <strong>Tip:</strong> Add 20–30% extra for index files, metadata and future growth.`;
  },

  _metric(label, value, hint, highlight=false) {
    return `<div class="res-box ${highlight?'hi':''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint?`<div class="res-hint">${hint}</div>`:''}
    </div>`;
  }
};
