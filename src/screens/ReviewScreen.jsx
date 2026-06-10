import { useState } from 'react';
import { WordCard } from '../components/WordCard';
import { words } from '../data/hsk4';
import { getCard, saveCard } from '../lib/storage';
import { createCard, reviewCard } from '../lib/sm2';

export function ReviewScreen({ queue, onBack, onQueueChange }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]); // 'known' | 'learning'

  const done = index >= queue.length;
  const wordId = queue[index];
  const word = wordId ? words.find((w) => w.id === wordId) : null;

  function advance(result) {
    const base = getCard(wordId) ?? createCard(wordId);
    saveCard(reviewCard(base, result === 'known' ? 4 : 1));
    setResults((r) => [...r, result]);
    setIndex((i) => i + 1);
  }

  if (queue.length === 0) {
    return (
      <div className="screen review-screen">
        <div className="screen-topbar">
          <button className="back-btn" onClick={onBack}>← Back</button>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h2>All caught up!</h2>
          <p>No words are due for review right now.</p>
          <p className="empty-sub">Keep studying — your next review will appear when it's due.</p>
        </div>
      </div>
    );
  }

  if (done) {
    const knownCount = results.filter((r) => r === 'known').length;
    const learningCount = results.filter((r) => r === 'learning').length;

    return (
      <div className="screen review-screen">
        <div className="screen-topbar">
          <button className="back-btn" onClick={() => { onQueueChange(); onBack(); }}>← Home</button>
        </div>
        <div className="review-complete">
          <div className="complete-icon">✅</div>
          <h2>Session complete!</h2>
          <p>{queue.length} word{queue.length !== 1 ? 's' : ''} reviewed</p>

          <div className="result-chips">
            <div className="result-chip chip-known">
              <span>{knownCount}</span> Known
            </div>
            <div className="result-chip chip-learning">
              <span>{learningCount}</span> Still Learning
            </div>
          </div>

          <p className="complete-hint">
            Words you marked "Still Learning" will reappear sooner.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => { onQueueChange(); onBack(); }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen review-screen">
      <div className="screen-topbar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <span className="progress-label">{index + 1} / {queue.length}</span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(index / queue.length) * 100}%` }}
        />
      </div>

      <div className="word-card-wrap">
        {word && (
          <WordCard
            key={wordId}
            word={word}
            onKnown={() => advance('known')}
            onStillLearning={() => advance('learning')}
          />
        )}
      </div>
    </div>
  );
}
