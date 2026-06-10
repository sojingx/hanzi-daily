import { useState } from 'react';

export function WordCard({ word, onKnown, onStillLearning, initialRevealed = false }) {
  const [revealed, setRevealed] = useState(initialRevealed);

  function handleReveal() {
    if (!revealed) setRevealed(true);
  }

  return (
    <div className="word-card" onClick={!revealed ? handleReveal : undefined}>
      <div className="card-top">
        <p className="card-label">HSK 4</p>
        <div className="character-hero">{word.character}</div>
        <p className="meaning-text">{word.meaning}</p>
      </div>

      {!revealed ? (
        <div className="reveal-hint">
          <span className="reveal-icon">👆</span>
          <span>Tap to reveal</span>
        </div>
      ) : (
        <div className="revealed-section">
          <div className="pinyin-row">{word.pinyin}</div>

          <div className="example-block">
            <p className="example-zh">{word.exampleZh}</p>
            <p className="example-pinyin">{word.examplePinyin}</p>
            <p className="example-en">{word.exampleEn}</p>
          </div>

          {onKnown && onStillLearning && (
            <div className="action-row">
              <button
                className="btn btn-learning"
                onClick={(e) => { e.stopPropagation(); onStillLearning(); }}
              >
                Still Learning
              </button>
              <button
                className="btn btn-known"
                onClick={(e) => { e.stopPropagation(); onKnown(); }}
              >
                Known ✓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
