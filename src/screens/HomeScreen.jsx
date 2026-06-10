import { words } from '../data/hsk4';
import { getCard } from '../lib/storage';

export function HomeScreen({ todayWordId, reviewCount, streak, onOpenWord, onStartReview }) {
  const word = words.find((w) => w.id === todayWordId);
  const card = todayWordId ? getCard(todayWordId) : null;
  const alreadyReviewedToday = card?.lastReviewed === new Date().toISOString().split('T')[0];

  return (
    <div className="screen home-screen">
      {/* Header */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="app-title">汉字日记</h1>
          <p className="app-subtitle">Daily Chinese</p>
        </div>
        {streak > 0 && (
          <div className="streak-chip">
            <span className="streak-flame">🔥</span>
            <span className="streak-num">{streak}</span>
          </div>
        )}
      </header>

      {/* Today's word preview card */}
      <section className="today-section">
        <p className="section-label">Today's Word</p>

        {word ? (
          <button className="preview-card" onClick={() => onOpenWord(todayWordId)}>
            <div className="preview-character">{word.character}</div>
            <div className="preview-meaning">{word.meaning}</div>
            {alreadyReviewedToday ? (
              <div className="preview-done-badge">✓ Done today</div>
            ) : (
              <div className="preview-cta">Tap to study →</div>
            )}
          </button>
        ) : (
          <div className="preview-card preview-empty">
            <p>No word selected yet</p>
          </div>
        )}
      </section>

      {/* Review queue */}
      <section className="review-section">
        <div className="review-row">
          <div>
            <p className="section-label">Due for Review</p>
            <p className="review-count-text">
              {reviewCount === 0
                ? 'All caught up!'
                : `${reviewCount} word${reviewCount !== 1 ? 's' : ''} due`}
            </p>
          </div>
          {reviewCount > 0 && (
            <button className="btn btn-review-start" onClick={onStartReview}>
              Start →
            </button>
          )}
        </div>

        {reviewCount > 0 && (
          <div className="review-progress-bar">
            <div className="review-progress-fill" />
          </div>
        )}
      </section>

      {/* Stats hint */}
      <p className="home-hint">
        Words are scheduled with spaced repetition — review at the right moment to remember for life.
      </p>
    </div>
  );
}
