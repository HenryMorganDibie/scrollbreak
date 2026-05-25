# ScrollBreak 🛑

> AI-powered doomscrolling intervention — intention setting, session timer, reflection journaling, and pattern coaching via Groq Llama.

## What it does

ScrollBreak is a single-file web app that helps you break the doomscrolling habit through three evidence-based interventions:

- **Intention** — Before opening any app, you state *why* you are going there, pick a platform, and set a time limit. Llama coaches you on whether your intention is specific or a disguised urge to scroll.
- **Reflect** — A session timer tracks how long you actually scrolled. After the session, you log your mood, whether you hit your goal, and a note. Llama gives a personalized debrief.
- **History** — Every session is logged locally. Once you have several sessions, Llama analyzes your patterns across platforms and mood outcomes.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — zero dependencies, zero build step |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Storage | `localStorage` — fully private, no backend |
| Deploy | GitHub Pages (one click) |

## Getting started

1. Clone or download this repo
2. Open `index.html` in any browser — no server needed
3. Click **⚡ SET GROQ KEY** and paste your key from [console.groq.com](https://console.groq.com)
4. Set your first intention and go

## Deploy to GitHub Pages

1. Go to repo **Settings → Pages**
2. Source: **Deploy from branch → main → / (root)**
3. Save — your app is live at `https://HenryMorganDibie.github.io/scrollbreak`

## Project structure

```
scrollbreak/
├── index.html        ← entire app (UI + logic + Groq integration)
├── README.md
├── ARCHITECTURE.md   ← data flow and design decisions
└── .gitignore
```

## Privacy

Your Groq API key is stored only in your browser localStorage. Session data never leaves your device. The only outbound request is to `api.groq.com` when Llama coaching is triggered.

## License

MIT

