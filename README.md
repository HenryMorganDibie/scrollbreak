# ScrollBreak 🛑

> AI-powered doomscrolling intervention — intention setting, session timer, reflection journaling, pattern coaching, team dashboards, and clinical analytics. Powered by Groq Llama.

![ScrollBreak App Preview](docs/screenshot.svg)

---

## What it does

ScrollBreak interrupts the doomscrolling habit at three points:

**Before** — You state why you're opening a platform, set a time limit. Llama coaches you on whether your intention is specific or a cover for mindless scrolling.

**During** — A session timer tracks actual vs. intended time. Hits red when your limit expires.

**After** — You log your mood and goal outcome. Llama gives a personalized debrief naming the pattern it sees.

**Over time** — Every session builds a local history. AI pattern analysis surfaces your biggest behavioral risks across platforms.

---

## Project structure

```
scrollbreak/
├── index.html                ← GitHub Pages entry (redirects to app/)
├── app/                      ← Web app
│   ├── index.html
│   ├── css/main.css
│   └── js/
│       ├── storage.js        ← localStorage + backend sync
│       ├── groq.js           ← Groq API client + all prompts
│       ├── app.js            ← Intention, reflect, history
│       ├── dashboard.js      ← Family/team dashboard
│       └── analytics.js      ← Clinical analytics + charts
├── extension/                ← Chrome extension
│   ├── manifest.json         ← MV3
│   ├── background.js         ← Tab interception service worker
│   ├── content.js            ← Intention overlay injected into pages
│   ├── content.css
│   └── popup.html
├── backend/                  ← Optional self-hosted sync server
│   ├── server.js             ← Express + SQLite
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   └── screenshot.svg
└── README.md
```

---

## Getting started

### Web app (zero setup)

1. Go to [henrymorgandibie.github.io/scrollbreak](https://henrymorgandibie.github.io/scrollbreak)
2. Click **⚙ SETTINGS** → paste your [Groq API key](https://console.groq.com)
3. Pick a platform, write your intention, set a time limit
4. Hit **SET INTENTION + GET COACHING** — Llama responds instantly

### Chrome extension (intercepts social media tabs)

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select the `/extension` folder
5. Open Twitter, YouTube, TikTok — ScrollBreak intercepts before the page loads

### Backend (optional — multi-device sync)

```bash
cd backend
npm install
node server.js
```

Deploy to Railway, Render, or Fly.io. Then in Settings, add your backend URL and a user ID to sync sessions across devices.

---

## Features

| Feature | Web App | Extension |
|---|---|---|
| Intention check before scrolling | ✅ | ✅ |
| Llama AI coaching | ✅ | ✅ |
| Session timer with limit alert | ✅ | — |
| Mood + reflection journal | ✅ | — |
| AI pattern analysis | ✅ | — |
| Family / team dashboard | ✅ | — |
| Clinical analytics view | ✅ | — |
| Multi-device sync | ✅ (with backend) | — |
| Tab interception overlay | — | ✅ |

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — no build step |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Storage | localStorage (web) · chrome.storage (extension) |
| Backend | Node.js + Express + SQLite |
| Hosting | GitHub Pages (web) · any Node host (backend) |

---

## Privacy

- Groq API key stored only in your browser — sent only to `api.groq.com`
- Session data is local by default — backend sync is opt-in and self-hosted
- Chrome extension activates only on domains listed in `manifest.json`
- No analytics, no tracking, no accounts

---

## License

MIT

