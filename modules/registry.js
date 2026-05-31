/* ============================================================
   CalcHubApp — modules/registry.js
   Central module registry — one place to register all modules
   ============================================================ */

import { psmModule }           from './psm.js';
import { vaultModule }         from './vault.js';
import { unitConverterModule } from './unit-converter.js';
import { scorecardModule }     from './scorecard.js';
import { loanEmiModule }       from './loan-emi.js';
import { dateAgeModule }       from './date-age.js';
import { timeConverterModule } from './time-converter.js';

/* ── Module registry ── */
export const MODULES = [
  psmModule,
  vaultModule,
  unitConverterModule,
  scorecardModule,
  loanEmiModule,
  dateAgeModule,
  timeConverterModule,
];

export function getModule(id) {
  return MODULES.find(m => m.id === id) || null;
}
