# ScrollBreak 🛑

> AI-powered doomscrolling intervention — intention setting, session timer, reflection journaling, pattern coaching, team dashboards, and clinical analytics. Powered by Groq Llama.

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
├── app/                      ← Web app (GitHub Pages)
│   ├── index.html            ← Entry point
│   ├── css/
│   │   └── main.css          ← All styles
│   └── js/
│       ├── storage.js        ← localStorage + backend sync
│       ├── groq.js           ← Groq API client + prompts
│       ├── app.js            ← Intention, reflect, history logic
│       ├── dashboard.js      ← Family/team dashboard
│       └── analytics.js      ← Clinical analytics + charts
│
├── extension/                ← Chrome extension
│   ├── manifest.json         ← MV3 manifest
│   ├── background.js         ← Service worker (tab interception)
│   ├── content.js            ← Intention overlay injected into pages
│   ├── content.css           ← Overlay styles
│   └── popup.html            ← Extension popup
│
├── backend/                  ← Optional sync backend
│   ├── server.js             ← Express + SQLite API
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md
│
└── README.md
```

---

## Getting started

### Web app (zero setup)

1. Go to [henrymorgandibie.github.io/scrollbreak](https://henrymorgandibie.github.io/scrollbreak)
2. Click **⚙ SETTINGS** → paste your [Groq API key](https://console.groq.com)
3. Set your first intention

### Chrome extension (local install)

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `/extension` folder
5. Open any social media tab — ScrollBreak intercepts it

### Backend (optional — for multi-device sync)

```bash
cd backend
npm install
node server.js
```

Deploy to Railway, Render, or Fly.io for production. Then in the web app Settings, add your backend URL and a user ID to enable sync.

---

## Features

| Feature | Web App | Extension |
|---|---|---|
| Intention setting | ✅ | ✅ |
| Llama AI coaching | ✅ | ✅ |
| Session timer | ✅ | — |
| Reflection journal | ✅ | — |
| Pattern analysis | ✅ | — |
| Family dashboard | ✅ | — |
| Clinical analytics | ✅ | — |
| Multi-device sync | ✅ (with backend) | — |
| Tab interception | — | ✅ |

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML/CSS/JS |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Storage | localStorage (web) / chrome.storage (extension) |
| Backend | Node.js + Express + SQLite |
| Deploy | GitHub Pages (web) + any Node host (backend) |

---

## Privacy

- Your Groq API key is stored only in your browser. Never sent anywhere except `api.groq.com`.
- Session data stays local by default. Backend sync is opt-in and self-hosted.
- The Chrome extension only activates on social media domains listed in `manifest.json`.

---

## License

MIT
