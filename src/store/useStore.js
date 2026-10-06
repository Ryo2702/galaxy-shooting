import { create } from 'zustand';
import { cryptoService } from '../services/cryptoService.js';
import { audio } from '../services/audioService.js';
import { missions } from '../config/missions.js';
import { gameConfig } from '../config/game.js';
import { resetInput } from '../game/input.js';

function completeMissions(progress) {
  const unlocked = missions.filter(
    (m) => !progress.completed.includes(m.id) && progress[m.stat] >= m.target,
  );
  for (const mission of unlocked) {
    progress = cryptoService.credit(
      progress,
      mission.reward,
      `Mission: ${mission.title}`,
    );
    progress.completed = [...progress.completed, mission.id];
  }
  return { progress, unlocked };
}

export const useStore = create((set, get) => ({
  scene: 'INTRO',
  initialized: false,
  ready: false,
  webglAvailable: true,
  panel: null,
  selectedSystem: 'nova-prime',
  quality: 'AUTO',
  autoQuality: null,
  reducedMotion:
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
    false,
  soundEnabled: false,
  progress: cryptoService.load(),
  storageWarning: false,
  gameStatus: 'idle',
  gameReady: false,
  gameId: 0,
  score: 0,
  health: gameConfig.playerHealth,
  combo: 1,
  wave: 1,
  sessionEarnings: 0,
  notice: null,
  notify: (text, type = 'info') =>
    set({ notice: { text, type, id: Date.now() } }),
  initialize: () => {
    audio.play('click');
    set({ initialized: true, scene: 'GALAXY' });
  },
  navigate: (destination, system) => {
    if (!get().initialized) return;
    resetInput();
    audio.play('click');
    const update = {
      panel: [
        'WALLET',
        'TOKEN',
        'ABOUT',
        'LEADERBOARD',
        'MISSIONS',
        'SETTINGS',
      ].includes(destination)
        ? destination
        : null,
    };
    if (system) update.selectedSystem = system;
    if (destination === 'GAME') {
      set({ ...update, scene: 'GAME', gameStatus: 'briefing' });
    } else if (['MISSIONS', 'SETTINGS'].includes(destination)) {
      set({
        ...update,
        gameStatus:
          get().gameStatus === 'playing' ? 'paused' : get().gameStatus,
      });
    } else {
      set({
        ...update,
        scene: destination,
        gameStatus:
          get().gameStatus === 'playing' ? 'paused' : get().gameStatus,
      });
    }
  },
  closePanel: () =>
    set({ panel: null, scene: get().scene === 'GAME' ? 'GAME' : 'GALAXY' }),
  setQuality: (quality) => set({ quality, autoQuality: null }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  toggleSound: async () => {
    const enabled = !get().soundEnabled;
    try {
      await audio.enable(enabled);
      set({ soundEnabled: audio.enabled });
    } catch {
      get().notify('Audio is unavailable in this browser.');
      set({ soundEnabled: false });
    }
  },
  startGame: () => {
    resetInput();
    audio.play('click');
    set({
      scene: 'GAME',
      panel: null,
      gameStatus: 'playing',
      gameId: get().gameId + 1,
      score: 0,
      health: gameConfig.playerHealth,
      combo: 1,
      wave: 1,
      sessionEarnings: 0,
    });
  },
  pauseGame: () => {
    resetInput();
    set({
      gameStatus:
        get().gameStatus === 'playing'
          ? 'paused'
          : get().gameStatus === 'paused'
            ? 'playing'
            : get().gameStatus,
    });
  },
  save: (progress) => {
    const persisted = cryptoService.save(progress);
    set({ progress, storageWarning: !persisted });
  },
  rewardKill: ({ type, score, combo, milestone }) => {
    const state = get();
    const reward =
      type === 'drone' ? gameConfig.droneReward : gameConfig.asteroidReward;
    let progress = cryptoService.credit(
      state.progress,
      reward,
      type === 'drone' ? 'Drone neutralized' : 'Asteroid destroyed',
    );
    const stat = type === 'drone' ? 'drones' : 'asteroids';
    progress = {
      ...progress,
      [stat]: progress[stat] + 1,
      xp:
        progress.xp +
        (type === 'drone' ? gameConfig.droneXp : gameConfig.asteroidXp),
      bestScore: Math.max(progress.bestScore, score),
    };
    if (milestone)
      progress = cryptoService.credit(
        progress,
        gameConfig.milestoneReward * milestone,
        'Flight score milestone',
      );
    const result = completeMissions(progress);
    set({
      score,
      combo,
      sessionEarnings:
        state.sessionEarnings + result.progress.earned - state.progress.earned,
    });
    get().save(result.progress);
    if (result.unlocked.length) {
      audio.play('mission');
      get().notify(
        `${result.unlocked[0].title} complete · +${result.unlocked[0].reward} NOVA`,
        'reward',
      );
    } else audio.play('explosion');
  },
  finishGame: () => {
    const state = get();
    if (state.gameStatus === 'over') return;
    const flights = [
      { score: state.score, earned: state.sessionEarnings, time: Date.now() },
      ...state.progress.flights,
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    get().save({ ...state.progress, flights });
    set({ gameStatus: 'over' });
  },
  discover: () => {
    if (get().progress.discoveries) {
      get().notify('Signal decoded: “Stay curious, explorer.”');
      return;
    }
    const result = completeMissions({
      ...get().progress,
      discoveries: 1,
      xp: get().progress.xp + gameConfig.discoveryXp,
    });
    const reward = result.progress.earned - get().progress.earned;
    get().save(result.progress);
    audio.play('mission');
    get().notify(
      `Hidden world discovered · +${reward.toLocaleString()} NOVA`,
      'reward',
    );
  },
}));
