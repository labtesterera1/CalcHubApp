/* ============================================================
   CalcHubApp — modules/scorecard.js
   Student Score Card + Gap Analysis
   EXACT port of original HTML logic — MM · MR · M% system
   ============================================================ */

export const scorecardModule = {
  id:    'scorecard',
  label: 'Score Card',
  icon:  '🎓',
  desc:  'Student Score Card',
  accent: '#38bdf8',
  accentRgb: '56,189,248',

  /* ── State ── */
  studentPhoto: null,   // base64 data URL of student pic

  SSC_DEFAULT: [
    { name:'Mathematics', obt:78, max:90,  rank:208 },
    { name:'Physics',     obt:45, max:60,  rank:442 },
    { name:'Chemistry',   obt:54, max:60,  rank:110 },
  ],
  SSC_COLORS: ['#38bdf8','#a78bfa','#fb923c','#f472b6','#facc15','#818cf8','#e879f9'],
  sscRows: [],
  gapSubjects: [],
  gapTargets: {},

  render() {
    return `
    <div class="mod-header">
      <div class="mod-header-top">
        <button class="mod-back-btn" onclick="window.__goHome()" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Home
        </button>
        <span class="mod-badge" style="color:#38bdf8;background:#38bdf81a;border-color:#38bdf84d">STUDENT · REPORT</span>
      </div>
      <h2 class="mod-title" style="color:#38bdf8">Student Score Card</h2>
    </div>

    <!-- Sub-tabs -->
    <div class="sub-tabs">
      <button class="sub-tab-btn active" id="subtab-scorecard" onclick="__ssc.switchSub('scorecard')">📋 Score Card</button>
      <button class="sub-tab-btn gap-sub" id="subtab-gap" onclick="__ssc.switchSub('gap')">🎯 Gap Analysis</button>
    </div>

    <!-- ══ Sub-panel 1: Score Card ══ -->
    <div id="subpanel-scorecard">
      <p style="font-size:12px;color:var(--muted);margin-bottom:1.1rem;">Enter student details and subject marks — get MM · MR · M% for each subject and TM · TR · T% overall.</p>

      <!-- Student info header -->
      <div class="student-header">
        <!-- Student photo upload -->
        <div class="student-pic-wrap" id="ssc-pic-wrap" onclick="document.getElementById('ssc-pic-input').click()" title="Tap to add student photo">
          <div class="student-pic-inner" id="ssc-pic-inner">
            <span class="student-pic-icon">🎓</span>
            <span class="student-pic-hint">Add<br>Photo</span>
          </div>
          <div class="student-pic-ring"></div>
          <div class="student-pic-badge">📷</div>
        </div>
        <input type="file" id="ssc-pic-input" accept="image/*" style="display:none">
        <div class="student-fields">
          <div class="student-field">
            <label>Student Name</label>
            <input type="text" id="ssc-name" placeholder="e.g. Rahul Sharma" oninput="__ssc.calc()">
          </div>
          <div class="student-field">
            <label>Class / Standard</label>
            <input type="text" id="ssc-class" placeholder="e.g. Class 10 - A" oninput="__ssc.calc()">
          </div>
          <div class="student-field">
            <label>Exam / Term</label>
            <input type="text" id="ssc-exam" placeholder="e.g. Final Exam 2025" oninput="__ssc.calc()">
          </div>
          <div class="student-field">
            <label>Roll Number</label>
            <input type="text" id="ssc-roll" placeholder="e.g. 101" oninput="__ssc.calc()">
          </div>
          <div class="student-field">
            <label>School / Institute</label>
            <input type="text" id="ssc-school" placeholder="e.g. DPS Bengaluru" oninput="__ssc.calc()">
          </div>
          <div class="student-field">
            <label>Academic Year</label>
            <input type="text" id="ssc-year" placeholder="e.g. 2024–2025" oninput="__ssc.calc()">
          </div>
        </div>
      </div>

      <!-- Subject table -->
      <div class="tool-card">
        <div class="tool-card-title ssc">Subject Marks — MM · MR · M%</div>

        <div class="ssc-legend">
          <span class="ssc-leg-item" style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.25);color:var(--accent-ssc);">MM = Marks obtained</span>
          <span class="ssc-leg-item" style="background:rgba(148,163,184,0.08);border:1px solid rgba(148,163,184,0.2);color:#94a3b8;">MR = Rank in subject</span>
          <span class="ssc-leg-item" style="background:rgba(250,204,21,0.08);border:1px solid rgba(250,204,21,0.2);color:#fcd34d;">M% = Subject percentage</span>
          <span class="ssc-leg-item" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);color:#34d399;">TM = Total marks · TR = Total rank · T% = Overall %</span>
        </div>

        <!-- Student name banner above table -->
        <div id="ssc-name-banner" style="background:rgba(56,189,248,0.07);border:1px solid rgba(56,189,248,0.2);border-radius:6px;padding:8px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div id="ssc-report-pic" style="width:36px;height:36px;border-radius:50%;background:rgba(56,189,248,.15);border:2px solid rgba(56,189,248,.4);display:flex;align-items:center;justify-content:center;font-size:16px;overflow:hidden;flex-shrink:0;">🎓</div>
            <div>
              <span style="font-size:10px;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Student</span>
              <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:#38bdf8;" id="ssc-banner-name">—</div>
            </div>
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <div><div style="font-size:10px;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Class</div><div style="font-size:12px;color:var(--text);font-family:'JetBrains Mono',monospace;" id="ssc-banner-class">—</div></div>
            <div><div style="font-size:10px;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Roll No</div><div style="font-size:12px;color:var(--text);font-family:'JetBrains Mono',monospace;" id="ssc-banner-roll">—</div></div>
            <div><div style="font-size:10px;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">Exam</div><div style="font-size:12px;color:var(--text);font-family:'JetBrains Mono',monospace;" id="ssc-banner-exam">—</div></div>
            <div><div style="font-size:10px;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">School</div><div style="font-size:12px;color:var(--text);font-family:'JetBrains Mono',monospace;" id="ssc-banner-school">—</div></div>
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
                <th rowspan="2" style="vertical-align:middle;min-width:34px;color:var(--text-muted);font-size:10px;"></th>
              </tr>
              <tr>
                <th style="background:rgba(56,189,248,0.05);color:var(--text-muted);min-width:68px;">Obtained</th>
                <th style="background:rgba(56,189,248,0.05);color:var(--text-muted);min-width:68px;">Max</th>
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
                  <input type="number" id="ssc-tot-rank" placeholder="TR" oninput="__ssc.calc()"
                    style="width:58px;background:var(--bg);border:1px solid rgba(148,163,184,0.25);border-radius:4px;color:#94a3b8;font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;" title="Total Rank (TR) — enter manually">
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
          <button onclick="__ssc.reset()" style="background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--text-muted);border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;">↺ Reset</button>
          <button onclick="__ssc.save()" style="background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.4);color:#38bdf8;border-radius:6px;padding:6px 16px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:600;">💾 Save</button>
          <button onclick="__ssc.load()" style="background:rgba(250,204,21,0.1);border:1px solid rgba(250,204,21,0.3);color:#fcd34d;border-radius:6px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;">📂 Load Saved</button>
          <span id="ssc-save-msg" style="font-size:11px;color:#34d399;font-family:'JetBrains Mono',monospace;display:none;">✓ Saved!</span>
          <div id="ssc-grade-pill" style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;padding:5px 16px;border-radius:20px;border:1px solid var(--border);color:var(--text-muted);">Grade —</div>
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
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-muted);margin-bottom:6px;">
          Student: <span id="ssc-disp-name" style="color:#38bdf8;font-weight:600;">—</span>
          &nbsp;·&nbsp; Class: <span id="ssc-disp-class" style="color:var(--text);">—</span>
          &nbsp;·&nbsp; Exam: <span id="ssc-disp-exam" style="color:var(--text);">—</span>
        </div>
        <div class="ssc-progress-wrap">
          <div class="ssc-progress-fill" id="ssc-prog-bar" style="width:0%;background:#38bdf8;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;margin-bottom:10px;">
          <span>0%</span>
          <span id="ssc-prog-label" style="color:#38bdf8;">0%</span>
          <span>100%</span>
        </div>
        <div class="ssc-grade-card" id="ssc-grade-card" style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);">
          <div class="ssc-grade-left">
            <div class="ssc-grade-label">Grade</div>
            <div class="ssc-grade-value" id="ssc-grade-val" style="color:#38bdf8;">—</div>
            <div class="ssc-grade-desc" id="ssc-grade-desc" style="color:var(--text-muted);">Enter marks above</div>
          </div>
          <div class="ssc-grade-right">
            <div class="ssc-grade-pct" id="ssc-grade-pct" style="color:#38bdf8;">—%</div>
            <div class="ssc-grade-sub" id="ssc-grade-sub">—</div>
          </div>
        </div>
        <div id="ssc-mini-bars" style="margin-top:12px;display:flex;flex-direction:column;gap:6px;"></div>
      </div>
    </div><!-- /subpanel-scorecard -->

    <!-- ══ Sub-panel 2: Gap Analysis ══ -->
    <div id="subpanel-gap" style="display:none;">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:1.25rem;">Auto-synced from Score Card — shows marks short of 100% and what's needed to hit any target %.</p>

      <div style="background:rgba(251,113,133,0.06);border:1px solid rgba(251,113,133,0.2);border-radius:6px;padding:8px 14px;margin-bottom:1rem;font-size:11px;color:#fda4af;font-family:'JetBrains Mono',monospace;">
        ⚡ Data is automatically pulled from your Score Card subjects. Update marks in Score Card → switch here to refresh.
        <button onclick="__ssc.syncGap();__ssc.calcGap();" style="margin-left:10px;background:rgba(251,113,133,0.15);border:1px solid rgba(251,113,133,0.3);color:#fb7185;border-radius:4px;padding:3px 10px;font-size:11px;cursor:pointer;font-family:'JetBrains Mono',monospace;">↺ Sync Now</button>
      </div>

      <!-- Overall summary -->
      <div class="gap-summary">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#fb7185;margin-bottom:10px;">📊 Overall Summary (TM / T%)</div>
        <div class="gap-bar-wrap" style="height:14px;margin-bottom:6px;">
          <div class="gap-bar-fill" id="gap-summary-bar" style="width:0%;"></div>
        </div>
        <div class="gap-summary-grid">
          <div class="gap-sum-box"><div class="gap-sum-label">Total Obtained (TM)</div><div class="gap-sum-value" id="gap-tot-obt">—</div></div>
          <div class="gap-sum-box"><div class="gap-sum-label">Total Max Marks</div><div class="gap-sum-value" id="gap-tot-max">—</div></div>
          <div class="gap-sum-box"><div class="gap-sum-label">Total % (T%)</div><div class="gap-sum-value" id="gap-tot-pct">—</div></div>
          <div class="gap-sum-box hl"><div class="gap-sum-label">⚠ Total Shortfall</div><div class="gap-sum-value" id="gap-tot-short">—</div></div>
        </div>
      </div>

      <div id="gap-cards"></div>

      <!-- Legend -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.9rem 1.1rem;font-size:11px;color:var(--text-muted);line-height:2;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#fb7185;display:block;margin-bottom:6px;">Legend</span>
        <span style="color:#34d399;">■</span> ≥ 90% Outstanding &nbsp;
        <span style="color:#60a5fa;">■</span> ≥ 75% Good &nbsp;
        <span style="color:#fbbf24;">■</span> ≥ 60% Average &nbsp;
        <span style="color:#f87171;">■</span> &lt; 60% Needs Attention &nbsp;&nbsp;
        <span style="color:rgba(255,255,255,0.35);">│</span> White line = selected target %
      </div>
    </div><!-- /subpanel-gap -->
    `;
  },

  init() {
    /* Expose to window so inline onclick="" handlers work */
    window.__ssc = this;
    this.sscRows = JSON.parse(JSON.stringify(this.SSC_DEFAULT));
    this.gapSubjects = [];
    this.gapTargets  = {};
    this.renderRows();
    this.updateTotals();

    /* Wire student photo input */
    const picInput = document.getElementById('ssc-pic-input');
    if (picInput) {
      picInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.studentPhoto = ev.target.result;
          this._renderStudentPic(ev.target.result);
        };
        reader.readAsDataURL(file);
      });
    }

    /* Restore saved photo if any */
    if (this.studentPhoto) {
      this._renderStudentPic(this.studentPhoto);
    }
  },

  cleanup() {
    delete window.__ssc;
  },

  _renderStudentPic(src) {
    const inner = document.getElementById('ssc-pic-inner');
    if (!inner) return;
    inner.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    inner.style.padding = '0';
    inner.style.flexDirection = 'row';
    // Also update report card photo if visible
    const reportPic = document.getElementById('ssc-report-pic');
    if (reportPic) reportPic.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  },

  switchSub(sub) {
    ['scorecard','gap'].forEach(s => {
      const btn = document.getElementById('subtab-' + s);
      const panel = document.getElementById('subpanel-' + s);
      if (btn) btn.classList.toggle('active', s === sub);
      if (panel) panel.style.display = s === sub ? 'block' : 'none';
    });
    if (sub === 'gap') {
      this.syncGap();
      this.calcGap();
    }
  },

  barColor(pct) {
    if (pct >= 90) return '#34d399';
    if (pct >= 75) return '#60a5fa';
    if (pct >= 60) return '#fbbf24';
    return '#f87171';
  },

  grade(pct) {
    if (pct >= 90) return { g:'O',  desc:'Outstanding', bg:'rgba(52,211,153,0.1)',  border:'rgba(52,211,153,0.35)',  c:'#34d399' };
    if (pct >= 80) return { g:'A+', desc:'Excellent',   bg:'rgba(96,165,250,0.1)',  border:'rgba(96,165,250,0.35)',  c:'#60a5fa' };
    if (pct >= 70) return { g:'A',  desc:'Very Good',   bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.35)', c:'#a78bfa' };
    if (pct >= 60) return { g:'B',  desc:'Good',        bg:'rgba(56,189,248,0.1)',  border:'rgba(56,189,248,0.35)',  c:'#38bdf8' };
    if (pct >= 50) return { g:'C',  desc:'Average',     bg:'rgba(251,191,36,0.1)',  border:'rgba(251,191,36,0.35)',  c:'#fbbf24' };
    if (pct >= 40) return { g:'D',  desc:'Pass',        bg:'rgba(249,115,22,0.1)',  border:'rgba(249,115,22,0.35)',  c:'#f97316' };
    return                { g:'F',  desc:'Fail',        bg:'rgba(248,113,113,0.1)', border:'rgba(248,113,113,0.35)', c:'#f87171' };
  },

  renderRows() {
    const tbody = document.getElementById('ssc-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    this.sscRows.forEach((s, i) => {
      const clr    = this.SSC_COLORS[i % this.SSC_COLORS.length];
      const pctVal = s.max ? (s.obt / s.max) * 100 : 0;
      const pctClr = s.max ? this.barColor(pctVal) : 'var(--text-muted)';
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
          style="width:64px;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;"></td>
        <td><input type="number" value="${s.max}" placeholder="100" data-field="max" data-idx="${i}"
          style="width:64px;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;"></td>
        <td class="ssc-score-cell" style="font-size:12px;color:#38bdf8;font-family:'JetBrains Mono',monospace;">${s.obt} / ${s.max}</td>
        <td><input type="number" value="${s.rank||''}" placeholder="—" data-field="rank" data-idx="${i}"
          style="width:58px;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:#94a3b8;font-family:'JetBrains Mono',monospace;font-size:12px;padding:4px 6px;outline:none;-moz-appearance:textfield;"></td>
        <td class="ssc-pct-cell" style="font-weight:700;font-size:13px;color:${pctClr};font-family:'JetBrains Mono',monospace;">${pctTxt}</td>
        <td style="text-align:center;">
          ${this.sscRows.length > 1
            ? `<button onclick="__ssc.delRow(${i})" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:13px;padding:2px 5px;">✕</button>`
            : ''}
        </td>`;
      tbody.appendChild(tr);
    });

    /* delegated listener — avoids focus loss on re-render */
    tbody.oninput = (e) => {
      const inp   = e.target;
      const idx   = parseInt(inp.dataset.idx);
      const field = inp.dataset.field;
      if (isNaN(idx) || !field) return;
      if (field === 'name') {
        this.sscRows[idx].name = inp.value;
      } else if (field === 'obt') {
        this.sscRows[idx].obt = parseFloat(inp.value) || 0;
      } else if (field === 'max') {
        this.sscRows[idx].max = parseFloat(inp.value) || 0;
      } else if (field === 'rank') {
        this.sscRows[idx].rank = parseFloat(inp.value) || 0;
      }
      this.updateRow(idx);
      this.updateTotals();
    };
  },

  updateRow(i) {
    const s      = this.sscRows[i];
    const pctVal = s.max ? (s.obt / s.max) * 100 : 0;
    const pctClr = s.max ? this.barColor(pctVal) : 'var(--text-muted)';
    const pctTxt = s.max ? pctVal.toFixed(2) + '%' : '—';
    const tbody  = document.getElementById('ssc-tbody');
    if (!tbody) return;
    const row = tbody.querySelector(`tr[data-idx="${i}"]`);
    if (!row) return;
    row.querySelector('.ssc-score-cell').textContent = `${s.obt} / ${s.max}`;
    const pctCell = row.querySelector('.ssc-pct-cell');
    pctCell.textContent = pctTxt;
    pctCell.style.color = pctClr;
  },

  updateTotals() {
    let totObt = 0, totMax = 0;
    this.sscRows.forEach(s => { totObt += s.obt; totMax += s.max; });
    const tPct = totMax ? (totObt / totMax) * 100 : 0;
    const tr   = document.getElementById('ssc-tot-rank')?.value || '—';
    const g    = this.grade(tPct);

    const el = (id) => document.getElementById(id);

    /* footer */
    if (el('ssc-tot-obt'))   el('ssc-tot-obt').textContent   = totObt;
    if (el('ssc-tot-max'))   el('ssc-tot-max').textContent   = totMax;
    if (el('ssc-tot-score')) el('ssc-tot-score').textContent = totMax ? `${totObt} / ${totMax}` : '—';
    if (el('ssc-tot-pct'))  { el('ssc-tot-pct').textContent = totMax ? tPct.toFixed(2)+'%' : '—'; el('ssc-tot-pct').style.color = g.c; }

    /* summary strip */
    if (el('ssc-sum-tm'))  el('ssc-sum-tm').textContent  = totObt;
    if (el('ssc-sum-max')) el('ssc-sum-max').textContent = totMax;
    if (el('ssc-sum-tr'))  el('ssc-sum-tr').textContent  = tr;
    if (el('ssc-sum-pct')) { el('ssc-sum-pct').textContent = totMax ? tPct.toFixed(2)+'%' : '—'; el('ssc-sum-pct').style.color = g.c; }

    /* progress bar */
    if (el('ssc-prog-bar'))   { el('ssc-prog-bar').style.width = (totMax ? Math.min(100,tPct) : 0).toFixed(1)+'%'; el('ssc-prog-bar').style.background = g.c; }
    if (el('ssc-prog-label')) { el('ssc-prog-label').textContent = totMax ? tPct.toFixed(2)+'%' : '0%'; el('ssc-prog-label').style.color = g.c; }

    /* grade card */
    if (el('ssc-grade-card')) { el('ssc-grade-card').style.background = g.bg; el('ssc-grade-card').style.border = `1px solid ${g.border}`; }
    if (el('ssc-grade-val'))  { el('ssc-grade-val').textContent = g.g;    el('ssc-grade-val').style.color  = g.c; }
    if (el('ssc-grade-desc')) { el('ssc-grade-desc').textContent = g.desc; el('ssc-grade-desc').style.color = g.c; }
    if (el('ssc-grade-pct'))  { el('ssc-grade-pct').textContent = totMax ? tPct.toFixed(2)+'%' : '—%'; el('ssc-grade-pct').style.color = g.c; }
    if (el('ssc-grade-sub'))    el('ssc-grade-sub').textContent  = totMax ? `${totObt} out of ${totMax} marks` : '—';

    /* grade pill */
    if (el('ssc-grade-pill')) { el('ssc-grade-pill').textContent = `Grade: ${g.g} — ${g.desc}`; el('ssc-grade-pill').style.background = g.bg; el('ssc-grade-pill').style.border = `1px solid ${g.border}`; el('ssc-grade-pill').style.color = g.c; }

    /* student info display */
    const nameVal   = el('ssc-name')?.value   || '—';
    const clsVal    = el('ssc-class')?.value  || '—';
    const examVal   = el('ssc-exam')?.value   || '—';
    const rollVal   = el('ssc-roll')?.value   || '—';
    const schoolVal = el('ssc-school')?.value || '—';
    if (el('ssc-disp-name'))    el('ssc-disp-name').textContent  = nameVal;
    if (el('ssc-disp-class'))   el('ssc-disp-class').textContent = clsVal;
    if (el('ssc-disp-exam'))    el('ssc-disp-exam').textContent  = examVal;
    if (el('ssc-banner-name'))  el('ssc-banner-name').textContent   = nameVal;
    if (el('ssc-banner-class')) el('ssc-banner-class').textContent  = clsVal;
    if (el('ssc-banner-roll'))  el('ssc-banner-roll').textContent   = rollVal;
    if (el('ssc-banner-exam'))  el('ssc-banner-exam').textContent   = examVal;
    if (el('ssc-banner-school'))el('ssc-banner-school').textContent = schoolVal;

    /* mini bars */
    if (el('ssc-mini-bars')) {
      el('ssc-mini-bars').innerHTML = this.sscRows.map((s, i) => {
        const sp  = s.max ? (s.obt / s.max) * 100 : 0;
        const clr = this.SSC_COLORS[i % this.SSC_COLORS.length];
        const bc  = this.barColor(sp);
        return `<div style="display:flex;align-items:center;gap:8px;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${clr};min-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</span>
          <div style="flex:1;background:rgba(255,255,255,0.05);border-radius:99px;height:7px;overflow:hidden;">
            <div style="width:${sp.toFixed(1)}%;height:100%;background:${bc};border-radius:99px;transition:width 0.4s;"></div>
          </div>
          <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${bc};min-width:46px;text-align:right;">${s.max ? sp.toFixed(1)+'%' : '—'}</span>
          <span style="font-size:10px;color:var(--text-muted);min-width:48px;font-family:'JetBrains Mono',monospace;">${s.obt}/${s.max}</span>
        </div>`;
      }).join('');
    }
  },

  calc()   { this.updateTotals(); },
  addRow() { this.sscRows.push({ name:'New Subject', obt:0, max:100, rank:0 }); this.renderRows(); this.updateTotals(); },
  delRow(i){ this.sscRows.splice(i,1); this.renderRows(); this.updateTotals(); },
  reset()  {
    this.sscRows = JSON.parse(JSON.stringify(this.SSC_DEFAULT));
    const tr = document.getElementById('ssc-tot-rank');
    if (tr) tr.value = '';
    // Reset photo
    this.studentPhoto = null;
    const inner = document.getElementById('ssc-pic-inner');
    if (inner) { inner.innerHTML = '<span class="student-pic-icon">🎓</span><span class="student-pic-hint">Add<br>Photo</span>'; inner.style.padding=''; inner.style.flexDirection=''; }
    try { localStorage.removeItem('ch__ssc_photo'); localStorage.removeItem('ch_ssc_photo'); } catch {}
    const rp = document.getElementById('ssc-report-pic');
    if (rp) rp.innerHTML = '🎓';
    this.renderRows();
    this.updateTotals();
  },

  save() {
    const el = (id) => document.getElementById(id);
    const data = {
      info: { name: el('ssc-name')?.value, cls: el('ssc-class')?.value, exam: el('ssc-exam')?.value, roll: el('ssc-roll')?.value, school: el('ssc-school')?.value, year: el('ssc-year')?.value },
      rows: JSON.parse(JSON.stringify(this.sscRows)),
      totalRank: el('ssc-tot-rank')?.value,
      savedAt: new Date().toLocaleString()
    };
    // Save text data to multiple keys for resilience
    const dataStr = JSON.stringify(data);
    try { localStorage.setItem('ch__ssc_data', dataStr); } catch(e) { console.warn('[SSC] Save failed:', e); }
    try { localStorage.setItem('ssc_saved', dataStr); } catch(e) {} // legacy backup
    try { localStorage.setItem('ch_ssc_data', dataStr); } catch(e) {} // old prefix backup
    // Save photo separately (large base64)
    if (this.studentPhoto) {
      try { localStorage.setItem('ch__ssc_photo', this.studentPhoto); } catch(e) { console.warn('[SSC] Photo save failed (too large?):', e); }
    }
    const msg = el('ssc-save-msg');
    if (msg) { msg.textContent = '✓ Saved at ' + data.savedAt; msg.style.display = 'inline'; setTimeout(() => { msg.style.display='none'; }, 3000); }
  },

  load() {
    // Try new key first, fall back to legacy key
    let raw = null;
    try { raw = localStorage.getItem('ch__ssc_data') || localStorage.getItem('ch_ssc_data') || localStorage.getItem('ssc_saved'); } catch(e) {}
    if (!raw) { alert('No saved data found. Please save first using the 💾 Save button.'); return; }
    let data;
    try { data = JSON.parse(raw); } catch(e) { alert('Saved data is corrupted.'); return; }
    const el = (id) => document.getElementById(id);
    if (el('ssc-name'))   el('ssc-name').value   = data.info?.name   || '';
    if (el('ssc-class'))  el('ssc-class').value  = data.info?.cls    || '';
    if (el('ssc-exam'))   el('ssc-exam').value   = data.info?.exam   || '';
    if (el('ssc-roll'))   el('ssc-roll').value   = data.info?.roll   || '';
    if (el('ssc-school')) el('ssc-school').value = data.info?.school || '';
    if (el('ssc-year'))   el('ssc-year').value   = data.info?.year   || '';
    if (el('ssc-tot-rank')) el('ssc-tot-rank').value = data.totalRank || '';
    if (data.rows && data.rows.length) this.sscRows = data.rows;
    this.renderRows();
    this.updateTotals();
    // Restore student photo from separate key
    const photo = localStorage.getItem('ch__ssc_photo') || localStorage.getItem('ch_ssc_photo') || data.studentPhoto || null;
    if (photo) { this.studentPhoto = photo; this._renderStudentPic(photo); }
    const msg = el('ssc-save-msg');
    if (msg) { msg.textContent = '✓ Loaded (saved '+(data.savedAt||'—')+')'; msg.style.color='#fcd34d'; msg.style.display='inline'; setTimeout(()=>{ msg.style.display='none'; msg.style.color='#34d399'; },4000); }
  },

  /* ── Gap Analysis ── */
  syncGap() {
    const colors = ['#60a5fa','#a78bfa','#fb923c','#f472b6','#facc15','#818cf8','#e879f9'];
    const clsMap  = ['math','physics','chem','custom','custom','custom','custom'];
    this.gapSubjects = this.sscRows.map((s, i) => ({
      key:   'ssc_' + i,
      label: s.name,
      short: ['MM','PM','CM','NM','NM','NM','NM'][i] || 'NM',
      color: colors[i % colors.length],
      cls:   clsMap[i % clsMap.length],
      obt:   s.obt,
      max:   s.max,
    }));
    const newKeys = new Set(this.gapSubjects.map(s => s.key));
    Object.keys(this.gapTargets).forEach(k => { if (!newKeys.has(k)) delete this.gapTargets[k]; });
  },

  gapBarColor(pct) {
    if (pct >= 90) return '#34d399';
    if (pct >= 75) return '#60a5fa';
    if (pct >= 60) return '#fbbf24';
    return '#f87171';
  },

  calcGap() {
    if (!this.gapSubjects.length) this.syncGap();
    const wrap = document.getElementById('gap-cards');
    if (!wrap) return;
    wrap.innerHTML = '';
    let totObt = 0, totMax = 0;

    this.gapSubjects.forEach(s => {
      const obt  = s.obt || 0;
      const max  = s.max || 0;
      const gap  = Math.max(0, max - obt);
      const pct  = max ? (obt / max) * 100 : 0;
      const tgt  = this.gapTargets[s.key] || 100;
      const need = max ? Math.max(0, Math.ceil((tgt / 100) * max) - obt) : 0;
      totObt += obt; totMax += max;
      const barW   = max ? Math.min(100, (obt/max)*100).toFixed(1) : 0;
      const tgtW   = Math.min(100, tgt);
      const barClr = this.gapBarColor(pct);
      const targets = [60, 70, 75, 80, 90, 95, 100];

      wrap.innerHTML += `
      <div class="gap-subject-card ${s.cls}" style="margin-bottom:10px;">
        <div class="gap-header">
          <div><div class="gap-subj-name">${s.label} <span style="color:var(--text-muted);font-size:11px;">(${s.short})</span></div></div>
          <div class="gap-chips">
            <span class="gap-chip obtained">Obtained: ${obt}</span>
            <span class="gap-chip maximum">Max: ${max}</span>
            <span class="gap-chip pct-done">${pct.toFixed(2)}%</span>
            <span class="gap-chip shortfall">⚠ ${gap} marks short of 100%</span>
          </div>
        </div>
        <div class="gap-bar-wrap">
          <div class="gap-bar-fill" style="width:${barW}%;background:${barClr};"></div>
          <div class="gap-bar-target" style="left:${tgtW}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;margin-bottom:8px;">
          <span>0</span><span style="color:${barClr};font-weight:600;">${obt} scored</span><span>${max}</span>
        </div>
        <div class="gap-target-row">
          <span style="font-size:11px;color:var(--text-muted);">Target %:</span>
          <div class="gap-target-chips">
            ${targets.map(t => `<span class="gap-target-chip ${this.gapTargets[s.key]===t||(!(s.key in this.gapTargets)&&t===100)?'active-t':''}" onclick="__ssc.setTarget('${s.key}',${t})">${t}%</span>`).join('')}
          </div>
          <div class="gap-need-label">
            ${need > 0
              ? `<span style="color:#fb7185;">Need <strong>${need}</strong> more mark${need>1?'s':''} for ${tgt}%</span>`
              : `<span style="color:#34d399;">✓ Already at ${tgt}% target!</span>`}
          </div>
        </div>
      </div>`;
    });

    const totPct = totMax ? (totObt/totMax)*100 : 0;
    const el = (id) => document.getElementById(id);
    if (el('gap-tot-obt'))   el('gap-tot-obt').textContent   = totObt;
    if (el('gap-tot-max'))   el('gap-tot-max').textContent   = totMax;
    if (el('gap-tot-pct'))   el('gap-tot-pct').textContent   = totMax ? totPct.toFixed(2)+'%' : '—';
    if (el('gap-tot-short')) el('gap-tot-short').textContent = Math.max(0, totMax-totObt) + ' marks';
    const sBar = el('gap-summary-bar');
    if (sBar) { sBar.style.width = (totMax ? Math.min(100, totPct) : 0).toFixed(1)+'%'; sBar.style.background = this.gapBarColor(totPct); }
  },

  setTarget(key, val) { this.gapTargets[key] = val; this.calcGap(); },
};
