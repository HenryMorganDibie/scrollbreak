# ScrollBreak — Architecture

## System overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER TOUCHPOINTS                      │
│                                                          │
│  Chrome Extension          Web App (GitHub Pages)        │
│  ┌─────────────┐           ┌──────────────────────┐      │
│  │ Tab intercept│           │ Intention / Reflect  │      │
│  │ Overlay UI  │           │ History / Dashboard  │      │
│  │ Popup stats │           │ Clinical Analytics   │      │
│  └──────┬──────┘           └──────────┬───────────┘      │
│         │                             │                  │
└─────────┼─────────────────────────────┼──────────────────┘
          │                             │
          ▼                             ▼
   chrome.storage.local          localStorage
          │                             │
          └──────────┬──────────────────┘
                     │ (optional sync)
                     ▼
          ┌──────────────────────┐
          │   Backend (Express)  │
          │   SQLite database    │
          │   /api/sync  (POST)  │
          │   /api/pull  (GET)   │
          │   /api/analytics     │
          └──────────────────────┘
                     │
          (all AI calls go directly
           from browser to Groq)
                     │
                     ▼
          ┌──────────────────────┐
          │     Groq API         │
          │  llama-3.3-70b-      │
          │  versatile           │
          └──────────────────────┘
```

---

## Module breakdown

### app/js/storage.js
- Wraps all localStorage reads/writes
- Fire-and-forget sync to backend (never blocks UI)
- Pulls latest data from backend on page load
- Max 200 sessions retained locally

### app/js/groq.js
- Single `call()` function — all Groq requests go through here
- `streamToElement()` helper renders thinking state + result
- All 5 prompts defined in `prompts` object:
  - `intention` — pre-scroll coaching
  - `reflection` — post-scroll debrief
  - `patterns` — personal history analysis
  - `group` — family/team insight
  - `clinical` — structured behavioral report

### app/js/app.js
- Intention tab: platform + intent + time limit → session creation → Groq coaching
- Reflect tab: timer + mood + outcome → session update → Groq debrief
- History tab: session log render + streak counter + pattern insight trigger

### app/js/dashboard.js
- Member management (add/list)
- Group statistics (total sessions, goal rate, platforms)
- Group AI insight via Groq

### app/js/analytics.js
- Summary cards: total sessions, avg duration, achievement rate, drift rate
- Mood distribution bar chart (pure CSS, no library)
- Platform risk index: % of sessions per platform with negative mood or drift
- Weekly trend: 7-day bar chart by day of week
- Clinical report generation via Groq

---

## Chrome Extension flow

```
User navigates to twitter.com
        │
        ▼
background.js (service worker)
  - Detects social media domain
  - Checks if tab already cleared
  - If not: injects content.js
        │
        ▼
content.js
  - Renders full-screen overlay over page content
  - User types intention + selects time limit
  - On submit: saves session to chrome.storage
  - Calls Groq API directly (key from chrome.storage)
  - Shows 2-sentence coaching response
  - Auto-dismisses after 6 seconds
  - Sends INTENTION_SET message to background
        │
        ▼
background.js
  - Marks tab as cleared
  - Next navigation on same tab is allowed through
```

---

## Backend API

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Status check |
| `/api/sync` | POST | Push sessions or members from client |
| `/api/pull?userId=` | GET | Fetch all user data |
| `/api/analytics/:userId` | GET | Aggregate stats (no raw content) |
| `/api/members/:adminId/sessions` | GET | All member sessions for dashboard |

### Session schema
```json
{
  "id": 1716900000000,
  "platform": "YouTube",
  "intention": "Watch one specific tutorial",
  "timeLimitMins": 20,
  "durationSecs": 1380,
  "mood": "😌 Calm",
  "achieved": "yes",
  "note": "Stayed on task",
  "timestamp": "2026-05-26T10:00:00.000Z",
  "source": "web | extension"
}
```

---

## AI Prompt design

All prompts share these constraints:
- Model: `llama-3.3-70b-versatile` via Groq
- Max tokens: 200–500 depending on use case
- No bullet points or headers — natural spoken text requested
- Role: "mindful digital wellness coach" or "behavioral health analyst"
- Tone: direct, warm, evidence-based

---

## Privacy model

| Data | Storage | Leaves device? |
|---|---|---|
| Groq API key | localStorage / chrome.storage | Only to api.groq.com |
| Sessions | localStorage / chrome.storage | Only if backend URL configured |
| Intention text | Local + sent to Groq at coaching time | Yes, to Groq |
| Mood/reflection | Local + sent to Groq at coaching time | Yes, to Groq |
| Backend data | SQLite (self-hosted) | Never — you own the server |
