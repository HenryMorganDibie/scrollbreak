// pwa.js — PWA registration, install prompt, push notifications

const PWA = (() => {
  let deferredInstallPrompt = null;

  const init = async () => {
    if (!('serviceWorker' in navigator)) return;

    // Register service worker
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      console.log('[PWA] Service worker registered:', reg.scope);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner();
          }
        });
      });
    } catch (err) {
      console.warn('[PWA] SW registration failed:', err);
    }

    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      hideInstallBanner();
      deferredInstallPrompt = null;
    });

    // Handle URL hash shortcuts
    const hash = window.location.hash;
    if (hash === '#reflect') switchTab('reflect');
    if (hash === '#history') switchTab('history');
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      return { granted: false, reason: 'not-supported' };
    }
    if (Notification.permission === 'granted') {
      scheduleDailyReminder();
      return { granted: true };
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      scheduleDailyReminder();
      return { granted: true };
    }
    return { granted: false, reason: 'denied' };
  };

  const scheduleDailyReminder = async () => {
    const reg = await navigator.serviceWorker.ready;

    // Try periodic sync (Chrome Android)
    if ('periodicSync' in reg) {
      try {
        await reg.periodicSync.register('daily-reminder', { minInterval: 24 * 60 * 60 * 1000 });
        return;
      } catch {}
    }

    // Fallback: schedule via setTimeout for current session
    const now = new Date();
    const reminderHour = 9; // 9am
    const next = new Date(now);
    next.setHours(reminderHour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next - now;

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('ScrollBreak', {
          body: 'Have you set your scrolling intention today?',
          icon: 'icons/icon-192.png'
        });
      }
    }, delay);
  };

  const triggerInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') deferredInstallPrompt = null;
  };

  const showInstallBanner = () => {
    const existing = document.getElementById('sb-install-banner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.id = 'sb-install-banner';
    banner.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #161616; border: 1px solid #c8f135; border-radius: 8px;
      padding: 14px 20px; display: flex; align-items: center; gap: 16px;
      z-index: 1000; max-width: 360px; width: calc(100% - 40px);
      font-family: 'Syne', sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;
    banner.innerHTML = `
      <div style="flex:1">
        <div style="font-size:0.82rem;font-weight:700;color:#f0f0f0;margin-bottom:3px">Add to Home Screen</div>
        <div style="font-size:0.72rem;color:#555">Use ScrollBreak like a native app</div>
      </div>
      <button onclick="PWA.triggerInstall()" style="background:#c8f135;color:#000;border:none;padding:8px 14px;font-weight:700;font-size:0.75rem;border-radius:4px;cursor:pointer;letter-spacing:0.05em;">INSTALL</button>
      <button onclick="document.getElementById('sb-install-banner').remove()" style="background:none;border:none;color:#555;cursor:pointer;font-size:1rem;padding:4px;">✕</button>
    `;
    document.body.appendChild(banner);
  };

  const hideInstallBanner = () => {
    document.getElementById('sb-install-banner')?.remove();
  };

  const showUpdateBanner = () => {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
      background: #161616; border: 1px solid #c8f135; border-radius: 6px;
      padding: 12px 18px; z-index: 1000; font-family: 'Syne', sans-serif;
      font-size: 0.8rem; color: #f0f0f0; display: flex; gap: 12px; align-items: center;
    `;
    banner.innerHTML = `
      <span>Update available</span>
      <button onclick="window.location.reload()" style="background:#c8f135;color:#000;border:none;padding:5px 12px;font-weight:700;font-size:0.75rem;border-radius:3px;cursor:pointer;">REFRESH</button>
    `;
    document.body.appendChild(banner);
  };

  // Add notification toggle to settings
  const injectNotificationToggle = () => {
    const settingsModal = document.querySelector('.modal');
    if (!settingsModal) return;

    const toggle = document.createElement('div');
    toggle.className = 'setting-group';
    toggle.innerHTML = `
      <label>Push Notifications</label>
      <button onclick="PWA.requestNotifications().then(r => {
        this.textContent = r.granted ? '✅ Enabled' : '❌ Blocked in browser settings';
        this.style.background = r.granted ? 'rgba(200,241,53,0.1)' : 'rgba(255,77,77,0.1)';
      })" style="width:100%;background:#161616;border:1px solid #222;color:#f0f0f0;padding:10px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:0.82rem;text-align:left;">
        ${Notification.permission === 'granted' ? '✅ Enabled' : 'Enable daily reminders'}
      </button>
    `;

    const saveBtn = settingsModal.querySelector('.btn-primary');
    if (saveBtn) settingsModal.insertBefore(toggle, saveBtn);
  };

  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(injectNotificationToggle, 500);
  });

  return { init, requestNotifications, triggerInstall, scheduleDailyReminder };
})();

// Auto-init
PWA.init();
