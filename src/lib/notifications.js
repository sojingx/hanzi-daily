import { words } from '../data/hsk4';
import { getToday } from './storage';

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

/**
 * Schedule the daily notification via the service worker.
 * Uses serviceWorker.ready so it works even on first load when .controller is null.
 * Also fires a catch-up notification immediately if the scheduled time already
 * passed today and we haven't shown one yet.
 */
export async function scheduleNotification(time, wordId) {
  if (!('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'granted') return;

  const word = words.find((w) => w.id === wordId);
  if (!word) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active;
    if (!sw) return;

    sw.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      time,
      character: word.character,
      meaning: word.meaning,
      wordId,
    });

    // Catch-up: if the scheduled time already passed today and we haven't
    // shown a notification yet today, show one now.
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledToday = new Date();
    scheduledToday.setHours(hours, minutes, 0, 0);

    const lastNotifDate = localStorage.getItem('hanzidaily_lastNotifDate');
    if (scheduledToday <= new Date() && lastNotifDate !== getToday()) {
      reg.showNotification('今日汉字', {
        body: `${word.character}  —  ${word.meaning}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'daily-word',
        data: { wordId },
      });
      localStorage.setItem('hanzidaily_lastNotifDate', getToday());
    }
  } catch (e) {
    console.error('Notification scheduling failed:', e);
  }
}
