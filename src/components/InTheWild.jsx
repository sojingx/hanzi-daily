import { useState, useEffect } from 'react';
import { fetchInTheWild, clearInTheWildCache } from '../lib/inTheWild';

// ── Helpers ───────────────────────────────────────────────────────────────────

const REGISTER_META = {
  formal:   { label: 'Formal',   cls: 'reg-formal'   },
  casual:   { label: 'Casual',   cls: 'reg-casual'   },
  literary: { label: 'Literary', cls: 'reg-literary' },
  slang:    { label: 'Slang',    cls: 'reg-slang'    },
  song:     { label: 'Song',     cls: 'reg-song'     },
  neutral:  { label: 'Neutral',  cls: 'reg-neutral'  },
};

/** Wrap every occurrence of `character` in the text with a red <span>. */
function HighlightedText({ text, character }) {
  if (!text || !character) return <span>{text}</span>;
  const parts = text.split(character);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="itw-highlight">{character}</span>
          )}
        </span>
      ))}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClaudeBlock({ data, character }) {
  const reg = REGISTER_META[data.register] ?? REGISTER_META.neutral;

  return (
    <div className="itw-card itw-claude-card">
      <div className="itw-card-header">
        <span className="itw-card-icon">✦</span>
        <span className="itw-card-title">Context</span>
        <span className={`itw-reg-badge ${reg.cls}`}>{reg.label}</span>
      </div>

      <p className="itw-context-note">{data.contextNote}</p>

      <div className="itw-listen-tip">
        <span className="itw-tip-label">Listen for</span>
        <span className="itw-tip-text">{data.listenTip}</span>
      </div>

      {data.exampleLyricZh && (
        <div className="itw-example-block">
          <p className="itw-example-zh">
            <HighlightedText text={data.exampleLyricZh} character={character} />
          </p>
          <p className="itw-example-pinyin">{data.exampleLyricPinyin}</p>
          <p className="itw-example-en">{data.exampleLyricEn}</p>
        </div>
      )}
    </div>
  );
}

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

function YouTubeBlock({ videos }) {
  if (!videos.length) return null;

  return (
    <div className="itw-card itw-yt-card">
      <div className="itw-card-header">
        <span className="itw-card-icon">▶</span>
        <span className="itw-card-title">Videos</span>
        <span className="itw-source-badge itw-source-yt">YouTube</span>
      </div>

      <div className="itw-yt-grid">
        {videos.map((v) => (
          <a
            key={v.id}
            className="itw-yt-item"
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {v.thumbnail && (
              <img
                className="itw-yt-thumb"
                src={v.thumbnail}
                alt={v.title}
                loading="lazy"
              />
            )}
            <div className="itw-yt-meta">
              <span className="itw-yt-title">{v.title}</span>
              <span className="itw-yt-channel">{v.channel}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="itw-spinner-wrap">
      <div className="itw-spinner" />
      <p className="itw-spinner-text">Loading real-world context…</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InTheWild({ word }) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    if (!word) return;
    setState({ status: 'loading', data: null, error: null });

    fetchInTheWild(word)
      .then((data) => setState({ status: 'done', data, error: null }))
      .catch((err) => setState({ status: 'error', data: null, error: err.message }));
  }, [word?.id]);

  function handleRefresh() {
    clearInTheWildCache(word.id);
    setState({ status: 'loading', data: null, error: null });
    fetchInTheWild(word)
      .then((data) => setState({ status: 'done', data, error: null }))
      .catch((err) => setState({ status: 'error', data: null, error: err.message }));
  }

  const { status, data } = state;
  const hasContent =
    data && (data.claude || data.genius || (data.youtube && data.youtube.length > 0));

  return (
    <section className="itw-section">
      {/* Section header */}
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

      {/* Loading */}
      {status === 'loading' && <Spinner />}

      {/* Error with no data */}
      {status === 'error' && !hasContent && (
        <div className="itw-error-box">
          <p>Couldn't load data. Check your API keys in .env and try again.</p>
          <button className="itw-retry-btn" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {status === 'done' && hasContent && (
        <div className="itw-blocks">
          {data.claude && (
            <ClaudeBlock data={data.claude} character={word.character} />
          )}
          {!data.claude && data.claudeError && (
            <div className="itw-partial-error">
              Context unavailable: {data.claudeError}
            </div>
          )}

          {data.genius && <GeniusBlock data={data.genius} />}

          {data.youtube?.length > 0 && <YouTubeBlock videos={data.youtube} />}
        </div>
      )}

      {/* Done but nothing came back */}
      {status === 'done' && !hasContent && (
        <div className="itw-error-box">
          <p>No results found for this word. Make sure your API keys are set in .env</p>
          <button className="itw-retry-btn" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
