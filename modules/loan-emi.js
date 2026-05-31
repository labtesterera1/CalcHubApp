/* ============================================================
   CalcHubApp — modules/loan-emi.js
   Personal Loan EMI Calculator — full amortisation schedule
   ============================================================ */

export const loanEmiModule = {
  id:    'loan-emi',
  label: 'Loan EMI',
  icon:  '💰',
  desc:  'Personal Loan EMI Calculator',
  accent: '#f97316',
  accentRgb: '249,115,22',

  render() {
    return `
    <div class="mod-header">
      <span class="mod-badge" style="color:#f97316;background:rgba(249,115,22,.1);border-color:rgba(249,115,22,.3)">FINANCE · EMI</span>
      <h2 class="mod-title" style="color:#f97316">Loan EMI Calculator</h2>
      <p class="mod-desc">Calculate EMI, total interest, and full amortisation schedule for personal loans.</p>
    </div>

    <div class="calc-grid">
      <div class="field-card">
        <div class="field-label">Loan Amount (Principal)</div>
        <div class="field-row">
          <span class="field-prefix">₹</span>
          <input type="number" id="emi-principal" class="field-input emi-in" value="500000" min="1000" step="1000">
        </div>
        <div class="field-hint">Total loan amount requested</div>
      </div>

      <div class="field-card">
        <div class="field-label">Annual Interest Rate</div>
        <div class="field-row">
          <input type="number" id="emi-rate" class="field-input emi-in" value="10.5" min="0.1" max="50" step="0.1">
          <span class="field-unit">% p.a.</span>
        </div>
        <div class="field-hint">Annual interest rate (reducing balance)</div>
      </div>

      <div class="field-card">
        <div class="field-label">Loan Tenure</div>
        <div class="field-row">
          <input type="number" id="emi-tenure" class="field-input emi-in" value="60" min="1" max="360">
          <select id="emi-tenure-unit" class="field-select emi-in" style="max-width:100px">
            <option value="months" selected>Months</option>
            <option value="years">Years</option>
          </select>
        </div>
        <div class="field-hint">Duration of the loan repayment</div>
      </div>

      <div class="field-card">
        <div class="field-label">Processing Fee</div>
        <div class="field-row">
          <input type="number" id="emi-fee" class="field-input emi-in" value="1" min="0" max="10" step="0.1">
          <span class="field-unit">%</span>
        </div>
        <div class="field-hint">One-time processing / disbursal fee</div>
      </div>

      <div class="field-card">
        <div class="field-label">Pre-payment per Year</div>
        <div class="field-row">
          <span class="field-prefix">₹</span>
          <input type="number" id="emi-prepay" class="field-input emi-in" value="0" min="0" step="1000">
        </div>
        <div class="field-hint">Optional annual lump-sum pre-payment</div>
      </div>

      <div class="field-card">
        <div class="field-label">Loan Start</div>
        <div class="field-row">
          <input type="month" id="emi-start" class="field-input emi-in">
        </div>
        <div class="field-hint">First EMI payment month</div>
      </div>
    </div>

    <button class="calc-btn orange" id="emi-calc">CALCULATE EMI</button>

    <div id="emi-results" style="display:none">
      <div class="results-grid" id="emi-grid" style="margin-bottom:1rem"></div>

      <!-- Donut chart placeholder (CSS-based) -->
      <div class="emi-donut-wrap">
        <div class="emi-donut" id="emi-donut">
          <div class="emi-donut-hole">
            <div class="emi-donut-label">Total</div>
            <div class="emi-donut-val" id="emi-donut-val">—</div>
          </div>
        </div>
        <div class="emi-legend" id="emi-legend"></div>
      </div>

      <!-- Amortisation toggle -->
      <div style="margin-top:1rem;margin-bottom:8px;display:flex;gap:8px;align-items:center">
        <button class="calc-btn-sm orange" id="emi-toggle-schedule">Show Schedule</button>
        <span style="color:var(--muted);font-size:12px">Monthly breakdown of principal + interest</span>
      </div>
      <div id="emi-schedule-wrap" style="display:none">
        <div class="table-wrap" style="max-height:320px;overflow-y:auto">
          <table class="ref-table">
            <thead>
              <tr><th>#</th><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>
            </thead>
            <tbody id="emi-schedule-body"></tbody>
          </table>
        </div>
      </div>

      <div class="results-note" id="emi-note"></div>
    </div>
    `;
  },

  init() {
    // Set default start month
    const now = new Date();
    const startEl = document.getElementById('emi-start');
    if (startEl) startEl.value = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;

    document.querySelectorAll('.emi-in').forEach(el => {
      el.addEventListener('input', () => this.calculate());
    });
    document.getElementById('emi-calc')?.addEventListener('click', () => this.calculate());
    document.getElementById('emi-toggle-schedule')?.addEventListener('click', () => {
      const sw = document.getElementById('emi-schedule-wrap');
      if (!sw) return;
      const isOpen = sw.style.display !== 'none';
      sw.style.display = isOpen ? 'none' : 'block';
      document.getElementById('emi-toggle-schedule').textContent = isOpen ? 'Show Schedule' : 'Hide Schedule';
    });
    this.calculate();
  },

  calculate() {
    const P         = parseFloat(document.getElementById('emi-principal')?.value) || 500000;
    const annualR   = parseFloat(document.getElementById('emi-rate')?.value)      || 10.5;
    let   N         = parseFloat(document.getElementById('emi-tenure')?.value)    || 60;
    const tenureUnit = document.getElementById('emi-tenure-unit')?.value || 'months';
    const feeP      = parseFloat(document.getElementById('emi-fee')?.value)       || 1;
    const prepay    = parseFloat(document.getElementById('emi-prepay')?.value)    || 0;

    if (tenureUnit === 'years') N = N * 12;

    const r   = annualR / 100 / 12;  // Monthly rate
    let   emi = 0;

    if (r === 0) {
      emi = P / N;
    } else {
      emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    }

    const processingFee = P * feeP / 100;

    // Amortisation schedule
    let balance    = P;
    let totalInt   = 0;
    let totalPrin  = 0;
    let months     = 0;
    const schedule = [];

    const startEl    = document.getElementById('emi-start');
    let   startDate  = startEl?.value ? new Date(startEl.value + '-01') : new Date();

    while (balance > 0.01 && months < N + 120) {
      const interest = balance * r;
      let   principal = emi - interest;
      if (principal > balance) principal = balance;
      balance -= principal;

      // Annual pre-payment
      if (prepay > 0 && months > 0 && months % 12 === 0) {
        const extra = Math.min(prepay, balance);
        balance -= extra;
      }

      const date = new Date(startDate);
      date.setMonth(date.getMonth() + months);
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

      totalInt  += interest;
      totalPrin += principal;
      months++;

      schedule.push({
        n: months,
        month: monthLabel,
        emi: emi,
        principal: principal,
        interest: interest,
        balance: Math.max(0, balance)
      });

      if (balance <= 0.01) break;
    }

    const totalPayment  = emi * months + prepay * Math.floor(months / 12);
    const effectiveCost = totalPayment - P + processingFee;

    // Render results
    const grid = document.getElementById('emi-grid');
    if (grid) {
      grid.innerHTML = `
        ${this._metric('Monthly EMI', '₹' + this._fmt(emi), 'Fixed monthly instalment', true)}
        ${this._metric('Total Interest', '₹' + this._fmt(totalInt), 'Interest paid over tenure')}
        ${this._metric('Processing Fee', '₹' + this._fmt(processingFee), `${feeP}% one-time fee`)}
        ${this._metric('Total Cost', '₹' + this._fmt(effectiveCost), 'Interest + Fees')}
        ${this._metric('Total Payment', '₹' + this._fmt(totalPayment + processingFee), 'Principal + Interest + Fees')}
        ${this._metric('Actual Months', months + ' mo', `Closes in ${(months / 12).toFixed(1)} years`)}
      `;
    }

    // Donut chart (CSS conic-gradient)
    const pPct = Math.round((P / (P + totalInt)) * 100);
    const iPct = 100 - pPct;
    const donut = document.getElementById('emi-donut');
    const donutVal = document.getElementById('emi-donut-val');
    if (donut) {
      donut.style.background = `conic-gradient(#f97316 0% ${pPct}%, rgba(249,115,22,0.25) ${pPct}% 100%)`;
    }
    if (donutVal) donutVal.textContent = '₹' + this._fmt(P + totalInt);

    const legend = document.getElementById('emi-legend');
    if (legend) {
      legend.innerHTML = `
        <div class="legend-item"><span class="legend-dot" style="background:#f97316"></span>Principal <strong>${pPct}%</strong></div>
        <div class="legend-item"><span class="legend-dot" style="background:rgba(249,115,22,0.3)"></span>Interest <strong>${iPct}%</strong></div>
      `;
    }

    // Schedule
    const tbody = document.getElementById('emi-schedule-body');
    if (tbody) {
      tbody.innerHTML = schedule.slice(0, 360).map(row => `
        <tr>
          <td>${row.n}</td>
          <td>${row.month}</td>
          <td class="mono">₹${this._fmt(row.emi)}</td>
          <td class="mono" style="color:#34d399">₹${this._fmt(row.principal)}</td>
          <td class="mono" style="color:#f97316">₹${this._fmt(row.interest)}</td>
          <td class="mono">₹${this._fmt(row.balance)}</td>
        </tr>
      `).join('');
    }

    document.getElementById('emi-note').innerHTML =
      `<strong>Formula:</strong> EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1) where r = monthly rate, n = months<br>
       <strong>Tip:</strong> Increasing your annual pre-payment by ₹${this._fmt(emi)} saves significant interest.`;

    document.getElementById('emi-results').style.display = 'block';
  },

  _fmt(n) {
    if (n >= 1e7)  return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5)  return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'K';
    return Math.round(n).toLocaleString('en-IN');
  },

  _metric(label, value, hint, highlight = false) {
    return `<div class="res-box ${highlight ? 'hi-orange' : ''}">
      <div class="res-label">${label}</div>
      <div class="res-value">${value}</div>
      ${hint ? `<div class="res-hint">${hint}</div>` : ''}
    </div>`;
  }
};
