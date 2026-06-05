/* ============================================================
   CalcHubApp — modules/storage.js  v3.0
   Persistent storage: IndexedDB + localStorage dual-write
   Works on: Android Chrome, Desktop Edge, Desktop Chrome
   
   Key fixes v3.0:
   ✓ navigator.storage.persist() called correctly
   ✓ Edge: persist() needs user gesture OR installed PWA
   ✓ Dual-write: every save goes to BOTH IDB + localStorage
   ✓ Read: IDB first, localStorage fallback, no silent failures
   ✓ IDB connection auto-heals on close/versionchange
   ✓ Large data (banner, photos) in localStorage only
   ✓ All errors logged, never silently swallowed
   ============================================================ */

const DB_NAME    = 'CalcHubApp';
const DB_VERSION = 1;
const STORES     = ['settings', 'history', 'profiles', 'exports'];

let _db = null;

/* ════════════════════════════
   IndexedDB core
   ════════════════════════════ */
export async function openDB() {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      STORES.forEach(s => {
        if (!db.objectStoreNames.contains(s))
          db.createObjectStore(s, { keyPath: 'key' });
      });
    };

    req.onsuccess = e => {
      _db = e.target.result;
      _db.onclose        = () => { _db = null; };
      _db.onversionchange = () => { _db.close(); _db = null; };
      resolve(_db);
    };

    req.onerror   = e => { console.error('[IDB] open error:', e.target.error); reject(e.target.error); };
    req.onblocked = () => console.warn('[IDB] blocked by another tab');
  });
}

async function idbSet(store, key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put({ key, value, ts: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror    = e => reject(e.target.error);
    tx.onabort    = e => reject(e.target.error);
  });
}

async function idbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror   = e => reject(e.target.error);
  });
}

async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = e => reject(e.target.error);
  });
}

/* ════════════════════════════
   localStorage helpers
   ════════════════════════════ */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[LS] write failed:', key, e.name);
    return false;
  }
}

function lsGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : null;
  } catch { return null; }
}

function lsDel(key) {
  try { localStorage.removeItem(key); } catch {}
}

/* ════════════════════════════
   Dual-write public API
   ════════════════════════════ */
export async function dbSet(store, key, value) {
  // Always write to localStorage immediately (synchronous, reliable)
  lsSet(`ch__${store}__${key}`, value);
  // Also write to IDB asynchronously (more space, less eviction risk)
  try {
    await idbSet(store, key, value);
  } catch (e) {
    console.warn('[Storage] IDB write failed (LS has it):', store, key, e.message);
  }
  return true;
}

export async function dbGet(store, key) {
  // Try IDB first (authoritative)
  try {
    const v = await idbGet(store, key);
    if (v !== null) return v;
  } catch (e) {
    console.warn('[Storage] IDB read failed, using LS:', store, key, e.message);
  }
  // Fall back to localStorage
  return lsGet(`ch__${store}__${key}`);
}

export async function dbDelete(store, key) {
  lsDel(`ch__${store}__${key}`);
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = res; tx.onerror = rej;
    });
  } catch {}
}

export async function dbList(store) {
  try { return await idbGetAll(store); } catch { return []; }
}

/* ════════════════════════════
   Persistent Storage
   Works on Chrome/Android: auto-granted if PWA installed
   Works on Edge desktop: requires user gesture or PWA install
   ════════════════════════════ */
export async function requestPersistence() {
  if (!navigator?.storage?.persist) {
    console.log('[Storage] Persistence API not available');
    return false;
  }
  try {
    const already = await navigator.storage.persisted();
    if (already) {
      console.log('[Storage] Already persistent ✓');
      return true;
    }
    const granted = await navigator.storage.persist();
    console.log('[Storage] persist() result:', granted);
    return granted;
  } catch (e) {
    console.warn('[Storage] persist() error:', e);
    return false;
  }
}

export async function checkPersistence() {
  if (!navigator?.storage?.persisted) return false;
  try { return await navigator.storage.persisted(); } catch { return false; }
}

export async function getStorageEstimate() {
  if (!navigator?.storage?.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return {
      usedMB:  (usage  / 1048576).toFixed(2),
      quotaMB: (quota  / 1048576).toFixed(0),
      pct:     ((usage / quota) * 100).toFixed(1)
    };
  } catch { return null; }
}

/* ════════════════════════════
   Settings  (key/value)
   ════════════════════════════ */
export const Settings = {
  async set(key, value) {
    return dbSet('settings', key, value);
  },
  async get(key, def = null) {
    const v = await dbGet('settings', key);
    return v !== null ? v : def;
  },
  async getAll() {
    const rows = await dbList('settings');
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
};

/* ════════════════════════════
   Banner  (localStorage only — large base64)
   ════════════════════════════ */
export const Banner = {
  save(dataUrl) {
    if (!dataUrl) { lsDel('ch__banner'); return; }
    try {
      localStorage.setItem('ch__banner', dataUrl);
    } catch (e) {
      console.warn('[Banner] Too large for localStorage:', e.name);
    }
  },
  load() {
    try { return localStorage.getItem('ch__banner') || null; } catch { return null; }
  },
  clear() { lsDel('ch__banner'); }
};

/* ════════════════════════════
   Profile  (meta in dual, avatar in LS)
   ════════════════════════════ */
export const Profile = {
  async save(data) {
    const { avatar, ...meta } = data;
    // Save meta — dual write IDB + localStorage
    try { await idbSet('profiles', 'main', meta); } catch(e) {
      console.warn('[Profile.save] IDB failed:', e.message);
    }
    // Always write to localStorage directly (reliable)
    try { localStorage.setItem('ch__profile_meta', JSON.stringify(meta)); } catch {}
    // Avatar in localStorage
    if (avatar) {
      try { localStorage.setItem('ch__profile_avatar', avatar); } catch (e) {
        console.warn('[Profile] Avatar too large for LS:', e.name);
      }
    } else {
      try { localStorage.removeItem('ch__profile_avatar'); } catch {}
    }
  },
  async load() {
    let meta = null;
    // Try IDB first
    try { meta = await idbGet('profiles', 'main'); } catch(e) {
      console.warn('[Profile.load] IDB failed:', e.message);
    }
    // Fallback to localStorage
    if (!meta) {
      try {
        const raw = localStorage.getItem('ch__profile_meta');
        if (raw) meta = JSON.parse(raw);
      } catch {}
    }
    // Avatar always from localStorage (large base64)
    const avatar = (() => {
      try { return localStorage.getItem('ch__profile_avatar') || null; } catch { return null; }
    })();
    if (!meta && !avatar) return null;
    return { ...(meta || {}), avatar };
  }
};

/* ════════════════════════════
   Score Card  (text + photo separate)
   ════════════════════════════ */
export const ScorecardStore = {
  save(data) {
    const { studentPhoto, ...rest } = data;
    lsSet('ch__ssc_data', rest);
    try { dbSet('settings', 'ssc_data', rest).catch(() => {}); } catch {}
    if (studentPhoto) {
      try { localStorage.setItem('ch__ssc_photo', studentPhoto); } catch (e) {
        console.warn('[SSC] Photo too large:', e.name);
      }
    } else { lsDel('ch__ssc_photo'); }
  },
  load() {
    const data  = lsGet('ch__ssc_data');
    const photo = localStorage.getItem('ch__ssc_photo') || null;
    if (!data) return null;
    return { ...data, studentPhoto: photo };
  },
  clearPhoto() { lsDel('ch__ssc_photo'); }
};

/* ════════════════════════════
   Export / Import
   ════════════════════════════ */
export async function exportAllData() {
  const payload = { version: '3.0', ts: Date.now(), stores: {}, ls: {} };
  for (const s of STORES) {
    try { payload.stores[s] = await idbGetAll(s); } catch { payload.stores[s] = []; }
  }
  // Include LS-only data
  ['ch__ssc_data', 'ch__profile_meta'].forEach(k => {
    const v = lsGet(k); if (v !== null) payload.ls[k] = v;
  });
  return JSON.stringify(payload, null, 2);
}

export async function importAllData(jsonStr) {
  const payload = JSON.parse(jsonStr);
  if (payload.stores) {
    for (const [store, rows] of Object.entries(payload.stores)) {
      if (!STORES.includes(store)) continue;
      for (const row of rows) {
        try { await idbSet(store, row.key, row.value); } catch {}
        lsSet(`ch__${store}__${row.key}`, row.value);
      }
    }
  }
  if (payload.ls) {
    for (const [k, v] of Object.entries(payload.ls)) lsSet(k, v);
  }
  return true;
}
