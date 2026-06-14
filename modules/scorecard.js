/* ============================================================
   CalcHubApp — modules/scorecard.js  v4.0
   Student Score Card + Gap Analysis
   Storage: auto-save on EVERY change, restore on EVERY open
   ============================================================ */

/* ── Storage helpers — no imports needed, direct localStorage ── */
const SSC_KEY     = 'calchub_ssc_v4';      // current session data
const PHOTO_KEY   = 'calchub_ssc_photo';   // student photo
const HISTORY_KEY = 'calchub_ssc_history'; // weekly test history array

function sscWrite(data) {
  try {
    localStorage.setItem(SSC_KEY, JSON.stringify(data));
    return true;
  } catch(e) {
    console.warn('[SSC] Write failed:', e.name, e.message);
    return false;
  }
}

function sscRead() {
  try {
    const raw = localStorage.getItem(SSC_KEY);
    if (raw) return JSON.parse(raw);
    /* migrate from old keys */
    const legacy = localStorage.getItem('ch__ssc_data')
                || localStorage.getItem('ssc_saved')
                || localStorage.getItem('ch_ssc_data');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      sscWrite(parsed); // migrate to new key
      return parsed;
    }
    return null;
  } catch(e) {
    console.warn('[SSC] Read failed:', e.name);
    return null;
  }
}

function photoWrite(dataUrl) {
  try { localStorage.setItem(PHOTO_KEY, dataUrl); return true; }
  catch(e) { console.warn('[SSC] Photo write failed:', e.name); return false; }
}

function photoRead() {
  try {
    return localStorage.getItem(PHOTO_KEY)
        || localStorage.getItem('ch__ssc_photo')
        || localStorage.getItem('ch_ssc_photo')
        || null;
  } catch { return null; }
}

export const scorecardModule = {
  id:    'scorecard',
  label: 'Score Card',
  icon:  '🎓',
  desc:  'Student Score Card',
  accent: '#38bdf8',
  accentRgb: '56,189,248',

  /* ── Runtime state ── */
  studentPhoto:   null,
  _saveTimer:     null,

  SSC_DEFAULT: [
    { name:'Mathematics', obt:78, max:90,  rank:208 },
    { name:'Physics',     obt:45, max:60,  rank:442 },
    { name:'Chemistry',   obt:54, max:60,  rank:110 },
  ],
  SSC_COLORS: ['#38bdf8','#a78bfa','#fb923c','#f472b6','#facc15','#818cf8','#e879f9'],
  sscRows:      [],
  gapSubjects:  [],
  gapTargets:   {},

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  render() {
    return `
    <div class="mod-header">
      <div class="mod-header-top">
        <button class="mod-back-btn" onclick="window.__goHome()" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Home
        </button>
        <span class="mod-badge" style="color:#38bdf8;background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.3)">STUDENT · REPORT</span>
      </div>
      <h2 class="mod-title" style="color:#38bdf8">Student Score Card</h2>
    </div>

    <!-- Sub-tabs -->
    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="subtab-scorecard" onclick="__ssc.switchSub('scorecard')">📋 Score Card</button>
      <button class="sub-tab-btn gap-sub" id="subtab-gap" onclick="__ssc.switchSub('gap')">🎯 Gap Analysis</button>
      <button class="sub-tab-btn" id="subtab-history" onclick="__ssc.switchSub('history')" style="color:#f59e0b;border:none;">📅 Overall Analysis</button>
    </div>

    <!-- ══ SCORE CARD ══ -->
    <div id="subpanel-scorecard">
      <p style="font-size:12px;color:var(--muted,#6b6656);margin-bottom:1.1rem;">
        Data saves automatically as you type — no Save button needed.
      </p>

      <!-- Student header -->
      <div class="student-header">
        <!-- Photo upload -->
        <div class="student-pic-wrap" id="ssc-pic-wrap" onclick="document.getElementById('ssc-pic-input').click()" title="Tap to add student photo">
          <div class="student-pic-inner" id="ssc-pic-inner">
            <span class="student-pic-icon">🎓</span>
            <span class="student-pic-hint">Add<br>Photo</span>
          </div>
          <div class="student-pic-ring"></div>
          <div class="student-pic-badge">📷</div>
        </div>
        <input type="file" id="ssc-pic-input" accept="image/*" style="display:none">

        <!-- Info fields -->
        <div class="student-fields">
          <div class="student-field">
            <label>Student Name</label>
            <input type="text" id="ssc-name" placeholder="e.g. Rahul Sharma" oninput="__ssc.onFieldChange()">
          </div>
          <div class="student-field">
            <label>Class / Standard</label>
            <input type="text" id="ssc-class" placeholder="e.g. Class 10 - A" oninput="__ssc.onFieldChange()">
          </div>
          <div class="student-field">
            <label>Exam / Term</label>
            <input type="text" id="ssc-exam" placeholder="e.g. Final Exam 2025" oninput="__ssc.onFieldChange()">
          </div>
          <div class="student-field">
            <label>Roll Number</label>
            <input type="text" id="ssc-roll" placeholder="e.g. 101" oninput="__ssc.onFieldChange()">
          </div>
          <div class="student-field">
            <label>School / Institute</label>
            <input type="text" id="ssc-school" placeholder="e.g. DPS Bengaluru" oninput="__ssc.onFieldChange()">
          </div>
          <div class="student-field">
            <label>Academic Year</label>
            <input type="text" id="ssc-year" placeholder="e.g. 2024–2025" oninput="__ssc.onFieldChange()">
          </div>
        </div>
      </div>

      <!-- Subject table -->
      <div class="tool-card">
        <div class="tool-card-title ssc">Subject Marks — MM · MR · M%</div>

        <div class="ssc-legend">
          <span class="ssc-leg-item" style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.25);color:#38bdf8;">MM = Marks obtained</span>
          <span class="ssc-leg-item" style="background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.2);color:#94a3b8;">MR = Rank in subject</span>
          <span class="ssc-leg-item" style="background:rgba(250,204,21,0.08);border:1px solid rgba(250,204,21,0.2);color:#fcd34d;">M% = Subject percentage</span>
          <span class="ssc-leg-item" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);color:#34d399;">TM = Total · TR = Total rank · T% = Overall %</span>
        </div>

        <!-- Student name banner -->
        <div id="ssc-name-banner" style="background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.2);border-radius:6px;padding:8px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div id="ssc-report-pic" style="width:36px;height:36px;border-radius:50%;background:rgba(56,189,248,.15);border:2px solid rgba(56,189,248,.4);display:flex;align-items:center;justify-content:center;font-size:16px;overflow:hidden;flex-shrink:0;">🎓</div>
            <div>
              <span style="font-size:10px;color:var(--text-muted,#6b6656);letter-spacing:0.1em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Student</span>
              <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:#38bdf8;" id="ssc-banner-name">—</div>
            </div>
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <div><div style="font-size:10px;color:var(--text-muted,#6b6656);text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Class</div><div style="font-size:12px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;" id="ssc-banner-class">—</div></div>
            <div><div style="font-size:10px;color:var(--text-muted,#6b6656);text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Roll</div><div style="font-size:12px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;" id="ssc-banner-roll">—</div></div>
            <div><div style="font-size:10px;color:var(--text-muted,#6b6656);text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Exam</div><div style="font-size:12px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;" id="ssc-banner-exam">—</div></div>
            <div><div style="font-size:10px;color:var(--text-muted,#6b6656);text-transform:uppercase;font-family:'JetBrains Mono',monospace;">School</div><div style="font-size:12px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;" id="ssc-banner-school">—</div></div>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="score-table" id="ssc-table">
            <thead>
              <tr>
                <th rowspan="2" style="vertical-align:middle;min-width:110px;text-align:left;padding-left:8px;">Subject</th>
                <th colspan="3" style="background:rgba(56,189,248,0.08);border-bottom:2px solid rgba(56,189,248,0.3);color:#38bdf8;">Marks (MM)</th>
                <th rowspan="2" style="vertical-align:middle;min-width:68px;color:#94a3b8;">Rank (MR)</th>
                <th rowspan="2" style="vertical-align:middle;min-width:72px;color:#fcd34d;">% (M%)</th>
                <th rowspan="2" style="vertical-align:middle;min-width:34px;"></th>
              </tr>
              <tr>
                <th style="background:rgba(56,189,248,0.05);color:var(--text-muted,#6b6656);min-width:68px;">Obtained</th>
                <th style="background:rgba(56,189,248,0.05);color:var(--text-muted,#6b6656);min-width:68px;">Max</th>
                <th style="background:rgba(56,189,248,0.05);color:#38bdf8;min-width:80px;">Score</th>
              </tr>
            </thead>
            <tbody id="ssc-tbody"></tbody>
            <tfoot>
              <tr style="background:rgba(56,189,248,0.05);">
                <td style="text-align:left;padding-left:8px;color:#38bdf8;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;">TOTAL</td>
                <td class="total-col" id="ssc-tot-obt">—</td>
                <td class="total-col" id="ssc-tot-max">—</td>
                <td class="total-col" id="ssc-tot-score">—</td>
                <td>
                  <input type="number" id="ssc-tot-rank" placeholder="TR" oninput="__ssc.onFieldChange()"
                    style="width:58px;background:var(--bg,#080807);border:1px solid rgba(148,163,184,0.25);border-radius:4px;color:#94a3b8;font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;" title="Total Rank (TR)">
                </td>
                <td class="pct-col" id="ssc-tot-pct" style="font-weight:700;font-size:14px;">—</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Actions -->
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button onclick="__ssc.addRow()" style="background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;">+ Add Subject</button>
          <button onclick="__ssc.resetAll()" style="background:rgba(255,255,255,0.04);border:1px solid var(--border,#2a2820);color:var(--text-muted,#6b6656);border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;">↺ Reset</button>
          <!-- Weekly test date + save -->
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <input type="date" id="ssc-test-date"
              style="background:var(--bg,#080807);border:1px solid rgba(245,158,11,.35);border-radius:6px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:5px 9px;outline:none;color-scheme:dark;cursor:pointer;">
            <button onclick="__ssc.saveTestRecord()" style="background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.4);color:#f59e0b;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;">💾 Save Test</button>
          </div>
          <div id="ssc-autosave-msg" style="font-size:11px;color:#34d399;font-family:'JetBrains Mono',monospace;display:none;margin-left:4px;">✓ Saved</div>
          <div id="ssc-grade-pill" style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;padding:5px 16px;border-radius:20px;border:1px solid var(--border,#2a2820);color:var(--text-muted,#6b6656);">Grade —</div>
        </div>
      </div>

      <!-- Result summary strip -->
      <div class="ssc-result-strip">
        <div class="ssc-strip-box"><div class="ssc-strip-label">Total Marks (TM)</div><div class="ssc-strip-value" id="ssc-sum-tm">—</div></div>
        <div class="ssc-strip-box"><div class="ssc-strip-label">Max Possible</div><div class="ssc-strip-value" id="ssc-sum-max">—</div></div>
        <div class="ssc-strip-box"><div class="ssc-strip-label">Total Rank (TR)</div><div class="ssc-strip-value" id="ssc-sum-tr">—</div></div>
        <div class="ssc-strip-box hi"><div class="ssc-strip-label">Overall % (T%)</div><div class="ssc-strip-value" id="ssc-sum-pct">—</div></div>
      </div>

      <!-- Performance overview -->
      <div class="tool-card" style="margin-top:0;">
        <div class="tool-card-title ssc">Performance Overview</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted,#6b6656);margin-bottom:6px;">
          Student: <span id="ssc-disp-name" style="color:#38bdf8;font-weight:600;">—</span>
          &nbsp;·&nbsp; Class: <span id="ssc-disp-class" style="color:var(--text,#e8e4d8);">—</span>
          &nbsp;·&nbsp; Exam: <span id="ssc-disp-exam" style="color:var(--text,#e8e4d8);">—</span>
        </div>
        <div class="ssc-progress-wrap">
          <div class="ssc-progress-fill" id="ssc-prog-bar" style="width:0%;background:#38bdf8;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;margin-bottom:10px;">
          <span>0%</span><span id="ssc-prog-label" style="color:#38bdf8;">0%</span><span>100%</span>
        </div>
        <div class="ssc-grade-card" id="ssc-grade-card" style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);">
          <div class="ssc-grade-left">
            <div class="ssc-grade-label">Grade</div>
            <div class="ssc-grade-value" id="ssc-grade-val" style="color:#38bdf8;">—</div>
            <div class="ssc-grade-desc" id="ssc-grade-desc" style="color:var(--text-muted,#6b6656);">Enter marks above</div>
          </div>
          <div class="ssc-grade-right">
            <div class="ssc-grade-pct" id="ssc-grade-pct" style="color:#38bdf8;">—%</div>
            <div class="ssc-grade-sub" id="ssc-grade-sub">—</div>
          </div>
        </div>
        <div id="ssc-mini-bars" style="margin-top:12px;display:flex;flex-direction:column;gap:6px;"></div>
      </div>
    </div><!-- /subpanel-scorecard -->

    <!-- ══ GAP ANALYSIS ══ -->
    <div id="subpanel-gap" style="display:none;">
      <p style="font-size:12px;color:var(--text-muted,#6b6656);margin-bottom:1.25rem;">Auto-synced from Score Card.</p>
      <div style="background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.2);border-radius:6px;padding:8px 14px;margin-bottom:1rem;font-size:11px;color:#fda4af;font-family:'JetBrains Mono',monospace;">
        ⚡ Data is automatically pulled from your Score Card subjects.
        <button onclick="__ssc.syncGap();__ssc.calcGap();" style="margin-left:10px;background:rgba(251,113,133,0.15);border:1px solid rgba(251,113,133,0.3);color:#fb7185;border-radius:4px;padding:3px 10px;font-size:11px;cursor:pointer;font-family:'JetBrains Mono',monospace;">↺ Sync Now</button>
      </div>
      <div class="gap-summary">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#fb7185;margin-bottom:10px;">📊 Overall Summary</div>
        <div class="gap-bar-wrap" style="height:14px;margin-bottom:6px;"><div class="gap-bar-fill" id="gap-summary-bar" style="width:0%;"></div></div>
        <div class="gap-summary-grid">
          <div class="gap-sum-box"><div class="gap-sum-label">Total Obtained (TM)</div><div class="gap-sum-value" id="gap-tot-obt">—</div></div>
          <div class="gap-sum-box"><div class="gap-sum-label">Total Max Marks</div><div class="gap-sum-value" id="gap-tot-max">—</div></div>
          <div class="gap-sum-box"><div class="gap-sum-label">Total % (T%)</div><div class="gap-sum-value" id="gap-tot-pct">—</div></div>
          <div class="gap-sum-box hl"><div class="gap-sum-label">⚠ Total Shortfall</div><div class="gap-sum-value" id="gap-tot-short">—</div></div>
        </div>
      </div>
      <div id="gap-cards"></div>
      <div style="background:var(--surface,#14130f);border:1px solid var(--border,#2a2820);border-radius:8px;padding:0.9rem 1.1rem;font-size:11px;color:var(--text-muted,#6b6656);line-height:2;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#fb7185;display:block;margin-bottom:6px;">Legend</span>
        <span style="color:#34d399;">■</span> ≥ 90% Outstanding &nbsp;
        <span style="color:#60a5fa;">■</span> ≥ 75% Good &nbsp;
        <span style="color:#fbbf24;">■</span> ≥ 60% Average &nbsp;
        <span style="color:#f87171;">■</span> &lt; 60% Needs Attention
      </div>
    </div>

    <!-- ══ OVERALL ANALYSIS ══ -->
    <div id="subpanel-history" style="display:none;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:1rem;">
        <p style="font-size:12px;color:var(--text-muted,#6b6656);margin:0;">All saved weekly tests — tap any card to view full breakdown.</p>
        <button onclick="__ssc.clearHistory()" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:#f87171;border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;font-family:'JetBrains Mono',monospace;">🗑 Clear All</button>
      </div>
      <div id="ssc-history-list"></div>

      <!-- Drill-down modal overlay -->
      <div id="ssc-drill-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;backdrop-filter:blur(4px);overflow-y:auto;-webkit-overflow-scrolling:touch;" onclick="__ssc.closeDrill(event)">
        <div id="ssc-drill-card" style="background:#14130f;border:1px solid #2a2820;border-radius:16px;max-width:420px;margin:40px auto;padding:0;overflow:hidden;" onclick="event.stopPropagation()">
          <div id="ssc-drill-inner"></div>
        </div>
      </div>
    </div>
    `;
  },

  /* ═══════════════════════════════════════
     INIT — runs every time module opens
     ═══════════════════════════════════════ */
  init() {
    window.__ssc = this;
    this.gapSubjects = [];
    this.gapTargets  = {};

    // Load saved data FIRST before rendering
    const saved = sscRead();

    if (saved && saved.rows && saved.rows.length > 0) {
      this.sscRows = saved.rows;
    } else {
      this.sscRows = JSON.parse(JSON.stringify(this.SSC_DEFAULT));
    }

    // Render rows ONCE
    this.renderRows();

    // Fill info fields from saved data
    if (saved && saved.info) {
      const el = id => document.getElementById(id);
      if (el('ssc-name'))   el('ssc-name').value   = saved.info.name   || '';
      if (el('ssc-class'))  el('ssc-class').value  = saved.info.cls    || '';
      if (el('ssc-exam'))   el('ssc-exam').value   = saved.info.exam   || '';
      if (el('ssc-roll'))   el('ssc-roll').value   = saved.info.roll   || '';
      if (el('ssc-school')) el('ssc-school').value = saved.info.school || '';
      if (el('ssc-year'))   el('ssc-year').value   = saved.info.year   || '';
      if (el('ssc-tot-rank') && saved.totalRank)
        el('ssc-tot-rank').value = saved.totalRank;
      console.log('[SSC] Student info restored:', saved.info.name || '(unnamed)');
    }

    this.updateTotals();

    // Restore photo
    const photo = photoRead();
    if (photo) {
      this.studentPhoto = photo;
      this._renderPic(photo);
      console.log('[SSC] Photo restored ✓');
    } else {
      this.studentPhoto = null;
    }

    // Set today as default test date
    const dateEl = document.getElementById('ssc-test-date');
    if (dateEl && !dateEl.value) {
      const now = new Date();
      dateEl.value = now.toISOString().slice(0,10);
    }

    // Wire photo input
    const picInput = document.getElementById('ssc-pic-input');
    if (picInput) {
      picInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const MAX = 400, scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          this.studentPhoto = dataUrl;
          photoWrite(dataUrl);   // ← write immediately
          this._renderPic(dataUrl);
          console.log('[SSC] Photo saved ✓');
        };
        img.src = url;
      });
    }
  },

  cleanup() {
    if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
    // Flush any pending save immediately on leaving
    this._commitSave();
    delete window.__ssc;
  },

  /* ═══════════════════════════════════════
     SAVE — called on every field change
     ═══════════════════════════════════════ */
  onFieldChange() {
    this.updateTotals();
    // Immediate save — no debounce, no delay
    this._commitSave();
  },

  _commitSave() {
    const el = id => document.getElementById(id);
    const data = {
      info: {
        name:   el('ssc-name')?.value   || '',
        cls:    el('ssc-class')?.value  || '',
        exam:   el('ssc-exam')?.value   || '',
        roll:   el('ssc-roll')?.value   || '',
        school: el('ssc-school')?.value || '',
        year:   el('ssc-year')?.value   || '',
      },
      rows:      JSON.parse(JSON.stringify(this.sscRows)),
      totalRank: el('ssc-tot-rank')?.value || '',
      savedAt:   new Date().toISOString(),
    };
    const ok = sscWrite(data);
    // Flash save indicator
    if (ok) {
      const msg = document.getElementById('ssc-autosave-msg');
      if (msg) {
        msg.style.display = 'inline';
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => { msg.style.display = 'none'; }, 1500);
      }
    }
    return ok;
  },

  /* ═══════════════════════════════════════
     RENDER ROWS
     ═══════════════════════════════════════ */
  renderRows() {
    const tbody = document.getElementById('ssc-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    this.sscRows.forEach((s, i) => {
      const clr    = this.SSC_COLORS[i % this.SSC_COLORS.length];
      const pctVal = s.max ? (s.obt / s.max) * 100 : 0;
      const pctClr = s.max ? this._barColor(pctVal) : 'var(--text-muted,#6b6656)';
      const pctTxt = s.max ? pctVal.toFixed(2) + '%' : '—';
      const tr = document.createElement('tr');
      tr.dataset.idx = i;
      tr.innerHTML = `
        <td style="text-align:left;padding:6px 8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${clr};flex-shrink:0;display:inline-block;"></span>
            <input type="text" value="${s.name}" placeholder="Subject"
              data-field="name" data-idx="${i}"
              style="background:transparent;border:none;color:${clr};font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;width:110px;outline:none;">
          </div>
        </td>
        <td><input type="number" value="${s.obt}" placeholder="0" data-field="obt" data-idx="${i}"
          style="width:64px;background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:4px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;"></td>
        <td><input type="number" value="${s.max}" placeholder="100" data-field="max" data-idx="${i}"
          style="width:64px;background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:4px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;"></td>
        <td class="ssc-score-cell" style="font-size:12px;color:#38bdf8;font-family:'JetBrains Mono',monospace;">${s.obt} / ${s.max}</td>
        <td><input type="number" value="${s.rank||''}" placeholder="—" data-field="rank" data-idx="${i}"
          style="width:58px;background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:4px;color:#94a3b8;font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;"></td>
        <td class="ssc-pct-cell" style="font-weight:700;font-size:13px;color:${pctClr};font-family:'JetBrains Mono',monospace;">${pctTxt}</td>
        <td style="text-align:center;">
          ${this.sscRows.length > 1
            ? `<button onclick="__ssc.delRow(${i})" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:13px;padding:2px 5px;">✕</button>`
            : ''}
        </td>`;
      tbody.appendChild(tr);
    });

    // Single delegated listener for all row inputs
    tbody.oninput = e => {
      const inp = e.target, idx = parseInt(inp.dataset.idx), field = inp.dataset.field;
      if (isNaN(idx) || !field) return;
      if      (field === 'name') this.sscRows[idx].name = inp.value;
      else if (field === 'obt')  this.sscRows[idx].obt  = parseFloat(inp.value) || 0;
      else if (field === 'max')  this.sscRows[idx].max  = parseFloat(inp.value) || 0;
      else if (field === 'rank') this.sscRows[idx].rank = parseFloat(inp.value) || 0;
      this._updateRow(idx);
      this.updateTotals();
      this._commitSave(); // ← save immediately on every mark change
    };
  },

  _updateRow(i) {
    const s = this.sscRows[i];
    const pctVal = s.max ? (s.obt / s.max) * 100 : 0;
    const pctClr = s.max ? this._barColor(pctVal) : 'var(--text-muted,#6b6656)';
    const pctTxt = s.max ? pctVal.toFixed(2) + '%' : '—';
    const tbody = document.getElementById('ssc-tbody');
    if (!tbody) return;
    const row = tbody.querySelector(`tr[data-idx="${i}"]`);
    if (!row) return;
    row.querySelector('.ssc-score-cell').textContent = `${s.obt} / ${s.max}`;
    const pc = row.querySelector('.ssc-pct-cell');
    if (pc) { pc.textContent = pctTxt; pc.style.color = pctClr; }
  },

  /* ═══════════════════════════════════════
     TOTALS + DISPLAY UPDATE
     ═══════════════════════════════════════ */
  updateTotals() {
    let totObt = 0, totMax = 0;
    this.sscRows.forEach(s => { totObt += (s.obt || 0); totMax += (s.max || 0); });
    const tPct = totMax ? (totObt / totMax) * 100 : 0;
    const g    = this._grade(tPct);
    const tr   = document.getElementById('ssc-tot-rank')?.value || '—';
    const el   = id => document.getElementById(id);
    const set  = (id, v, clr) => { const e=el(id); if(e){e.textContent=v; if(clr)e.style.color=clr;} };

    set('ssc-tot-obt', totObt);
    set('ssc-tot-max', totMax);
    set('ssc-tot-score', totMax ? `${totObt} / ${totMax}` : '—');
    set('ssc-tot-pct',   totMax ? tPct.toFixed(2)+'%' : '—', g.c);
    set('ssc-sum-tm',    totObt);
    set('ssc-sum-max',   totMax);
    set('ssc-sum-tr',    tr);
    set('ssc-sum-pct',   totMax ? tPct.toFixed(2)+'%' : '—', g.c);

    const pb = el('ssc-prog-bar');
    if (pb) { pb.style.width=(totMax?Math.min(100,tPct):0).toFixed(1)+'%'; pb.style.background=g.c; }
    set('ssc-prog-label', totMax ? tPct.toFixed(2)+'%' : '0%', g.c);

    const gc = el('ssc-grade-card');
    if (gc) { gc.style.background=g.bg; gc.style.border=`1px solid ${g.border}`; }
    set('ssc-grade-val',  g.g,    g.c);
    set('ssc-grade-desc', g.desc, g.c);
    set('ssc-grade-pct',  totMax ? tPct.toFixed(2)+'%' : '—%', g.c);
    set('ssc-grade-sub',  totMax ? `${totObt} out of ${totMax} marks` : '—');

    const gp = el('ssc-grade-pill');
    if (gp) { gp.textContent=`Grade: ${g.g} — ${g.desc}`; gp.style.background=g.bg; gp.style.border=`1px solid ${g.border}`; gp.style.color=g.c; }

    // Student info display
    const nameVal=el('ssc-name')?.value||'—', clsVal=el('ssc-class')?.value||'—',
          examVal=el('ssc-exam')?.value||'—', rollVal=el('ssc-roll')?.value||'—',
          schVal =el('ssc-school')?.value||'—';
    set('ssc-disp-name',    nameVal, '#38bdf8');
    set('ssc-disp-class',   clsVal);
    set('ssc-disp-exam',    examVal);
    set('ssc-banner-name',  nameVal);
    set('ssc-banner-class', clsVal);
    set('ssc-banner-roll',  rollVal);
    set('ssc-banner-exam',  examVal);
    set('ssc-banner-school',schVal);

    // Mini bars
    const mb = el('ssc-mini-bars');
    if (mb) {
      mb.innerHTML = this.sscRows.map((s,i) => {
        const sp=s.max?(s.obt/s.max)*100:0, clr=this.SSC_COLORS[i%this.SSC_COLORS.length], bc=this._barColor(sp);
        return `<div style="display:flex;align-items:center;gap:8px;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${clr};min-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</span>
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:99px;height:7px;overflow:hidden;">
            <div style="width:${sp.toFixed(1)}%;height:100%;background:${bc};border-radius:99px;transition:width 0.3s;"></div>
          </div>
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${bc};min-width:46px;text-align:right;">${s.max?sp.toFixed(1)+'%':'—'}</span>
          <span style="font-size:10px;color:var(--text-muted,#6b6656);min-width:48px;font-family:'JetBrains Mono',monospace;">${s.obt}/${s.max}</span>
        </div>`;
      }).join('');
    }
  },

  /* ═══════════════════════════════════════
     ROW ACTIONS
     ═══════════════════════════════════════ */
  switchSub(sub) {
    ['scorecard','gap','history'].forEach(s => {
      const btn = document.getElementById('subtab-'+s);
      if (btn) btn.classList.toggle('active', s===sub);
      const p = document.getElementById('subpanel-'+s);
      if (p) p.style.display = s===sub ? 'block' : 'none';
    });
    if (sub==='gap')     { this.syncGap(); this.calcGap(); }
    if (sub==='history') { this.renderHistory(); }
  },

  addRow() {
    this.sscRows.push({ name:'New Subject', obt:0, max:100, rank:0 });
    this.renderRows();
    this.updateTotals();
    this._commitSave();
  },

  delRow(i) {
    this.sscRows.splice(i,1);
    this.renderRows();
    this.updateTotals();
    this._commitSave();
  },

  resetAll() {
    if (!confirm('Reset all student data? This clears saved data too.')) return;
    this.sscRows = JSON.parse(JSON.stringify(this.SSC_DEFAULT));
    this.studentPhoto = null;
    const el = id => document.getElementById(id);
    ['ssc-name','ssc-class','ssc-exam','ssc-roll','ssc-school','ssc-year'].forEach(id => {
      const e=el(id); if(e) e.value='';
    });
    const tr=el('ssc-tot-rank'); if(tr) tr.value='';
    const inner=el('ssc-pic-inner');
    if (inner) { inner.innerHTML='<span class="student-pic-icon">🎓</span><span class="student-pic-hint">Add<br>Photo</span>'; inner.style.padding=''; }
    const rp=el('ssc-report-pic'); if(rp) rp.innerHTML='🎓';
    // Clear storage
    try { localStorage.removeItem(SSC_KEY); localStorage.removeItem(PHOTO_KEY); } catch {}
    this.renderRows();
    this.updateTotals();
  },

  /* ═══════════════════════════════════════
     PHOTO
     ═══════════════════════════════════════ */
  _renderPic(src) {
    const inner = document.getElementById('ssc-pic-inner');
    if (inner) { inner.innerHTML=`<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`; inner.style.padding='0'; }
    const rp = document.getElementById('ssc-report-pic');
    if (rp)    { rp.innerHTML=`<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`; }
  },

  /* ═══════════════════════════════════════
     GAP ANALYSIS
     ═══════════════════════════════════════ */
  syncGap() {
    const colors=['#60a5fa','#a78bfa','#fb923c','#f472b6','#facc15','#818cf8','#e879f9'];
    const clsMap =['math','physics','chem','custom','custom','custom','custom'];
    this.gapSubjects = this.sscRows.map((s,i) => ({
      key:'ssc_'+i, label:s.name, short:['MM','PM','CM','NM','NM','NM','NM'][i]||'NM',
      color:colors[i%colors.length], cls:clsMap[i%clsMap.length], obt:s.obt, max:s.max,
    }));
    const nk=new Set(this.gapSubjects.map(s=>s.key));
    Object.keys(this.gapTargets).forEach(k=>{ if(!nk.has(k)) delete this.gapTargets[k]; });
  },

  calcGap() {
    if (!this.gapSubjects.length) this.syncGap();
    const wrap=document.getElementById('gap-cards');
    if (!wrap) return;
    wrap.innerHTML='';
    let totObt=0, totMax=0;
    this.gapSubjects.forEach(s => {
      const obt=s.obt||0, max=s.max||0, gap=Math.max(0,max-obt), pct=max?(obt/max)*100:0;
      const tgt=this.gapTargets[s.key]||100, need=max?Math.max(0,Math.ceil((tgt/100)*max)-obt):0;
      totObt+=obt; totMax+=max;
      const barW=max?Math.min(100,(obt/max)*100).toFixed(1):0, tgtW=Math.min(100,tgt);
      const barClr=this._gapBarColor(pct);
      const targets=[60,70,75,80,90,95,100];
      wrap.innerHTML+=`
      <div class="gap-subject-card ${s.cls}" style="margin-bottom:10px;">
        <div class="gap-header">
          <div><div class="gap-subj-name">${s.label} <span style="color:var(--text-muted,#6b6656);font-size:11px;">(${s.short})</span></div></div>
          <div class="gap-chips">
            <span class="gap-chip obtained">Obtained: ${obt}</span>
            <span class="gap-chip maximum">Max: ${max}</span>
            <span class="gap-chip pct-done">${pct.toFixed(2)}%</span>
            <span class="gap-chip shortfall">⚠ ${gap} marks short</span>
          </div>
        </div>
        <div class="gap-bar-wrap">
          <div class="gap-bar-fill" style="width:${barW}%;background:${barClr};"></div>
          <div class="gap-bar-target" style="left:${tgtW}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;margin-bottom:8px;">
          <span>0</span><span style="color:${barClr};font-weight:600;">${obt} scored</span><span>${max}</span>
        </div>
        <div class="gap-target-row">
          <span style="font-size:11px;color:var(--text-muted,#6b6656);">Target %:</span>
          <div class="gap-target-chips">
            ${targets.map(t=>`<span class="gap-target-chip ${this.gapTargets[s.key]===t||(!(s.key in this.gapTargets)&&t===100)?'active-t':''}" onclick="__ssc.setTarget('${s.key}',${t})">${t}%</span>`).join('')}
          </div>
          <div class="gap-need-label">
            ${need>0?`<span style="color:#fb7185;">Need <strong>${need}</strong> more for ${tgt}%</span>`:`<span style="color:#34d399;">✓ At ${tgt}% target!</span>`}
          </div>
        </div>
      </div>`;
    });
    const totPct=totMax?(totObt/totMax)*100:0;
    const el=id=>document.getElementById(id);
    const set=(id,v)=>{const e=el(id);if(e)e.textContent=v;};
    set('gap-tot-obt',totObt); set('gap-tot-max',totMax);
    set('gap-tot-pct',totMax?totPct.toFixed(2)+'%':'—');
    set('gap-tot-short',Math.max(0,totMax-totObt)+' marks');
    const sb=el('gap-summary-bar');
    if(sb){sb.style.width=(totMax?Math.min(100,totPct):0).toFixed(1)+'%';sb.style.background=this._gapBarColor(totPct);}
  },

  setTarget(key,val){ this.gapTargets[key]=val; this.calcGap(); },

  /* ═══════════════════════════════════════
     WEEKLY TEST HISTORY
     ═══════════════════════════════════════ */

  _readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  _writeHistory(records) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(records)); return true; }
    catch(e) { console.warn('[SSC] History write failed:', e.name); return false; }
  },

  saveTestRecord() {
    const el    = id => document.getElementById(id);
    const dateEl = el('ssc-test-date');
    const testDate = dateEl?.value || new Date().toISOString().slice(0,10);

    // Build snapshot of current marks
    let totObt = 0, totMax = 0;
    const subjects = this.sscRows.map(s => {
      totObt += (s.obt||0); totMax += (s.max||0);
      return { name:s.name, obt:s.obt||0, max:s.max||0, rank:s.rank||0 };
    });
    const pct = totMax ? ((totObt/totMax)*100) : 0;

    const record = {
      id:       Date.now(),
      date:     testDate,
      label:    el('ssc-exam')?.value || 'Weekly Test',
      student:  el('ssc-name')?.value || 'Student',
      cls:      el('ssc-class')?.value || '',
      school:   el('ssc-school')?.value || '',
      examRank: el('ssc-tot-rank')?.value || '',
      subjects,
      totObt,
      totMax,
      pct:      parseFloat(pct.toFixed(2)),
      grade:    this._grade(pct).g,
    };

    const history = this._readHistory();
    // Check if same date already exists — ask to overwrite
    const existIdx = history.findIndex(r => r.date === testDate);
    if (existIdx >= 0) {
      if (!confirm(`A test record for ${this._fmtDate(testDate)} already exists. Overwrite?`)) return;
      history[existIdx] = record;
    } else {
      history.unshift(record); // newest first
    }
    this._writeHistory(history);

    // Flash confirmation
    const msg = el('ssc-autosave-msg');
    if (msg) {
      msg.textContent = `✓ Test saved — ${this._fmtDate(testDate)}`;
      msg.style.display = 'inline';
      setTimeout(() => { msg.style.display='none'; msg.textContent='✓ Saved'; }, 3000);
    }
    console.log('[SSC] Test record saved for', testDate);
  },

  clearHistory() {
    if (!confirm('Delete ALL weekly test records? This cannot be undone.')) return;
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    this.renderHistory();
  },

  _fmtDate(iso) {
    try {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
    } catch { return iso; }
  },

  renderHistory() {
    const list = document.getElementById('ssc-history-list');
    if (!list) return;
    const records = this._readHistory();

    if (!records.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;">
          <div style="font-size:2rem;margin-bottom:12px;">📅</div>
          <div style="font-size:13px;margin-bottom:6px;">No test records yet</div>
          <div style="font-size:11px;">Fill in marks, pick a date, then tap <span style="color:#f59e0b;">💾 Save Test</span></div>
        </div>`;
      return;
    }

    list.innerHTML = records.map((r,i) => {
      const g = this._grade(r.pct);
      const shortfall = Math.max(0, r.totMax - r.totObt);
      const barW = r.totMax ? Math.min(100, r.pct).toFixed(1) : 0;
      return `
      <div class="ssc-hist-card" onclick="__ssc.openDrill(${r.id})" style="border-left:3px solid ${g.c};">
        <div class="ssc-hist-header">
          <div>
            <div class="ssc-hist-date">${this._fmtDate(r.date)}</div>
            <div class="ssc-hist-label">${r.label}${r.student ? ' · ' + r.student : ''}</div>
          </div>
          <div class="ssc-hist-grade" style="color:${g.c};background:${g.bg};border:1px solid ${g.border};">${r.grade}</div>
        </div>
        <!-- progress bar -->
        <div style="background:rgba(255,255,255,.05);border-radius:99px;height:6px;overflow:hidden;margin:8px 0 10px;">
          <div style="width:${barW}%;height:100%;background:${g.c};border-radius:99px;transition:width .4s;"></div>
        </div>
        <!-- 4-box summary -->
        <div class="ssc-hist-summary">
          <div class="ssc-hist-box"><div class="ssc-hist-box-lbl">Total Obtained (TM)</div><div class="ssc-hist-box-val">${r.totObt}</div></div>
          <div class="ssc-hist-box"><div class="ssc-hist-box-lbl">Total Max Marks</div><div class="ssc-hist-box-val">${r.totMax}</div></div>
          <div class="ssc-hist-box"><div class="ssc-hist-box-lbl">Total % (T%)</div><div class="ssc-hist-box-val" style="color:${g.c};">${r.pct}%</div></div>
          <div class="ssc-hist-box hl-red"><div class="ssc-hist-box-lbl">⚠ Total Shortfall</div><div class="ssc-hist-box-val">${shortfall} marks</div></div>
        </div>
        <div style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;margin-top:8px;text-align:right;">tap to view details →</div>
      </div>`;
    }).join('');
  },

  openDrill(id) {
    const records = this._readHistory();
    const r = records.find(x => x.id === id);
    if (!r) return;
    const g = this._grade(r.pct);
    const circumference = 2 * Math.PI * 44; // radius 44
    const dash = (r.pct / 100) * circumference;
    const shortfall = Math.max(0, r.totMax - r.totObt);

    // Subject rows
    const subjectRows = (r.subjects || []).map(s => {
      const sp = s.max ? ((s.obt/s.max)*100) : 0;
      const sc2 = this._barColor(sp);
      return `
        <div class="ssc-drill-subj-row">
          <div class="ssc-drill-subj-rank">${s.rank ? '<div style='font-size:9px;color:var(--text-muted,#6b6656);letter-spacing:.06em;'>Rank</div><div style='font-size:14px;font-weight:700;color:var(--text,#e8e4d8);'>' + s.rank + '</div>' : '<div style='font-size:11px;color:var(--text-muted,#6b6656);'>—</div>'}</div>
          <div class="ssc-drill-subj-name">${s.name}</div>
          <div class="ssc-drill-subj-score" style="color:${sc2};">${s.obt}/${s.max}</div>
        </div>`;
    }).join('');

    document.getElementById('ssc-drill-inner').innerHTML = `
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(56,189,248,.12) 0%,rgba(56,189,248,.04) 100%);padding:1.25rem 1.25rem 1rem;border-bottom:1px solid #2a2820;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted,#6b6656);letter-spacing:.1em;text-transform:uppercase;">Weekly Test</div>
          <button onclick="__ssc.closeDrill()" style="background:rgba(255,255,255,.06);border:1px solid #2a2820;border-radius:6px;color:var(--text-muted,#6b6656);font-size:12px;padding:3px 10px;cursor:pointer;font-family:'JetBrains Mono',monospace;">✕ Close</button>
        </div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#38bdf8;">${r.label}</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted,#6b6656);margin-top:2px;">${this._fmtDate(r.date)}${r.student?' · '+r.student:''}</div>
      </div>

      <!-- Top stats + donut -->
      <div style="padding:1.1rem 1.25rem;display:flex;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid #2a2820;">
        <!-- Left stats -->
        <div style="flex:1;min-width:140px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <div style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;">Marks Obtained</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:700;color:var(--text,#e8e4d8);">${r.totObt}/${r.totMax}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;">Subjects</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:700;color:var(--text,#e8e4d8);">${(r.subjects||[]).length.toString().padStart(2,'0')}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;">Exam Rank</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:700;color:var(--text,#e8e4d8);">${r.examRank||'—'}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;">Shortfall</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:700;color:#f87171;">${shortfall}</div>
          </div>
        </div>
        <!-- Donut % gauge -->
        <div style="position:relative;width:110px;height:110px;flex-shrink:0;">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10"/>
            <circle cx="55" cy="55" r="44" fill="none" stroke="${g.c}" stroke-width="10"
              stroke-dasharray="${dash.toFixed(1)} ${circumference.toFixed(1)}"
              stroke-linecap="round"
              transform="rotate(-90 55 55)"
              style="transition:stroke-dasharray .6s ease;"/>
            <!-- small dot top -->
            <circle cx="55" cy="11" r="4" fill="#f87171"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:700;color:${g.c};line-height:1;">${r.pct}%</div>
            <div style="font-size:9px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;letter-spacing:.06em;">${g.desc}</div>
          </div>
        </div>
      </div>

      <!-- Subject wise breakdown -->
      <div style="padding:1rem 1.25rem;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#38bdf8;margin-bottom:12px;border-left:3px solid #38bdf8;padding-left:8px;">Subject Wise Marks Scored</div>
        <div style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;margin-bottom:10px;">Scored Marks / Total Marks</div>
        ${subjectRows}
      </div>

      <!-- Delete record -->
      <div style="padding:0 1.25rem 1.25rem;text-align:right;">
        <button onclick="__ssc.deleteDrillRecord(${r.id})" style="background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:#f87171;border-radius:6px;padding:5px 14px;font-size:11px;cursor:pointer;font-family:'JetBrains Mono',monospace;">🗑 Delete this record</button>
      </div>
    `;

    document.getElementById('ssc-drill-overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
  },

  closeDrill(e) {
    if (e && e.target !== document.getElementById('ssc-drill-overlay')) return;
    document.getElementById('ssc-drill-overlay').style.display = 'none';
    document.body.style.overflow = '';
  },

  deleteDrillRecord(id) {
    if (!confirm('Delete this test record?')) return;
    const history = this._readHistory().filter(r => r.id !== id);
    this._writeHistory(history);
    document.getElementById('ssc-drill-overlay').style.display = 'none';
    document.body.style.overflow = '';
    this.renderHistory();
  },

  /* ═══════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════ */
  _barColor(pct) {
    if(pct>=90) return '#34d399';
    if(pct>=75) return '#60a5fa';
    if(pct>=60) return '#fbbf24';
    return '#f87171';
  },
  _gapBarColor(pct) { return this._barColor(pct); },

  _grade(pct) {
    if(pct>=90) return {g:'O', desc:'Outstanding',bg:'rgba(52,211,153,0.1)', border:'rgba(52,211,153,0.35)', c:'#34d399'};
    if(pct>=80) return {g:'A+',desc:'Excellent',  bg:'rgba(96,165,250,0.1)', border:'rgba(96,165,250,0.35)', c:'#60a5fa'};
    if(pct>=70) return {g:'A', desc:'Very Good',  bg:'rgba(167,139,250,0.1)',border:'rgba(167,139,250,0.35)',c:'#a78bfa'};
    if(pct>=60) return {g:'B', desc:'Good',       bg:'rgba(56,189,248,0.1)', border:'rgba(56,189,248,0.35)', c:'#38bdf8'};
    if(pct>=50) return {g:'C', desc:'Average',    bg:'rgba(251,191,36,0.1)', border:'rgba(251,191,36,0.35)', c:'#fbbf24'};
    if(pct>=40) return {g:'D', desc:'Pass',       bg:'rgba(249,115,22,0.1)', border:'rgba(249,115,22,0.35)', c:'#f97316'};
    return               {g:'F', desc:'Fail',       bg:'rgba(248,113,113,0.1)',border:'rgba(248,113,113,0.35)',c:'#f87171'};
  },
};
