# ScrollBreak 🛑

> AI-powered doomscrolling intervention — intention setting, session timer, reflection journaling, pattern coaching, team dashboards, and clinical analytics. Powered by Groq Llama.

![ScrollBreak App Preview](docs/screenshot.svg)

---

## ⚠️ Honest: What actually works

| Feature | Platform | Status | Notes |
|---|---|---|---|
| Intention + reflect + history | Web app | ✅ Full | Open manually at the URL |
| AI coaching via Groq Llama | Web + Extension + Android | ✅ Full | Free Groq API key required |
| Session timer with limit alert | Web app | ✅ Full | Flashes red at your limit |
| Family / team dashboard | Web app | ✅ Full | Add members, view group stats |
| Clinical analytics view | Web app | ✅ Full | Needs a few sessions first |
| Multi-device sync | Web app | ✅ With backend | Self-host the Express server |
| Tab interception | Chrome extension | ✅ Full | Desktop Chrome only |
| Add to home screen (PWA) | iPhone + Android | ✅ Full | Works like a native app |
| Push notifications + reminders | iPhone + Android | ✅ Full | Via PWA service worker |
| Offline support | iPhone + Android | ✅ Full | Service worker caches all assets |
| Real app interception | Android | ✅ Full | Accessibility Service overlays social media apps |
| Real app interception | iPhone | ❌ Not possible | Apple blocks this at the OS level |

**In plain terms:**
- **Desktop** → Chrome extension intercepts Twitter, YouTube, TikTok etc. before they load
- **Android** → Install the APK, enable Accessibility Service, and it overlays social media apps just like on desktop
- **iPhone** → Install the PWA (add to home screen), use it as a habit before opening apps. Pair with Screen Time for hard limits
- **Everywhere** → The web app + Groq AI coaching works on any browser

---

## What it does

ScrollBreak interrupts doomscrolling at three points:

**Before** — State why you're opening a platform, set a time limit. Llama coaches you on whether your intention is specific or a cover for mindless scrolling.

**During** — Session timer tracks actual vs. intended time. Flashes red when your limit hits.

**After** — Log your mood and whether you hit your goal. Llama gives a personalized debrief naming the exact pattern it sees.

**Over time** — Every session builds a local history. AI surfaces your biggest behavioral risks across platforms, moods, and times of day.

---

## Getting started

### Web app (any device, zero install)

1. Go to [henrymorgandibie.github.io/scrollbreak](https://henrymorgandibie.github.io/scrollbreak)
2. Click **⚙ SETTINGS** → paste your [Groq API key](https://console.groq.com) (free)
3. Pick a platform, write your intention, set a time limit
4. Hit **SET INTENTION + GET COACHING**

---

### PWA — iPhone and Android (add to home screen)

Turns ScrollBreak into a home screen app with push notifications and offline support.

**iPhone (Safari):**
1. Open [henrymorgandibie.github.io/scrollbreak](https://henrymorgandibie.github.io/scrollbreak) in Safari
2. Tap the Share button → **Add to Home Screen**
3. Tap Add — ScrollBreak appears on your home screen like a native app
4. Open it → Settings → tap **Enable daily reminders** → allow notifications

**Android (Chrome):**
1. Open the URL in Chrome
2. Tap the 3-dot menu → **Add to Home Screen** or **Install App**
3. Tap Install — it launches fullscreen with no browser bar
4. Enable notifications when prompted for daily check-ins

---

### Chrome extension — desktop tab interception

Intercepts Chrome tabs when you navigate to social media and forces an intention screen before the page loads.

1. Clone or download this repo
2. Open `chrome://extensions` in Chrome
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked** → select the `/extension` folder
5. Click the ScrollBreak toolbar icon → paste your Groq key
6. Open YouTube, Twitter, TikTok — the overlay appears before the feed loads

**Platforms intercepted:** Twitter/X · Instagram · TikTok · YouTube · Reddit · Google News · BBC · CNN

---

### Android app — real interception via Accessibility Service

Overlays an intention screen on top of social media apps the moment you open them — same behaviour as the Chrome extension, but for native apps.

**Requirements:** Android Studio, Android phone with USB debugging enabled

1. Clone this repo
2. Open the `/android` folder in Android Studio
3. Plug in your Android phone → hit **Run**
4. In the app tap **Enable Accessibility Service** → find ScrollBreak → turn it on
5. Paste your Groq key in the app
6. Open TikTok, Instagram, YouTube — ScrollBreak overlays before the feed appears

**Apps intercepted:** Twitter/X · Instagram · TikTok · YouTube · Reddit · Facebook · Snapchat

> iOS equivalent is not possible — Apple does not allow apps to overlay or intercept other apps.

---

### Backend sync (optional — multi-device)

```bash
cd backend
npm install
node server.js
```

Deploy to Railway or Render. In Settings, add your backend URL + a user ID. Sessions sync across all your devices and the Android app.

---

## Project structure

```
scrollbreak/
├── index.html                    ← GitHub Pages entry (redirects to app/)
│
├── app/                          ← Web app + PWA
│   ├── index.html                ← Entry point with PWA meta tags
│   ├── manifest.json             ← PWA manifest (icons, shortcuts, display)
│   ├── sw.js                     ← Service worker (offline, push, bg sync)
│   ├── css/
│   │   └── main.css              ← All styles
│   └── js/
│       ├── storage.js            ← localStorage + backend sync
│       ├── groq.js               ← Groq API client + all 5 prompts
│       ├── app.js                ← Intention, reflect, history logic
│       ├── dashboard.js          ← Family/team dashboard
│       ├── analytics.js          ← Clinical analytics + charts
│       └── pwa.js                ← PWA install prompt + notification scheduling
│
├── extension/                    ← Chrome extension (MV3)
│   ├── manifest.json
│   ├── background.js             ← Service worker: tab interception
│   ├── content.js                ← Intention overlay injected into pages
│   ├── content.css               ← Overlay styles
│   └── popup.html                ← Toolbar popup (key + quick stats)
│
├── android/                      ← Android native app
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/scrollbreak/
│       │   ├── MainActivity.java               ← Settings + onboarding
│       │   ├── IntentionActivity.java          ← Overlay shown over social apps
│       │   └── ScrollBreakAccessibilityService.java  ← App interception engine
│       └── res/
│           ├── layout/           ← UI layouts
│           ├── values/           ← Strings
│           └── xml/              ← Accessibility service config
│
├── backend/                      ← Optional sync server
│   ├── server.js                 ← Express + SQLite REST API
│   └── package.json
│
└── docs/
    ├── ARCHITECTURE.md
    └── screenshot.svg
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Web frontend | Vanilla HTML/CSS/JS — no build step, no dependencies |
| PWA | Service Worker + Web App Manifest |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Storage | localStorage (web) · chrome.storage (extension) · SharedPreferences (Android) |
| Chrome extension | Manifest V3 — background service worker + content scripts |
| Android | Java + Accessibility Services API |
| Backend | Node.js + Express + SQLite (better-sqlite3) |
| Hosting | GitHub Pages (web) · any Node host (backend) |

---

## Privacy

- Groq API key stored only in your browser/device — sent only to `api.groq.com`
- Session data is local by default — backend sync is opt-in and self-hosted
- Chrome extension activates only on domains listed in `manifest.json`
- Android Accessibility Service reads app package names only — no screen content, no keylogging
- No analytics, no tracking, no accounts required

---

## License

MIT

