// storage.js — handles localStorage and optional backend sync

const Storage = (() => {
  const KEYS = {
    sessions: 'sb_sessions',
    members: 'sb_members',
    groqKey: 'sb_groq_key',
    backendUrl: 'sb_backend_url',
    userId: 'sb_user_id',
    role: 'sb_role',
  };

  const get = (key) => {
    try { return JSON.parse(localStorage.getItem(KEYS[key])); } catch { return null; }
  };

  const set = (key, value) => {
    try { localStorage.setItem(KEYS[key], JSON.stringify(value)); return true; }
    catch { return false; }
  };

  const getSessions = () => get('sessions') || [];
  const getMembers = () => get('members') || [];
  const getGroqKey = () => get('groqKey') || '';
  const getBackendUrl = () => get('backendUrl') || '';
  const getUserId = () => get('userId') || '';
  const getRole = () => get('role') || 'user';

  const saveSessions = (sessions) => {
    set('sessions', sessions.slice(0, 200));
    syncToBackend('sessions', sessions.slice(0, 200));
  };

  const saveMembers = (members) => {
    set('members', members);
    syncToBackend('members', members);
  };

  const saveSettings = ({ groqKey, backendUrl, userId, role }) => {
    if (groqKey !== undefined) set('groqKey', groqKey);
    if (backendUrl !== undefined) set('backendUrl', backendUrl);
    if (userId !== undefined) set('userId', userId);
    if (role !== undefined) set('role', role);
  };

  // Backend sync — fire-and-forget, never blocks UI
  const syncToBackend = async (type, data) => {
    const url = getBackendUrl();
    const userId = getUserId();
    if (!url || !userId) return;

    try {
      const res = await fetch(`${url}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type, data, timestamp: new Date().toISOString() })
      });
      if (res.ok) {
        document.getElementById('syncStatus').textContent = '🟢 synced';
        document.getElementById('syncStatus').classList.add('synced');
      }
    } catch {
      document.getElementById('syncStatus').textContent = '🔴 sync failed';
    }
  };

  // Pull from backend on load
  const pullFromBackend = async () => {
    const url = getBackendUrl();
    const userId = getUserId();
    if (!url || !userId) return;

    try {
      const res = await fetch(`${url}/api/pull?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.sessions) set('sessions', data.sessions);
      if (data.members) set('members', data.members);
      document.getElementById('syncStatus').textContent = '🟢 synced';
      document.getElementById('syncStatus').classList.add('synced');
    } catch { /* silent fail */ }
  };

  return {
    getSessions, saveSessions,
    getMembers, saveMembers,
    getGroqKey, getBackendUrl, getUserId, getRole,
    saveSettings, pullFromBackend
  };
})();

// Pull on load
window.addEventListener('DOMContentLoaded', () => Storage.pullFromBackend());
