import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { WordDetailScreen } from './screens/WordDetailScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NavBar } from './components/NavBar';
import {
  getToday,
  getTodayWord,
  saveTodayWord,
  getCards,
  getSettings,
  getReviewQueue,
  touchStreak,
} from './lib/storage';
import { words } from './data/hsk4';
import { scheduleNotification } from './lib/notifications';

function pickTodayWord() {
  const today = getToday();
  const saved = getTodayWord();
  // Reuse today's word only if it still exists in the current word list
  if (saved?.date === today && words.find((w) => w.id === saved.wordId)) {
    return saved.wordId;
  }

  // Find first unseen word
  const cards = getCards();
  const seen = new Set(Object.keys(cards));
  const next = words.find((w) => !seen.has(w.id));
  const id = next ? next.id : words[0].id;

  saveTodayWord(id);
  return id;
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [todayWordId, setTodayWordId] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const id = pickTodayWord();
    setTodayWordId(id);
    setReviewQueue(getReviewQueue(id));
    setStreak(touchStreak());

    // Re-schedule notification if enabled
    const settings = getSettings();
    if (settings.notificationsEnabled && navigator.serviceWorker?.controller) {
      scheduleNotification(settings.notificationTime, id);
    }

    // Listen for SW notification click (open word)
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'OPEN_WORD' && event.data.wordId) {
        setScreen('word');
        setTodayWordId(event.data.wordId);
      }
    });

    // Handle ?word= query param from notification tap
    const params = new URLSearchParams(window.location.search);
    const wordParam = params.get('word');
    if (wordParam) {
      setScreen('word');
      setTodayWordId(wordParam);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  function refreshQueue() {
    setReviewQueue(getReviewQueue(todayWordId));
  }

  function handleWordDone() {
    refreshQueue();
    setScreen('home');
  }

  return (
    <div className="app">
      <main className="main-content">
        {screen === 'home' && (
          <HomeScreen
            todayWordId={todayWordId}
            reviewCount={reviewQueue.length}
            streak={streak}
            onOpenWord={() => setScreen('word')}
            onStartReview={() => setScreen('review')}
          />
        )}

        {screen === 'word' && (
          <WordDetailScreen
            wordId={todayWordId}
            onBack={() => setScreen('home')}
            onDone={handleWordDone}
          />
        )}

        {screen === 'review' && (
          <ReviewScreen
            queue={reviewQueue}
            onBack={() => setScreen('home')}
            onQueueChange={refreshQueue}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen todayWordId={todayWordId} />
        )}
      </main>

      <NavBar
        screen={screen}
        onNavigate={setScreen}
        reviewCount={reviewQueue.length}
      />
    </div>
  );
}
