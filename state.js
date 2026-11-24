import {
  starterCards
} from './data.js';
export const STORAGE_KEY = 'little-mandarin-v1';
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function newState() {
  return {
    version: 1,
    profile: {
      name: '',
      minutes: 30
    },
    days: {},
    completed: [],
    cards: starterCards.map(c => ({
      ...c,
      due: 0,
      interval: 0,
      reviews: 0
    })),
    timer: null
  };
}
const finite = (x, max = Number.MAX_SAFE_INTEGER) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= max;
export function validateState(s) {
  if (!s || s.version !== 1 || !s.profile || typeof s.profile.name !== 'string' || s.profile.name.length > 40 || ![15, 30, 60].includes(s.profile.minutes) || !Array.isArray(s.completed) || s.completed.length > 8 || !s.completed.every(x => ['hello', 'repair', 'courtesy', 'drinks', 'numbers', 'where', 'about', 'connect'].includes(x)) || new Set(s.completed).size !== s.completed.length) throw Error('This file is not a supported Little Mandarin backup.');
  if (!Array.isArray(s.cards) || s.cards.length > 3000 || !s.cards.every(c => c && ['id', 'hanzi', 'pinyin', 'english', 'source'].every(k => typeof c[k] === 'string' && c[k].length > 0 && c[k].length <= 500) && finite(c.due, 1e14) && finite(c.interval, 365) && finite(c.reviews, 1e7)) || new Set(s.cards.map(c => c.id)).size !== s.cards.length) throw Error('Invalid phrase data in backup.');
  if (!s.days || typeof s.days !== 'object' || Array.isArray(s.days) || Object.keys(s.days).length > 20000 || !Object.entries(s.days).every(([k, d]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && d && Array.isArray(d.done) && d.done.length <= 4 && d.done.every(x => ['sound', 'learn', 'review', 'speak'].includes(x)) && new Set(d.done).size === d.done.length && finite(d.seconds, 86400) && finite(d.reviews, 1e7))) throw Error('Invalid practice history in backup.');
  if (s.timer !== null && (!s.timer || !finite(s.timer.started, 1e14) || !['sound', 'learn', 'review', 'speak'].includes(s.timer.task))) throw Error('Invalid timer in backup.');
  return s;
}
export function schedule(card, rating, now = Date.now()) {
  if (!['again', 'good', 'easy'].includes(rating)) throw Error('Unknown review rating');
  const interval = rating === 'again' ? 0 : rating === 'easy' ? Math.min(365, Math.max(3, card.interval * 2.5)) : Math.min(365, Math.max(1, card.interval * 2));
  return {
    ...card,
    interval,
    due: now + (rating === 'again' ? 600000 : interval * 86400000),
    reviews: card.reviews + 1
  };
}
export function streak(days, today = new Date()) {
  const d = new Date(today);
  let count = 0;
  if (!(days[dayKey(d)]?.seconds > 0 || days[dayKey(d)]?.done.length)) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]?.seconds > 0 || days[dayKey(d)]?.done.length) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
export function accrueTimer(state, now = Date.now()) {
  if (!state.timer) return;
  const start = state.timer.started;
  // Limit unattended sessions to two hours; split activity at local midnight.
  const end = Math.min(now, start + 7200000);
  let cursor = start;
  while (cursor < end) {
    const d = new Date(cursor),
      midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(),
      until = Math.min(end, midnight),
      key = dayKey(d);
    state.days[key] ??= {
      done: [],
      seconds: 0,
      reviews: 0
    };
    state.days[key].seconds = Math.min(86400, state.days[key].seconds + (until - cursor) / 1000);
    cursor = until;
  }
  state.timer = null;
}
