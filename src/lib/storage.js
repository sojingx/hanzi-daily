const P = 'hanzidaily_';

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(P + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(P + key, JSON.stringify(value));
}

export function getToday() {
  // Use local date, not UTC — so the day rolls over at midnight in the user's timezone
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ── Cards (SM-2 state per word) ───────────────────────────────────────────────
export function getCards() {
  return load('cards', {});
}

export function saveCards(cards) {
  save('cards', cards);
}

export function getCard(wordId) {
  return getCards()[wordId] ?? null;
}

export function saveCard(card) {
  const cards = getCards();
  cards[card.wordId] = card;
  saveCards(cards);
}

// ── Today's word ──────────────────────────────────────────────────────────────
export function getTodayWord() {
  return load('todayWord', null);
}

export function saveTodayWord(wordId) {
  const today = getToday();
  save('todayWord', { wordId, date: today });
  // Log to daily history (only write once per day)
  const history = getDailyHistory();
  if (!history[today]) {
    history[today] = wordId;
    saveDailyHistory(history);
  }
}

// ── Daily history: { 'YYYY-MM-DD': wordId } ──────────────────────────────────
export function getDailyHistory() {
  return load('dailyHistory', {});
}

export function saveDailyHistory(history) {
  save('dailyHistory', history);
}

// ── Settings ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  notificationsEnabled: false,
  notificationTime: '08:00',
  streak: 0,
  lastActiveDate: null,
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...load('settings', {}) };
}

export function saveSettings(settings) {
  save('settings', settings);
}

// ── Streak tracking ───────────────────────────────────────────────────────────
export function touchStreak() {
  const today = getToday();
  const settings = getSettings();

  if (settings.lastActiveDate === today) return settings.streak;

  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yesterdayStr = [
    yDate.getFullYear(),
    String(yDate.getMonth() + 1).padStart(2, '0'),
    String(yDate.getDate()).padStart(2, '0'),
  ].join('-');

  const streak =
    settings.lastActiveDate === yesterdayStr ? settings.streak + 1 : 1;

  saveSettings({ ...settings, streak, lastActiveDate: today });
  return streak;
}

// ── Review queue (words due today, already learned at least once) ─────────────
export function getReviewQueue(todayWordId) {
  const today = getToday();
  const cards = getCards();
  return Object.values(cards)
    .filter(
      (c) => c.nextDue <= today && c.wordId !== todayWordId && c.reps > 0
    )
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
    .map((c) => c.wordId);
}
