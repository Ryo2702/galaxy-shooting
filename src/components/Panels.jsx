import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore.js';
import { missions } from '../config/missions.js';
import { gameConfig } from '../config/game.js';
import { resolveQuality } from '../config/graphics.js';
import Icon from './ui/Icon.jsx';
import { WalletStatus } from './WalletConnect.jsx';

const panelTitles = {
  WALLET: ['PERSONAL ORBITAL VAULT', 'Your little fortune.'],
  MISSIONS: ['A PURPOSE IN THE STARS', 'Make your mark.'],
  TOKEN: ['THE ENERGY OF EXPLORATION', 'Meet NOVA.'],
  LEADERBOARD: ['YOUR EXPLORER ARCHIVE', 'Flights worth remembering.'],
  ABOUT: ['A SMALL EXPERIMENT. A BIG UNIVERSE.', 'Built for the curious.'],
  SETTINGS: ['YOUR COCKPIT, YOUR RULES', 'Tune your universe.'],
};

export default function Panels({ panel }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('button')?.focus();
    const keydown = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = [
        ...ref.current.querySelectorAll(
          'button:not(:disabled), a[href], select, input, [tabindex="0"]',
        ),
      ];
      const first = focusable[0],
        last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, [panel]);
  const [eyebrow, title] = panelTitles[panel];
  return (
    <motion.div
      className="panel-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) useStore.getState().closePanel();
      }}
    >
      <motion.section
        ref={ref}
        className={`holo-panel panel-${panel.toLowerCase()}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ type: 'spring', damping: 28, stiffness: 230 }}
      >
        <div className="panel-heading">
          <span className="eyebrow">{eyebrow}</span>
          <button
            className="icon-button close-panel"
            aria-label="Close panel"
            onClick={() => useStore.getState().closePanel()}
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 id="panel-title">{title}</h2>
        <div className="panel-scroll">
          {panel === 'WALLET' ? (
            <Wallet />
          ) : panel === 'MISSIONS' ? (
            <Missions />
          ) : panel === 'SETTINGS' ? (
            <Settings />
          ) : panel === 'TOKEN' ? (
            <Token />
          ) : panel === 'LEADERBOARD' ? (
            <Leaderboard />
          ) : (
            <About />
          )}
        </div>
        <div className="panel-footer">
          <span className="status-light" /> LOCAL LINK SECURE{' '}
          <span>NOVA VERSE / 001</span>
        </div>
      </motion.section>
    </motion.div>
  );
}

function Wallet() {
  const progress = useStore((s) => s.progress),
    session = useStore((s) => s.sessionEarnings),
    storageWarning = useStore((s) => s.storageWarning),
    address = useStore((s) => s.walletAddress),
    openWalletPicker = useStore((s) => s.openWalletPicker);
  return (
    <>
      <div className="wallet-balance">
        <span className="micro-label">AVAILABLE BALANCE</span>
        <div>
          <Icon name="token" size={33} />
          <strong>{progress.balance.toLocaleString()}</strong>
          <span>NOVA</span>
        </div>
        <small>Every token has a story. This one is yours.</small>
      </div>
      <div className="external-wallet">
        <div className="subheading">
          <h3>Solana wallet</h3>
          <span>{address ? 'CONNECTED' : 'OPTIONAL'}</span>
        </div>
        {address ? (
          <WalletStatus />
        ) : (
          <>
            <p>
              Share only your public address. NOVA progress remains local to
              this browser.
            </p>
            <button className="primary-button wallet-panel-connect" onClick={openWalletPicker}>
              Connect wallet
              <Icon name="arrow" size={17} />
            </button>
          </>
        )}
      </div>
      <div className="wallet-stats">
        <div>
          <span>LIFETIME EARNED</span>
          <strong>
            {progress.earned.toLocaleString()} <small>NOVA</small>
          </strong>
        </div>
        <div>
          <span>THIS FLIGHT</span>
          <strong className="mint">
            +{session.toLocaleString()} <small>NOVA</small>
          </strong>
        </div>
        <div>
          <span>EXPLORER LEVEL</span>
          <strong>
            {String(
              Math.floor(progress.xp / gameConfig.xpPerLevel) + 1,
            ).padStart(2, '0')}
          </strong>
        </div>
      </div>
      <div className="level-progress">
        <span>
          YOUR NEXT HORIZON{' '}
          <b>
            {progress.xp % gameConfig.xpPerLevel} / {gameConfig.xpPerLevel} XP
          </b>
        </span>
        <div className="health-track">
          <i
            style={{
              width: `${((progress.xp % gameConfig.xpPerLevel) / gameConfig.xpPerLevel) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="subheading">
        <h3>Achievements</h3>
        <span>
          {progress.completed.length} / {missions.length}
        </span>
      </div>
      <div className="achievement-row">
        {missions.map((m) => (
          <div
            key={m.id}
            title={`${m.title}: ${progress.completed.includes(m.id) ? 'Unlocked' : m.detail}`}
            className={progress.completed.includes(m.id) ? 'unlocked' : ''}
          >
            <Icon name={m.icon} size={23} />
            <span>{m.title}</span>
            {progress.completed.includes(m.id) ? (
              <Icon name="check" size={11} />
            ) : (
              <Icon name="lock" size={11} />
            )}
          </div>
        ))}
      </div>
      <div className="subheading">
        <h3>Recent activity</h3>
        <span>LAST {Math.min(progress.transactions.length, 8)}</span>
      </div>
      {progress.transactions.length ? (
        <div className="transaction-list">
          {progress.transactions.slice(0, 8).map((t) => (
            <div className="transaction" key={t.id}>
              <span className="transaction-icon">
                <Icon name="diagonal" size={16} />
              </span>
              <span>
                {t.label}
                <small>
                  {new Date(t.time).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </small>
              </span>
              <strong>
                +{t.amount.toLocaleString()}
                <small>NOVA</small>
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="orbit" size={30} />
          <p>Your story is still unwritten.</p>
          <span>Launch a flight to earn your first NOVA.</span>
          <button
            className="text-button"
            onClick={() => useStore.getState().navigate('GAME')}
          >
            Enter combat <Icon name="arrow" size={15} />
          </button>
        </div>
      )}
      {storageWarning && (
        <p className="warning">
          Local storage is unavailable. Keep this tab open to retain your
          progress.
        </p>
      )}
      <p className="fine-print">
        NOVA is a fictional in-experience currency with no real-world value or
        transactions. Progress is saved in this browser; a connected Solana
        wallet only shares its public address.
      </p>
    </>
  );
}

function Missions() {
  const progress = useStore((s) => s.progress);
  return (
    <>
      <p className="panel-description">
        A few reasons to take the long way home.
        <br />
        Rewards arrive automatically when your mission is complete.
      </p>
      <div className="mission-list">
        {missions.map((m, index) => {
          const complete = progress.completed.includes(m.id),
            value = Math.min(progress[m.stat], m.target);
          return (
            <div
              key={m.id}
              className={`mission-card ${complete ? 'complete' : ''}`}
            >
              <div className="mission-number">0{index + 1}</div>
              <div className="mission-card-content">
                <div className="micro-label">
                  {complete ? 'COMPLETE' : 'EXPLORATION OBJECTIVE'}
                  <span className="mint">+{m.reward} NOVA</span>
                </div>
                <h3>{m.title}</h3>
                <p>{m.detail}</p>
                <div className="mission-progress">
                  <div>
                    <i style={{ width: `${(value / m.target) * 100}%` }} />
                  </div>
                  <span>
                    {value.toLocaleString()} / {m.target.toLocaleString()}
                  </span>
                </div>
              </div>
              <Icon name={complete ? 'check' : m.icon} size={21} />
            </div>
          );
        })}
      </div>
      <button
        className="primary-button"
        onClick={() => useStore.getState().navigate('GAME')}
      >
        FIND YOUR NEXT CHALLENGE
        <Icon name="arrow" size={17} />
      </button>
    </>
  );
}

function Token() {
  const earned = useStore((s) => s.progress.earned);
  const rewards = [
    { name: 'Asteroid', value: gameConfig.asteroidReward },
    { name: 'Enemy drone', value: gameConfig.droneReward },
    { name: 'Score milestone', value: gameConfig.milestoneReward },
    {
      name: 'Mission (up to)',
      value: Math.max(
        0,
        ...missions
          .filter((m) => m.stat !== 'discoveries')
          .map((m) => m.reward),
      ),
    },
    {
      name: 'Discovery',
      value: missions.find((m) => m.stat === 'discoveries')?.reward ?? 0,
    },
  ];
  return (
    <>
      <div className="token-display">
        <Icon name="token" size={70} />
        <span>
          $NOVA<small>POWERED BY CURIOSITY</small>
        </span>
      </div>
      <p className="panel-description">
        The currency of a universe worth exploring. Earn it by defending the
        frontier, completing missions, and finding what others overlook.
      </p>
      <div className="wallet-stats">
        <div>
          <span>YOUR TOTAL EARNED</span>
          <strong>{earned.toLocaleString()}</strong>
        </div>
        <div>
          <span>NETWORK</span>
          <strong className="small-value">LOCAL ORBIT</strong>
        </div>
        <div>
          <span>REAL VALUE</span>
          <strong>$0.00</strong>
        </div>
      </div>
      <div className="subheading">
        <h3>Ways to earn</h3>
        <span>NOVA / REWARD</span>
      </div>
      <div className="reward-chart">
        {rewards.map((r) => (
          <div key={r.name}>
            <span>{r.name}</span>
            <div>
              <i style={{ width: `${Math.max(2, r.value / 10)}%` }} />
            </div>
            <strong>+{r.value}</strong>
          </div>
        ))}
      </div>
      <div className="token-note">
        <Icon name="info" size={19} />
        <p>
          Purely for the adventure. NOVA is simulated, has no cash value, and
          never connects to a real blockchain. A Solana wallet connection only
          shares a public address.
        </p>
      </div>
    </>
  );
}

function Leaderboard() {
  const progress = useStore((s) => s.progress);
  return (
    <>
      <p className="panel-description">
        Your best flights, kept close to home.
        <br />
        This is your personal log, stored on this device.
      </p>
      <div className="record-banner">
        <Icon name="trophy" size={31} />
        <span>
          PERSONAL BEST
          <strong>
            {progress.bestScore.toLocaleString()}
            <small>PTS</small>
          </strong>
        </span>
        <div>
          {progress.asteroids + progress.drones}
          <small>TARGETS CLEARED</small>
        </div>
      </div>
      {progress.flights.length ? (
        <div className="flight-log">
          <div className="flight-table-head">
            <span>RANK / DATE</span>
            <span>SCORE</span>
            <span>EARNED</span>
          </div>
          {progress.flights.map((f, i) => (
            <div key={`${f.time}-${i}`}>
              <span>
                <b>{String(i + 1).padStart(2, '0')}</b>
                {new Date(f.time).toLocaleDateString()}
              </span>
              <strong>{f.score.toLocaleString()}</strong>
              <span className="mint">+{f.earned || 0} NOVA</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="trophy" size={32} />
          <p>The first record is yours to set.</p>
          <span>Completed flights appear here.</span>
        </div>
      )}
      <button
        className="primary-button"
        onClick={() => useStore.getState().navigate('GAME')}
      >
        WRITE YOUR NEXT CHAPTER
        <Icon name="arrow" size={17} />
      </button>
    </>
  );
}

function Settings() {
  const quality = useStore((s) => s.quality),
    auto = useStore((s) => s.autoQuality),
    sound = useStore((s) => s.soundEnabled),
    reduced = useStore((s) => s.reducedMotion);
  return (
    <>
      <p className="panel-description">
        A smooth journey looks different on every device.
        <br />
        Make yourself comfortable.
      </p>
      <div className="setting-block">
        <div className="subheading">
          <h3>Graphics quality</h3>
          <span>
            {quality === 'AUTO'
              ? `AUTO · ${auto || resolveQuality('AUTO')}`
              : quality}
          </span>
        </div>
        <div className="quality-options">
          {['AUTO', 'LOW', 'MEDIUM', 'HIGH'].map((q) => (
            <button
              key={q}
              className={quality === q ? 'selected' : ''}
              aria-pressed={quality === q}
              onClick={() => useStore.getState().setQuality(q)}
            >
              {q}
            </button>
          ))}
        </div>
        <p className="fine-print">
          Auto adapts to your device and lowers detail if frames slow down. High
          adds subtle bloom. Low is ideal for mobile.
        </p>
      </div>
      <div className="setting-row">
        <span>
          <strong>Space audio</strong>
          <small>Ambient tones, lasers, and discovery cues</small>
        </span>
        <button
          className={`toggle ${sound ? 'on' : ''}`}
          role="switch"
          aria-checked={sound}
          aria-label="Space audio"
          onClick={() => useStore.getState().toggleSound()}
        >
          <i />
        </button>
      </div>
      <div className="setting-row">
        <span>
          <strong>Reduced motion</strong>
          <small>Gentler camera, static stars, fewer effects</small>
        </span>
        <button
          className={`toggle ${reduced ? 'on' : ''}`}
          role="switch"
          aria-checked={reduced}
          aria-label="Reduced motion"
          onClick={() => useStore.getState().setReducedMotion(!reduced)}
        >
          <i />
        </button>
      </div>
      <div className="setting-row">
        <span>
          <strong>A wider universe</strong>
          <small>Let the experience fill your screen</small>
        </span>
        <button
          className="outline-button"
          onClick={async () => {
            try {
              if (document.fullscreenElement) await document.exitFullscreen();
              else await document.documentElement.requestFullscreen();
            } catch {
              useStore
                .getState()
                .notify('Fullscreen is unavailable in this browser.');
            }
          }}
        >
          FULLSCREEN
          <Icon name="diagonal" size={13} />
        </button>
      </div>
      <div className="subheading">
        <h3>Flight controls</h3>
        <span>DESKTOP + TOUCH</span>
      </div>
      <div className="keyboard-guide">
        <span>
          Move the ship <b>WASD / ARROWS</b>
        </span>
        <span>
          Aim <b>MOUSE / TOUCH</b>
        </span>
        <span>
          Fire <b>CLICK / SPACE / HOLD TOUCH</b>
        </span>
        <span>
          Pause / close <b>ESC</b>
        </span>
        <span>
          Explore destinations <b>TAB + ENTER</b>
        </span>
      </div>
    </>
  );
}

function About() {
  return (
    <>
      <div className="about-orbit">
        <Icon name="orbit" size={90} />
        <span>EST. 2026 / SOMEWHERE IN SPACE</span>
      </div>
      <p className="about-lead">
        For the part of you
        <br />
        that still looks up.
      </p>
      <p className="panel-description">
        NOVA VERSE is an interactive experiment in exploration, play, and the
        quiet wonder of deep space. A small universe with no destination you
        have to reach.
      </p>
      <p className="panel-description">
        Take a flight. Find a hidden world. Collect a little stardust. Stay a
        while.
      </p>
      <div className="about-facts">
        <span>
          01 <b>A living, procedural galaxy</b>
        </span>
        <span>
          02 <b>A frontier worth defending</b>
        </span>
        <span>
          03 <b>Rewards for the curious</b>
        </span>
      </div>
      <button
        className="text-button"
        onClick={() => useStore.getState().navigate('TOKEN')}
      >
        Discover the NOVA economy <Icon name="arrow" size={16} />
      </button>
      <p className="fine-print">
        Built with React, Three.js, React Three Fiber, GSAP, Motion, and a
        healthy fascination with the unknown.
      </p>
    </>
  );
}
