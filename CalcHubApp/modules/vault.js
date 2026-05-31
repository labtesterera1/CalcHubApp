/* ============================================================
   CalcHubApp — modules/vault.js
   NIK Vault Server — Storage Sizing Calculator
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
      <span class="mod-badge" style="color:#0096ff;background:rgba(0,150,255,.1);border-color:rgba(0,150,255,.3)">NIK · VAULT SERVER</span>
      <h2 class="mod-title" style="color:#0096ff">Vault Storage Sizing</h2>
      <p class="mod-desc">Estimate disk requirements for NIK Digital Vault servers (EPV).</p>
    </div>

    <div class="calc-grid">
      <div class="field-card">
        <div class="field-label">Total Accounts</div>
        <div class="field-row">
          <input type="number" id="vault-accounts" class="field-input vault-in" value="5000" min="1">
          <span class="field-unit">accounts</span>
        </div>
        <div class="field-hint">Total privileged accounts stored in vault</div>
      </div>

      <div class="field-card">
        <div class="field-label">Avg Object Size</div>
        <div class="field-row">
          <input type="number" id="vault-obj-size" class="field-input vault-in" value="2" min="0.1" step="0.1">
          <span class="field-unit">KB</span>
        </div>
        <div class="field-hint">Average size of each vault object (password + metadata)</div>
      </div>

      <div class="field-card">
        <div class="field-label">Password Versions</div>
        <div class="field-row">
          <input type="number" id="vault-versions" class="field-input vault-in" value="5" min="1" max="999">
          <span class="field-unit">versions</span>
        </div>
        <div class="field-hint">History versions retained per account</div>
      </div>

      <div class="field-card">
        <div class="field-label">Audit Log Days</div>
        <div class="field-row">
          <input type="number" id="vault-audit" class="field-input vault-in" value="365" min="1">
          <span class="field-unit">days</span>
        </div>
        <div class="field-hint">Audit and activity log retention period</div>
      </div>

      <div class="field-card">
        <div class="field-label">Daily Log Volume</div>
        <div class="field-row">
          <input type="number" id="vault-log-mb" class="field-input vault-in" value="50" min="1">
          <span class="field-unit">MB/day</span>
        </div>
        <div class="field-hint">Estimated daily audit log generation</div>
      </div>

      <div class="field-card">
        <div class="field-label">OS + Metadata Buffer</div>
        <div class="field-row">
          <input type="number" id="vault-buffer" class="field-input vault-in" value="25" min="0" max="60">
          <span class="field-unit">%</span>
        </div>
        <div class="field-hint">Reserved for OS, indexing, and growth headroom</div>
      </div>

      <div class="field-card">
        <div class="field-label">Backup Copies</div>
        <div class="field-row">
          <input type="number" id="vault-backups" class="field-input vault-in" value="2" min="0" max="10">
          <span class="field-unit">copies</span>
        </div>
        <div class="field-hint">Number of on-site backup copies to provision for</div>
      </div>

      <div class="field-card">
        <div class="field-label">DR Replica</div>
        <div class="field-row">
          <select id="vault-dr" class="field-select vault-in">
            <option value="0">No DR</option>
            <option value="1" selected>1 DR Site</option>
            <option value="2">2 DR Sites</option>
          </select>
        </div>
        <div class="field-hint">Disaster recovery vault replicas</div>
      </div>
    </div>

    <button class="calc-btn blue" id="vault-calc">CALCULATE STORAGE</button>

    <div id="vault-results" class="results-panel" style="display:none">
      <div class="results-grid" id="vault-grid"></div>
      <div class="results-note" id="vault-note"></div>
    </div>
    `;
  },

  init() {
    document.querySelectorAll('.vault-in').forEach(el => {
      el.addEventListener('input', () => this.calculate());
    });
    document.getElementById('vault-calc')?.addEventListener('click', () => this.calculate());
    this.calculate();
  },

  calculate() {
    const accounts  = parseFloat(document.getElementById('vault-accounts')?.value)  || 5000;
    const objSize   = parseFloat(document.getElementById('vault-obj-size')?.value)   || 2;
    const versions  = parseFloat(document.getElementById('vault-versions')?.value)   || 5;
    const auditDays = parseFloat(document.getElementById('vault-audit')?.value)      || 365;
    const logMB     = parseFloat(document.getElementById('vault-log-mb')?.value)     || 50;
    const buffer    = parseFloat(document.getElementById('vault-buffer')?.value)     || 25;
    const backups   = parseFloat(document.getElementById('vault-backups')?.value)    || 2;
    const drSites   = parseFloat(document.getElementById('vault-dr')?.value)         || 1;

    // Core vault objects GB
    const vaultDataGB = (accounts * versions * objSize) / (1024 * 1024); // KB → GB

    // Audit logs GB
    const auditGB = (logMB * auditDays) / 1024;

    // Total raw
    const rawGB = vaultDataGB + auditGB;

    // With buffer
    const primaryGB = rawGB * (1 + buffer / 100);

    // Backup storage
    const backupGB = primaryGB * backups;

    // DR storage
    const drGB = primaryGB * drSites;

    // Grand total
    const totalGB = primaryGB + backupGB + drGB;
    const totalTB = totalGB / 1024;

    const grid  = document.getElementById('vault-grid');
    const panel = document.getElementById('vault-results');
    if (!grid || !panel) return;
    panel.style.display = 'block';

    grid.innerHTML = `
      ${this._metric('Vault Objects', vaultDataGB < 1 ? (vaultDataGB * 1024).toFixed(2) + ' MB' : vaultDataGB.toFixed(3) + ' GB', 'Account data + version history')}
      ${this._metric('Audit Logs', auditGB.toFixed(2) + ' GB', `${auditDays} days of activity logs`)}
      ${this._metric('Primary Vault', primaryGB.toFixed(2) + ' GB', 'With OS buffer')}
      ${this._metric('Backups', backupGB.toFixed(2) + ' GB', `${backups} on-site copies`)}
      ${this._metric('DR Replica', drGB.toFixed(2) + ' GB', `${drSites} disaster recovery site(s)`)}
      ${this._metric('GRAND TOTAL', totalGB < 1024 ? totalGB.toFixed(2) + ' GB' : totalTB.toFixed(3) + ' TB', 'All sites combined', true)}
    `;

    document.getElementById('vault-note').innerHTML =
      `<strong>NIK Vault Tip:</strong> Primary vault drive should be ≥ 2× the raw data size. 
       Enable SSD-backed storage for the active vault path and spinning disk for backup archives.<br>
       Always provision DR replica with matching storage tier to primary.`;
  },

  _metric(label, value, hint, highlight = false) {
    return `<div class="res-box ${highlight ? 'hi-blue' : ''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint ? `<div class="res-hint">${hint}</div>` : ''}
    </div>`;
  }
};
