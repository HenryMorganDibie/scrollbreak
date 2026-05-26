// app.js — core app logic

let selectedPlatform = '';
let selectedTime = 10;
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let selectedMood = '';
let selectedAchieved = '';

// ─── INIT ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  renderHistory();
  updateStreak();
  renderAnalytics();
});

// ─── SETTINGS ───────────────────────────────────────────
function loadSettings() {
  const key = Storage.getGroqKey();
  const url = Storage.getBackendUrl();
  const uid = Storage.getUserId();
  const role = Storage.getRole();
  if (key) {
    document.getElementById('apiBtn').classList.add('set');
    document.getElementById('apiBtn').textContent = '⚙ SETTINGS';
  }
  document.getElementById('groqKeyInput').value = key || '';
  document.getElementById('backendUrlInput').value = url || '';
  document.getElementById('userIdInput').value = uid || '';
  document.getElementById('roleSelect').value = role || 'user';
}

function saveSettings() {
  Storage.saveSettings({
    groqKey: document.getElementById('groqKeyInput').value.trim(),
    backendUrl: document.getElementById('backendUrlInput').value.trim(),
    userId: document.getElementById('userIdInput').value.trim(),
    role: document.getElementById('roleSelect').value
  });
  document.getElementById('apiBtn').classList.add('set');
  closeModal('settings');
}

// ─── MODALS ─────────────────────────────────────────────
function openModal(name) {
  document.getElementById(`modal-${name}`).classList.add('open');
}
function closeModal(name) {
  document.getElementById(`modal-${name}`).classList.remove('open');
}
document.querySelectorAll('.modal-backdrop').forEach(el => {
  el.addEventListener('click', (e) => { if (e.target === el) el.classList.remove('open'); });
});

// ─── TABS ────────────────────────────────────────────────
function switchTab(name) {
  const tabs = ['intention','reflect','history','dashboard','therapist'];
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', tabs[i] === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${name}`).classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'therapist') renderAnalytics();
}

// ─── INTENTION ───────────────────────────────────────────
function togglePlatform(el, name) {
  document.querySelectorAll('.platform-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedPlatform = name;
}

function selectTime(el, mins) {
  document.querySelectorAll('.time-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedTime = mins;
}

async function submitIntention() {
  const intent = document.getElementById('intentInput').value.trim();
  if (!intent) { document.getElementById('intentInput').focus(); return; }
  if (!selectedPlatform) { alert('Pick a platform first.'); return; }

  const session = {
    id: Date.now(),
    platform: selectedPlatform,
    intention: intent,
    timeLimitMins: selectedTime,
    timestamp: new Date().toISOString(),
    mood: null,
    achieved: null,
    note: null,
    durationSecs: null,
    memberId: Storage.getUserId() || null
  };

  const sessions = Storage.getSessions();
  sessions.unshift(session);
  Storage.saveSessions(sessions);
  updateStreak();

  const key = Storage.getGroqKey();
  if (!key) { document.getElementById('warnNoKey').classList.add('show'); return; }

  const box = document.getElementById('aiBox');
  box.style.display = 'block';
  await Groq.streamToElement(
    Groq.prompts.intention(selectedPlatform, intent, selectedTime),
    document.getElementById('aiResponse')
  );
}

// ─── REFLECT ─────────────────────────────────────────────
function selectMood(el) {
  document.querySelectorAll('#moodRow .mood-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedMood = el.textContent;
}

function selectAchieved(el) {
  el.closest('.mood-row').querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedAchieved = el.dataset.val;
}

async function saveReflection() {
  if (!selectedMood) { alert('How are you feeling?'); return; }
  if (!selectedAchieved) { alert('Did you achieve your intention?'); return; }

  const sessions = Storage.getSessions();
  if (sessions.length > 0) {
    sessions[0].mood = selectedMood;
    sessions[0].achieved = selectedAchieved;
    sessions[0].note = document.getElementById('reflectNote').value.trim();
    sessions[0].durationSecs = timerSeconds;
    Storage.saveSessions(sessions);
    renderHistory();
    renderAnalytics();
  }

  const key = Storage.getGroqKey();
  if (!key) { alert('Add your Groq key in Settings for AI coaching.'); return; }

  const s = sessions[0];
  const box = document.getElementById('reflectAiBox');
  box.style.display = 'block';
  await Groq.streamToElement(
    Groq.prompts.reflection(
      s?.platform || selectedPlatform,
      s?.timeLimitMins || selectedTime,
      Math.round(timerSeconds / 60),
      selectedAchieved, selectedMood,
      document.getElementById('reflectNote').value.trim()
    ),
    document.getElementById('reflectAiResponse')
  );
}

// ─── TIMER ───────────────────────────────────────────────
function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timerToggle').textContent = 'RESUME';
  } else {
    timerRunning = true;
    document.getElementById('timerToggle').textContent = 'PAUSE';
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay();
      const sessions = Storage.getSessions();
      const limit = sessions[0]?.timeLimitMins || selectedTime;
      if (timerSeconds === limit * 60) flashTimer();
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 0;
  document.getElementById('timerToggle').textContent = 'START';
  document.getElementById('timerDisplay').classList.remove('warn');
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

function flashTimer() {
  const el = document.getElementById('timerDisplay');
  el.classList.add('warn');
  setTimeout(() => el.classList.remove('warn'), 4000);
}

// ─── HISTORY ─────────────────────────────────────────────
function renderHistory() {
  const sessions = Storage.getSessions();
  const list = document.getElementById('historyList');
  document.getElementById('streakNum').textContent = todayCount(sessions);
  document.getElementById('streakSub').textContent = todayCount(sessions) === 0
    ? 'Start your first intention-led session.'
    : `${todayCount(sessions)} intentional session${todayCount(sessions) > 1 ? 's' : ''} today.`;

  if (sessions.length === 0) {
    list.innerHTML = '<div class="history-empty">No sessions yet. Set your first intention above.</div>';
    document.getElementById('insightToggle').style.display = 'none';
    return;
  }

  document.getElementById('insightToggle').style.display = 'flex';
  list.innerHTML = sessions.slice(0, 30).map(s => {
    const d = new Date(s.timestamp);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dur = s.durationSecs ? `${Math.round(s.durationSecs/60)}m` : `${s.timeLimitMins}m limit`;
    return `<div class="history-item">
      <div class="h-top">
        <span class="h-platform">${s.platform}</span>
        <span class="h-meta">${dateStr} ${timeStr} · ${dur}</span>
      </div>
      <div class="h-intent">"${s.intention}"</div>
      ${s.mood
        ? `<div class="h-mood">${s.mood} · ${s.achieved==='yes'?'✅ achieved':s.achieved==='partial'?'〰 partial':'❌ drifted'}</div>`
        : '<div class="h-mood" style="color:var(--muted);font-size:0.72rem">No reflection yet</div>'}
    </div>`;
  }).join('');
}

async function getWeeklyInsight() {
  const sessions = Storage.getSessions();
  if (!Storage.getGroqKey()) { alert('Add your Groq key in Settings.'); return; }
  const box = document.getElementById('insightBox');
  box.style.display = 'block';
  await Groq.streamToElement(
    Groq.prompts.patterns(sessions),
    document.getElementById('insightResponse'),
    400
  );
}

function updateStreak() { renderHistory(); }

function todayCount(sessions) {
  const today = new Date().toDateString();
  return sessions.filter(s => new Date(s.timestamp).toDateString() === today).length;
}
