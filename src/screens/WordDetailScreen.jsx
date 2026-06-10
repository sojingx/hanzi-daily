import { WordCard } from '../components/WordCard';
import { InTheWild } from '../components/InTheWild';
import { words } from '../data/hsk4';
import { getCard, saveCard, getToday } from '../lib/storage';
import { createCard, reviewCard } from '../lib/sm2';

export function WordDetailScreen({ wordId, onBack, onDone }) {
  const word = words.find((w) => w.id === wordId);
  if (!word) return null;

  const card = getCard(wordId);
  const alreadyDone = card?.lastReviewed === getToday();

  function handleKnown() {
    const base = getCard(wordId) ?? createCard(wordId);
    saveCard(reviewCard(base, 4));
    onDone('known');
  }

  function handleStillLearning() {
    const base = getCard(wordId) ?? createCard(wordId);
    saveCard(reviewCard(base, 1));
    onDone('learning');
  }

  return (
    <div className="screen word-screen">
      <div className="screen-topbar">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        {alreadyDone && <span className="done-tag">✓ Reviewed today</span>}
      </div>

      <div className="word-card-wrap">
        <WordCard
          word={word}
          onKnown={alreadyDone ? null : handleKnown}
          onStillLearning={alreadyDone ? null : handleStillLearning}
          initialRevealed={alreadyDone}
        />
      </div>

      {alreadyDone && (
        <p className="already-done-msg">
          You've reviewed this word today. Come back tomorrow!
        </p>
      )}

      <InTheWild word={word} />
    </div>
  );
}
