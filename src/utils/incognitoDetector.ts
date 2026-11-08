// Robust Incognito / Private Browsing Detector

export async function detectIncognito(): Promise<{ isIncognito: boolean; browser: string }> {
  // Check Chrome / Chromium
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const { quota } = await navigator.storage.estimate();
      if (quota && quota < 120 * 1024 * 1024) {
        return { isIncognito: true, browser: 'Chrome/Chromium' };
      }
    } catch {
      // ignore
    }
  }

  // Check Safari
  try {
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isSafari) {
      if (!window.indexedDB) {
        return { isIncognito: true, browser: 'Safari' };
      }
      // Safari private mode restricts certain storage or openDatabase
      try {
        const db = window.indexedDB.open('__test_incognito');
        db.onerror = () => {};
      } catch {
        return { isIncognito: true, browser: 'Safari' };
      }
    }
  } catch {
    // ignore
  }

  // Check Firefox
  try {
    const isFirefox = /Firefox/.test(navigator.userAgent);
    if (isFirefox) {
      const db = indexedDB.open('__test_firefox_incognito');
      const isPrivate = await new Promise<boolean>((resolve) => {
        db.onerror = () => resolve(true);
        db.onsuccess = () => resolve(false);
      });
      if (isPrivate) {
        return { isIncognito: true, browser: 'Firefox' };
      }
    }
  } catch {
    // ignore
  }

  return { isIncognito: false, browser: 'Standard' };
}
