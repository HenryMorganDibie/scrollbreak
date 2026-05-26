// content.js — injects intention overlay on social media pages

(function () {
  if (document.getElementById('sb-overlay')) return;

  const platform = window.__scrollbreakPlatform || 'this site';

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'sb-overlay';
  overlay.innerHTML = `
    <div id="sb-card">
      <div id="sb-logo">SCROLL<span>BREAK</span></div>
      <div id="sb-question">Why are you opening <em>${platform}</em>?</div>
      <textarea id="sb-intent" placeholder="Be specific — e.g. checking if a friend replied, one specific video, catching up on news..." rows="3"></textarea>
      <div id="sb-time-label">Time limit</div>
      <div id="sb-times">
        <button class="sb-time selected" data-mins="10">10 min</button>
        <button class="sb-time" data-mins="15">15 min</button>
        <button class="sb-time" data-mins="20">20 min</button>
        <button class="sb-time" data-mins="30">30 min</button>
      </div>
      <div id="sb-ai-box" style="display:none">
        <div id="sb-ai-label">🤖 Llama coaching...</div>
        <div id="sb-ai-text"></div>
      </div>
      <button id="sb-proceed">SET INTENTION &amp; PROCEED</button>
      <button id="sb-skip">Skip (no intention)</button>
    </div>
  `;

  document.documentElement.appendChild(overlay);

  let selectedMins = 10;

  // Time selection
  overlay.querySelectorAll('.sb-time').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.sb-time').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMins = parseInt(btn.dataset.mins);
    });
  });

  // Proceed
  document.getElementById('sb-proceed').addEventListener('click', async () => {
    const intent = document.getElementById('sb-intent').value.trim();
    if (!intent) { document.getElementById('sb-intent').focus(); return; }

    // Save session to extension storage
    const session = {
      id: Date.now(),
      platform,
      intention: intent,
      timeLimitMins: selectedMins,
      timestamp: new Date().toISOString(),
      source: 'extension'
    };

    chrome.storage.local.get(['sb_sessions'], (result) => {
      const sessions = result.sb_sessions || [];
      sessions.unshift(session);
      chrome.storage.local.set({ sb_sessions: sessions.slice(0, 200) });
    });

    // Try Groq coaching
    chrome.storage.local.get(['sb_groq_key'], async (result) => {
      const key = result.sb_groq_key;
      if (key) {
        const aiBox = document.getElementById('sb-ai-box');
        const aiText = document.getElementById('sb-ai-text');
        aiBox.style.display = 'block';
        document.getElementById('sb-proceed').disabled = true;

        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              max_tokens: 200,
              messages: [{
                role: 'user',
                content: `You are a mindful digital wellness coach. Be very brief (2 sentences max).
A user is about to open ${platform}. Intention: "${intent}". Limit: ${selectedMins} min.
One quick observation on their intention and one tip. No lists.`
              }]
            })
          });
          const data = await res.json();
          aiText.textContent = data.choices[0].message.content;
          document.getElementById('sb-ai-label').textContent = '🤖 Llama via Groq';

          // Auto-dismiss after 6 seconds
          setTimeout(() => dismissOverlay(), 6000);
        } catch {
          dismissOverlay();
        }
      } else {
        dismissOverlay();
      }
    });

    chrome.runtime.sendMessage({ type: 'INTENTION_SET' });
  });

  // Skip
  document.getElementById('sb-skip').addEventListener('click', dismissOverlay);

  function dismissOverlay() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s ease';
    setTimeout(() => overlay.remove(), 400);
  }
})();
