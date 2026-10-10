/**
 * Safe LocalStorage Wrapper to prevent QuotaExceededError crashes
 * Gracefully cleans up heavy data, handles quota limits, and never throws uncaught errors.
 */

// Strips heavy base64 strings (>50KB) from stored records to prevent exceeding the 5MB browser quota
function sanitizePayloadForStorage(jsonString: string): string {
  try {
    const data = JSON.parse(jsonString);
    if (!data) return jsonString;

    const sanitizeRecord = (item: any): any => {
      if (!item || typeof item !== 'object') return item;
      const cleaned = { ...item };
      for (const prop of ['aadhaarFrontUrl', 'aadhaarBackUrl', 'paymentReceiptUrl', 'screenshotUrl']) {
        if (typeof cleaned[prop] === 'string' && cleaned[prop].startsWith('data:image') && cleaned[prop].length > 40000) {
          // Replace oversized base64 with empty or compact indicator in storage copy
          cleaned[prop] = '';
        }
      }
      // If photoUrl is massive (>80KB raw base64), drop or truncate it in storage copy
      if (typeof cleaned.photoUrl === 'string' && cleaned.photoUrl.startsWith('data:image') && cleaned.photoUrl.length > 80000) {
        cleaned.photoUrl = '';
      }
      return cleaned;
    };

    if (Array.isArray(data)) {
      return JSON.stringify(data.map(sanitizeRecord));
    }
    return JSON.stringify(sanitizeRecord(data));
  } catch {
    return jsonString;
  }
}

/**
 * Safely writes to localStorage without ever throwing an unhandled QuotaExceededError
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;

    if (isQuotaError) {
      console.warn(`[SafeStorage] QuotaExceededError when setting "${key}". Initiating auto-recovery.`);

      try {
        // Step 1: Clean up any old or heavy non-critical items
        cleanupStorageQuota();

        // Step 2: Sanitize heavy base64 strings from this payload
        const sanitized = sanitizePayloadForStorage(value);
        localStorage.setItem(key, sanitized);
        return true;
      } catch {
        // Step 3: If still failing, try storing a trimmed array (most recent 25 records)
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 25) {
            const trimmed = sanitizePayloadForStorage(JSON.stringify(parsed.slice(0, 25)));
            localStorage.setItem(key, trimmed);
            return true;
          }
        } catch {
          // ignore
        }

        // Step 4: Gracefully absorb error - in-memory React state remains active and working
        console.warn(`[SafeStorage] Could not persist "${key}" to localStorage due to browser quota limits. State kept in memory.`);
        return false;
      }
    }

    console.warn(`[SafeStorage] Failed to set "${key}":`, err?.message);
    return false;
  }
}

/**
 * Safely reads and parses JSON from localStorage
 */
export function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Error reading or parsing "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely removes an item from localStorage
 */
export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Error removing "${key}":`, err);
  }
}

/**
 * Cleans up oversized items from localStorage to recover quota
 */
export function cleanupStorageQuota(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const keysToCheck = [
      'lkst_id_cards',
      'lkst_applications',
      'lkst_students',
      'lkst_volunteers',
      'lkst_donations',
    ];

    for (const key of keysToCheck) {
      try {
        const raw = localStorage.getItem(key);
        if (raw && raw.length > 150000) { // If payload > 150KB
          const sanitized = sanitizePayloadForStorage(raw);
          if (sanitized.length < raw.length) {
            localStorage.setItem(key, sanitized);
          }
        }
      } catch {
        // If an item is causing quota failure, we can safely prune or clear it
      }
    }
  } catch (err) {
    console.warn('[SafeStorage] Storage cleanup warning:', err);
  }
}
