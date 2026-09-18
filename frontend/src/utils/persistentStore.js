/**
 * persistentStore.js
 * localStorage wrapper with 30-day TTL (Time-To-Live).
 * Data saved here survives page refreshes and lasts 30 days before auto-expiring.
 */

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Save data to localStorage with a 30-day expiry timestamp.
 * @param {string} key
 * @param {*} value  - anything JSON-serializable
 */
export function setStored(key, value) {
  try {
    const payload = { value, expiresAt: Date.now() + TTL_MS };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // quota exceeded – ignore silently
  }
}

/**
 * Read data from localStorage. Returns null if missing or expired.
 * @param {string} key
 * @returns {*|null}
 */
export function getStored(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

/**
 * Remove a stored key.
 * @param {string} key
 */
export function removeStored(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Merge new items into an existing stored array (dedup by `idField`).
 * Preserves the 30-day TTL on every merge.
 * @param {string} key
 * @param {Array}  newItems
 * @param {string} idField  - field name to use as unique ID (e.g. 'id', 'order_id')
 */
export function mergeStoredArray(key, newItems, idField = 'id') {
  const existing = getStored(key) || [];
  const map = new Map();
  existing.forEach(item => map.set(item[idField], item));
  newItems.forEach(item => map.set(item[idField], { ...map.get(item[idField]), ...item }));
  setStored(key, Array.from(map.values()));
}

/**
 * Storage keys used across the app (single source of truth).
 */
export const STORE_KEYS = {
  ORDERS:        'agriowl_orders_v2',
  FARMERS:       'agriowl_farmers_v2',
  PRODUCTS:      'agriowl_products_v2',
  INVENTORY:     'agriowl_inventory_v2',
  NOTIFICATIONS: 'agriowl_notifications_v2',
};
