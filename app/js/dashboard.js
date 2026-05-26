// dashboard.js — family/team dashboard

function renderDashboard() {
  const members = Storage.getMembers();
  const sessions = Storage.getSessions();
  const grid = document.getElementById('memberGrid');
  const stats = document.getElementById('groupStats');

  if (members.length === 0) {
    grid.innerHTML = `<div class="history-empty" style="grid-column:1/-1">No members yet. Click + ADD MEMBER to get started.</div>`;
  } else {
    grid.innerHTML = members.map(m => {
      const ms = sessions.filter(s => s.memberId === m.id);
      const achieved = ms.filter(s => s.achieved === 'yes').length;
      const rate = ms.length ? Math.round((achieved / ms.length) * 100) : 0;
      const today = ms.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length;
      return `<div class="member-card">
        <div class="mc-name">${m.name}</div>
        <div class="mc-role">${m.role}</div>
        <div class="mc-stat">Sessions: <span>${ms.length}</span></div>
        <div class="mc-stat">Today: <span>${today}</span></div>
        <div class="mc-stat">Goal rate: <span>${rate}%</span></div>
      </div>`;
    }).join('');
  }

  // Group stats
  const totalSessions = sessions.length;
  const totalAchieved = sessions.filter(s => s.achieved === 'yes').length;
  const groupRate = totalSessions ? Math.round((totalAchieved / totalSessions) * 100) : 0;
  const platforms = [...new Set(sessions.map(s => s.platform))];

  stats.innerHTML = `
    <div class="gs-card"><div class="gs-num">${totalSessions}</div><div class="gs-label">Total Sessions</div></div>
    <div class="gs-card"><div class="gs-num">${groupRate}%</div><div class="gs-label">Goal Rate</div></div>
    <div class="gs-card"><div class="gs-num">${platforms.length}</div><div class="gs-label">Platforms Tracked</div></div>
  `;
}

function addMember() {
  const name = document.getElementById('memberName').value.trim();
  const id = document.getElementById('memberId').value.trim();
  const role = document.getElementById('memberRole').value;
  if (!name || !id) { alert('Name and ID required.'); return; }

  const members = Storage.getMembers();
  if (members.find(m => m.id === id)) { alert('Member already exists.'); return; }

  members.push({ id, name, role, addedAt: new Date().toISOString() });
  Storage.saveMembers(members);
  closeModal('invite');
  document.getElementById('memberName').value = '';
  document.getElementById('memberId').value = '';
  renderDashboard();
}

async function getGroupInsight() {
  const members = Storage.getMembers();
  const sessions = Storage.getSessions();
  if (!Storage.getGroqKey()) { alert('Add your Groq key in Settings.'); return; }
  if (members.length === 0) { alert('Add some members first.'); return; }

  const box = document.getElementById('groupAiBox');
  box.style.display = 'block';
  await Groq.streamToElement(
    Groq.prompts.group(members, sessions),
    document.getElementById('groupAiResponse'),
    400
  );
}
