/* ============================================================
   CalcHubApp — modules/vault.js
   NIK Vault Server — Storage Sizing Calculator
   Two methods:
     Tab 1 — Original formula: S = (t_ret × N_sess × t_sess × R_rec) + 20 GB
     Tab 2 — Advanced multi-variable sizing
   ============================================================ */

export const vaultModule = {
  id:    'vault',
  label: 'Vault Server',
  icon:  '🔐',
  desc:  'NIK Vault Storage Sizing',
  accent: '#0096ff',
  accentRgb: '0,150,255',

  render() {
    return `
    <div class="mod-header">
      <div class="mod-header-top">
        <button class="mod-back-btn" onclick="window.__goHome()" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#0096ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Home
        </button>
        <span class="mod-badge" style="color:#0096ff;background:#0096ff1a;border-color:#0096ff4d">NIK · VAULT SERVER</span>
      </div>
      <h2 class="mod-title" style="color:#0096ff">Vault Storage Sizing</h2>
    </div>

    <!-- Method tabs -->
    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="vault-tab-orig" onclick="__vault.switchTab('orig')">📐 Original Formula</button>
      <button class="sub-tab-btn" id="vault-tab-adv" onclick="__vault.switchTab('adv')">🔬 Advanced Sizing</button>
    </div>

    <!-- ══ TAB 1: ORIGINAL ══ -->
    <div id="vault-panel-orig">

      <div class="sec-title-formula">
        S<sub>Vault</sub> = (t<sub>retention</sub>) × (N<sub>session</sub>) × (t<sub>session</sub>) × (R<sub>recording</sub>) + 20 GB
      </div>

      <div class="formula-box-orig vault-orig">
        <span class="em-vault">S<sub>Vault</sub></span> = Required storage on Vault &nbsp;|&nbsp;
        <span class="em-vault">t<sub>retention</sub></span> = Retention days &nbsp;|&nbsp;
        <span class="em-vault">N<sub>session</sub></span> = Recorded sessions/day &nbsp;|&nbsp;
        <span class="em-vault">t<sub>session</sub></span> = Avg session length (min) &nbsp;|&nbsp;
        <span class="em-vault">R<sub>recording</sub></span> = Avg bit rate (KB/min)
      </div>

      <div class="orig-row3">
        <div class="orig-card">
          <label>Retention period — days (t<sub>retention</sub>)</label>
          <input type="number" class="orig-input vault-color" id="v-retention" min="1" value="90" oninput="__vault.calcOrig()">
        </div>
        <div class="orig-card">
          <label>Sessions per day (N<sub>session</sub>)</label>
          <input type="number" class="orig-input vault-color" id="v-sessions" min="1" value="400" oninput="__vault.calcOrig()">
        </div>
        <div class="orig-card">
          <label>Session length — minutes (t<sub>session</sub>)</label>
          <input type="number" class="orig-input vault-color" id="v-duration" min="1" value="180" oninput="__vault.calcOrig()">
        </div>
      </div>

      <div class="rate-card-orig">
        <div class="rate-section-label">Recording bit rate — R<sub>recording</sub></div>
        <div class="rate-grid-orig" id="v-rate-group">
          <label class="rate-opt" onclick="__vault.vSetRate(this)">
            <input type="radio" name="v-rate" value="100" onchange="__vault.calcOrig()">
            <span class="rate-lbl"><span class="kb-vault">100 KB/min</span><span class="rate-desc">Average SSH session</span></span>
          </label>
          <label class="rate-opt" onclick="__vault.vSetRate(this)">
            <input type="radio" name="v-rate" value="200" onchange="__vault.calcOrig()">
            <span class="rate-lbl"><span class="kb-vault">200 KB/min</span><span class="rate-desc">Low activity RDP session</span></span>
          </label>
          <label class="rate-opt active-vault" onclick="__vault.vSetRate(this)">
            <input type="radio" name="v-rate" value="300" checked onchange="__vault.calcOrig()">
            <span class="rate-lbl"><span class="kb-vault">300 KB/min</span><span class="rate-desc">High activity RDP with rich wallpaper</span></span>
          </label>
          <label class="rate-opt" onclick="__vault.vSetRate(this)">
            <input type="radio" name="v-rate" value="custom" onchange="__vault.calcOrig()">
            <span class="rate-lbl">
              <span class="kb-vault" style="color:var(--text-muted);">Custom</span>
              <span class="custom-rate-wrap">
                <input type="number" id="v-custom" min="1" value="300" oninput="__vault.vCustomActive();__vault.calcOrig()" onclick="__vault.vCustomActive()">
                <span>KB/min</span>
              </span>
            </span>
          </label>
        </div>
      </div>

      <div class="results-3-orig">
        <div class="stat-orig">
          <div class="stat-orig-label">Raw recording</div>
          <div class="stat-orig-value" id="v-raw">—</div>
          <div class="stat-orig-unit" id="v-raw-unit">TB</div>
        </div>
        <div class="stat-orig">
          <div class="stat-orig-label">OS overhead</div>
          <div class="stat-orig-value">20</div>
          <div class="stat-orig-unit">GB (fixed)</div>
        </div>
        <div class="stat-orig hi-vault-stat">
          <div class="stat-orig-label">S<sub>Vault</sub> required</div>
          <div class="stat-orig-value" id="v-total">—</div>
          <div class="stat-orig-unit" id="v-total-unit">TB total</div>
        </div>
      </div>

      <div class="formula-live-orig" id="v-live">
        ( 90 days ) × ( 400 sessions/day ) × ( 180 min ) × ( 300 KB/min ) + 20 GB = <span class="hl-vault">1.96 TB</span>
      </div>

      <div class="note-box-orig vault-note">
        <strong>Reference:</strong> 250 GB of storage is sufficient for recording 10 hours of activities per day retained for 5 years.
      </div>
    </div>

    <!-- ══ TAB 2: ADVANCED ══ -->
    <div id="vault-panel-adv" style="display:none">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:1rem;">Multi-variable sizing — accounts for account objects, audit logs, backup copies and DR replicas.</p>

      <div class="calc-grid">
        <div class="field-card">
          <div class="field-label">Total Accounts</div>
          <div class="field-row">
            <input type="number" id="vault-accounts" class="field-input" value="5000" min="1">
            <span class="field-unit">accounts</span>
          </div>
          <div class="field-hint">Total privileged accounts stored in vault</div>
        </div>
        <div class="field-card">
          <div class="field-label">Avg Object Size</div>
          <div class="field-row">
            <input type="number" id="vault-obj-size" class="field-input" value="2" min="0.1" step="0.1">
            <span class="field-unit">KB</span>
          </div>
          <div class="field-hint">Average size of each vault object</div>
        </div>
        <div class="field-card">
          <div class="field-label">Password Versions</div>
          <div class="field-row">
            <input type="number" id="vault-versions" class="field-input" value="5" min="1">
            <span class="field-unit">versions</span>
          </div>
          <div class="field-hint">History versions retained per account</div>
        </div>
        <div class="field-card">
          <div class="field-label">Audit Log Days</div>
          <div class="field-row">
            <input type="number" id="vault-audit" class="field-input" value="365" min="1">
            <span class="field-unit">days</span>
          </div>
          <div class="field-hint">Audit and activity log retention</div>
        </div>
        <div class="field-card">
          <div class="field-label">Daily Log Volume</div>
          <div class="field-row">
            <input type="number" id="vault-log-mb" class="field-input" value="50" min="1">
            <span class="field-unit">MB/day</span>
          </div>
          <div class="field-hint">Estimated daily audit log generation</div>
        </div>
        <div class="field-card">
          <div class="field-label">OS + Metadata Buffer</div>
          <div class="field-row">
            <input type="number" id="vault-buffer" class="field-input" value="25" min="0" max="60">
            <span class="field-unit">%</span>
          </div>
          <div class="field-hint">Reserved for OS, indexing, and growth</div>
        </div>
        <div class="field-card">
          <div class="field-label">Backup Copies</div>
          <div class="field-row">
            <input type="number" id="vault-backups" class="field-input" value="2" min="0" max="10">
            <span class="field-unit">copies</span>
          </div>
          <div class="field-hint">Number of on-site backup copies</div>
        </div>
        <div class="field-card">
          <div class="field-label">DR Replica</div>
          <div class="field-row">
            <select id="vault-dr" class="field-select">
              <option value="0">No DR</option>
              <option value="1" selected>1 DR Site</option>
              <option value="2">2 DR Sites</option>
            </select>
          </div>
          <div class="field-hint">Disaster recovery vault replicas</div>
        </div>
      </div>

      <button class="calc-btn blue" onclick="__vault.calcAdv()">CALCULATE STORAGE</button>

      <div id="vault-results-adv" class="results-panel" style="display:none">
        <div class="results-grid" id="vault-grid-adv"></div>
        <div class="results-note" id="vault-note-adv"></div>
      </div>
    </div>
    `;
  },

  init() {
    window.__vault = this;
    this.calcOrig();
  },

  cleanup() { delete window.__vault; },

  switchTab(tab) {
    ['orig','adv'].forEach(t => {
      document.getElementById(`vault-tab-${t}`)?.classList.toggle('active', t === tab);
      const panel = document.getElementById(`vault-panel-${t}`);
      if (panel) panel.style.display = t === tab ? 'block' : 'none';
    });
  },

  /* ── Original Method ── */
  vSetRate(el) {
    document.querySelectorAll('#v-rate-group .rate-opt').forEach(o => o.classList.remove('active-vault'));
    el.classList.add('active-vault');
  },

  vCustomActive() {
    const opts = document.querySelectorAll('#v-rate-group .rate-opt');
    opts[3]?.querySelector('input[type=radio]').click();
    this.vSetRate(opts[3]);
  },

  getVRate() {
    const sel = document.querySelector('input[name="v-rate"]:checked');
    if (!sel) return 300;
    return sel.value === 'custom'
      ? (parseFloat(document.getElementById('v-custom')?.value) || 0)
      : parseFloat(sel.value);
  },

  fmtGB(gb) {
    if (gb >= 1000) return { val: (gb/1000).toFixed(2), unit: 'TB' };
    return { val: gb.toFixed(2), unit: 'GB' };
  },

  calcOrig() {
    const retention = parseFloat(document.getElementById('v-retention')?.value) || 0;
    const sessions  = parseFloat(document.getElementById('v-sessions')?.value)  || 0;
    const duration  = parseFloat(document.getElementById('v-duration')?.value)  || 0;
    const rate      = this.getVRate();
    const rawKB     = retention * sessions * duration * rate;
    const rawGB     = rawKB / (1000 * 1000);
    const totalGB   = rawGB + 20;
    const raw       = this.fmtGB(rawGB);
    const total     = this.fmtGB(totalGB);

    const el = id => document.getElementById(id);
    if (el('v-raw'))        el('v-raw').textContent        = raw.val;
    if (el('v-raw-unit'))   el('v-raw-unit').textContent   = raw.unit;
    if (el('v-total'))      el('v-total').textContent      = total.val;
    if (el('v-total-unit')) el('v-total-unit').textContent = total.unit + ' total';
    if (el('v-live'))       el('v-live').innerHTML =
      `( ${retention} days ) × ( ${sessions} sessions/day ) × ( ${duration} min ) × ( ${rate} KB/min ) + 20 GB = <span class="hl-vault">${total.val} ${total.unit}</span>`;
  },

  /* ── Advanced Method ── */
  calcAdv() {
    const accounts  = parseFloat(document.getElementById('vault-accounts')?.value)  || 5000;
    const objSize   = parseFloat(document.getElementById('vault-obj-size')?.value)   || 2;
    const versions  = parseFloat(document.getElementById('vault-versions')?.value)   || 5;
    const auditDays = parseFloat(document.getElementById('vault-audit')?.value)      || 365;
    const logMB     = parseFloat(document.getElementById('vault-log-mb')?.value)     || 50;
    const buffer    = parseFloat(document.getElementById('vault-buffer')?.value)     || 25;
    const backups   = parseFloat(document.getElementById('vault-backups')?.value)    || 2;
    const drSites   = parseFloat(document.getElementById('vault-dr')?.value)         || 1;

    const vaultDataGB  = (accounts * versions * objSize) / (1024 * 1024);
    const auditGB      = (logMB * auditDays) / 1024;
    const rawGB        = vaultDataGB + auditGB;
    const primaryGB    = rawGB * (1 + buffer / 100);
    const backupGB     = primaryGB * backups;
    const drGB         = primaryGB * drSites;
    const totalGB      = primaryGB + backupGB + drGB;
    const totalTB      = totalGB / 1024;

    const grid  = document.getElementById('vault-grid-adv');
    const panel = document.getElementById('vault-results-adv');
    if (!grid || !panel) return;
    panel.style.display = 'block';

    grid.innerHTML = `
      ${this._metric('Vault Objects', vaultDataGB<1?(vaultDataGB*1024).toFixed(2)+' MB':vaultDataGB.toFixed(3)+' GB', 'Account data + version history')}
      ${this._metric('Audit Logs', auditGB.toFixed(2)+' GB', `${auditDays} days of activity logs`)}
      ${this._metric('Primary Vault', primaryGB.toFixed(2)+' GB', 'With OS buffer')}
      ${this._metric('Backups', backupGB.toFixed(2)+' GB', `${backups} on-site copies`)}
      ${this._metric('DR Replica', drGB.toFixed(2)+' GB', `${drSites} disaster recovery site(s)`)}
      ${this._metric('GRAND TOTAL', totalGB<1024?totalGB.toFixed(2)+' GB':totalTB.toFixed(3)+' TB', 'All sites combined', true)}
    `;

    document.getElementById('vault-note-adv').innerHTML =
      `<strong>Tip:</strong> Primary vault drive should be ≥ 2× raw data size. Use SSD-backed storage for the active vault path and spinning disk for archives.<br>
       Always provision DR replica with matching storage tier to primary.`;
  },

  _metric(label, value, hint, highlight=false) {
    return `<div class="res-box ${highlight?'hi-blue':''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint?`<div class="res-hint">${hint}</div>`:''}
    </div>`;
  }
};
