/* ============================================================
   CalcHubApp — modules/scorecard.js
   Student Score Card — Marks, Grades, Percentages, Gap Analysis
   ============================================================ */

const GRADE_SCALE = [
  { min: 90, grade: 'O',  label: 'Outstanding', color: '#d4ff3a' },
  { min: 80, grade: 'A+', label: 'Excellent',   color: '#34d399' },
  { min: 70, grade: 'A',  label: 'Very Good',   color: '#38bdf8' },
  { min: 60, grade: 'B+', label: 'Good',        color: '#a78bfa' },
  { min: 50, grade: 'B',  label: 'Average',     color: '#f59e0b' },
  { min: 40, grade: 'C',  label: 'Pass',        color: '#fb923c' },
  { min:  0, grade: 'F',  label: 'Fail',        color: '#f87171' },
];

function getGrade(pct) {
  return GRADE_SCALE.find(g => pct >= g.min) || GRADE_SCALE.at(-1);
}

export const scorecardModule = {
  id:    'scorecard',
  label: 'Score Card',
  icon:  '🎓',
  desc:  'Student Score Card',
  accent: '#38bdf8',
  accentRgb: '56,189,248',

  subjects: [
    { id: 's1', name: 'Mathematics',  max: 100 },
    { id: 's2', name: 'Science',      max: 100 },
    { id: 's3', name: 'English',      max: 100 },
    { id: 's4', name: 'Social',       max: 100 },
    { id: 's5', name: 'Language',     max: 100 },
  ],

  render() {
    const subjectRows = this.subjects.map(s => `
      <div class="field-card sc-subj-row" data-id="${s.id}">
        <div class="sc-subj-header">
          <input class="sc-subj-name" data-id="${s.id}" value="${s.name}" placeholder="Subject name" style="background:transparent;border:none;color:var(--text);font-family:'JetBrains Mono',monospace;font-weight:600;font-size:13px;outline:none;width:140px">
          <div class="field-row" style="gap:6px;margin:0">
            <input type="number" class="field-input sc-obtained sc-in" data-id="${s.id}" placeholder="Obtained" value="75" min="0" style="width:90px">
            <span style="color:var(--muted);font-size:13px">/ </span>
            <input type="number" class="field-input sc-max sc-in" data-id="${s.id}" placeholder="Max" value="${s.max}" min="1" style="width:75px">
          </div>
        </div>
        <div class="sc-bar-wrap"><div class="sc-bar-fill" data-id="${s.id}"></div></div>
      </div>
    `).join('');

    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#38bdf8;background:rgba(56,189,248,.1);border-color:rgba(56,189,248,.3)">STUDENT · REPORT</span>
      <h2 class="mod-title" style="color:#38bdf8">Score Card</h2>
      <p class="mod-desc">Enter marks for each subject to generate a full grade report with gap analysis.</p>
    </div>

    <!-- Student Info -->
    <div class="sc-info-bar">
      <div class="sc-info-field">
        <label>Student Name</label>
        <input id="sc-name" type="text" placeholder="Enter name…" value="Student">
      </div>
      <div class="sc-info-field">
        <label>Class / Grade</label>
        <input id="sc-class" type="text" placeholder="e.g. 10th A" value="10th">
      </div>
      <div class="sc-info-field">
        <label>Roll No.</label>
        <input id="sc-roll" type="text" placeholder="Roll number" value="01">
      </div>
      <div class="sc-info-field">
        <label>Exam</label>
        <input id="sc-exam" type="text" placeholder="e.g. Final 2024" value="Annual Exam">
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap;align-items:center">
      <button class="calc-btn-sm blue" id="sc-add-subj">+ Add Subject</button>
      <button class="calc-btn-sm red" id="sc-clear">✕ Clear All</button>
    </div>

    <div id="sc-subjects">${subjectRows}</div>

    <button class="calc-btn blue" id="sc-calc">GENERATE REPORT</button>

    <div id="sc-report" style="display:none">
      <div class="sc-report-card" id="sc-report-inner"></div>
      <div class="sc-gap-section" id="sc-gap-inner"></div>
    </div>
    `;
  },

  init() {
    document.getElementById('sc-calc')?.addEventListener('click', () => this.generate());
    document.getElementById('sc-add-subj')?.addEventListener('click', () => this.addSubject());
    document.getElementById('sc-clear')?.addEventListener('click', () => this.clearAll());
    this._attachListeners();
  },

  _attachListeners() {
    document.querySelectorAll('.sc-in').forEach(el => {
      el.addEventListener('input', () => this._updateBar(el.dataset.id));
    });
    document.querySelectorAll('.sc-subj-name').forEach(el => {
      el.addEventListener('input', e => {
        const s = this.subjects.find(s => s.id === e.target.dataset.id);
        if (s) s.name = e.target.value;
      });
    });
    // Init bars
    this.subjects.forEach(s => this._updateBar(s.id));
  },

  _updateBar(id) {
    const oEl   = document.querySelector(`.sc-obtained[data-id="${id}"]`);
    const mEl   = document.querySelector(`.sc-max[data-id="${id}"]`);
    const bar   = document.querySelector(`.sc-bar-fill[data-id="${id}"]`);
    if (!oEl || !mEl || !bar) return;
    const pct   = Math.min(100, (parseFloat(oEl.value) || 0) / (parseFloat(mEl.value) || 100) * 100);
    const grade = getGrade(pct);
    bar.style.width = pct + '%';
    bar.style.background = grade.color;
  },

  addSubject() {
    const id = 's' + Date.now();
    this.subjects.push({ id, name: 'New Subject', max: 100 });
    const container = document.getElementById('sc-subjects');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'field-card sc-subj-row';
    div.dataset.id = id;
    div.innerHTML = `
      <div class="sc-subj-header">
        <input class="sc-subj-name" data-id="${id}" value="New Subject" placeholder="Subject name" style="background:transparent;border:none;color:var(--text);font-family:'JetBrains Mono',monospace;font-weight:600;font-size:13px;outline:none;width:140px">
        <div class="field-row" style="gap:6px;margin:0">
          <input type="number" class="field-input sc-obtained sc-in" data-id="${id}" placeholder="Obtained" value="0" min="0" style="width:90px">
          <span style="color:var(--muted);font-size:13px">/ </span>
          <input type="number" class="field-input sc-max sc-in" data-id="${id}" placeholder="Max" value="100" min="1" style="width:75px">
        </div>
      </div>
      <div class="sc-bar-wrap"><div class="sc-bar-fill" data-id="${id}"></div></div>
    `;
    container.appendChild(div);
    this._attachListeners();
  },

  clearAll() {
    document.querySelectorAll('.sc-obtained').forEach(el => { el.value = '0'; this._updateBar(el.dataset.id); });
    document.getElementById('sc-report').style.display = 'none';
  },

  generate() {
    const name  = document.getElementById('sc-name')?.value  || 'Student';
    const cls   = document.getElementById('sc-class')?.value || '';
    const roll  = document.getElementById('sc-roll')?.value  || '';
    const exam  = document.getElementById('sc-exam')?.value  || '';

    const rows = [];
    let totalObtained = 0, totalMax = 0;

    document.querySelectorAll('.sc-subj-row').forEach(row => {
      const id   = row.dataset.id;
      const n    = row.querySelector('.sc-subj-name')?.value || 'Subject';
      const got  = parseFloat(row.querySelector('.sc-obtained')?.value) || 0;
      const max  = parseFloat(row.querySelector('.sc-max')?.value) || 100;
      const pct  = max > 0 ? (got / max * 100) : 0;
      const g    = getGrade(pct);
      rows.push({ id, name: n, got, max, pct, grade: g });
      totalObtained += got;
      totalMax      += max;
    });

    const totalPct = totalMax > 0 ? (totalObtained / totalMax * 100) : 0;
    const overall  = getGrade(totalPct);

    // Subject rows HTML
    const subjectHTML = rows.map(r => `
      <tr>
        <td>${r.name}</td>
        <td class="mono">${r.got}</td>
        <td class="mono">${r.max}</td>
        <td class="mono">${r.pct.toFixed(1)}%</td>
        <td><span class="grade-badge" style="color:${r.grade.color};background:${r.grade.color}18;border:1px solid ${r.grade.color}44">${r.grade.grade}</span></td>
        <td>${r.grade.label}</td>
      </tr>
    `).join('');

    // Gap analysis
    const gapHTML = rows.map(r => {
      const gap   = r.max - r.got;
      const needed90 = Math.max(0, Math.ceil(r.max * 0.9) - r.got);
      const needed80 = Math.max(0, Math.ceil(r.max * 0.8) - r.got);
      return `
        <div class="gap-row">
          <div class="gap-subj">${r.name}</div>
          <div class="gap-pct" style="color:${r.grade.color}">${r.pct.toFixed(1)}%</div>
          <div class="gap-chips-row">
            ${gap > 0 ? `<span class="gap-chip red">-${gap} marks lost</span>` : '<span class="gap-chip green">Full marks!</span>'}
            ${needed90 > 0 ? `<span class="gap-chip amber">Need +${needed90} for A+</span>` : ''}
            ${needed80 > 0 && needed80 !== needed90 ? `<span class="gap-chip blue">Need +${needed80} for A</span>` : ''}
          </div>
          <div class="sc-bar-wrap"><div class="sc-bar-fill" style="width:${r.pct}%;background:${r.grade.color}"></div></div>
        </div>
      `;
    }).join('');

    const panel = document.getElementById('sc-report');
    const inner = document.getElementById('sc-report-inner');
    const gap   = document.getElementById('sc-gap-inner');

    inner.innerHTML = `
      <div class="sc-card-header" style="border-color:${overall.color}44">
        <div class="sc-card-info">
          <div class="sc-student-name">${name}</div>
          <div class="sc-meta">${cls ? `Class: ${cls}` : ''} ${roll ? `· Roll: ${roll}` : ''} ${exam ? `· ${exam}` : ''}</div>
        </div>
        <div class="sc-overall" style="color:${overall.color}">
          <div class="sc-grade-big">${overall.grade}</div>
          <div class="sc-pct-big">${totalPct.toFixed(1)}%</div>
          <div class="sc-label-small">${overall.label}</div>
        </div>
      </div>
      <div style="margin:12px 0 4px;font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase">SUBJECT BREAKDOWN</div>
      <div class="table-wrap">
        <table class="ref-table">
          <thead>
            <tr><th>Subject</th><th>Obtained</th><th>Max</th><th>%</th><th>Grade</th><th>Remark</th></tr>
          </thead>
          <tbody>${subjectHTML}</tbody>
          <tfoot>
            <tr style="border-top:1px solid var(--border)">
              <td><strong>TOTAL</strong></td>
              <td class="mono"><strong>${totalObtained}</strong></td>
              <td class="mono"><strong>${totalMax}</strong></td>
              <td class="mono" style="color:${overall.color}"><strong>${totalPct.toFixed(1)}%</strong></td>
              <td><span class="grade-badge" style="color:${overall.color};background:${overall.color}18;border:1px solid ${overall.color}44">${overall.grade}</span></td>
              <td><strong>${overall.label}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    gap.innerHTML = `
      <div style="margin:1.25rem 0 0.75rem;font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;border-top:1px solid var(--border);padding-top:1rem">GAP ANALYSIS — IMPROVEMENT PLAN</div>
      ${gapHTML}
    `;

    panel.style.display = 'block';
  }
};
