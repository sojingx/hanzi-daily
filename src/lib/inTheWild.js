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

// ── YouTube captions: find first timestamp where the character appears ─────────
async function findWordTimestamp(videoId, character) {
  // Try common Chinese caption language codes in order
  const langCodes = ['zh-Hans', 'zh', 'zh-CN', 'zh-TW', 'zh-Hant'];

  for (const lang of langCodes) {
    try {
      const timedtextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(timedtextUrl)}`;
      const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) continue;

      const data = await resp.json();
      if (!data.events?.length) continue;

      for (const event of data.events) {
        const text = (event.segs ?? []).map((s) => s.utf8 ?? '').join('');
        if (text.includes(character)) {
          return Math.floor((event.tStartMs ?? 0) / 1000);
        }
      }
      // Caption track found but word not in it — no point trying other langs
      break;
    } catch {
      // timeout or parse error — try next lang
    }
  }
  return null;
}

// ── YouTube: up to 3 results + timestamps ────────────────────────────────────
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
          thumbnail:
            item.snippet.thumbnails?.medium?.url ??
            item.snippet.thumbnails?.default?.url ??
            null,
        });
      }
    } catch {
      // ignore individual query failures
    }
  }

  // Fetch timestamps for all videos in parallel
  const withTimestamps = await Promise.all(
    results.map(async (v) => {
      const timestamp = await findWordTimestamp(v.id, character).catch(() => null);
      return { ...v, timestamp };
    })
  );

  return withTimestamps;
}

// ── Public: fetch in parallel, cache result ────────────────────────────────────
export async function fetchInTheWild(word) {
  const cached = loadCache(word.id);
  if (cached) return cached;

  const [geniusResult, youtubeResult] = await Promise.allSettled([
    fetchGenius(word.character),
    fetchYouTube(word.character),
  ]);

  const result = {
    genius: geniusResult.status === 'fulfilled' ? geniusResult.value : null,
    youtube: youtubeResult.status === 'fulfilled' ? youtubeResult.value : [],
  };

  // Only cache if at least one source succeeded
  if (result.genius || result.youtube.length) {
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
