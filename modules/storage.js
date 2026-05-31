/* ============================================================
   CalcHubApp — modules/storage.js
   Persistent Storage: IndexedDB (primary) + localStorage (fallback)
   Per-device only, no cloud sync
   ============================================================ */

const DB_NAME    = 'CalcHubApp';
const DB_VERSION = 1;
const STORES     = ['settings', 'history', 'profiles', 'exports'];

let _db = null;

/* ── Open / initialise IndexedDB ── */
export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'key' });
        }
      });
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror   = e => reject(e.target.error);
  });
}

/* ── Generic put / get / delete / list ── */
export async function dbSet(store, key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put({ key, value, ts: Date.now() });
      req.onsuccess = () => resolve(true);
      req.onerror   = e => reject(e.target.error);
    });
  } catch { lsSet(store + ':' + key, value); }
}

export async function dbGet(store, key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror   = e => reject(e.target.error);
    });
  } catch { return lsGet(store + ':' + key); }
}

export async function dbDelete(store, key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror   = e => reject(e.target.error);
    });
  } catch { localStorage.removeItem(store + ':' + key); }
}

export async function dbList(store) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction(store, 'readonly');
      const req     = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = e => reject(e.target.error);
    });
  } catch { return []; }
}

/* ── localStorage fallback helpers ── */
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}

/* ── Settings convenience wrappers ── */
export const Settings = {
  async get(key, def = null) {
    const v = await dbGet('settings', key);
    return v !== null ? v : def;
  },
  async set(key, value) { return dbSet('settings', key, value); },
  async getAll() {
    const rows = await dbList('settings');
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
};

/* ── History convenience wrappers ── */
export const History = {
  async push(module, data) {
    const key = `${module}:${Date.now()}`;
    return dbSet('history', key, { module, data, ts: Date.now() });
  },
  async getModule(module) {
    const all = await dbList('history');
    return all
      .filter(r => r.value && r.value.module === module)
      .sort((a, b) => (b.value.ts || 0) - (a.value.ts || 0))
      .slice(0, 50);
  },
  async clear(module) {
    const all = await dbList('history');
    const toDelete = all.filter(r => r.value && r.value.module === module);
    for (const r of toDelete) await dbDelete('history', r.key);
  }
};

/* ── Profile wrappers ── */
export const Profile = {
  async save(data) { return dbSet('profiles', 'main', data); },
  async load()     { return dbGet('profiles', 'main'); },
};

/* ── Export / Import ── */
export async function exportAllData() {
  const payload = { version: '1.0.0', ts: Date.now(), stores: {} };
  for (const s of STORES) {
    payload.stores[s] = await dbList(s);
  }
  return JSON.stringify(payload, null, 2);
}

export async function importAllData(jsonString) {
  const payload = JSON.parse(jsonString);
  if (!payload.stores) throw new Error('Invalid export format');
  for (const [store, rows] of Object.entries(payload.stores)) {
    if (!STORES.includes(store)) continue;
    for (const row of rows) {
      await dbSet(store, row.key, row.value);
    }
  }
  return true;
}
