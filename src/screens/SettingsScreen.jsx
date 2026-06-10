import { useState, useEffect } from 'react';
import { getSettings, saveSettings, getCards, getToday } from '../lib/storage';
import { requestPermission, scheduleNotification } from '../lib/notifications';
import { words } from '../data/hsk4';

export function SettingsScreen({ todayWordId }) {
  const [settings, setSettings] = useState(getSettings());
  const [permStatus, setPermStatus] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [saved, setSaved] = useState(false);

  const cards = getCards();
  const learnedCount = Object.values(cards).filter((c) => c.reps > 0).length;
  const totalDue = Object.values(cards).filter(
    (c) => c.nextDue <= getToday() && c.reps > 0
  ).length;

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  async function handleToggleNotifications() {
    if (permStatus === 'unsupported') return;

    if (!settings.notificationsEnabled) {
      const result = await requestPermission();
      setPermStatus(result);
      if (result !== 'granted') return;
    }

    const next = { ...settings, notificationsEnabled: !settings.notificationsEnabled };
    setSettings(next);
    saveSettings(next);

    if (next.notificationsEnabled) {
      scheduleNotification(next.notificationTime, todayWordId);
    }

    setSaved(true);
  }

  function handleTimeChange(e) {
    const next = { ...settings, notificationTime: e.target.value };
    setSettings(next);
    saveSettings(next);

    if (next.notificationsEnabled && todayWordId) {
      scheduleNotification(next.notificationTime, todayWordId);
    }

    setSaved(true);
  }

  function handleReset() {
    if (!window.confirm('Reset all progress? This cannot be undone.')) return;
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div className="screen settings-screen">
      <header className="settings-header">
        <h2>Settings</h2>
        {saved && <span className="saved-badge">Saved ✓</span>}
      </header>

      {/* Stats */}
      <section className="settings-section">
        <h3 className="section-title">Progress</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{learnedCount}</span>
            <span className="stat-label">Words Learned</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{words.length}</span>
            <span className="stat-label">Total Words</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{totalDue}</span>
            <span className="stat-label">Due Today</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{settings.streak ?? 0}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="settings-section">
        <h3 className="section-title">Daily Reminder</h3>

        {permStatus === 'unsupported' && (
          <p className="notif-note">
            Notifications are not supported in this browser.
          </p>
        )}

        {permStatus === 'denied' && (
          <p className="notif-note notif-denied">
            Notifications are blocked. Enable them in your browser settings.
          </p>
        )}

        {permStatus !== 'unsupported' && (
          <>
            <div className="settings-row">
              <label className="settings-label" htmlFor="notif-toggle">
                Enable daily reminder
              </label>
              <button
                id="notif-toggle"
                className={`toggle ${settings.notificationsEnabled ? 'on' : ''}`}
                onClick={handleToggleNotifications}
                aria-pressed={settings.notificationsEnabled}
              >
                <span className="toggle-knob" />
              </button>
            </div>

            {settings.notificationsEnabled && (
              <div className="settings-row">
                <label className="settings-label" htmlFor="notif-time">
                  Reminder time
                </label>
                <input
                  id="notif-time"
                  type="time"
                  className="time-input"
                  value={settings.notificationTime}
                  onChange={handleTimeChange}
                />
              </div>
            )}

            <p className="notif-note">
              Notifications require the app to be installed to your home screen on iOS.
            </p>
          </>
        )}
      </section>

      {/* About */}
      <section className="settings-section">
        <h3 className="section-title">About</h3>
        <p className="about-text">
          汉字日记 uses the SM-2 spaced repetition algorithm to schedule reviews at
          the optimal moment — just before you'd forget. One new HSK 4 word per day,
          with reviews growing further apart as your memory strengthens.
        </p>
      </section>

      {/* Danger zone */}
      <section className="settings-section">
        <button className="btn btn-danger" onClick={handleReset}>
          Reset All Progress
        </button>
      </section>
    </div>
  );
}
