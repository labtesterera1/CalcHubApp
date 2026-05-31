/* ============================================================
   CalcHubApp — modules/unit-converter.js
   Storage Unit Converter
   Tab 1 — Original: 4 dedicated KB/MB/GB/TB blocks (decimal)
   Tab 2 — Advanced: universal picker + IOPS table + bandwidth
   ============================================================ */

export const unitConverterModule = {
  id:    'unit-converter',
  label: 'Unit Converter',
  icon:  '⚖️',
  desc:  'Storage Unit Converter',
  accent: '#f59e0b',
  accentRgb: '245,158,11',

  render() {
    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#f59e0b;background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.3)">TOOL · CONVERTER</span>
      <h2 class="mod-title" style="color:#f59e0b">Storage Unit Converter</h2>
    </div>

    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="uc-tab-orig" onclick="__uc.switchTab('orig')">📐 Original</button>
      <button class="sub-tab-btn" id="uc-tab-adv" onclick="__uc.switchTab('adv')">🔬 Advanced</button>
    </div>

    <!-- ══ TAB 1: ORIGINAL ══ -->
    <div id="uc-panel-orig">
      <!-- KB → all -->
      <div class="conv-group">
        <div class="conv-group-title">KB → MB / GB / TB</div>
        <div class="conv-input-row">
          <label>KB</label>
          <input type="number" id="c-kb" min="0" value="1000000" placeholder="Enter KB" oninput="__uc.fromKB()">
        </div>
        <div class="conv-results">
          <div class="conv-stat"><div class="conv-stat-label">Megabytes</div><div class="conv-stat-value" id="c-kb-mb">1,000.00</div><div class="conv-unit">MB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Gigabytes</div><div class="conv-stat-value" id="c-kb-gb">1.00</div><div class="conv-unit">GB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Terabytes</div><div class="conv-stat-value" id="c-kb-tb">0.001000</div><div class="conv-unit">TB</div></div>
        </div>
      </div>
      <!-- MB → all -->
      <div class="conv-group">
        <div class="conv-group-title">MB → KB / GB / TB</div>
        <div class="conv-input-row">
          <label>MB</label>
          <input type="number" id="c-mb" min="0" value="1000" placeholder="Enter MB" oninput="__uc.fromMB()">
        </div>
        <div class="conv-results">
          <div class="conv-stat"><div class="conv-stat-label">Kilobytes</div><div class="conv-stat-value" id="c-mb-kb">1,000,000</div><div class="conv-unit">KB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Gigabytes</div><div class="conv-stat-value" id="c-mb-gb">1.00</div><div class="conv-unit">GB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Terabytes</div><div class="conv-stat-value" id="c-mb-tb">0.001000</div><div class="conv-unit">TB</div></div>
        </div>
      </div>
      <!-- GB → all -->
      <div class="conv-group">
        <div class="conv-group-title">GB → KB / MB / TB</div>
        <div class="conv-input-row">
          <label>GB</label>
          <input type="number" id="c-gb" min="0" value="1" placeholder="Enter GB" oninput="__uc.fromGB()">
        </div>
        <div class="conv-results">
          <div class="conv-stat"><div class="conv-stat-label">Kilobytes</div><div class="conv-stat-value" id="c-gb-kb">1,000,000</div><div class="conv-unit">KB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Megabytes</div><div class="conv-stat-value" id="c-gb-mb">1,000</div><div class="conv-unit">MB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Terabytes</div><div class="conv-stat-value" id="c-gb-tb">0.001000</div><div class="conv-unit">TB</div></div>
        </div>
      </div>
      <!-- TB → all -->
      <div class="conv-group">
        <div class="conv-group-title">TB → KB / MB / GB</div>
        <div class="conv-input-row">
          <label>TB</label>
          <input type="number" id="c-tb" min="0" value="1" placeholder="Enter TB" oninput="__uc.fromTB()">
        </div>
        <div class="conv-results">
          <div class="conv-stat"><div class="conv-stat-label">Kilobytes</div><div class="conv-stat-value" id="c-tb-kb">1,000,000,000</div><div class="conv-unit">KB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Megabytes</div><div class="conv-stat-value" id="c-tb-mb">1,000,000</div><div class="conv-unit">MB</div></div>
          <div class="conv-stat"><div class="conv-stat-label">Gigabytes</div><div class="conv-stat-value" id="c-tb-gb">1,000</div><div class="conv-unit">GB</div></div>
        </div>
      </div>
      <div class="note-box-orig" style="background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.2);">
        <strong>Note:</strong> All conversions use decimal units — 1 KB = 1,000 bytes, 1 MB = 1,000 KB, 1 GB = 1,000 MB, 1 TB = 1,000 GB — consistent with NIK sizing calculations.
      </div>
    </div>

    <!-- ══ TAB 2: ADVANCED ══ -->
    <div id="uc-panel-adv" style="display:none">
      <div class="field-card" style="margin-bottom:1rem">
        <div class="field-label">Input Value</div>
        <div class="field-row" style="gap:10px;flex-wrap:wrap">
          <input type="number" id="uc-value" class="field-input" value="1" min="0" step="any" style="flex:1;min-width:120px" oninput="__uc.convert()">
          <select id="uc-from" class="field-select" style="flex:1;min-width:140px" onchange="__uc.convert()">
            <option value="b">Bytes</option>
            <option value="kb">Kilobytes</option>
            <option value="mb">Megabytes</option>
            <option value="gb" selected>Gigabytes</option>
            <option value="tb">Terabytes</option>
            <option value="pb">Petabytes</option>
          </select>
        </div>
      </div>
      <div id="uc-results" class="uc-results-grid"></div>

      <!-- IOPS Reference -->
      <div class="field-card" style="margin-top:1.5rem">
        <div class="field-label" style="color:#f59e0b;border-left:3px solid #f59e0b;padding-left:8px;margin-bottom:12px">IOPS Reference Table</div>
        <div class="table-wrap">
          <table class="ref-table">
            <thead><tr><th>Storage Type</th><th>Read IOPS</th><th>Write IOPS</th><th>Latency</th></tr></thead>
            <tbody>
              <tr><td>HDD (7200 RPM)</td><td class="mono">120</td><td class="mono">100</td><td class="mono">5–10 ms</td></tr>
              <tr><td>SSD SATA</td><td class="mono">50,000</td><td class="mono">40,000</td><td class="mono">0.1 ms</td></tr>
              <tr><td>NVMe SSD</td><td class="mono">500,000</td><td class="mono">450,000</td><td class="mono">0.02 ms</td></tr>
              <tr><td>SAN / FC Array</td><td class="mono">200,000</td><td class="mono">180,000</td><td class="mono">0.5 ms</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bandwidth calc -->
      <div class="field-card" style="margin-top:1rem">
        <div class="field-label" style="color:#f59e0b;border-left:3px solid #f59e0b;padding-left:8px;margin-bottom:12px">Bandwidth ↔ Transfer Time</div>
        <div class="calc-grid" style="margin-bottom:8px">
          <div class="field-card" style="background:var(--bg-deep)">
            <div class="field-label">File Size</div>
            <div class="field-row">
              <input type="number" id="bw-size" class="field-input" value="100" min="0" step="any" oninput="__uc.calcBW()">
              <select id="bw-size-unit" class="field-select" style="max-width:80px" onchange="__uc.calcBW()">
                <option value="mb">MB</option><option value="gb" selected>GB</option><option value="tb">TB</option>
              </select>
            </div>
          </div>
          <div class="field-card" style="background:var(--bg-deep)">
            <div class="field-label">Bandwidth</div>
            <div class="field-row">
              <input type="number" id="bw-speed" class="field-input" value="1" min="0" step="any" oninput="__uc.calcBW()">
              <select id="bw-speed-unit" class="field-select" style="max-width:80px" onchange="__uc.calcBW()">
                <option value="mbps">Mbps</option><option value="gbps" selected>Gbps</option><option value="tbps">Tbps</option>
              </select>
            </div>
          </div>
        </div>
        <div class="bw-result-box" id="bw-result"></div>
      </div>
    </div>`;
  },

  UNITS: [
    { key:'b',  label:'Bytes',     factor:1 },
    { key:'kb', label:'Kilobytes', factor:1024 },
    { key:'mb', label:'Megabytes', factor:1024**2 },
    { key:'gb', label:'Gigabytes', factor:1024**3 },
    { key:'tb', label:'Terabytes', factor:1024**4 },
    { key:'pb', label:'Petabytes', factor:1024**5 },
  ],

  init() {
    window.__uc = this;
    this.fromKB(); this.fromMB(); this.fromGB(); this.fromTB();
    this.convert(); this.calcBW();
  },
  cleanup() { delete window.__uc; },

  switchTab(tab) {
    ['orig','adv'].forEach(t => {
      document.getElementById(`uc-tab-${t}`)?.classList.toggle('active', t === tab);
      const p = document.getElementById(`uc-panel-${t}`);
      if (p) p.style.display = t === tab ? 'block' : 'none';
    });
  },

  /* ── Original ── */
  fmtInt(n) { return Math.round(n).toLocaleString(); },

  fromKB() {
    const kb = parseFloat(document.getElementById('c-kb')?.value) || 0;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('c-kb-mb', (kb/1e3).toFixed(2));
    set('c-kb-gb', (kb/1e6).toFixed(6));
    set('c-kb-tb', (kb/1e9).toFixed(9));
  },
  fromMB() {
    const mb = parseFloat(document.getElementById('c-mb')?.value) || 0;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('c-mb-kb', this.fmtInt(mb*1e3));
    set('c-mb-gb', (mb/1e3).toFixed(6));
    set('c-mb-tb', (mb/1e6).toFixed(9));
  },
  fromGB() {
    const gb = parseFloat(document.getElementById('c-gb')?.value) || 0;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('c-gb-kb', this.fmtInt(gb*1e6));
    set('c-gb-mb', this.fmtInt(gb*1e3));
    set('c-gb-tb', (gb/1e3).toFixed(6));
  },
  fromTB() {
    const tb = parseFloat(document.getElementById('c-tb')?.value) || 0;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('c-tb-kb', this.fmtInt(tb*1e9));
    set('c-tb-mb', this.fmtInt(tb*1e6));
    set('c-tb-gb', this.fmtInt(tb*1e3));
  },

  /* ── Advanced ── */
  convert() {
    const val = parseFloat(document.getElementById('uc-value')?.value) || 0;
    const fromKey = document.getElementById('uc-from')?.value || 'gb';
    const from = this.UNITS.find(u => u.key === fromKey);
    if (!from) return;
    const bytes = val * from.factor;
    const container = document.getElementById('uc-results');
    if (!container) return;
    container.innerHTML = this.UNITS.map(u => {
      const cv = bytes / u.factor;
      const isActive = u.key === fromKey;
      const fmt = Math.abs(cv) >= 1e15 ? cv.toExponential(3)
               : Math.abs(cv) >= 1    ? parseFloat(cv.toPrecision(8)).toString()
               : cv.toExponential(3);
      return `<div class="uc-res-box ${isActive?'uc-active':''}">
        <div class="res-label">${u.label}</div>
        <div class="res-value mono">${fmt}</div>
        <div class="res-hint">${u.key.toUpperCase()}</div>
      </div>`;
    }).join('');
  },

  calcBW() {
    const size  = parseFloat(document.getElementById('bw-size')?.value) || 0;
    const sUnit = document.getElementById('bw-size-unit')?.value || 'gb';
    const speed = parseFloat(document.getElementById('bw-speed')?.value) || 0;
    const spdU  = document.getElementById('bw-speed-unit')?.value || 'gbps';
    const sMap  = { mb:1e6, gb:1e9, tb:1e12 };
    const bytes = size * (sMap[sUnit]||1e9);
    const bpsMap = { mbps:1e6, gbps:1e9, tbps:1e12 };
    const bps = speed * (bpsMap[spdU]||1e9);
    const sec = bps > 0 ? (bytes*8)/bps : 0;
    const fmt = sec<60 ? sec.toFixed(2)+' seconds' : sec<3600 ? (sec/60).toFixed(2)+' minutes' : (sec/3600).toFixed(2)+' hours';
    const el = document.getElementById('bw-result');
    if (el) el.innerHTML = `<div class="bw-label">Transfer Time</div><div class="bw-value">${fmt}</div><div class="bw-sub">at ${speed} ${spdU.toUpperCase()} for ${size} ${sUnit.toUpperCase()}</div>`;
  }
};
