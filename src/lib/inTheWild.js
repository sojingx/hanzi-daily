// ── In the Wild — parallel API fetching with localStorage cache ────────────────
const CACHE_PREFIX = 'hanzidaily_itw_';

function loadCache(wordId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + wordId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(wordId, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + wordId, JSON.stringify(data));
  } catch {}
}

// ── Claude: register + context + example ─────────────────────────────────────
async function fetchClaude(character, meaning) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) throw new Error('No Anthropic API key configured');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a Mandarin Chinese language expert helping an intermediate learner understand how words appear in real life.

For the word "${character}" (meaning: ${meaning}), return ONLY a JSON object — no markdown, no code fences, no explanation — with exactly these fields:

{
  "register": one of "formal" | "casual" | "literary" | "slang" | "song" | "neutral",
  "contextNote": "1–2 sentences describing the kinds of real-life situations (TV dramas, news, song lyrics, everyday speech, literature, etc.) where this word naturally appears",
  "listenTip": "A short, practical tip for recognising or remembering this word when heard or read in the wild",
  "exampleLyricZh": "A natural, authentic-sounding example sentence in Chinese using this word — different from a textbook example",
  "exampleLyricPinyin": "Full pinyin for that sentence",
  "exampleLyricEn": "Natural English translation of that sentence"
}`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Claude API ${resp.status}: ${err.slice(0, 120)}`);
  }

  const data = await resp.json();
  const raw = data.content?.[0]?.text?.trim() ?? '';

  // Strip accidental markdown fences if Claude wraps in ```json
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

// ── Genius: first song result for the character ───────────────────────────────
async function fetchGenius(character) {
  const token = import.meta.env.VITE_GENIUS_TOKEN;
  if (!token || token.startsWith('your_')) throw new Error('No Genius token configured');

  const targetUrl = `https://api.genius.com/search?q=${encodeURIComponent(character)}&access_token=${token}`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

  const resp = await fetch(proxyUrl);
  if (!resp.ok) throw new Error(`Genius API ${resp.status}`);

  const data = await resp.json();
  const hit = data.response?.hits?.find((h) => h.type === 'song');
  if (!hit) return null;

  return {
    title: hit.result.title,
    artist: hit.result.primary_artist.name,
    url: hit.result.url,
    thumbnail: hit.result.song_art_image_thumbnail_url ?? null,
  };
}

// ── YouTube: up to 3 results across two search queries ───────────────────────
async function fetchYouTube(character) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) throw new Error('No YouTube API key configured');

  const queries = [`${character} 中文歌曲`, `${character} 中文对话`];
  const seen = new Set();
  const results = [];

  for (const q of queries) {
    if (results.length >= 3) break;
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet&q=${encodeURIComponent(q)}&maxResults=3&type=video` +
        `&key=${apiKey}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();

      for (const item of data.items ?? []) {
        if (results.length >= 3) break;
        const id = item.id?.videoId;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? null,
        });
      }
    } catch {
      // ignore individual query failures
    }
  }

  return results;
}

// ── Public: fetch all three in parallel, cache result ────────────────────────
export async function fetchInTheWild(word) {
  const cached = loadCache(word.id);
  if (cached) return cached;

  const [claudeResult, geniusResult, youtubeResult] = await Promise.allSettled([
    fetchClaude(word.character, word.meaning),
    fetchGenius(word.character),
    fetchYouTube(word.character),
  ]);

  const result = {
    claude: claudeResult.status === 'fulfilled' ? claudeResult.value : null,
    claudeError: claudeResult.status === 'rejected' ? claudeResult.reason?.message : null,
    genius: geniusResult.status === 'fulfilled' ? geniusResult.value : null,
    youtube: youtubeResult.status === 'fulfilled' ? youtubeResult.value : [],
  };

  // Only cache if at least one source succeeded
  if (result.claude || result.genius || result.youtube.length) {
    saveCache(word.id, result);
  }

  return result;
}

// Clears cached data for a specific word (useful for refresh)
export function clearInTheWildCache(wordId) {
  try {
    localStorage.removeItem(CACHE_PREFIX + wordId);
  } catch {}
}
