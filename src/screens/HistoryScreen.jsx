import { useState } from 'react';
import { getDailyHistory } from '../lib/storage';
import { words } from '../data/hsk4';
import { WordCard } from '../components/WordCard';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateString(year, month, day) {
  return [
    year,
    String(month + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function getCalendarDays(year, month) {
  // Monday-first grid
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = (firstDow + 6) % 7; // Mon=0 … Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function HistoryScreen() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const history = getDailyHistory();
  const cells = getCalendarDays(viewYear, viewMonth);

  const todayStr = toDateString(
    today.getFullYear(), today.getMonth(), today.getDate()
  );

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  }

  function handleDayClick(day) {
    if (!day) return;
    const ds = toDateString(viewYear, viewMonth, day);
    setSelectedDate(prev => prev === ds ? null : ds);
  }

  const selectedWordId = selectedDate ? history[selectedDate] : null;
  const selectedWord = selectedWordId ? words.find(w => w.id === selectedWordId) : null;

  // Count total learned days
  const learnedDays = Object.keys(history).length;

  return (
    <div className="screen history-screen">
      <header className="history-header">
        <div>
          <h2 className="history-title">History</h2>
          <p className="history-sub">
            {learnedDays} day{learnedDays !== 1 ? 's' : ''} studied
          </p>
        </div>
      </header>

      {/* Month navigator */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>

      {/* Day-of-week headers */}
      <div className="cal-grid">
        {DAY_LABELS.map(d => (
          <div key={d} className="cal-dow">{d}</div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="cal-cell cal-empty" />;
          const ds = toDateString(viewYear, viewMonth, day);
          const hasWord = !!history[ds];
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          return (
            <button
              key={ds}
              className={[
                'cal-cell',
                hasWord ? 'has-word' : '',
                isToday ? 'is-today' : '',
                isSelected ? 'is-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleDayClick(day)}
            >
              <span className="cal-day-num">{day}</span>
              {hasWord && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="cal-detail">
          {selectedWord ? (
            <>
              <p className="cal-detail-date">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
              <WordCard word={selectedWord} initialRevealed={true} />
            </>
          ) : (
            <div className="cal-no-word">
              <p>No word recorded for this day.</p>
            </div>
          )}
        </div>
      )}

      {learnedDays === 0 && (
        <p className="history-empty">
          Start studying today — your history will appear here.
        </p>
      )}
    </div>
  );
}
