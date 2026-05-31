/* ============================================================
   CalcHubApp — modules/psm.js
   NIK PSM Server — Storage Sizing Calculator
   (Migrated from original CyberArk → "NIK" branding)
   ============================================================ */

export const psmModule = {
  id:    'psm',
  label: 'PSM Server',
  icon:  '🖥️',
  desc:  'NIK PSM Storage Sizing',
  accent: '#d4ff3a',
  accentRgb: '212,255,58',

  render() {
    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#d4ff3a;background:rgba(212,255,58,.1);border-color:rgba(212,255,58,.3)">NIK · PSM SERVER</span>
      <h2 class="mod-title" style="color:#d4ff3a">PSM Storage Sizing</h2>
      <p class="mod-desc">Calculate storage requirements for NIK Privileged Session Manager servers.</p>
    </div>

    <div class="calc-grid">
      <!-- Sessions -->
      <div class="field-card">
        <div class="field-label">Concurrent Sessions</div>
        <div class="field-row">
          <input type="number" id="psm-sessions" class="field-input psm-in" value="100" min="1" max="10000" placeholder="100">
          <span class="field-unit">sessions</span>
        </div>
        <div class="field-hint">Active simultaneous PSM sessions at peak</div>
      </div>

      <!-- Recording Duration -->
      <div class="field-card">
        <div class="field-label">Avg Session Duration</div>
        <div class="field-row">
          <input type="number" id="psm-duration" class="field-input psm-in" value="60" min="1" max="1440" placeholder="60">
          <span class="field-unit">min</span>
        </div>
        <div class="field-hint">Average duration of each recorded session</div>
      </div>

      <!-- Video Quality -->
      <div class="field-card">
        <div class="field-label">Recording Quality</div>
        <div class="field-row">
          <select id="psm-quality" class="field-select psm-in">
            <option value="0.5">Low — 0.5 GB/hr</option>
            <option value="1" selected>Medium — 1 GB/hr</option>
            <option value="2">High — 2 GB/hr</option>
            <option value="4">Ultra — 4 GB/hr</option>
          </select>
        </div>
        <div class="field-hint">Video recording bit-rate preset</div>
      </div>

      <!-- Retention -->
      <div class="field-card">
        <div class="field-label">Retention Period</div>
        <div class="field-row">
          <input type="number" id="psm-retention" class="field-input psm-in" value="90" min="1" max="3650" placeholder="90">
          <span class="field-unit">days</span>
        </div>
        <div class="field-hint">How long session recordings are kept</div>
      </div>

      <!-- Daily Sessions -->
      <div class="field-card">
        <div class="field-label">Daily Session Count</div>
        <div class="field-row">
          <input type="number" id="psm-daily" class="field-input psm-in" value="500" min="1" max="100000" placeholder="500">
          <span class="field-unit">sessions/day</span>
        </div>
        <div class="field-hint">Total new sessions recorded per day</div>
      </div>

      <!-- OS Buffer -->
      <div class="field-card">
        <div class="field-label">OS / System Buffer</div>
        <div class="field-row">
          <input type="number" id="psm-buffer" class="field-input psm-in" value="20" min="0" max="50" placeholder="20">
          <span class="field-unit">%</span>
        </div>
        <div class="field-hint">Additional headroom for OS and system files</div>
      </div>
    </div>

    <button class="calc-btn lime" id="psm-calc">CALCULATE STORAGE</button>

    <div id="psm-results" class="results-panel" style="display:none">
      <div class="results-grid" id="psm-grid"></div>
      <div class="results-note" id="psm-note"></div>
    </div>
    `;
  },

  init() {
    document.querySelectorAll('.psm-in').forEach(el => {
      el.addEventListener('input', () => this.calculate());
    });
    document.getElementById('psm-calc')?.addEventListener('click', () => this.calculate());
    this.calculate();
  },

  calculate() {
    const sessions  = parseFloat(document.getElementById('psm-sessions')?.value)  || 100;
    const duration  = parseFloat(document.getElementById('psm-duration')?.value)   || 60;
    const quality   = parseFloat(document.getElementById('psm-quality')?.value)    || 1;
    const retention = parseFloat(document.getElementById('psm-retention')?.value)  || 90;
    const daily     = parseFloat(document.getElementById('psm-daily')?.value)      || 500;
    const buffer    = parseFloat(document.getElementById('psm-buffer')?.value)     || 20;

    // Per-session GB = quality GB/hr × duration_min / 60
    const perSession = quality * (duration / 60);

    // Daily storage in GB
    const dailyGB = daily * perSession;

    // Total raw storage for retention
    const rawGB = dailyGB * retention;

    // Apply buffer
    const totalGB = rawGB * (1 + buffer / 100);
    const totalTB = totalGB / 1024;

    // Concurrent live session temp space
    const liveGB = sessions * perSession;

    // Recommended disk config
    const recommended = totalTB < 2 ? 'Single 2 TB SSD' : `RAID-5 array — ${Math.ceil(totalTB * 1.5)} TB usable`;

    const grid = document.getElementById('psm-grid');
    const panel = document.getElementById('psm-results');
    if (!grid || !panel) return;
    panel.style.display = 'block';

    grid.innerHTML = `
      ${this._metric('Per Session', perSession.toFixed(3) + ' GB', 'Storage per recorded session')}
      ${this._metric('Daily Total', dailyGB.toFixed(2) + ' GB', 'Storage consumed each day')}
      ${this._metric('Live Buffer', liveGB.toFixed(2) + ' GB', 'Active concurrent session space')}
      ${this._metric('Raw (${retention}d)', rawGB.toFixed(2) + ' GB', 'Before OS buffer')}
      ${this._metric('Required', totalGB < 1024 ? totalGB.toFixed(1) + ' GB' : totalTB.toFixed(2) + ' TB', 'Total recommended storage', true)}
      ${this._metric('Disk Config', recommended, 'Suggested hardware', false, true)}
    `;

    document.getElementById('psm-note').innerHTML =
      `<strong>Formula:</strong> (Daily Sessions × Avg Duration × Quality Rate / 60) × Retention Days × (1 + Buffer%) <br>
       <strong>Tip:</strong> Add 20 – 30% extra for index files, metadata and future growth.`;
  },

  _metric(label, value, hint, highlight = false, wide = false) {
    return `<div class="res-box ${highlight ? 'hi' : ''} ${wide ? 'wide' : ''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint ? `<div class="res-hint">${hint}</div>` : ''}
    </div>`;
  }
};
