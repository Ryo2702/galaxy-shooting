const STORAGE_KEY = 'nova-verse.progress.v1';
let transactionSequence = 0;
export const emptyProgress = () => ({
  balance: 0,
  earned: 0,
  xp: 0,
  asteroids: 0,
  drones: 0,
  discoveries: 0,
  bestScore: 0,
  completed: [],
  transactions: [],
  flights: [],
});
const safeNumber = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function sanitizeProgress(value) {
  const clean = emptyProgress();
  if (!value || typeof value !== 'object') return clean;
  for (const key of [
    'balance',
    'earned',
    'xp',
    'asteroids',
    'drones',
    'discoveries',
    'bestScore',
  ])
    clean[key] = safeNumber(value[key]);
  clean.completed = Array.isArray(value.completed)
    ? [...new Set(value.completed.filter((x) => typeof x === 'string'))].slice(
        0,
        50,
      )
    : [];
  clean.transactions = Array.isArray(value.transactions)
    ? value.transactions
        .filter(
          (x) =>
            x &&
            typeof x.id === 'string' &&
            typeof x.label === 'string' &&
            Number.isFinite(x.amount) &&
            x.amount > 0 &&
            Number.isFinite(x.time),
        )
        .slice(0, 60)
    : [];
  clean.flights = Array.isArray(value.flights)
    ? value.flights
        .filter(
          (x) =>
            x &&
            Number.isFinite(x.score) &&
            x.score >= 0 &&
            Number.isFinite(x.time),
        )
        .slice(0, 10)
    : [];
  return clean;
}

export class MockCryptoService {
  load() {
    try {
      return sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return emptyProgress();
    }
  }
  save(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch {
      return false;
    }
  }
  credit(progress, amount, label) {
    if (!Number.isSafeInteger(amount) || amount <= 0)
      throw new Error('Reward must be a positive whole number.');
    return {
      ...progress,
      balance: progress.balance + amount,
      earned: progress.earned + amount,
      transactions: [
        {
          id:
            globalThis.crypto?.randomUUID?.() ??
            `${Date.now()}-${++transactionSequence}`,
          amount,
          label,
          time: Date.now(),
        },
        ...progress.transactions,
      ].slice(0, 60),
    };
  }
}

// This service only owns local NOVA progress; it never handles blockchain keys.
export const cryptoService = new MockCryptoService();
