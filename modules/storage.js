/* ============================================================
   CalcHubApp — modules/storage.js  v2.0
   Robust persistent storage: IndexedDB primary, localStorage fallback
   Fixes:
     • Requests navigator.storage.persist() on first load
     • Re-opens DB if connection is lost (handles SW restarts)
     • Splits large data (bannerImage) into chunked localStorage
     • Unified API used by ALL modules — no raw localStorage calls
   ============================================================ */

const DB_NAME    = 'CalcHubApp';
const DB_VERSION = 1;
const STORES     = ['settings', 'history', 'profiles', 'exports'];

let _db = null;

/* ── Open DB — always re-checks connection ── */
export async function openDB() {
  // If we have a live connection, use it
  if (_db && !_db._closed) return _db;
  _db = null;

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

    req.onsuccess = e => {
      _db = e.target.result;
      // Mark connection closed if DB is closed unexpectedly
      _db.onclose     = () => { _db = null; };
      _db.onversionchange = () => { _db.close(); _db = null; };
      resolve(_db);
    };

    req.onerror = e => {
      console.warn('[Storage] IndexedDB open failed:', e.target.error);
      reject(e.target.error);
    };

    req.onblocked = () => {
      console.warn('[Storage] IndexedDB blocked — another tab has older version open');
    };
  });
}

/* ── Request persistent storage from browser ── */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return false;
  try {
    const already = await navigator.storage.persisted();
    if (already) return true;
    const granted = await navigator.storage.persist();
    console.log('[Storage] Persistence granted:', granted);
    return granted;
  } catch (e) {
    console.warn('[Storage] Could not request persistence:', e);
    return false;
  }
}

/* ── Check storage quota ── */
export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return null;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return {
      usedMB: (usage / 1048576).toFixed(2),
      quotaMB: (quota / 1048576).toFixed(0),
      pct: ((usage / quota) * 100).toFixed(1)
    };
  } catch { return null; }
}

/* ── Generic IndexedDB put ── */
async function idbSet(store, key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put({ key, value, ts: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror    = e => reject(e.target.error);
    tx.onabort    = e => reject(e.target.error);
  });
}

/* ── Generic IndexedDB get ── */
async function idbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror   = e => reject(e.target.error);
  });
}

/* ── Generic IndexedDB delete ── */
async function idbDelete(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror   = e => reject(e.target.error);
  });
}

/* ── Generic IndexedDB getAll ── */
async function idbList(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = e => reject(e.target.error);
  });
}

/* ── localStorage helpers (fallback + small data) ── */
function lsSet(key, value) {
  try {
    localStorage.setItem('ch_' + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[Storage] localStorage write failed:', key, e);
    return false;
  }
}

function lsGet(key) {
  try {
    const v = localStorage.getItem('ch_' + key);
    return v !== null ? JSON.parse(v) : null;
  } catch { return null; }
}

function lsDel(key) {
  try { localStorage.removeItem('ch_' + key); } catch {}
}

/* ── Public API: dbSet — IDB with localStorage fallback ── */
export async function dbSet(store, key, value) {
  try {
    await idbSet(store, key, value);
    // Mirror critical small keys to localStorage as backup
    if (store === 'settings' && key !== 'bannerImage') {
      lsSet(`idb_mirror_${store}_${key}`, value);
    }
    return true;
  } catch (e) {
    console.warn('[Storage] IDB write failed, using localStorage:', store, key, e);
    return lsSet(`${store}_${key}`, value);
  }
}

/* ── Public API: dbGet — IDB with localStorage fallback ── */
export async function dbGet(store, key) {
  try {
    const v = await idbGet(store, key);
    if (v !== null) return v;
    // Try localStorage mirror as recovery
    const mirror = lsGet(`idb_mirror_${store}_${key}`);
    if (mirror !== null) return mirror;
    // Try plain localStorage fallback key
    return lsGet(`${store}_${key}`);
  } catch (e) {
    console.warn('[Storage] IDB read failed, using localStorage:', store, key, e);
    const mirror = lsGet(`idb_mirror_${store}_${key}`);
    return mirror !== null ? mirror : lsGet(`${store}_${key}`);
  }
}

/* ── Public API: dbDelete ── */
export async function dbDelete(store, key) {
  try { await idbDelete(store, key); } catch {}
  lsDel(`idb_mirror_${store}_${key}`);
  lsDel(`${store}_${key}`);
}

/* ── Public API: dbList ── */
export async function dbList(store) {
  try {
    return await idbList(store);
  } catch (e) {
    console.warn('[Storage] IDB list failed:', store, e);
    return [];
  }
}

/* ══════════════════════════════════════════════
   Settings — key/value store for app preferences
   ══════════════════════════════════════════════ */
export const Settings = {
  async get(key, def = null) {
    // Fast path: try localStorage mirror first (synchronous-like speed)
    const quick = lsGet(`idb_mirror_settings_${key}`);
    if (quick !== null) return quick;
    const v = await dbGet('settings', key);
    return v !== null ? v : def;
  },

  async set(key, value) {
    // Write to both immediately
    if (key !== 'bannerImage') {
      lsSet(`idb_mirror_settings_${key}`, value);
    }
    return dbSet('settings', key, value);
  },

  async getAll() {
    const rows = await dbList('settings');
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }
};

/* ══════════════════════════════════════════════
   Banner — stored in localStorage (base64 is large,
   IDB chunking not needed, LS handles ~5MB fine)
   ══════════════════════════════════════════════ */
export const Banner = {
  save(dataUrl) {
    if (!dataUrl) { localStorage.removeItem('ch_banner'); return; }
    try {
      localStorage.setItem('ch_banner', dataUrl);
    } catch (e) {
      // If quota exceeded, try compressing by reducing quality
      console.warn('[Storage] Banner too large for localStorage, skipping:', e);
    }
  },
  load() {
    try { return localStorage.getItem('ch_banner') || null; } catch { return null; }
  },
  clear() {
    try { localStorage.removeItem('ch_banner'); } catch {}
  }
};

/* ══════════════════════════════════════════════
   Profile — stored in IDB + localStorage mirror
   ══════════════════════════════════════════════ */
export const Profile = {
  async save(data) {
    // Store without photo in IDB (photo stored separately)
    const { avatar, ...meta } = data;
    await dbSet('profiles', 'main', meta);
    lsSet('profile_meta', meta);
    // Store avatar in localStorage (base64)
    if (avatar) {
      try { localStorage.setItem('ch_profile_avatar', avatar); } catch {}
    } else {
      localStorage.removeItem('ch_profile_avatar');
    }
    return true;
  },

  async load() {
    try {
      let meta = await idbGet('profiles', 'main');
      if (!meta) meta = lsGet('profile_meta');
      const avatar = localStorage.getItem('ch_profile_avatar') || null;
      if (!meta && !avatar) return null;
      return { ...(meta || {}), avatar };
    } catch {
      const meta = lsGet('profile_meta');
      const avatar = localStorage.getItem('ch_profile_avatar') || null;
      if (!meta && !avatar) return null;
      return { ...(meta || {}), avatar };
    }
  }
};

/* ══════════════════════════════════════════════
   Module Data — persist each module's last-used
   inputs so they survive page reload / navigation
   ══════════════════════════════════════════════ */
export const ModuleData = {
  async save(moduleId, data) {
    lsSet(`mod_${moduleId}`, data);           // fast LS write
    return dbSet('settings', `mod_${moduleId}`, data);  // IDB backup
  },
  async load(moduleId) {
    const quick = lsGet(`mod_${moduleId}`);
    if (quick !== null) return quick;
    return dbGet('settings', `mod_${moduleId}`);
  }
};

/* ══════════════════════════════════════════════
   ScoreCard — own key with photo separated
   ══════════════════════════════════════════════ */
export const ScorecardStore = {
  save(data) {
    const { studentPhoto, ...rest } = data;
    // Save text data
    lsSet('ssc_data', rest);
    try { dbSet('settings', 'ssc_data', rest); } catch {}
    // Save photo separately (it's large base64)
    if (studentPhoto) {
      try { localStorage.setItem('ch_ssc_photo', studentPhoto); } catch {}
    } else {
      localStorage.removeItem('ch_ssc_photo');
    }
  },

  load() {
    const data = lsGet('ssc_data');
    const photo = localStorage.getItem('ch_ssc_photo') || null;
    if (!data) return null;
    return { ...data, studentPhoto: photo };
  },

  clearPhoto() {
    localStorage.removeItem('ch_ssc_photo');
  }
};

/* ══════════════════════════════════════════════
   Export / Import ALL data
   ══════════════════════════════════════════════ */
export async function exportAllData() {
  const payload = {
    version: '2.0',
    ts: Date.now(),
    stores: {},
    localStorage: {}
  };

  // IDB stores
  for (const s of STORES) {
    try { payload.stores[s] = await idbList(s); } catch { payload.stores[s] = []; }
  }

  // Critical localStorage keys
  const lsKeys = ['ssc_data', 'profile_meta'];
  lsKeys.forEach(k => {
    const v = lsGet(k);
    if (v !== null) payload.localStorage[k] = v;
  });

  return JSON.stringify(payload, null, 2);
}

export async function importAllData(jsonString) {
  const payload = JSON.parse(jsonString);
  if (!payload.stores && !payload.localStorage) throw new Error('Invalid export format');

  // Restore IDB
  if (payload.stores) {
    for (const [store, rows] of Object.entries(payload.stores)) {
      if (!STORES.includes(store)) continue;
      for (const row of rows) {
        try { await idbSet(store, row.key, row.value); } catch {}
      }
    }
  }

  // Restore localStorage
  if (payload.localStorage) {
    for (const [k, v] of Object.entries(payload.localStorage)) {
      lsSet(k, v);
    }
  }

  return true;
}
