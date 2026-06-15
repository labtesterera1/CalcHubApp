/* ============================================================
   CalcHubApp — modules/scorecard.js  v4.0
   Student Score Card + Gap Analysis
   Storage: auto-save on EVERY change, restore on EVERY open
   ============================================================ */

/* ── Storage helpers — no imports needed, direct localStorage ── */
const SSC_KEY     = 'calchub_ssc_v4';      // current session data
const PHOTO_KEY   = 'calchub_ssc_photo';   // student photo
const HISTORY_KEY  = 'calchub_ssc_history';  // weekly test history array
const STUDENTS_KEY = 'calchub_ssc_students'; // other students roster
const PRESETS_KEY  = 'calchub_ssc_presets';  // max mark presets (CALC1, CALC2...)
const WEEKLY_KEY   = 'calchub_ssc_weekly';   // weekly sessions [{date,presetId,students:[{id,marks[]}]}]

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
    <div class="sub-tabs" style="overflow-x:auto;flex-wrap:nowrap;">
      <button class="sub-tab-btn active" id="subtab-scorecard" onclick="__ssc.switchSub('scorecard')">📋 Score Card</button>
      <button class="sub-tab-btn gap-sub" id="subtab-gap" onclick="__ssc.switchSub('gap')">🎯 Gap Analysis</button>
      <button class="sub-tab-btn" id="subtab-history" onclick="__ssc.switchSub('history')" style="color:#f59e0b;border:none;">📅 Analysis</button>
      <button class="sub-tab-btn" id="subtab-students" onclick="__ssc.switchSub('students')" style="color:#34d399;border:none;">👥 Students</button>
      <button class="sub-tab-btn" id="subtab-transfer" onclick="__ssc.switchSub('transfer')" style="color:#c084fc;border:none;">📤 Export/Import</button>
    </div>

    <!-- ══ SCORE CARD ══ -->
    <div id="subpanel-scorecard">
      <p style="font-size:12px;color:var(--muted,#6b6656);margin-bottom:1.1rem;">
        Data saves automatically as you type — no Save button needed.
      </p>

      <!-- Student header -->
      <div class="student-header">
        <!-- Student photo via URL -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">
          <!-- Photo display circle -->
          <div id="ssc-pic-wrap" style="width:72px;height:72px;border-radius:50%;overflow:hidden;border:2px solid rgba(56,189,248,.4);background:rgba(56,189,248,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <div id="ssc-pic-placeholder" style="display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;color:#38bdf8;text-align:center;line-height:1.4;gap:1px;">
              <span style="font-size:20px;">🎓</span>
              <span>PHOTO</span>
            </div>
            <img id="ssc-pic-img" src="" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:none;">
          </div>
          <!-- URL input below circle -->
          <input type="url" id="ssc-pic-url" placeholder="Paste photo URL"
            oninput="__ssc._onPhotoUrl(this.value)"
            style="width:90px;font-size:9px;font-family:'JetBrains Mono',monospace;background:var(--bg,#080807);border:1px solid rgba(56,189,248,.3);border-radius:4px;color:#38bdf8;padding:3px 5px;outline:none;text-align:center;">
        </div>

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

      <!-- Filter bar -->
      <div style="background:var(--surface,#14130f);border:1px solid var(--border,#2a2820);border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#f59e0b;flex-shrink:0;">🔍 Filter</span>

        <!-- Month picker -->
        <select id="hist-filter-month" onchange="__ssc.applyHistoryFilter()"
          style="background:var(--bg,#080807);border:1px solid rgba(245,158,11,.3);border-radius:6px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:6px 10px;outline:none;cursor:pointer;flex:1;min-width:110px;">
          <option value="">All Months</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <!-- Year picker — populated dynamically -->
        <select id="hist-filter-year" onchange="__ssc.applyHistoryFilter()"
          style="background:var(--bg,#080807);border:1px solid rgba(245,158,11,.3);border-radius:6px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:6px 10px;outline:none;cursor:pointer;flex:1;min-width:90px;">
          <option value="">All Years</option>
        </select>

        <!-- Student name filter -->
        <input type="text" id="hist-filter-student" placeholder="Student name…" oninput="__ssc.applyHistoryFilter()"
          style="background:var(--bg,#080807);border:1px solid rgba(245,158,11,.3);border-radius:6px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:6px 10px;outline:none;flex:1;min-width:110px;">

        <!-- Reset filters -->
        <button onclick="__ssc.resetHistoryFilter()"
          style="background:rgba(255,255,255,.04);border:1px solid var(--border,#2a2820);border-radius:6px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;font-size:11px;padding:6px 10px;cursor:pointer;white-space:nowrap;flex-shrink:0;">✕ Clear</button>

        <!-- Record count -->
        <span id="hist-filter-count" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted,#6b6656);flex-shrink:0;white-space:nowrap;"></span>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <p style="font-size:12px;color:var(--text-muted,#6b6656);margin:0;">Tap any card to view full breakdown.</p>
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

    <!-- ══ OTHER STUDENTS ══ -->
    <div id="subpanel-students" style="display:none;">

      <!-- ══ WEEK SELECTOR BAR ══ -->
      <div style="background:var(--surface,#14130f);border:1px solid rgba(52,211,153,.3);border-radius:10px;padding:10px 14px;margin-bottom:12px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#34d399;margin-bottom:8px;">📅 Weekly Session</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <!-- Prev week -->
          <button onclick="__ssc.weekNav(-1)" style="background:rgba(255,255,255,.05);border:1px solid var(--border,#2a2820);border-radius:6px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;font-size:13px;padding:6px 10px;cursor:pointer;" title="Previous week">←</button>
          <!-- Week picker dropdown -->
          <select id="stu-week-select" onchange="__ssc.weekGoto(this.value)"
            style="flex:1;min-width:160px;background:var(--bg,#080807);border:1px solid rgba(52,211,153,.35);border-radius:6px;color:#34d399;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;padding:6px 10px;outline:none;cursor:pointer;">
          </select>
          <!-- Next week -->
          <button onclick="__ssc.weekNav(+1)" style="background:rgba(255,255,255,.05);border:1px solid var(--border,#2a2820);border-radius:6px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;font-size:13px;padding:6px 10px;cursor:pointer;" title="Next week">→</button>
          <!-- Add new week -->
          <input type="date" id="stu-new-week-date" style="background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:6px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:6px 9px;outline:none;color-scheme:dark;cursor:pointer;">
          <button onclick="__ssc.weekAdd()" style="background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.4);color:#34d399;border-radius:6px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:700;white-space:nowrap;">+ New Week</button>
          <button onclick="__ssc.weekDelete()" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);color:#f87171;border-radius:6px;padding:6px 10px;font-size:11px;cursor:pointer;font-family:'JetBrains Mono',monospace;white-space:nowrap;">🗑 Delete Week</button>
        </div>
        <!-- Week info strip -->
        <div style="margin-top:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted,#6b6656);">
          <span>Preset: <span id="stu-week-preset-name" style="color:#f59e0b;">—</span></span>
          <span>Max per subject: <span id="stu-week-max-display" style="color:#f59e0b;">—</span></span>
          <span id="stu-week-count" style="margin-left:auto;color:var(--text-muted,#6b6656);"></span>
        </div>
      </div>

      <!-- ══ PRESET SELECTOR (per week) ══ -->
      <div style="background:var(--surface,#14130f);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:10px 14px;margin-bottom:12px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#f59e0b;border-left:3px solid #f59e0b;padding-left:8px;margin-bottom:8px;">📐 This Week's Max Mark Preset</div>
        <div id="stu-preset-pills" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;"></div>
        <div id="stu-preset-inputs" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:8px;"></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <input type="text" id="stu-new-preset-name" placeholder="New preset name (e.g. CALC 3)"
            style="background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:6px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:6px 10px;outline:none;flex:1;min-width:140px;max-width:200px;">
          <button onclick="__ssc.savePreset()" style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:#f59e0b;border-radius:6px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;white-space:nowrap;">+ Save Preset</button>
        </div>
      </div>

      <!-- ══ STUDENTS TABLE ══ -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted,#6b6656);">
          Subjects: <span id="stu-subject-names" style="color:#38bdf8;">—</span>
          &nbsp;·&nbsp; <span id="stu-roster-count" style="color:var(--text-muted,#6b6656);">0 students</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button onclick="__ssc.addStudent()" style="background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);color:#34d399;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;">+ Add Student</button>
          <button onclick="__ssc.showAllStudents()" style="background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);color:#38bdf8;border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;">👁 All Students</button>
          <button onclick="__ssc.resetRoster()" style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.25);color:#f87171;border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:'JetBrains Mono',monospace;" title="Clear student roster and start fresh">🗑 Reset Roster</button>
        </div>
      </div>

      <div id="stu-scroll-hint" style="display:none;text-align:right;font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;margin-bottom:4px;">← swipe to scroll →</div>
      <div style="border:1px solid var(--border,#2a2820);border-radius:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table class="ref-table" id="stu-table" style="min-width:700px;">
          <thead id="stu-thead"></thead>
          <tbody id="stu-tbody"></tbody>
        </table>
      </div>
      <div style="margin-top:6px;font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;">
        MM = Marks for this week · TM = Total Marks · TP = Total %
      </div>

      <!-- Student progress modal -->
      <div id="stu-progress-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1001;backdrop-filter:blur(4px);overflow-y:auto;-webkit-overflow-scrolling:touch;" onclick="__ssc.closeProgress(event)">
        <div style="background:#14130f;border:1px solid #2a2820;border-radius:16px;max-width:480px;margin:40px auto;padding:0;overflow:hidden;" onclick="event.stopPropagation()">
          <div id="stu-progress-inner"></div>
        </div>
      </div>

      <!-- All Students View modal -->
      <div id="stu-allview-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:1002;backdrop-filter:blur(4px);overflow-y:auto;-webkit-overflow-scrolling:touch;" onclick="__ssc.closeAllStudents(event)">
        <div style="background:#14130f;border:1px solid #2a2820;border-radius:16px;max-width:680px;margin:30px auto 60px;padding:0;overflow:hidden;" onclick="event.stopPropagation()">
          <div id="stu-allview-inner"></div>
        </div>
      </div>
    </div>

    <!-- ══ EXPORT / IMPORT ══ -->
    <div id="subpanel-transfer" style="display:none;">
      <div style="margin-bottom:1rem;">
        <p style="font-size:12px;color:var(--text-muted,#6b6656);line-height:1.6;">
          Export all Score Card data (current student + weekly history + other students) as a JSON file.<br>
          Import on any device to restore everything exactly.
        </p>
      </div>

      <!-- Export -->
      <div style="background:var(--surface,#14130f);border:1px solid rgba(192,132,252,.25);border-radius:10px;padding:1.1rem 1.25rem;margin-bottom:10px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#c084fc;border-left:3px solid #c084fc;padding-left:8px;margin-bottom:10px;">📤 Export Data</div>
        <p style="font-size:12px;color:var(--text-muted,#6b6656);margin-bottom:12px;">Downloads a <code style="background:rgba(255,255,255,.06);padding:1px 5px;border-radius:3px;font-size:11px;">.json</code> file with all your Score Card data. Send it to yourself via email, WhatsApp, or any app.</p>
        <button onclick="__ssc.exportData()" style="background:rgba(192,132,252,.15);border:1px solid rgba(192,132,252,.4);color:#c084fc;border-radius:6px;padding:9px 20px;font-size:13px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:.05em;">⬇ Download Export File</button>
      </div>

      <!-- Import -->
      <div style="background:var(--surface,#14130f);border:1px solid rgba(56,189,248,.25);border-radius:10px;padding:1.1rem 1.25rem;margin-bottom:10px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#38bdf8;border-left:3px solid #38bdf8;padding-left:8px;margin-bottom:12px;">📥 Import Data</div>

        <!-- Import mode selector -->
        <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
          <label id="import-mode-merge-lbl" style="flex:1;min-width:140px;display:flex;align-items:flex-start;gap:8px;background:rgba(52,211,153,.1);border:2px solid rgba(52,211,153,.4);border-radius:8px;padding:10px 12px;cursor:pointer;transition:all .2s;">
            <input type="radio" name="ssc-import-mode" value="merge" checked onchange="__ssc._onImportModeChange()" style="accent-color:#34d399;margin-top:2px;flex-shrink:0;">
            <div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#34d399;margin-bottom:3px;">⊕ Merge</div>
              <div style="font-size:11px;color:var(--text-muted,#6b6656);line-height:1.4;">Adds imported records to existing data. No data is lost. Duplicate entries are skipped.</div>
            </div>
          </label>
          <label id="import-mode-replace-lbl" style="flex:1;min-width:140px;display:flex;align-items:flex-start;gap:8px;background:rgba(255,255,255,.03);border:2px solid var(--border,#2a2820);border-radius:8px;padding:10px 12px;cursor:pointer;transition:all .2s;">
            <input type="radio" name="ssc-import-mode" value="replace" onchange="__ssc._onImportModeChange()" style="accent-color:#f87171;margin-top:2px;flex-shrink:0;">
            <div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:#f87171;margin-bottom:3px;">⊘ Full Replace</div>
              <div style="font-size:11px;color:var(--text-muted,#6b6656);line-height:1.4;">Wipes ALL existing data and replaces with import. Use to fully restore from backup.</div>
            </div>
          </label>
        </div>

        <!-- Warning shown for replace mode -->
        <div id="ssc-replace-warning" style="display:none;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:11px;font-family:'JetBrains Mono',monospace;color:#fca5a5;line-height:1.5;">
          ⚠ <strong>Full Replace will permanently delete</strong> all current student info, marks, history records, students roster and photo — then replace with the imported file. This cannot be undone.
        </div>

        <!-- File picker -->
        <label style="display:inline-flex;align-items:center;gap:8px;background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.4);color:#38bdf8;border-radius:6px;padding:9px 20px;font-size:13px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:.05em;">
          ⬆ Select Import File
          <input type="file" id="ssc-import-file" accept=".json" style="display:none;" onchange="__ssc.importData(this)">
        </label>

        <div id="ssc-import-status" style="margin-top:10px;font-size:12px;font-family:'JetBrains Mono',monospace;color:#34d399;display:none;"></div>
      </div>

      <!-- What's included -->
      <div style="background:rgba(255,255,255,.03);border:1px solid var(--border,#2a2820);border-radius:8px;padding:.9rem 1.1rem;">
        <div style="font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted,#6b6656);margin-bottom:8px;">Export includes</div>
        <div style="font-size:12px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;line-height:2;">
          ✓ Current student info &amp; marks<br>
          ✓ All weekly test history records<br>
          ✓ Other Students roster (Student01–10)<br>
          ✓ Student photo (if saved)
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

    // Wire photo input — use both 'change' and 'input' for maximum browser compatibility
    // Restore URL input if photo URL saved
    const urlInput = document.getElementById('ssc-pic-url');
    if (urlInput && this.studentPhoto) {
      // Only show URL if it's actually a URL (not base64)
      if (this.studentPhoto.startsWith('http')) urlInput.value = this.studentPhoto;
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
    tbody.innerHTML = noWeekBanner + tbody.innerHTML;
    }
  },

  /* ═══════════════════════════════════════
     ROW ACTIONS
     ═══════════════════════════════════════ */
  switchSub(sub) {
    ['scorecard','gap','history','students','transfer'].forEach(s => {
      const btn = document.getElementById('subtab-'+s);
      if (btn) btn.classList.toggle('active', s===sub);
      const p = document.getElementById('subpanel-'+s);
      if (p) p.style.display = s===sub ? 'block' : 'none';
    });
    if (sub==='gap')      { this.syncGap(); this.calcGap(); }
    if (sub==='history')  { this.renderHistory(); }
    if (sub==='students') { this.renderStudents(); }
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
    // Reset photo
    this.studentPhoto = null;
    this._renderPic('');
    const urlInput = el('ssc-pic-url');
    if (urlInput) urlInput.value = '';
    const rp=el('ssc-report-pic'); if(rp) rp.innerHTML='🎓';
    // Clear storage
    try { localStorage.removeItem(SSC_KEY); localStorage.removeItem(PHOTO_KEY); } catch {}
    this.renderRows();
    this.updateTotals();
  },

  /* ═══════════════════════════════════════
     PHOTO
     ═══════════════════════════════════════ */
  _onPhotoUrl(url) {
    url = url.trim();
    if (!url) {
      // Clear photo
      this.studentPhoto = null;
      photoWrite('');
      this._renderPic('');
      return;
    }
    // Save and show immediately — works with any valid image URL
    this.studentPhoto = url;
    photoWrite(url);
    this._renderPic(url);
  },

  _renderPic(src) {
    const ph  = document.getElementById('ssc-pic-placeholder');
    const img = document.getElementById('ssc-pic-img');
    if (!src) {
      // Clear — show placeholder
      if (ph)  ph.style.display = '';
      if (img) { img.style.display = 'none'; img.src = ''; }
    } else {
      if (ph)  ph.style.display  = 'none';
      if (img) { img.src = src; img.style.display = 'block'; }
    }
    const rp = document.getElementById('ssc-report-pic');
    if (rp) {
      rp.innerHTML = src
        ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.style.display='none'">`
        : '🎓';
    }
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
    const allRecords = this._readHistory();

    // Populate year dropdown from actual records
    const yearEl = document.getElementById('hist-filter-year');
    if (yearEl) {
      const years = [...new Set(allRecords.map(r => r.date?.slice(0,4)).filter(Boolean))].sort((a,b) => b-a);
      const curYear = yearEl.value;
      yearEl.innerHTML = '<option value="">All Years</option>' +
        years.map(y => `<option value="${y}" ${y===curYear?'selected':''}>${y}</option>`).join('');
    }

    if (!allRecords.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;">
          <div style="font-size:2rem;margin-bottom:12px;">📅</div>
          <div style="font-size:13px;margin-bottom:6px;">No test records yet</div>
          <div style="font-size:11px;">Fill in marks, pick a date, then tap <span style="color:#f59e0b;">💾 Save Test</span></div>
        </div>`;
      return;
    }

    // Apply filters
    const filterMonth   = document.getElementById('hist-filter-month')?.value   || '';
    const filterYear    = document.getElementById('hist-filter-year')?.value    || '';
    const filterStudent = (document.getElementById('hist-filter-student')?.value || '').toLowerCase().trim();

    const records = allRecords.filter(r => {
      if (filterMonth   && r.date?.slice(5,7) !== filterMonth)                          return false;
      if (filterYear    && r.date?.slice(0,4) !== filterYear)                           return false;
      if (filterStudent && !r.student?.toLowerCase().includes(filterStudent)
                        && !r.label?.toLowerCase().includes(filterStudent))             return false;
      return true;
    });

    // Update count
    const countEl = document.getElementById('hist-filter-count');
    if (countEl) {
      const isFiltered = filterMonth || filterYear || filterStudent;
      countEl.textContent = isFiltered
        ? `${records.length} of ${allRecords.length} records`
        : `${allRecords.length} records`;
      countEl.style.color = isFiltered ? '#f59e0b' : 'var(--text-muted,#6b6656)';
    }

    if (!records.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;">
          <div style="font-size:1.5rem;margin-bottom:8px;">🔍</div>
          <div style="font-size:13px;">No records match the filter</div>
          <div style="font-size:11px;margin-top:4px;">Try clearing the filter above</div>
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

  applyHistoryFilter() {
    this.renderHistory();
  },

  resetHistoryFilter() {
    const m = document.getElementById('hist-filter-month');
    const y = document.getElementById('hist-filter-year');
    const s = document.getElementById('hist-filter-student');
    if (m) m.value = '';
    if (y) y.value = '';
    if (s) s.value = '';
    this.renderHistory();
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
            <div style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px;">Grade</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:1.3rem;font-weight:700;color:${g.c};">${r.grade}</div>
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

/* ═══════════════════════════════════════
   OTHER STUDENTS ROSTER
   ═══════════════════════════════════════ */

// Appended methods — scorecard.js v4.1

Object.assign(scorecardModule, {

  /* ── Preset storage helpers ── */
  _readPresets() {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // Seed built-in presets with real values (saves on first call)
    const defaults = [
      { id: 'calc1', name: 'CALC 1', maxMarks: [60, 45, 45], builtIn: true },
      { id: 'calc2', name: 'CALC 2', maxMarks: [90, 60, 60], builtIn: true },
    ];
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(defaults)); } catch {}
    return defaults;
  },

  _writePresets(list) {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(list)); } catch(e) { console.warn('[SSC] Presets write failed:', e.name); }
  },

  _getActivePreset() {
    try {
      const id = localStorage.getItem('calchub_ssc_active_preset');
      if (!id) return null;
      return this._readPresets().find(p => p.id === id) || null;
    } catch { return null; }
  },

  _setActivePreset(id) {
    try { localStorage.setItem('calchub_ssc_active_preset', id); } catch {}
  },

  _renderPresetPills() {
    const container = document.getElementById('stu-preset-pills');
    if (!container) return;
    const presets   = this._readPresets();
    const activeId  = localStorage.getItem('calchub_ssc_active_preset') || '';
    const subjects  = this.sscRows;

    container.innerHTML = presets.map(p => {
      const isActive = p.id === activeId;
      const maxSummary = p.maxMarks.length
        ? p.maxMarks.slice(0, subjects.length).join('/') || '—'
        : '(no max set)';
      return `<label style="display:inline-flex;align-items:center;gap:7px;background:${isActive?'rgba(52,211,153,.15)':'rgba(255,255,255,.04)'};border:1px solid ${isActive?'rgba(52,211,153,.4)':'var(--border,#2a2820)'};border-radius:8px;padding:7px 12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;color:${isActive?'#34d399':'var(--text,#e8e4d8)'};transition:all .2s;user-select:none;">
        <input type="radio" name="stu-preset" value="${p.id}" ${isActive?'checked':''} onchange="__ssc.selectPreset('${p.id}')" style="accent-color:#34d399;">
        <span><strong>${p.name}</strong><span style="color:var(--text-muted,#6b6656);font-size:10px;margin-left:6px;">max: ${maxSummary}</span></span>
        ${!p.builtIn ? `<button onclick="event.preventDefault();event.stopPropagation();__ssc.deletePreset('${p.id}')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:11px;padding:0 0 0 6px;" title="Delete preset">✕</button>` : ''}
      </label>`;
    }).join('') +
    // "None" option
    `<label style="display:inline-flex;align-items:center;gap:7px;background:${!activeId?'rgba(255,255,255,.07)':'rgba(255,255,255,.04)'};border:1px solid ${!activeId?'var(--border-light,#38352a)':'var(--border,#2a2820)'};border-radius:8px;padding:7px 12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted,#6b6656);user-select:none;">
      <input type="radio" name="stu-preset" value="" ${!activeId?'checked':''} onchange="__ssc.selectPreset('')" style="accent-color:#34d399;">
      <span>Use Score Card max</span>
    </label>`;
  },

  _renderPresetInputs(currentMax) {
    const container = document.getElementById('stu-preset-inputs');
    if (!container) return;
    const subjects = this.sscRows;
    if (!subjects.length) { container.innerHTML = ''; return; }
    container.innerHTML = subjects.map((s, i) => `
      <div style="background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:6px;padding:8px 10px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted,#6b6656);margin-bottom:5px;">MM${i+1} — ${s.name}</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:11px;color:var(--text-muted,#6b6656);">Max:</span>
          <input type="number" id="stu-preset-max-${i}" value="${currentMax[i]||s.max}" min="1"
            style="width:70px;background:var(--surface,#14130f);border:1px solid rgba(245,158,11,.3);border-radius:4px;color:#f59e0b;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;padding:4px 8px;outline:none;-moz-appearance:textfield;">
        </div>
      </div>`).join('');
  },

  selectPreset(id) {
    this._setActivePreset(id);
    this.renderStudents();
  },

  savePreset() {
    const nameEl = document.getElementById('stu-new-preset-name');
    const name   = nameEl?.value.trim();
    if (!name) { alert('Please enter a preset name (e.g. CALC 3)'); return; }

    const subjects  = this.sscRows;
    const maxMarks  = subjects.map((s, i) => {
      const el = document.getElementById(`stu-preset-max-${i}`);
      return parseFloat(el?.value) || s.max;
    });

    const presets = this._readPresets();
    const id      = 'preset_' + Date.now();
    presets.push({ id, name, maxMarks, builtIn: false });
    this._writePresets(presets);
    this._setActivePreset(id);
    if (nameEl) nameEl.value = '';
    this.renderStudents();
  },

  deletePreset(id) {
    if (!confirm('Delete this preset?')) return;
    const presets = this._readPresets().filter(p => p.id !== id);
    this._writePresets(presets);
    const active = localStorage.getItem('calchub_ssc_active_preset');
    if (active === id) localStorage.removeItem('calchub_ssc_active_preset');
    this.renderStudents();
  },

  /* ── Student storage helpers ── */
  /* ═══════════════════════════════════════
     WEEKLY SESSION STORAGE
     ═══════════════════════════════════════ */

  _readWeekly() {
    try {
      const raw = localStorage.getItem(WEEKLY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  _writeWeekly(sessions) {
    try { localStorage.setItem(WEEKLY_KEY, JSON.stringify(sessions)); }
    catch(e) { console.warn('[SSC] Weekly write failed:', e.name); }
  },

  _readStudents() {
    try {
      const raw = localStorage.getItem(STUDENTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Migrate: old format stored marks[] inside each student — strip to roster-only
      return parsed.map(s => ({
        id:   s.id   || '',
        name: s.name || '',
        roll: s.roll || '',
      })).filter(s => s.id); // remove any corrupt entries
    } catch { return []; }
  },

  _writeStudents(list) {
    try { localStorage.setItem(STUDENTS_KEY, JSON.stringify(list)); }
    catch(e) { console.warn('[SSC] Students write failed:', e.name); }
  },

  /* Active week index (in-memory only, resets on reload — that's fine) */
  _activeWeekIdx: 0,

  _getWeekMarks(weekIdx, stuId) {
    const sessions = this._readWeekly();
    const session  = sessions[weekIdx];
    if (!session) return [];
    const stu = session.students.find(s => s.id === stuId);
    return stu ? stu.marks : [];
  },

  /* ── Week navigation ── */
  weekNav(dir) {
    const sessions = this._readWeekly();
    if (!sessions.length) return;
    this._activeWeekIdx = Math.max(0, Math.min(sessions.length - 1, this._activeWeekIdx + dir));
    this.renderStudents();
  },

  weekGoto(idx) {
    this._activeWeekIdx = parseInt(idx) || 0;
    this.renderStudents();
  },

  weekAdd() {
    const dateEl = document.getElementById('stu-new-week-date');
    const date   = dateEl?.value || new Date().toISOString().slice(0,10);
    const sessions = this._readWeekly();

    // Check duplicate date
    const dupIdx = sessions.findIndex(s => s.date === date);
    if (dupIdx >= 0) {
      if (!confirm('A session for ' + this._fmtDate(date) + ' already exists. Switch to it?')) return;
      this._activeWeekIdx = dupIdx;
      this.renderStudents();
      return;
    }

    const students = this._readStudents();
    const preset   = this._getActivePreset();
    const newSession = {
      id:        Date.now(),
      date,
      presetId:  preset?.id || '',
      students:  students.map(st => ({
        id:    st.id,
        marks: this.sscRows.map((s,i) => ({ subj: s.name, obt: 0 }))
      }))
    };

    sessions.unshift(newSession); // newest first
    this._writeWeekly(sessions);
    this._activeWeekIdx = 0;
    this.renderStudents();
  },

  weekDelete() {
    const sessions = this._readWeekly();
    if (!sessions.length) return;
    const w = sessions[this._activeWeekIdx];
    if (!confirm('Delete week ' + this._fmtDate(w.date) + '? This cannot be undone.')) return;
    sessions.splice(this._activeWeekIdx, 1);
    this._writeWeekly(sessions);
    this._activeWeekIdx = Math.max(0, this._activeWeekIdx - 1);
    this.renderStudents();
  },

  /* ── Update a student's marks for the active week ── */
  _onWeekMarkChange(stuId, markIdx, val) {
    const sessions = this._readWeekly();
    const session  = sessions[this._activeWeekIdx];
    if (!session) return;
    let stu = session.students.find(s => s.id === stuId);
    if (!stu) {
      stu = { id: stuId, marks: this.sscRows.map(s => ({ subj: s.name, obt: 0 })) };
      session.students.push(stu);
    }
    if (!stu.marks[markIdx]) stu.marks[markIdx] = { subj: this.sscRows[markIdx]?.name || '', obt: 0 };
    stu.marks[markIdx].obt = parseFloat(val) || 0;
    this._writeWeekly(sessions);

    // Live-update TM + TP% cells in the row
    const maxMarks  = this._activeWeekMaxMarks();
    const totObt    = stu.marks.reduce((a,m,i) => a + (parseFloat(m.obt)||0), 0);
    const totMax    = maxMarks.reduce((a,v) => a+v, 0);
    const pct       = totMax ? ((totObt/totMax)*100).toFixed(1) : '—';
    const pctClr    = totMax ? this._barColor((totObt/totMax)*100) : 'var(--text-muted,#6b6656)';
    const row       = document.querySelector(`tr[data-stu-id="${stuId}"]`);
    if (row) {
      const cells = row.querySelectorAll('td');
      const len   = cells.length;
      cells[len-3].textContent = totObt;
      cells[len-3].style.color = '#34d399';
      cells[len-2].textContent = totMax ? pct + '%' : '—';
      cells[len-2].style.color = pctClr;
    }
  },

  _activeWeekMaxMarks() {
    const sessions = this._readWeekly();
    const session  = sessions[this._activeWeekIdx];
    const preset   = session
      ? (this._readPresets().find(p => p.id === session.presetId) || this._getActivePreset())
      : this._getActivePreset();
    return this.sscRows.map((s,i) =>
      (preset?.maxMarks?.[i] != null) ? parseFloat(preset.maxMarks[i])||s.max : s.max
    );
  },

  /* ── Update student info (name/roll — shared across all weeks) ── */
  _onStudentInfoChange(stuIdx, field, val) {
    const list = this._readStudents();
    if (!list[stuIdx]) return;
    list[stuIdx][field] = val;
    this._writeStudents(list);
  },

  /* ── Add / Delete students (roster — fixed across weeks) ── */
  addStudent() {
    const list = this._readStudents();
    if (list.length >= 10) { alert('Maximum 10 students reached (Student01–Student10).'); return; }
    const num   = list.length + 1;
    const label = 'Student' + String(num).padStart(2,'0');
    list.push({ id: label, name: '', roll: '' });
    this._writeStudents(list);

    // Add to every existing weekly session
    const sessions = this._readWeekly();
    sessions.forEach(sess => {
      if (!sess.students.find(s => s.id === label)) {
        sess.students.push({ id: label, marks: this.sscRows.map(s => ({ subj: s.name, obt: 0 })) });
      }
    });
    this._writeWeekly(sessions);
    this.renderStudents();
  },

  deleteStudent(stuId) {
    if (!confirm('Remove ' + stuId + ' from all weeks? This cannot be undone.')) return;
    const list = this._readStudents().filter(s => s.id !== stuId);
    this._writeStudents(list);
    const sessions = this._readWeekly();
    sessions.forEach(sess => { sess.students = sess.students.filter(s => s.id !== stuId); });
    this._writeWeekly(sessions);
    this.renderStudents();
  },

  resetRoster() {
    if (!confirm('Clear ALL students from the roster? Weekly mark data will also be cleared. This cannot be undone.')) return;
    try { localStorage.removeItem(STUDENTS_KEY); } catch {}
    try { localStorage.removeItem(WEEKLY_KEY); } catch {}
    this._activeWeekIdx = 0;
    this.renderStudents();
  },

  /* ═══════════════════════════════════════
     RENDER STUDENTS (weekly-aware)
     ═══════════════════════════════════════ */
  renderStudents() {
    const subjects = this.sscRows;
    const students = this._readStudents();
    const sessions = this._readWeekly();

    // Clamp active index
    if (sessions.length) this._activeWeekIdx = Math.max(0, Math.min(sessions.length-1, this._activeWeekIdx));

    const session    = sessions[this._activeWeekIdx] || null;
    const maxMarks   = this._activeWeekMaxMarks();
    const totalMaxAll = maxMarks.reduce((a,v) => a+v, 0);

    // Find preset for this week
    const weekPreset = session
      ? (this._readPresets().find(p => p.id === session.presetId) || null)
      : this._getActivePreset();

    // ── Week selector dropdown ──
    const weekSel = document.getElementById('stu-week-select');
    if (weekSel) {
      if (!sessions.length) {
        weekSel.innerHTML = '<option value="">No weeks yet — add one above</option>';
      } else {
        weekSel.innerHTML = sessions.map((s,i) =>
          `<option value="${i}" ${i===this._activeWeekIdx?'selected':''}>${this._fmtDate(s.date)} — ${this._weekPresetLabel(s)}</option>`
        ).join('');
      }
    }

    // ── Week info strip ──
    const wpn = document.getElementById('stu-week-preset-name');
    const wmd = document.getElementById('stu-week-max-display');
    const wc  = document.getElementById('stu-week-count');
    if (wpn) wpn.textContent = weekPreset ? weekPreset.name : 'Score Card max';
    if (wmd) wmd.textContent = maxMarks.join(' / ') + '  (Total: ' + totalMaxAll + ')';
    if (wc)  wc.textContent  = sessions.length + ' week(s) saved';

    // ── Preset pills (week-specific) ──
    this._renderPresetPills(session);

    // ── Subject names ──
    const snEl = document.getElementById('stu-subject-names');
    if (snEl) snEl.textContent = subjects.map(s=>s.name).join(' · ') || '—';
    const rcEl = document.getElementById('stu-roster-count');
    if (rcEl) rcEl.textContent = students.length + ' student' + (students.length !== 1 ? 's' : '') + ' in roster';

    // ── Preset inputs ──
    this._renderPresetInputs(maxMarks);

    // ── Swipe hint ──
    const hint = document.getElementById('stu-scroll-hint');
    if (hint) hint.style.display = window.innerWidth < 600 ? 'block' : 'none';

    // ── Set default new-week date ──
    const nwd = document.getElementById('stu-new-week-date');
    if (nwd && !nwd.value) nwd.value = new Date().toISOString().slice(0,10);

    const thead = document.getElementById('stu-thead');
    const tbody = document.getElementById('stu-tbody');
    if (!thead || !tbody) return;

    // ── Header ──
    thead.innerHTML = `<tr>
      <th style="min-width:90px;text-align:left;padding-left:10px;">Student ID</th>
      <th style="min-width:120px;">Name</th>
      <th style="min-width:80px;">Roll No</th>
      ${subjects.map((s,i) => `<th style="min-width:72px;color:#38bdf8;">
        MM${i+1}<br>
        <span style="font-size:9px;color:var(--text-muted,#6b6656);">${s.name.substring(0,6)}</span><br>
        <span style="font-size:10px;color:#f59e0b;">/${maxMarks[i]}</span>
      </th>`).join('')}
      <th style="min-width:65px;color:#34d399;">TM<br><span style="font-size:9px;color:#f59e0b;">/${totalMaxAll}</span></th>
      <th style="min-width:65px;color:#fcd34d;">TP%</th>
      <th style="min-width:36px;" title="Week progress">📈</th>
      <th style="min-width:30px;"></th>
    </tr>`;

    if (!students.length) {
      tbody.innerHTML = `<tr><td colspan="${6+subjects.length}" style="text-align:center;padding:2rem;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;font-size:12px;">
        No students yet — tap <strong style="color:#34d399;">+ Add Student</strong> above
      </td></tr>`;
      return;
    }

    // Banner row when no week is selected (prepended to student rows)
    const noWeekBanner = !session ? `<tr><td colspan="${6+subjects.length}" style="text-align:center;padding:8px;background:rgba(245,158,11,.06);border-bottom:1px solid rgba(245,158,11,.2);font-family:'JetBrains Mono',monospace;font-size:11px;color:#f59e0b;">
      ⚠ No week selected — tap <strong>+ New Week</strong> above to start entering marks. Students listed below are from the roster.
    </td></tr>` : '';

    // Always render student rows — show 0 marks if no week selected
    tbody.innerHTML = students.map((st, idx) => {
      const weekStu  = session ? session.students.find(s => s.id === st.id) : null;
      const marks    = weekStu?.marks || subjects.map(s => ({ subj:s.name, obt:0 }));
      const totObt   = marks.reduce((a,m) => a+(parseFloat(m.obt)||0), 0);
      const pct      = totalMaxAll ? ((totObt/totalMaxAll)*100).toFixed(1) : '—';
      const pctClr   = totalMaxAll ? this._barColor((totObt/totalMaxAll)*100) : 'var(--text-muted,#6b6656)';

      const markCells = subjects.map((s,mi) =>
        `<td style="text-align:center;padding:4px;">
          <input type="number" value="${parseFloat(marks[mi]?.obt)||0}" min="0" max="${maxMarks[mi]}"
            data-stu-id="${st.id}" data-mark="${mi}"
            onchange="__ssc._onWeekMarkChange('${st.id}',${mi},this.value)"
            ${!session ? 'disabled title="Add a week first"' : ''}
            style="width:52px;background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:4px;color:${session?'var(--text,#e8e4d8)':'var(--text-muted,#6b6656)'};font-family:'JetBrains Mono',monospace;font-size:12px;padding:3px 5px;text-align:center;outline:none;-moz-appearance:textfield;opacity:${session?1:0.4};">
        </td>`
      ).join('');

      return `<tr data-stu-id="${st.id}">
        <td style="padding:6px 10px;"><div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#34d399;">${st.id}</div></td>
        <td style="padding:4px;">
          <input type="text" value="${st.name||''}" placeholder="Name" data-stu="${idx}" data-field="name"
            onchange="__ssc._onStudentInfoChange(${idx},'name',this.value)"
            style="width:100px;background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:4px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;">
        </td>
        <td style="padding:4px;">
          <input type="text" value="${st.roll||''}" placeholder="Roll" data-stu="${idx}" data-field="roll"
            onchange="__ssc._onStudentInfoChange(${idx},'roll',this.value)"
            style="width:62px;background:var(--bg,#080807);border:1px solid var(--border,#2a2820);border-radius:4px;color:var(--text,#e8e4d8);font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;">
        </td>
        ${markCells}
        <td style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#34d399;">${totObt}</td>
        <td style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:${pctClr};">${totalMaxAll ? pct+'%' : '—'}</td>
        <td style="text-align:center;">
          <button onclick="__ssc.showProgress('${st.id}')" style="background:none;border:none;color:#38bdf8;cursor:pointer;font-size:14px;padding:2px 4px;" title="Week-by-week progress">📈</button>
        </td>
        <td style="text-align:center;">
          <button onclick="__ssc.deleteStudent('${st.id}')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:13px;padding:2px 4px;" title="Remove student">✕</button>
        </td>
      </tr>`;
    }).join('');
  },

  _weekPresetLabel(session) {
    if (!session?.presetId) return 'Score Card max';
    const p = this._readPresets().find(p => p.id === session.presetId);
    return p ? p.name : 'Custom';
  },

  /* ── Preset pills — week-aware (selecting a preset assigns it to THIS week) ── */
  _renderPresetPills(session) {
    const container = document.getElementById('stu-preset-pills');
    if (!container) return;
    const presets   = this._readPresets();
    const activeId  = session?.presetId || '';

    container.innerHTML = presets.map(p => {
      const isActive   = p.id === activeId;
      const maxSummary = p.maxMarks?.length ? p.maxMarks.join('/') : '—';
      return `<label style="display:inline-flex;align-items:center;gap:7px;background:${isActive?'rgba(245,158,11,.15)':'rgba(255,255,255,.04)'};border:1px solid ${isActive?'rgba(245,158,11,.45)':'var(--border,#2a2820)'};border-radius:8px;padding:7px 12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;color:${isActive?'#f59e0b':'var(--text,#e8e4d8)'};user-select:none;transition:all .15s;">
        <input type="radio" name="stu-preset" value="${p.id}" ${isActive?'checked':''} onchange="__ssc.selectPreset('${p.id}')" style="accent-color:#f59e0b;margin-top:1px;">
        <span><strong>${p.name}</strong> <span style="color:var(--text-muted,#6b6656);font-size:10px;">max: ${maxSummary}</span></span>
        ${!p.builtIn?`<button onclick="event.preventDefault();event.stopPropagation();__ssc.deletePreset('${p.id}')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:11px;padding:0 0 0 4px;">✕</button>`:''}
      </label>`;
    }).join('') +
    `<label style="display:inline-flex;align-items:center;gap:7px;background:${!activeId?'rgba(255,255,255,.07)':'rgba(255,255,255,.03)'};border:1px solid ${!activeId?'var(--border-light,#38352a)':'var(--border,#2a2820)'};border-radius:8px;padding:7px 12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted,#6b6656);user-select:none;">
      <input type="radio" name="stu-preset" value="" ${!activeId?'checked':''} onchange="__ssc.selectPreset('')" style="accent-color:#34d399;">
      <span>Score Card max</span>
    </label>`;
  },

  /* ── Selecting a preset NOW assigns it to the active week ── */
  selectPreset(id) {
    const sessions = this._readWeekly();
    if (!sessions.length || this._activeWeekIdx >= sessions.length) {
      // No week yet — just store as global default
      this._setActivePreset(id);
    } else {
      sessions[this._activeWeekIdx].presetId = id;
      this._writeWeekly(sessions);
      this._setActivePreset(id); // also set global so new weeks inherit it
    }
    this.renderStudents();
  },

  savePreset() {
    const nameEl = document.getElementById('stu-new-preset-name');
    const name   = nameEl?.value.trim();
    if (!name) { alert('Please enter a preset name.'); return; }
    const maxMarks = this.sscRows.map((s,i) => {
      const el = document.getElementById(`stu-preset-max-${i}`);
      return parseFloat(el?.value) || s.max;
    });
    const presets = this._readPresets();
    const id      = 'preset_' + Date.now();
    presets.push({ id, name, maxMarks, builtIn: false });
    this._writePresets(presets);
    // Assign to active week
    const sessions = this._readWeekly();
    if (sessions[this._activeWeekIdx]) { sessions[this._activeWeekIdx].presetId = id; this._writeWeekly(sessions); }
    this._setActivePreset(id);
    if (nameEl) nameEl.value = '';
    this.renderStudents();
  },

  deletePreset(id) {
    if (!confirm('Delete this preset?')) return;
    const presets = this._readPresets().filter(p => p.id !== id);
    this._writePresets(presets);
    const active = localStorage.getItem('calchub_ssc_active_preset');
    if (active === id) localStorage.removeItem('calchub_ssc_active_preset');
    this.renderStudents();
  },

  /* ── Student week-by-week progress modal ── */
  showProgress(stuId) {
    const students  = this._readStudents();
    const sessions  = this._readWeekly();
    const st        = students.find(s => s.id === stuId);
    if (!st) return;

    const rows = sessions.map((sess, wi) => {
      const preset   = this._readPresets().find(p => p.id === sess.presetId);
      const maxMarks = this.sscRows.map((s,i) => (preset?.maxMarks?.[i]) || s.max);
      const totMax   = maxMarks.reduce((a,v) => a+v, 0);
      const weekStu  = sess.students.find(s => s.id === stuId);
      const marks    = weekStu?.marks || [];
      const totObt   = marks.reduce((a,m) => a+(parseFloat(m.obt)||0), 0);
      const pct      = totMax ? ((totObt/totMax)*100) : 0;
      return { date: sess.date, totObt, totMax, pct, marks, presetName: preset?.name || 'Score Card max' };
    }).reverse(); // chronological

    const maxPct = Math.max(...rows.map(r => r.pct), 1);

    const barRows = rows.map((r,i) => {
      const g   = this._grade(r.pct);
      const barW = (r.pct / maxPct * 100).toFixed(1);
      const subjectDetail = this.sscRows.map((s,si) =>
        `<span style="font-size:10px;color:var(--text-muted,#6b6656);font-family:'JetBrains Mono',monospace;">${s.name.substring(0,4)}: <span style="color:var(--text,#e8e4d8);">${parseFloat(r.marks[si]?.obt)||0}</span></span>`
      ).join(' · ');

      return `<div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:11px;margin-bottom:4px;">
          <span style="color:var(--text,#e8e4d8);">${this._fmtDate(r.date)}</span>
          <span style="color:var(--text-muted,#6b6656);font-size:10px;">${r.presetName}</span>
          <span style="color:${g.c};font-weight:700;">${r.pct.toFixed(1)}%</span>
        </div>
        <div style="background:rgba(255,255,255,.05);border-radius:99px;height:10px;overflow:hidden;margin-bottom:4px;">
          <div style="width:${barW}%;height:100%;background:${g.c};border-radius:99px;transition:width .4s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;">${subjectDetail}</div>
          <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#34d399;font-weight:600;">${r.totObt}/${r.totMax}</span>
        </div>
      </div>`;
    }).join('');

    // Trend arrow
    const trend = rows.length >= 2
      ? (rows[rows.length-1].pct - rows[rows.length-2].pct)
      : null;
    const trendHtml = trend !== null
      ? `<span style="color:${trend>=0?'#34d399':'#f87171'};font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;">${trend>=0?'↑':'↓'} ${Math.abs(trend).toFixed(1)}%</span> vs last week`
      : '';

    document.getElementById('stu-progress-inner').innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(56,189,248,.1),rgba(56,189,248,.03));padding:1.1rem 1.25rem;border-bottom:1px solid #2a2820;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#38bdf8;">${st.name || st.id}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted,#6b6656);">${st.roll ? 'Roll: '+st.roll+' · ' : ''}${rows.length} week(s) of data · ${trendHtml}</div>
        </div>
        <button onclick="__ssc.closeProgress()" style="background:rgba(255,255,255,.06);border:1px solid #2a2820;border-radius:6px;color:var(--text-muted,#6b6656);font-size:12px;padding:4px 10px;cursor:pointer;font-family:'JetBrains Mono',monospace;flex-shrink:0;">✕</button>
      </div>
      <div style="padding:1rem 1.25rem;max-height:65vh;overflow-y:auto;">
        ${rows.length ? barRows : '<div style="text-align:center;padding:2rem;color:var(--text-muted,#6b6656);font-family:JetBrains Mono,monospace;font-size:12px;">No weekly data yet.</div>'}
      </div>`;

    document.getElementById('stu-progress-overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
  },

  closeProgress(e) {
    if (e && e.target !== document.getElementById('stu-progress-overlay')) return;
    const el = document.getElementById('stu-progress-overlay');
    if (el) el.style.display = 'none';
    document.body.style.overflow = '';

    },

  /* ═══════════════════════════════════════
     EXPORT / IMPORT
     ═══════════════════════════════════════ */

  exportData() {
    const payload = {
      version:    '1.0',
      exportedAt: new Date().toISOString(),
      app:        'CalcHubApp-ScoreCard',
      current:    null,
      history:    [],
      students:   [],
      photo:      null,
    };

    // Current session
    try {
      const raw = localStorage.getItem('calchub_ssc_v4');
      if (raw) payload.current = JSON.parse(raw);
    } catch {}

    // History
    try {
      const raw = localStorage.getItem('calchub_ssc_history');
      if (raw) payload.history = JSON.parse(raw);
    } catch {}

    // Other students
    try {
      const raw = localStorage.getItem('calchub_ssc_students');
      if (raw) payload.students = JSON.parse(raw);
    } catch {}

    // Photo (optional — may be large)
    try {
      const photo = localStorage.getItem('calchub_ssc_photo');
      if (photo) payload.photo = photo;
    } catch {}

    // Download
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const name = document.getElementById('ssc-name')?.value?.replace(/\s+/g,'_') || 'student';
    const date = new Date().toISOString().slice(0,10);
    const a    = Object.assign(document.createElement('a'), {
      href:     url,
      download: `calchub_scorecard_${name}_${date}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
    console.log('[SSC] Export done ✓');
  },

  _onImportModeChange() {
    const mode    = document.querySelector('input[name="ssc-import-mode"]:checked')?.value || 'merge';
    const warning = document.getElementById('ssc-replace-warning');
    const mergeLbl   = document.getElementById('import-mode-merge-lbl');
    const replaceLbl = document.getElementById('import-mode-replace-lbl');

    if (warning)    warning.style.display    = mode === 'replace' ? 'block' : 'none';
    if (mergeLbl)   {
      mergeLbl.style.background   = mode === 'merge'   ? 'rgba(52,211,153,.1)' : 'rgba(255,255,255,.03)';
      mergeLbl.style.borderColor  = mode === 'merge'   ? 'rgba(52,211,153,.4)' : 'var(--border,#2a2820)';
    }
    if (replaceLbl) {
      replaceLbl.style.background  = mode === 'replace' ? 'rgba(248,113,113,.1)' : 'rgba(255,255,255,.03)';
      replaceLbl.style.borderColor = mode === 'replace' ? 'rgba(248,113,113,.4)' : 'var(--border,#2a2820)';
    }
  },

  importData(input) {
    const file = input.files[0];
    if (!file) return;
    const statusEl = document.getElementById('ssc-import-status');
    const mode     = document.querySelector('input[name="ssc-import-mode"]:checked')?.value || 'merge';

    // Confirm full replace
    if (mode === 'replace') {
      const replaceMsg = 'FULL REPLACE: Wipes ALL existing data (marks, history, students, photo) and replaces with the imported file. Cannot be undone. Continue?';
      if (!confirm(replaceMsg)) {
        input.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const payload = JSON.parse(ev.target.result);
        if (payload.app !== 'CalcHubApp-ScoreCard') throw new Error('Not a CalcHub Score Card export file');

        if (mode === 'replace') {
          /* ── FULL REPLACE ── wipe everything then restore */
          const keysToWipe = [
            'calchub_ssc_v4', 'calchub_ssc_history', 'calchub_ssc_students',
            'calchub_ssc_photo', 'calchub_ssc_presets', 'calchub_ssc_active_preset',
            'ssc_saved', 'ch__ssc_data', 'ch__ssc_photo',
          ];
          keysToWipe.forEach(k => { try { localStorage.removeItem(k); } catch {} });

          // Restore everything from payload
          if (payload.current)  try { localStorage.setItem('calchub_ssc_v4', JSON.stringify(payload.current)); } catch {}
          if (payload.history)  try { localStorage.setItem('calchub_ssc_history', JSON.stringify(payload.history)); } catch {}
          if (payload.students) try { localStorage.setItem('calchub_ssc_students', JSON.stringify(payload.students)); } catch {}
          if (payload.photo)    try { localStorage.setItem('calchub_ssc_photo', payload.photo); } catch {}

          const msg = `✓ Full Replace done — ${payload.history?.length||0} history records, ${payload.students?.length||0} students restored.`;
          if (statusEl) { statusEl.textContent = msg; statusEl.style.color = '#34d399'; statusEl.style.display = 'block'; }
          console.log('[SSC]', msg);
          // Re-init module without page reload
          setTimeout(() => { this.init(); this.switchSub('scorecard'); }, 400);

        } else {
          /* ── MERGE ── add imported records to existing */
          let imported = { current: 0, history: 0, students: 0, photo: false };

          // Restore current session only if no existing name
          if (payload.current) {
            const existing    = localStorage.getItem('calchub_ssc_v4');
            const existParsed = existing ? JSON.parse(existing) : null;
            if (!existParsed?.info?.name) {
              localStorage.setItem('calchub_ssc_v4', JSON.stringify(payload.current));
              imported.current = 1;
            }
          }

          // Merge history (skip duplicates by id)
          if (payload.history?.length) {
            const existing = this._readHistory();
            const existIds = new Set(existing.map(r => r.id));
            const newRecs  = payload.history.filter(r => !existIds.has(r.id));
            const merged   = [...existing, ...newRecs].sort((a,b) => b.id - a.id);
            localStorage.setItem('calchub_ssc_history', JSON.stringify(merged));
            imported.history = newRecs.length;
          }

          // Merge students (append missing)
          if (payload.students?.length) {
            const existing = this._readStudents();
            const combined = [...existing];
            payload.students.forEach(s => {
              if (!combined.find(e => e.id === s.id)) combined.push(s);
            });
            this._writeStudents(combined.slice(0,10));
            imported.students = payload.students.length;
          }

          // Restore photo only if none exists
          if (payload.photo && !localStorage.getItem('calchub_ssc_photo')) {
            try {
              localStorage.setItem('calchub_ssc_photo', payload.photo);
              imported.photo = true;
            } catch(qe) {
              console.warn('[SSC] Photo too large for import storage:', qe.name);
              // Skip photo if quota exceeded — rest of data still imported
            }
          }

          const msg = `✓ Merge done — ${imported.history} new history records, ${imported.students} students${imported.current?' + current session':''} imported.`;
          if (statusEl) { statusEl.textContent = msg; statusEl.style.color = '#34d399'; statusEl.style.display = 'block'; }
          console.log('[SSC]', msg);

          // Re-init to show imported data without page reload
          if (imported.current) setTimeout(() => { this.init(); this.switchSub('scorecard'); }, 400);
        }

      } catch(e) {
        const msg = '✗ Import failed: ' + e.message;
        if (statusEl) { statusEl.textContent = msg; statusEl.style.display = 'block'; statusEl.style.color = '#f87171'; }
        console.error('[SSC] Import error:', e);
      }
      input.value = '';
    };
    reader.readAsText(file);
  },

});
