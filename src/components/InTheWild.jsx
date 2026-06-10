import { useState, useEffect } from 'react';
import { fetchInTheWild, clearInTheWildCache } from '../lib/inTheWild';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format seconds as M:SS */
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GeniusBlock({ data }) {
  return (
    <div className="itw-card itw-genius-card">
      <div className="itw-card-header">
        <span className="itw-card-icon">♪</span>
        <span className="itw-card-title">Song Reference</span>
        <span className="itw-source-badge itw-source-genius">Genius</span>
      </div>

      <a
        className="itw-genius-link"
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {data.thumbnail && (
          <img
            className="itw-genius-thumb"
            src={data.thumbnail}
            alt={data.title}
            loading="lazy"
          />
        )}
        <div className="itw-genius-meta">
          <span className="itw-genius-title">{data.title}</span>
          <span className="itw-genius-artist">{data.artist}</span>
          <span className="itw-genius-cta">View on Genius →</span>
        </div>
      </a>
    </div>
  );
}

function YouTubeBlock({ videos, character }) {
  if (!videos.length) return null;

  return (
    <div className="itw-card itw-yt-card">
      <div className="itw-card-header">
        <span className="itw-card-icon">▶</span>
        <span className="itw-card-title">Videos</span>
        <span className="itw-source-badge itw-source-yt">YouTube</span>
      </div>

      <div className="itw-yt-grid">
        {videos.map((v) => {
          const href =
            v.timestamp != null
              ? `https://www.youtube.com/watch?v=${v.id}&t=${v.timestamp}`
              : `https://www.youtube.com/watch?v=${v.id}`;

          return (
            <a
              key={v.id}
              className="itw-yt-item"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="itw-yt-thumb-wrap">
                {v.thumbnail && (
                  <img
                    className="itw-yt-thumb"
                    src={v.thumbnail}
                    alt={v.title}
                    loading="lazy"
                  />
                )}
                {v.timestamp != null && (
                  <span className="itw-yt-timestamp">
                    {character} at {formatTime(v.timestamp)}
                  </span>
                )}
              </div>
              <div className="itw-yt-meta">
                <span className="itw-yt-title">{v.title}</span>
                <span className="itw-yt-channel">{v.channel}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="itw-spinner-wrap">
      <div className="itw-spinner" />
      <p className="itw-spinner-text">Finding real-world examples…</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InTheWild({ word }) {
  const [state, setState] = useState({ status: 'idle', data: null });

  useEffect(() => {
    if (!word) return;
    setState({ status: 'loading', data: null });

    fetchInTheWild(word)
      .then((data) => setState({ status: 'done', data }))
      .catch(() => setState({ status: 'error', data: null }));
  }, [word?.id]);

  function handleRefresh() {
    clearInTheWildCache(word.id);
    setState({ status: 'loading', data: null });
    fetchInTheWild(word)
      .then((data) => setState({ status: 'done', data }))
      .catch(() => setState({ status: 'error', data: null }));
  }

  const { status, data } = state;
  const hasContent = data && (data.genius || data.youtube?.length > 0);

  return (
    <section className="itw-section">
      <div className="itw-section-header">
        <div>
          <h3 className="itw-section-title">In the Wild</h3>
          <p className="itw-section-sub">See &amp; hear it used for real</p>
        </div>
        {status === 'done' && hasContent && (
          <button className="itw-refresh-btn" onClick={handleRefresh} title="Refresh">
            ↻
          </button>
        )}
      </div>

      {status === 'loading' && <Spinner />}

      {status === 'error' && (
        <div className="itw-error-box">
          <p>Couldn't load data. Check your API keys and try again.</p>
          <button className="itw-retry-btn" onClick={handleRefresh}>Retry</button>
        </div>
      )}

      {status === 'done' && hasContent && (
        <div className="itw-blocks">
          {data.genius && <GeniusBlock data={data.genius} />}
          {data.youtube?.length > 0 && (
            <YouTubeBlock videos={data.youtube} character={word.character} />
          )}
        </div>
      )}

      {status === 'done' && !hasContent && (
        <div className="itw-error-box">
          <p>No results found for this word.</p>
          <button className="itw-retry-btn" onClick={handleRefresh}>Retry</button>
        </div>
      )}
    </section>
  );
}
