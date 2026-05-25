# ScrollBreak — Architecture

## Overview

ScrollBreak is intentionally a zero-dependency, single-file application. Every layer — UI, state, AI calls, persistence — lives in `index.html`. This is a deliberate constraint: no build toolchain, no node_modules, no deployment pipeline. Open the file and it works.

---

## Data flow

```
User action
    │
    ▼
UI Event Handler (vanilla JS)
    │
    ├── Local state update (JS variables)
    │
    ├── localStorage write (session log, API key)
    │
    └── Groq API call (if key present)
            │
            ▼
        api.groq.com/openai/v1/chat/completions
        model: llama-3.3-70b-versatile
            │
            ▼
        AI response rendered inline
```

---

## Modules (logical, all in index.html)

### 1. Intention Engine
- Platform selection (Twitter/X, Instagram, YouTube, TikTok, Reddit, News)
- Free-text intention input
- Time limit selection (10 / 15 / 20 / 30 min)
- Groq prompt: evaluates specificity of intention, flags avoidance patterns, gives one practical tip

### 2. Session Timer
- Client-side interval timer (seconds precision)
- Visual warning when time limit is hit (color flash)
- Pause / resume / reset controls
- Duration stored on session object at reflection save

### 3. Reflection Journal
- Mood selector (7 states: Calm, Anxious, Irritated, Low, Numb, Motivated, Regretful)
- Goal achievement selector (Yes / Partially / No, drifted)
- Free-text note
- Groq prompt: pattern observation + one concrete next-time action

### 4. Session Store
- Structure: array of session objects in localStorage key `sb_sessions`
- Max 100 sessions retained (FIFO)
- Session object schema:
```json
{
  "id": 1716900000000,
  "platform": "YouTube",
  "intention": "Watch one tutorial on dbt",
  "timeLimitMins": 20,
  "timestamp": "2026-05-26T10:00:00.000Z",
  "mood": "😌 Calm",
  "achieved": "yes",
  "note": "Stayed focused",
  "durationSecs": 1140
}
```

### 5. Pattern Insight
- Triggered manually from History tab
- Sends last 10 sessions to Llama
- Prompt extracts: dominant platforms, intention quality trend, mood outcome correlation, achievement rate

---

## AI prompt design

All three prompts share these constraints:
- Max 300 tokens (concise by design)
- No bullet points or headers requested — natural spoken text
- Role: "mindful digital wellness coach"
- Tone: direct, warm, honest

---

## Privacy model

| Data | Where it lives | Leaves device? |
|---|---|---|
| Groq API key | localStorage | Only to api.groq.com |
| Session log | localStorage | Never |
| Intention text | localStorage + Groq prompt | Sent to Groq at coaching time |
| Mood / reflection | localStorage + Groq prompt | Sent to Groq at coaching time |

---

## Deployment options

| Option | Steps |
|---|---|
| Local | Open index.html in browser |
| GitHub Pages | Settings → Pages → main / root |
| Any static host | Upload index.html — done |

