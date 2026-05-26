// groq.js — Groq API client using llama-3.3-70b-versatile

const Groq = (() => {
  const MODEL = 'llama-3.3-70b-versatile';
  const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

  const call = async (prompt, maxTokens = 350) => {
    const key = Storage.getGroqKey();
    if (!key) throw new Error('No Groq API key set. Open Settings to add one.');

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Groq error ${res.status}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  };

  const streamToElement = async (prompt, el, maxTokens = 350) => {
    el.innerHTML = '<span class="thinking">Llama is thinking...</span>';
    try {
      const text = await call(prompt, maxTokens);
      el.textContent = text;
      return text;
    } catch (e) {
      el.innerHTML = `<span style="color:var(--accent2)">Error: ${e.message}</span>`;
      return null;
    }
  };

  // Pre-built prompts
  const prompts = {
    intention: (platform, intent, timeLimitMins) =>
      `You are a mindful digital wellness coach. Be direct, warm, and concise (3-4 sentences max).

A user is about to open ${platform}. Their stated intention: "${intent}". They've set a ${timeLimitMins}-minute limit.

Give one sharp observation about their intention (is it specific enough? is it a cover for mindless scrolling?), and one practical tip to stay on track. Be honest but supportive. No bullet points, no headers — just natural spoken text.`,

    reflection: (platform, timeLimitMins, actualMins, achieved, mood, note) =>
      `You are a mindful digital wellness coach. Be warm, direct, and brief (3-4 sentences).

After a ${platform} session (${actualMins} min actual, ${timeLimitMins} min intended):
- Goal achieved: ${achieved}
- Mood after: ${mood}
- Their note: "${note || 'none'}"

Give a brief, specific reflection — acknowledge what happened, name one pattern you notice, and give ONE concrete thing to try next time. No lists, just natural spoken text.`,

    patterns: (sessions) => {
      const summary = sessions.slice(0, 10).map(s =>
        `Platform: ${s.platform}, Intention: "${s.intention}", Achieved: ${s.achieved || 'not reflected'}, Mood after: ${s.mood || 'not logged'}`
      ).join('\n');
      return `You are a digital wellness coach analyzing scrolling patterns. Be analytical, honest, and constructive (4-6 sentences).

Recent sessions:
${summary}

Identify the most significant pattern — which platforms dominate, whether intentions are specific or vague, mood outcomes, achievement rates. Give one actionable strategy tailored to what you see. Speak directly to the user. No bullet points.`;
    },

    group: (members, allSessions) => {
      const memberSummary = members.map(m => {
        const ms = allSessions.filter(s => s.memberId === m.id || !s.memberId).slice(0, 5);
        return `${m.name} (${m.role}): ${ms.length} sessions, platforms: ${[...new Set(ms.map(s=>s.platform))].join(', ')||'none'}`;
      }).join('\n');
      return `You are a digital wellness coach analyzing group scrolling habits. Be concise and actionable (4-5 sentences).

Group members:
${memberSummary}

Identify the group's biggest collective challenge and give one specific recommendation the group can implement together. Be direct and warm.`;
    },

    clinical: (sessions) => {
      const platforms = {};
      const moods = {};
      let drifted = 0, achieved = 0, partial = 0;
      sessions.forEach(s => {
        platforms[s.platform] = (platforms[s.platform]||0)+1;
        if (s.mood) moods[s.mood] = (moods[s.mood]||0)+1;
        if (s.achieved === 'yes') achieved++;
        else if (s.achieved === 'partial') partial++;
        else if (s.achieved === 'no') drifted++;
      });
      return `You are a behavioral health data analyst producing a clinical-style report. Be precise, evidence-based, and constructive (6-8 sentences).

Data from ${sessions.length} sessions:
- Platform distribution: ${JSON.stringify(platforms)}
- Mood outcomes: ${JSON.stringify(moods)}
- Goal achievement: ${achieved} achieved, ${partial} partial, ${drifted} drifted
- Avg session duration: ${Math.round(sessions.filter(s=>s.durationSecs).reduce((a,s)=>a+s.durationSecs,0)/Math.max(sessions.filter(s=>s.durationSecs).length,1)/60)} min

Produce a structured assessment covering: behavioral patterns, emotional impact indicators, risk factors, and 2 specific evidence-based recommendations. Clinical but accessible tone.`;
    }
  };

  return { call, streamToElement, prompts };
})();
