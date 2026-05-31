/* ============================================================
   CalcHubApp — modules/time-converter.js
   Time Converter — seconds ↔ minutes ↔ hours ↔ days ↔ weeks
   + live clock + timezone display
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
      <p class="mod-desc">Convert time units, view live clocks, and compare timezones.</p>
    </div>

    <!-- Live clock -->
    <div class="clock-display" id="tc-clock">
      <div>
        <div class="clock-time" id="tc-time">--:--:--</div>
        <div class="clock-date" id="tc-date">Loading…</div>
      </div>
      <div class="clock-info">
        <div id="tc-tz" style="color:var(--muted);font-size:12px;font-family:'JetBrains Mono',monospace"></div>
        <div id="tc-utc" style="color:var(--muted);font-size:11px;margin-top:2px"></div>
      </div>
    </div>

    <!-- Conversion inputs -->
    <div class="field-card" style="margin-bottom:1rem">
      <div class="field-label" style="color:#c084fc;border-left:3px solid #c084fc;padding-left:8px;margin-bottom:12px">Enter a time value to convert</div>
      <div class="field-row" style="gap:10px;flex-wrap:wrap">
        <input type="number" id="tc-value" class="field-input" value="1" min="0" step="any" style="flex:2;min-width:120px">
        <select id="tc-unit" class="field-select" style="flex:1;min-width:140px">
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

    <div id="tc-results" class="uc-results-grid tc-grid"></div>

    <!-- Timezone comparison -->
    <div class="field-card" style="margin-top:1.5rem">
      <div class="field-label" style="color:#c084fc;border-left:3px solid #c084fc;padding-left:8px;margin-bottom:12px">World Clock</div>
      <div class="world-clock-grid" id="tc-world"></div>
    </div>

    <!-- HH:MM:SS ↔ Seconds -->
    <div class="field-card" style="margin-top:1rem">
      <div class="field-label" style="color:#c084fc;border-left:3px solid #c084fc;padding-left:8px;margin-bottom:12px">HH:MM:SS ↔ Total Seconds</div>
      <div class="calc-grid" style="margin-bottom:8px">
        <div class="field-card" style="background:var(--bg-deep)">
          <div class="field-label">Hours</div>
          <input type="number" id="tc-hh" class="field-input" value="1" min="0">
        </div>
        <div class="field-card" style="background:var(--bg-deep)">
          <div class="field-label">Minutes</div>
          <input type="number" id="tc-mm" class="field-input" value="30" min="0" max="59">
        </div>
        <div class="field-card" style="background:var(--bg-deep)">
          <div class="field-label">Seconds</div>
          <input type="number" id="tc-ss" class="field-input" value="0" min="0" max="59">
        </div>
      </div>
      <div class="bw-result-box" id="tc-hms-result"></div>
    </div>
    `;
  },

  init() {
    this._startClock();
    this._buildWorldClock();

    document.getElementById('tc-value')?.addEventListener('input', () => this.convert());
    document.getElementById('tc-unit')?.addEventListener('change', () => this.convert());
    ['tc-hh','tc-mm','tc-ss'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.calcHMS());
    });

    this.convert();
    this.calcHMS();
  },

  cleanup() {
    if (this._clockTimer) { clearInterval(this._clockTimer); this._clockTimer = null; }
  },

  _startClock() {
    const tick = () => {
      const now  = new Date();
      const el   = document.getElementById('tc-time');
      const del  = document.getElementById('tc-date');
      const tz   = document.getElementById('tc-tz');
      const utc  = document.getElementById('tc-utc');
      if (!el) { clearInterval(this._clockTimer); return; }
      el.textContent  = now.toLocaleTimeString('en-IN', { hour12: false });
      del.textContent = now.toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
      tz.textContent  = Intl.DateTimeFormat().resolvedOptions().timeZone;
      utc.textContent = 'UTC' + (now.getTimezoneOffset() <= 0 ? '+' : '-') +
        String(Math.abs(now.getTimezoneOffset() / 60)).padStart(2, '0') + ':00';
    };
    tick();
    this._clockTimer = setInterval(tick, 1000);
  },

  _buildWorldClock() {
    const zones = [
      { name: 'New York',  tz: 'America/New_York' },
      { name: 'London',    tz: 'Europe/London' },
      { name: 'Dubai',     tz: 'Asia/Dubai' },
      { name: 'Mumbai',    tz: 'Asia/Kolkata' },
      { name: 'Singapore', tz: 'Asia/Singapore' },
      { name: 'Tokyo',     tz: 'Asia/Tokyo' },
      { name: 'Sydney',    tz: 'Australia/Sydney' },
      { name: 'UTC',       tz: 'UTC' },
    ];

    const grid = document.getElementById('tc-world');
    if (!grid) return;

    const updateClock = () => {
      const now = new Date();
      zones.forEach(z => {
        const el = document.getElementById(`wc-${z.tz.replace(/\//g,'-')}`);
        if (!el) return;
        el.textContent = now.toLocaleTimeString('en-US', { timeZone: z.tz, hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
      });
    };

    grid.innerHTML = zones.map(z => `
      <div class="world-clock-box">
        <div class="wc-name">${z.name}</div>
        <div class="wc-time" id="wc-${z.tz.replace(/\//g,'-')}">--:--:--</div>
        <div class="wc-tz">${z.tz}</div>
      </div>
    `).join('');

    updateClock();
    // Reuse main clock interval
    const oldTimer = this._clockTimer;
    clearInterval(oldTimer);
    this._clockTimer = setInterval(() => {
      const timeEl = document.getElementById('tc-time');
      if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('en-IN', { hour12: false });
        document.getElementById('tc-date').textContent = now.toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
      }
      updateClock();
    }, 1000);
  },

  convert() {
    const val  = parseFloat(document.getElementById('tc-value')?.value) || 0;
    const unit = document.getElementById('tc-unit')?.value || 's';

    // All conversions to seconds
    const toSec = {
      ms: 0.001,
      s: 1,
      min: 60,
      hr: 3600,
      day: 86400,
      week: 604800,
      month: 2629800,   // 30.4375 days avg
      year: 31557600,   // 365.25 days avg
    };

    const seconds = val * (toSec[unit] || 1);

    const units = [
      { key: 'ms',    label: 'Milliseconds',  v: seconds / 0.001 },
      { key: 's',     label: 'Seconds',       v: seconds },
      { key: 'min',   label: 'Minutes',       v: seconds / 60 },
      { key: 'hr',    label: 'Hours',         v: seconds / 3600 },
      { key: 'day',   label: 'Days',          v: seconds / 86400 },
      { key: 'week',  label: 'Weeks',         v: seconds / 604800 },
      { key: 'month', label: 'Months',        v: seconds / 2629800 },
      { key: 'year',  label: 'Years',         v: seconds / 31557600 },
    ];

    const container = document.getElementById('tc-results');
    if (!container) return;

    container.innerHTML = units.map(u => {
      const isActive = u.key === unit;
      const fmt = Math.abs(u.v) >= 1e12 ? u.v.toExponential(3)
               : Math.abs(u.v) >= 0.001 ? parseFloat(u.v.toPrecision(8)).toString()
               : u.v.toExponential(3);
      return `
        <div class="uc-res-box ${isActive ? 'uc-active-purple' : ''}">
          <div class="res-label">${u.label}</div>
          <div class="res-value mono">${fmt}</div>
          <div class="res-hint">${u.key.toUpperCase()}</div>
        </div>
      `;
    }).join('');
  },

  calcHMS() {
    const h = parseInt(document.getElementById('tc-hh')?.value) || 0;
    const m = parseInt(document.getElementById('tc-mm')?.value) || 0;
    const s = parseInt(document.getElementById('tc-ss')?.value) || 0;
    const total = h * 3600 + m * 60 + s;
    const el = document.getElementById('tc-hms-result');
    if (!el) return;
    el.innerHTML = `
      <div class="bw-label">Total Seconds</div>
      <div class="bw-value">${total.toLocaleString()} sec</div>
      <div class="bw-sub">${(total / 60).toFixed(4)} min · ${(total / 3600).toFixed(6)} hrs · ${(total / 86400).toFixed(8)} days</div>
    `;
  }
};
