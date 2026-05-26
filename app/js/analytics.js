// analytics.js — therapist-facing clinical analytics

function renderAnalytics() {
  const sessions = Storage.getSessions();
  if (sessions.length === 0) return;

  // Summary cards
  const withDuration = sessions.filter(s => s.durationSecs);
  const avgDur = withDuration.length
    ? Math.round(withDuration.reduce((a,s) => a + s.durationSecs, 0) / withDuration.length / 60)
    : 0;
  const withOutcome = sessions.filter(s => s.achieved);
  const achievedCount = withOutcome.filter(s => s.achieved === 'yes').length;
  const driftCount = withOutcome.filter(s => s.achieved === 'no').length;
  const achieveRate = withOutcome.length ? Math.round((achievedCount / withOutcome.length) * 100) : 0;
  const driftRate = withOutcome.length ? Math.round((driftCount / withOutcome.length) * 100) : 0;

  document.getElementById('cardTotalSessions').querySelector('.ac-num').textContent = sessions.length;
  document.getElementById('cardAvgDuration').querySelector('.ac-num').textContent = `${avgDur}m`;
  document.getElementById('cardAchievementRate').querySelector('.ac-num').textContent = `${achieveRate}%`;
  document.getElementById('cardDriftRate').querySelector('.ac-num').textContent = `${driftRate}%`;

  renderMoodChart(sessions);
  renderPlatformRisk(sessions);
  renderWeeklyTrend(sessions);
}

function renderMoodChart(sessions) {
  const moodSessions = sessions.filter(s => s.mood);
  const counts = {};
  moodSessions.forEach(s => { counts[s.mood] = (counts[s.mood] || 0) + 1; });
  const max = Math.max(...Object.values(counts), 1);

  const el = document.getElementById('moodChart');
  if (Object.keys(counts).length === 0) { el.innerHTML = '<div style="color:var(--muted);font-size:0.82rem">No mood data yet.</div>'; return; }

  el.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => `
      <div class="mood-bar-row">
        <div class="mood-bar-label">${mood}</div>
        <div class="mood-bar-track">
          <div class="mood-bar-fill" style="width:${Math.round((count/max)*100)}%"></div>
        </div>
        <div class="mood-bar-count">${count}</div>
      </div>
    `).join('');
}

function renderPlatformRisk(sessions) {
  // Risk = % of sessions on that platform where mood was negative (Anxious/Irritated/Low/Numb/Regretful) or drifted
  const negativeMoods = ['😰 Anxious', '😤 Irritated', '😔 Low', '😐 Numb', '😕 Regretful'];
  const platforms = {};

  sessions.forEach(s => {
    if (!platforms[s.platform]) platforms[s.platform] = { total: 0, risk: 0 };
    platforms[s.platform].total++;
    if ((s.mood && negativeMoods.includes(s.mood)) || s.achieved === 'no') {
      platforms[s.platform].risk++;
    }
  });

  const el = document.getElementById('platformRisk');
  const entries = Object.entries(platforms).sort((a,b) => (b[1].risk/b[1].total) - (a[1].risk/a[1].total));

  if (entries.length === 0) { el.innerHTML = '<div style="color:var(--muted);font-size:0.82rem">No platform data yet.</div>'; return; }

  el.innerHTML = entries.map(([platform, data]) => {
    const score = Math.round((data.risk / data.total) * 100);
    const cls = score < 33 ? 'low' : score < 66 ? 'mid' : 'high';
    return `<div class="risk-row">
      <div class="risk-label">${platform}</div>
      <div class="risk-track"><div class="risk-fill ${cls}" style="width:${score}%"></div></div>
      <div class="risk-score">${score}%</div>
    </div>`;
  }).join('');
}

function renderWeeklyTrend(sessions) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const counts = new Array(7).fill(0);
  const today = new Date();

  sessions.forEach(s => {
    const d = new Date(s.timestamp);
    const diff = Math.floor((today - d) / (1000*60*60*24));
    if (diff < 7) {
      const dayIndex = d.getDay();
      counts[dayIndex]++;
    }
  });

  const max = Math.max(...counts, 1);
  const el = document.getElementById('weeklyTrend');

  // Start from today's day going back 7 days
  const todayDay = today.getDay();
  const orderedDays = [];
  for (let i = 6; i >= 0; i--) {
    orderedDays.push((todayDay - i + 7) % 7);
  }

  el.innerHTML = orderedDays.map(dayIdx => {
    const h = Math.round((counts[dayIdx] / max) * 64);
    return `<div class="trend-bar-wrap">
      <div class="trend-bar" style="height:${Math.max(h,4)}px"></div>
      <div class="trend-day">${days[dayIdx].slice(0,1)}</div>
    </div>`;
  }).join('');
}

async function getClinicalInsight() {
  const sessions = Storage.getSessions();
  if (!Storage.getGroqKey()) { alert('Add your Groq key in Settings.'); return; }
  if (sessions.length < 3) { alert('Log at least 3 sessions for a meaningful report.'); return; }

  const box = document.getElementById('clinicalAiBox');
  box.style.display = 'block';
  await Groq.streamToElement(
    Groq.prompts.clinical(sessions),
    document.getElementById('clinicalAiResponse'),
    500
  );
}
