/* ============================================================
   CalcHubApp — modules/unit-converter.js
   Storage Unit Converter — Bytes ↔ KB ↔ MB ↔ GB ↔ TB ↔ PB
   ============================================================ */

const UNITS = [
  { key: 'b',  label: 'Bytes',      factor: 1 },
  { key: 'kb', label: 'Kilobytes',  factor: 1024 },
  { key: 'mb', label: 'Megabytes',  factor: 1024 ** 2 },
  { key: 'gb', label: 'Gigabytes',  factor: 1024 ** 3 },
  { key: 'tb', label: 'Terabytes',  factor: 1024 ** 4 },
  { key: 'pb', label: 'Petabytes',  factor: 1024 ** 5 },
];

const IOPS_PROFILES = [
  { name: 'HDD (7200 RPM)',  read: 120,    write: 100,   latency: '5–10 ms' },
  { name: 'SSD SATA',        read: 50000,  write: 40000, latency: '0.1 ms'  },
  { name: 'NVMe SSD',        read: 500000, write: 450000,latency: '0.02 ms' },
  { name: 'SAN / FC Array',  read: 200000, write: 180000,latency: '0.5 ms'  },
];

export const unitConverterModule = {
  id:    'unit-converter',
  label: 'Unit Converter',
  icon:  '⚖️',
  desc:  'Storage Unit Converter',
  accent: '#f59e0b',
  accentRgb: '245,158,11',

  render() {
    const unitOptions = UNITS.map(u =>
      `<option value="${u.key}">${u.label}</option>`
    ).join('');

    const iopRows = IOPS_PROFILES.map(p => `
      <tr>
        <td>${p.name}</td>
        <td class="mono">${p.read.toLocaleString()}</td>
        <td class="mono">${p.write.toLocaleString()}</td>
        <td class="mono">${p.latency}</td>
      </tr>
    `).join('');

    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#f59e0b;background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3)">TOOL · CONVERTER</span>
      <h2 class="mod-title" style="color:#f59e0b">Storage Unit Converter</h2>
      <p class="mod-desc">Instantly convert between any storage units — bytes to petabytes and back.</p>
    </div>

    <!-- Main converter -->
    <div class="field-card" style="margin-bottom:1rem">
      <div class="field-label">Input Value</div>
      <div class="field-row" style="gap:10px;flex-wrap:wrap">
        <input type="number" id="uc-value" class="field-input" value="1" min="0" step="any" style="flex:1;min-width:120px">
        <select id="uc-from" class="field-select" style="flex:1;min-width:140px">${unitOptions}</select>
      </div>
    </div>

    <!-- Results grid -->
    <div id="uc-results" class="uc-results-grid"></div>

    <!-- IOPS Reference -->
    <div class="field-card" style="margin-top:1.5rem">
      <div class="field-label" style="color:#f59e0b;border-left:3px solid #f59e0b;padding-left:8px;margin-bottom:12px">IOPS Reference Table</div>
      <div class="table-wrap">
        <table class="ref-table">
          <thead>
            <tr>
              <th>Storage Type</th>
              <th>Read IOPS</th>
              <th>Write IOPS</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>${iopRows}</tbody>
        </table>
      </div>
    </div>

    <!-- Bandwidth calc -->
    <div class="field-card" style="margin-top:1rem">
      <div class="field-label" style="color:#f59e0b;border-left:3px solid #f59e0b;padding-left:8px;margin-bottom:12px">Bandwidth ↔ Time Calculator</div>
      <div class="calc-grid" style="margin-bottom:0">
        <div class="field-card" style="background:var(--bg-deep)">
          <div class="field-label">File Size</div>
          <div class="field-row">
            <input type="number" id="bw-size" class="field-input" value="100" min="0" step="any">
            <select id="bw-size-unit" class="field-select" style="max-width:110px">
              ${UNITS.slice(0,5).map(u => `<option value="${u.key}" ${u.key==='gb'?'selected':''}>${u.label.substring(0,2)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field-card" style="background:var(--bg-deep)">
          <div class="field-label">Bandwidth</div>
          <div class="field-row">
            <input type="number" id="bw-speed" class="field-input" value="1" min="0" step="any">
            <select id="bw-speed-unit" class="field-select" style="max-width:110px">
              <option value="mbps">Mbps</option>
              <option value="gbps" selected>Gbps</option>
              <option value="tbps">Tbps</option>
            </select>
          </div>
        </div>
      </div>
      <div id="bw-result" class="bw-result-box" style="margin-top:10px"></div>
    </div>
    `;
  },

  init() {
    document.getElementById('uc-value')?.addEventListener('input', () => this.convert());
    document.getElementById('uc-from')?.addEventListener('change',  () => this.convert());
    document.getElementById('bw-size')?.addEventListener('input', () => this.calcBW());
    document.getElementById('bw-size-unit')?.addEventListener('change', () => this.calcBW());
    document.getElementById('bw-speed')?.addEventListener('input', () => this.calcBW());
    document.getElementById('bw-speed-unit')?.addEventListener('change', () => this.calcBW());
    this.convert();
    this.calcBW();
  },

  convert() {
    const rawVal  = parseFloat(document.getElementById('uc-value')?.value) || 0;
    const fromKey = document.getElementById('uc-from')?.value || 'gb';
    const from    = UNITS.find(u => u.key === fromKey);
    if (!from) return;

    const bytes = rawVal * from.factor;
    const container = document.getElementById('uc-results');
    if (!container) return;

    container.innerHTML = UNITS.map(u => {
      const converted = bytes / u.factor;
      const isActive  = u.key === fromKey;
      const fmt = converted >= 1e15 ? converted.toExponential(3)
               : converted >= 1    ? this._fmt(converted)
               : converted.toExponential(3);
      return `
        <div class="uc-res-box ${isActive ? 'uc-active' : ''}">
          <div class="res-label">${u.label}</div>
          <div class="res-value mono">${fmt}</div>
          <div class="res-hint">${u.key.toUpperCase()}</div>
        </div>
      `;
    }).join('');
  },

  calcBW() {
    const size      = parseFloat(document.getElementById('bw-size')?.value) || 0;
    const sizeUnit  = document.getElementById('bw-size-unit')?.value || 'gb';
    const speed     = parseFloat(document.getElementById('bw-speed')?.value) || 0;
    const speedUnit = document.getElementById('bw-speed-unit')?.value || 'gbps';

    const from    = UNITS.find(u => u.key === sizeUnit);
    const bytes   = size * (from?.factor || 1);
    const bits    = bytes * 8;

    const bpsMap = { mbps: 1e6, gbps: 1e9, tbps: 1e12 };
    const bps    = speed * (bpsMap[speedUnit] || 1e9);

    const seconds = bps > 0 ? bits / bps : 0;
    const result  = document.getElementById('bw-result');
    if (!result) return;

    const fmt = seconds < 60
      ? seconds.toFixed(2) + ' seconds'
      : seconds < 3600
        ? (seconds / 60).toFixed(2) + ' minutes'
        : (seconds / 3600).toFixed(2) + ' hours';

    result.innerHTML = `
      <div class="bw-label">Transfer Time</div>
      <div class="bw-value">${fmt}</div>
      <div class="bw-sub">at ${speed} ${speedUnit.toUpperCase()} for ${size} ${sizeUnit.toUpperCase()}</div>
    `;
  },

  _fmt(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(4) + ' T';
    if (n >= 1e9)  return (n / 1e9).toFixed(4)  + ' B';
    if (n >= 1e6)  return (n / 1e6).toFixed(4)  + ' M';
    if (n >= 1e3)  return (n / 1e3).toFixed(4)  + ' K';
    return n.toFixed(4);
  }
};
