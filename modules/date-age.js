/* ============================================================
   CalcHubApp — modules/date-age.js
   Date & Age Calculation — age, difference, future dates
   ============================================================ */

export const dateAgeModule = {
  id:    'date-age',
  label: 'Date / Age',
  icon:  '📅',
  desc:  'Date And Age Calculation',
  accent: '#34d399',
  accentRgb: '52,211,153',

  render() {
    const today = this._fmtDate(new Date());
    const birth = '1990-01-01';

    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#34d399;background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3)">CALC · DATE & AGE</span>
      <h2 class="mod-title" style="color:#34d399">Date & Age Calculator</h2>
      <p class="mod-desc">Calculate exact age, date differences, future dates, and working days.</p>
    </div>

    <!-- Sub-tabs -->
    <div class="sub-tabs-row">
      <button class="sub-tab active-green" data-tab="age"        id="dt-tab-age">Age</button>
      <button class="sub-tab"             data-tab="diff"       id="dt-tab-diff">Date Diff</button>
      <button class="sub-tab"             data-tab="future"     id="dt-tab-future">Future Date</button>
      <button class="sub-tab"             data-tab="workdays"   id="dt-tab-workdays">Work Days</button>
    </div>

    <!-- AGE PANEL -->
    <div id="dt-panel-age" class="dt-panel">
      <div class="calc-grid">
        <div class="field-card">
          <div class="field-label">Date of Birth</div>
          <input type="date" id="age-dob" class="field-input" value="${birth}">
        </div>
        <div class="field-card">
          <div class="field-label">As on Date</div>
          <input type="date" id="age-ref" class="field-input" value="${today}">
        </div>
      </div>
      <button class="calc-btn green" id="age-calc">CALCULATE AGE</button>
      <div id="age-results" class="results-panel" style="display:none">
        <div class="results-grid" id="age-grid"></div>
        <div class="age-milestones" id="age-milestones"></div>
      </div>
    </div>

    <!-- DATE DIFF PANEL -->
    <div id="dt-panel-diff" class="dt-panel" style="display:none">
      <div class="calc-grid">
        <div class="field-card">
          <div class="field-label">Start Date</div>
          <input type="date" id="diff-start" class="field-input" value="${today}">
        </div>
        <div class="field-card">
          <div class="field-label">End Date</div>
          <input type="date" id="diff-end" class="field-input" value="${today}">
        </div>
      </div>
      <button class="calc-btn green" id="diff-calc">CALCULATE DIFFERENCE</button>
      <div id="diff-results" class="results-panel" style="display:none">
        <div class="results-grid" id="diff-grid"></div>
      </div>
    </div>

    <!-- FUTURE DATE PANEL -->
    <div id="dt-panel-future" class="dt-panel" style="display:none">
      <div class="calc-grid">
        <div class="field-card">
          <div class="field-label">Start Date</div>
          <input type="date" id="fut-start" class="field-input" value="${today}">
        </div>
        <div class="field-card">
          <div class="field-label">Add Days</div>
          <div class="field-row">
            <input type="number" id="fut-days" class="field-input" value="30" min="0">
            <span class="field-unit">days</span>
          </div>
        </div>
        <div class="field-card">
          <div class="field-label">Add Months</div>
          <div class="field-row">
            <input type="number" id="fut-months" class="field-input" value="0" min="0">
            <span class="field-unit">months</span>
          </div>
        </div>
        <div class="field-card">
          <div class="field-label">Add Years</div>
          <div class="field-row">
            <input type="number" id="fut-years" class="field-input" value="0" min="0">
            <span class="field-unit">years</span>
          </div>
        </div>
      </div>
      <button class="calc-btn green" id="fut-calc">FIND FUTURE DATE</button>
      <div id="fut-results" class="results-panel" style="display:none">
        <div class="results-grid" id="fut-grid"></div>
      </div>
    </div>

    <!-- WORK DAYS PANEL -->
    <div id="dt-panel-workdays" class="dt-panel" style="display:none">
      <div class="calc-grid">
        <div class="field-card">
          <div class="field-label">From Date</div>
          <input type="date" id="wd-start" class="field-input" value="${today}">
        </div>
        <div class="field-card">
          <div class="field-label">To Date</div>
          <input type="date" id="wd-end" class="field-input" value="${today}">
        </div>
        <div class="field-card">
          <div class="field-label">Holidays (count)</div>
          <div class="field-row">
            <input type="number" id="wd-holidays" class="field-input" value="0" min="0">
            <span class="field-unit">days</span>
          </div>
          <div class="field-hint">Public holidays in the period</div>
        </div>
      </div>
      <button class="calc-btn green" id="wd-calc">CALCULATE WORK DAYS</button>
      <div id="wd-results" class="results-panel" style="display:none">
        <div class="results-grid" id="wd-grid"></div>
      </div>
    </div>
    `;
  },

  init() {
    // Tab switching
    document.querySelectorAll('.sub-tab[data-tab]').forEach(btn => {
      btn.addEventListener('click', e => {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.sub-tab[data-tab]').forEach(b => b.classList.remove('active-green'));
        e.target.classList.add('active-green');
        document.querySelectorAll('.dt-panel').forEach(p => p.style.display = 'none');
        const panel = document.getElementById(`dt-panel-${tab}`);
        if (panel) panel.style.display = 'block';
      });
    });

    document.getElementById('age-calc')?.addEventListener('click', () => this.calcAge());
    document.getElementById('diff-calc')?.addEventListener('click', () => this.calcDiff());
    document.getElementById('fut-calc')?.addEventListener('click', () => this.calcFuture());
    document.getElementById('wd-calc')?.addEventListener('click', () => this.calcWorkdays());
  },

  calcAge() {
    const dob = new Date(document.getElementById('age-dob')?.value);
    const ref = new Date(document.getElementById('age-ref')?.value);
    if (isNaN(dob) || isNaN(ref)) return;

    let years  = ref.getFullYear() - dob.getFullYear();
    let months = ref.getMonth()    - dob.getMonth();
    let days   = ref.getDate()     - dob.getDate();

    if (days   < 0) { months--; const pm = new Date(ref.getFullYear(), ref.getMonth(), 0); days += pm.getDate(); }
    if (months < 0) { years--; months += 12; }

    const totalDays   = Math.floor((ref - dob) / 864e5);
    const totalWeeks  = Math.floor(totalDays / 7);
    const totalHours  = totalDays * 24;
    const totalMonths = years * 12 + months;

    // Next birthday
    const nextBday = new Date(ref.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday <= ref) nextBday.setFullYear(nextBday.getFullYear() + 1);
    const daysToNext = Math.ceil((nextBday - ref) / 864e5);

    const grid = document.getElementById('age-grid');
    if (grid) {
      grid.innerHTML = `
        ${this._metric('Age', `${years}y ${months}m ${days}d`, 'Years, months, days', true)}
        ${this._metric('Total Days', totalDays.toLocaleString(), 'Days lived')}
        ${this._metric('Total Weeks', totalWeeks.toLocaleString(), 'Complete weeks')}
        ${this._metric('Total Months', totalMonths.toLocaleString(), 'Complete months')}
        ${this._metric('Total Hours', totalHours.toLocaleString(), 'Approximate hours')}
        ${this._metric('Next Birthday', `in ${daysToNext} days`, nextBday.toDateString())}
      `;
    }

    const milestones = document.getElementById('age-milestones');
    if (milestones) {
      const mList = [25, 30, 40, 50, 60, 75, 100].map(age => {
        const mDate = new Date(dob.getFullYear() + age, dob.getMonth(), dob.getDate());
        const diff  = Math.ceil((mDate - ref) / 864e5);
        const past  = diff <= 0;
        return `<div class="milestone-row">
          <span class="milestone-age">${age} yrs</span>
          <span class="milestone-date">${mDate.toDateString()}</span>
          <span class="milestone-status ${past ? 'past' : 'future'}">${past ? `${Math.abs(diff)} days ago` : `in ${diff} days`}</span>
        </div>`;
      }).join('');
      milestones.innerHTML = `
        <div style="margin-top:1rem;font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">AGE MILESTONES</div>
        ${mList}
      `;
    }

    document.getElementById('age-results').style.display = 'block';
  },

  calcDiff() {
    const s = new Date(document.getElementById('diff-start')?.value);
    const e = new Date(document.getElementById('diff-end')?.value);
    if (isNaN(s) || isNaN(e)) return;

    const sign = e >= s ? 1 : -1;
    const [a, b] = e >= s ? [s, e] : [e, s];
    const totalDays = Math.floor((b - a) / 864e5);

    let years  = b.getFullYear() - a.getFullYear();
    let months = b.getMonth()    - a.getMonth();
    let days   = b.getDate()     - a.getDate();
    if (days   < 0) { months--; days += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }

    const grid = document.getElementById('diff-grid');
    if (grid) {
      grid.innerHTML = `
        ${this._metric('Difference', `${years}y ${months}m ${days}d`, sign < 0 ? 'End is before start' : '', true)}
        ${this._metric('Total Days', (totalDays * sign).toLocaleString(), 'Signed calendar days')}
        ${this._metric('Weeks', Math.floor(totalDays / 7) + ' weeks', Math.floor(totalDays / 7) * 7 + ' days')}
        ${this._metric('Hours', (totalDays * 24).toLocaleString(), 'Approximate')}
        ${this._metric('Minutes', (totalDays * 1440).toLocaleString(), 'Approximate')}
        ${this._metric('Months', (years * 12 + months).toLocaleString(), 'Complete months')}
      `;
    }
    document.getElementById('diff-results').style.display = 'block';
  },

  calcFuture() {
    const start  = new Date(document.getElementById('fut-start')?.value);
    const days   = parseInt(document.getElementById('fut-days')?.value)   || 0;
    const months = parseInt(document.getElementById('fut-months')?.value) || 0;
    const years  = parseInt(document.getElementById('fut-years')?.value)  || 0;
    if (isNaN(start)) return;

    const result = new Date(start);
    result.setFullYear(result.getFullYear() + years);
    result.setMonth(result.getMonth() + months);
    result.setDate(result.getDate() + days);

    const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    const grid = document.getElementById('fut-grid');
    if (grid) {
      grid.innerHTML = `
        ${this._metric('Future Date', result.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}), result.toDateString(), true)}
        ${this._metric('Day of Week', dow[result.getDay()], '')}
        ${this._metric('Total Added', `${years}y ${months}m ${days}d`, 'Combined addition')}
        ${this._metric('Quarter', 'Q' + Math.ceil((result.getMonth() + 1) / 3), result.getFullYear().toString())}
        ${this._metric('Week #', this._weekNum(result).toString(), 'ISO week of year')}
        ${this._metric('Unix Time', result.getTime().toString(), 'Milliseconds since epoch')}
      `;
    }
    document.getElementById('fut-results').style.display = 'block';
  },

  calcWorkdays() {
    const s        = new Date(document.getElementById('wd-start')?.value);
    const e        = new Date(document.getElementById('wd-end')?.value);
    const holidays = parseInt(document.getElementById('wd-holidays')?.value) || 0;
    if (isNaN(s) || isNaN(e)) return;

    const [a, b] = s <= e ? [s, e] : [e, s];
    let total = 0, weekends = 0, workdays = 0;
    const cur = new Date(a);
    while (cur <= b) {
      total++;
      const wd = cur.getDay();
      if (wd === 0 || wd === 6) weekends++;
      else workdays++;
      cur.setDate(cur.getDate() + 1);
    }
    const effectiveWorkdays = Math.max(0, workdays - holidays);

    const grid = document.getElementById('wd-grid');
    if (grid) {
      grid.innerHTML = `
        ${this._metric('Work Days', effectiveWorkdays.toString(), 'Excl. weekends & holidays', true)}
        ${this._metric('Calendar Days', total.toString(), 'Total span')}
        ${this._metric('Weekends', weekends.toString(), 'Saturdays + Sundays')}
        ${this._metric('Weekdays', workdays.toString(), 'Mon – Fri')}
        ${this._metric('Holidays', holidays.toString(), 'Entered by you')}
        ${this._metric('Weeks', Math.floor(total / 7).toString(), 'Complete weeks')}
      `;
    }
    document.getElementById('wd-results').style.display = 'block';
  },

  _weekNum(d) {
    const s = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    s.setUTCDate(s.getUTCDate() + 4 - (s.getUTCDay() || 7));
    const y = new Date(Date.UTC(s.getUTCFullYear(), 0, 1));
    return Math.ceil((((s - y) / 864e5) + 1) / 7);
  },

  _fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _metric(label, value, hint, highlight = false) {
    return `<div class="res-box ${highlight ? 'hi-green' : ''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint ? `<div class="res-hint">${hint}</div>` : ''}
    </div>`;
  }
};
