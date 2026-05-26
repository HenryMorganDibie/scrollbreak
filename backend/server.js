// server.js — ScrollBreak backend for multi-device sync
// Stack: Node.js + Express + SQLite (zero-config, file-based)
// Deploy: Railway, Render, Fly.io, or any Node host

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'scrollbreak.db');

// ─── MIDDLEWARE ───────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGINS || '*' }));
app.use(express.json({ limit: '2mb' }));

// ─── DATABASE SETUP ───────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now')),
    last_seen TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT,
    intention TEXT,
    time_limit_mins INTEGER,
    duration_secs INTEGER,
    mood TEXT,
    achieved TEXT,
    note TEXT,
    timestamp TEXT,
    source TEXT DEFAULT 'web',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    name TEXT,
    role TEXT,
    added_at TEXT,
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp);
`);

// ─── HELPERS ─────────────────────────────────────────────
const upsertUser = (userId) => {
  db.prepare(`
    INSERT INTO users (id, last_seen) VALUES (?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET last_seen = datetime('now')
  `).run(userId);
};

const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string' || userId.length > 200) return false;
  return true;
};

// ─── ROUTES ──────────────────────────────────────────────

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Sync (push data from client)
app.post('/api/sync', (req, res) => {
  const { userId, type, data } = req.body;
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid userId' });

  upsertUser(userId);

  if (type === 'sessions' && Array.isArray(data)) {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO sessions
        (id, user_id, platform, intention, time_limit_mins, duration_secs, mood, achieved, note, timestamp, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((sessions) => {
      for (const s of sessions.slice(0, 200)) {
        insert.run(s.id, userId, s.platform, s.intention, s.timeLimitMins,
          s.durationSecs, s.mood, s.achieved, s.note, s.timestamp, s.source || 'web');
      }
    });
    insertMany(data);
  }

  if (type === 'members' && Array.isArray(data)) {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO members (id, admin_user_id, name, role, added_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((members) => {
      for (const m of members.slice(0, 50)) {
        insert.run(m.id, userId, m.name, m.role, m.addedAt);
      }
    });
    insertMany(data);
  }

  res.json({ ok: true });
});

// Pull (fetch data to client)
app.get('/api/pull', (req, res) => {
  const { userId } = req.query;
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid userId' });

  upsertUser(userId);

  const sessions = db.prepare(`
    SELECT id, platform, intention, time_limit_mins as timeLimitMins,
           duration_secs as durationSecs, mood, achieved, note, timestamp, source
    FROM sessions WHERE user_id = ?
    ORDER BY timestamp DESC LIMIT 200
  `).all(userId);

  const members = db.prepare(`
    SELECT id, name, role, added_at as addedAt
    FROM members WHERE admin_user_id = ?
  `).all(userId);

  res.json({ sessions, members });
});

// Analytics endpoint (therapist view - aggregate only, no raw content)
app.get('/api/analytics/:userId', (req, res) => {
  const { userId } = req.params;
  if (!validateUserId(userId)) return res.status(400).json({ error: 'Invalid userId' });

  const total = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?').get(userId);
  const byPlatform = db.prepare(`
    SELECT platform, COUNT(*) as count FROM sessions
    WHERE user_id = ? GROUP BY platform ORDER BY count DESC
  `).all(userId);
  const byMood = db.prepare(`
    SELECT mood, COUNT(*) as count FROM sessions
    WHERE user_id = ? AND mood IS NOT NULL GROUP BY mood ORDER BY count DESC
  `).all(userId);
  const achievementRate = db.prepare(`
    SELECT achieved, COUNT(*) as count FROM sessions
    WHERE user_id = ? AND achieved IS NOT NULL GROUP BY achieved
  `).all(userId);
  const avgDuration = db.prepare(`
    SELECT AVG(duration_secs) as avg FROM sessions
    WHERE user_id = ? AND duration_secs IS NOT NULL
  `).get(userId);

  res.json({
    totalSessions: total.count,
    byPlatform,
    byMood,
    achievementRate,
    avgDurationSecs: Math.round(avgDuration.avg || 0)
  });
});

// Member sessions (for family/therapist dashboards)
app.get('/api/members/:adminId/sessions', (req, res) => {
  const { adminId } = req.params;
  if (!validateUserId(adminId)) return res.status(400).json({ error: 'Invalid adminId' });

  const members = db.prepare('SELECT * FROM members WHERE admin_user_id = ?').all(adminId);
  const memberIds = members.map(m => m.id);

  const allSessions = memberIds.flatMap(mid =>
    db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50').all(mid)
      .map(s => ({ ...s, memberId: mid }))
  );

  res.json({ members, sessions: allSessions });
});

// ─── START ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ScrollBreak backend running on port ${PORT}`);
  console.log(`DB: ${DB_PATH}`);
});

module.exports = app;
