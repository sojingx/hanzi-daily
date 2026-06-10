import { getToday } from './storage';

export function createCard(wordId) {
  return {
    wordId,
    ef: 2.5,
    interval: 0,
    reps: 0,
    nextDue: getToday(),
    lastReviewed: null,
  };
}

/**
 * SM-2 algorithm.
 * quality: 4 = "Known", 1 = "Still Learning"
 */
export function reviewCard(card, quality) {
  let { ef, interval, reps } = card;

  if (quality >= 3) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
    ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    reps = 0;
    interval = 1;
  }

  const due = new Date();
  due.setDate(due.getDate() + interval);

  return {
    ...card,
    ef,
    interval,
    reps,
    nextDue: due.toISOString().split('T')[0],
    lastReviewed: getToday(),
  };
}
