import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../store/useStore.js';
import { missions } from '../config/missions.js';
import { systems } from '../config/galaxy.js';
import { gameConfig } from '../config/game.js';
import Icon from './ui/Icon.jsx';

const destinations = [
  ['GALAXY', 'orbit', 'Explore'],
  ['GAME', 'target', 'Combat'],
  ['MAP', 'map', 'Galaxy map'],
  ['WALLET', 'wallet', 'Wallet'],
  ['LEADERBOARD', 'trophy', 'Flight log'],
  ['ABOUT', 'info', 'About'],
];
const number = (value) => value.toLocaleString();

export function Logo() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Icon name="orbit" size={35} />
        <b>N</b>
      </span>
      <span>
        NOVA<span className="brand-light">VERSE</span>
        <small>AN INTERSTELLAR EXPERIENCE</small>
      </span>
    </span>
  );
}

export function Header() {
  const initialized = useStore((s) => s.initialized),
    balance = useStore((s) => s.progress.balance),
    sound = useStore((s) => s.soundEnabled),
    scene = useStore((s) => s.scene),
    navigate = useStore((s) => s.navigate);
  return (
    <header className="top-hud">
      <button
        className="logo-button"
        aria-label="Return to galaxy"
        onClick={() => navigate('GALAXY')}
      >
        <Logo />
      </button>
      <div className="sector-status">
        <span className="status-light" />
        <span>
          {scene === 'GAME' ? 'COMBAT UPLINK' : 'NOVA PRIME SYSTEM'}
          <small>
            {scene === 'GAME' ? 'DEFEND THE FRONTIER' : 'SECTOR 07 / OUTER RIM'}
          </small>
        </span>
      </div>
      <div className="top-actions">
        <button
          className="balance-button"
          onClick={() => navigate('WALLET')}
          disabled={!initialized}
          aria-label={`Open wallet, ${balance} NOVA`}
        >
          <Icon name="token" size={20} />
          <b>{number(balance)}</b>
          <span>NOVA</span>
          <Icon name="chevron" size={13} />
        </button>
        <span className="toolbar-divider" />
        <button
          className="icon-button sound-button"
          disabled={!initialized}
          onClick={() => useStore.getState().toggleSound()}
          aria-label={sound ? 'Mute audio' : 'Enable audio'}
          aria-pressed={sound}
        >
          <Icon name={sound ? 'sound' : 'muted'} />
        </button>
        <button
          className="icon-button"
          onClick={() => navigate('SETTINGS')}
          disabled={!initialized}
          aria-label="Open settings"
        >
          <Icon name="settings" />
        </button>
      </div>
    </header>
  );
}

export function EntryAndHub() {
  const initialized = useStore((s) => s.initialized),
    ready = useStore((s) => s.ready),
    scene = useStore((s) => s.scene),
    reduced = useStore((s) => s.reducedMotion);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setPhase(1), reduced ? 0 : 900);
    return () => clearTimeout(timer);
  }, [reduced]);
  const progress = ready && phase ? 100 : ready ? 72 : 24;
  if (initialized && scene !== 'GALAXY') return null;
  return (
    <>
      <motion.div
        className="hub-intro"
        initial={{ opacity: 0, y: reduced ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2 }}
      >
        <div className="eyebrow">
          <span className="tiny-cross">+</span> THE NEXT FRONTIER IS YOU
        </div>
        <h1>
          BEYOND
          <br />
          THE <span>KNOWN.</span>
        </h1>
        <p>
          A universe of possibilities.
          <br />
          Explore the unknown. Make your mark.
        </p>
        {!initialized ? (
          <div className="initialization">
            <div className="load-info">
              <span>
                {progress === 100
                  ? 'ALL SYSTEMS READY'
                  : 'GALAXY INITIALIZATION'}
              </span>
              <span>
                {progress}
                <i>%</i>
              </span>
            </div>
            <div className="loading-track">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
            <button
              className="primary-button initialize-button"
              disabled={progress !== 100}
              onClick={() => useStore.getState().initialize()}
            >
              {progress === 100 ? 'INITIALIZE' : 'INITIALIZING'}
              <Icon name="arrow" size={18} />
            </button>
            <span className="initial-note">
              YOUR JOURNEY BEGINS WITH A SINGLE CLICK
            </span>
          </div>
        ) : (
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => useStore.getState().navigate('GAME')}
            >
              <Icon name="target" size={17} /> ENTER COMBAT{' '}
              <Icon name="diagonal" size={16} />
            </button>
            <button
              className="text-button"
              onClick={() => useStore.getState().navigate('MAP')}
            >
              Explore the galaxy <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
        <div className="experience-tags">
          <span>EXPLORE</span>
          <i />
          <span>DEFEND</span>
          <i />
          <span>EARN</span>
        </div>
      </motion.div>
      <div className="orbit-coordinates">
        <span>LOCAL SYSTEM</span>
        <strong>NOVA PRIME</strong>
        <span>RA 084.32° &nbsp; DEC +29.71°</span>
        <div className="coordinate-line" />
      </div>
      <div className="scene-caption">
        <span className="tiny-cross">+</span>
        <span>
          THERE IS MORE
          <br />
          THAN MEETS THE EYE.
        </span>
      </div>
      {initialized && <MissionWidget />}
    </>
  );
}

export function MissionWidget() {
  const progress = useStore((s) => s.progress);
  const mission =
    missions.find((m) => !progress.completed.includes(m.id)) || missions[0];
  const value = Math.min(progress[mission.stat], mission.target),
    completed = progress.completed.includes(mission.id);
  return (
    <button
      className="mission-widget"
      onClick={() => useStore.getState().navigate('MISSIONS')}
    >
      <div className="mission-icon">
        <Icon name={completed ? 'check' : mission.icon} size={22} />
      </div>
      <div className="mission-summary">
        <div className="micro-label">
          {completed ? 'ALL MISSIONS COMPLETE' : 'ACTIVE MISSION'}
          <span>+{mission.reward} NOVA</span>
        </div>
        <strong>{mission.title}</strong>
        <div className="mission-progress">
          <div>
            <i style={{ width: `${(value / mission.target) * 100}%` }} />
          </div>
          <span>
            {value} / {mission.target}
          </span>
        </div>
      </div>
      <Icon name="chevron" size={15} />
    </button>
  );
}

export function BottomHud() {
  const initialized = useStore((s) => s.initialized),
    xp = useStore((s) => s.progress.xp),
    scene = useStore((s) => s.scene),
    navigate = useStore((s) => s.navigate);
  const level = Math.floor(xp / gameConfig.xpPerLevel) + 1;
  return (
    <>
      <div className="bottom-hud">
        <button
          className="pilot-status"
          onClick={() => navigate('WALLET')}
          disabled={!initialized}
        >
          <span className="pilot-avatar">
            <Icon name="pilot" size={24} />
          </span>
          <span>
            <strong>
              EXPLORER_01 <i>LVL {String(level).padStart(2, '0')}</i>
            </strong>
            <small>
              {xp % gameConfig.xpPerLevel} / {gameConfig.xpPerLevel} XP
            </small>
            <span className="xp-track">
              <i
                style={{
                  width: `${((xp % gameConfig.xpPerLevel) / gameConfig.xpPerLevel) * 100}%`,
                }}
              />
            </span>
          </span>
        </button>
        <nav className="destination-dock" aria-label="Galaxy destinations">
          {destinations.map(([destination, icon, label]) => (
            <button
              key={destination}
              disabled={!initialized}
              className={scene === destination ? 'active' : ''}
              aria-current={scene === destination ? 'page' : undefined}
              onClick={() => navigate(destination)}
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
              {scene === destination && <i />}
            </button>
          ))}
        </nav>
        <button
          className="missions-link"
          onClick={() => navigate('MISSIONS')}
          disabled={!initialized}
        >
          <Icon name="galaxy" size={19} />
          <span>MISSIONS</span>
          <span className="count-badge">{missions.length}</span>
        </button>
      </div>
      <footer className="telemetry-footer">
        <span>
          <i className="status-light" /> SYSTEMS ONLINE <b>·</b> v.01.04
        </span>
        <span>
          AN EXPERIMENT IN CURIOSITY <span className="footer-star">✧</span>
        </span>
        <span>
          <Icon name="mouse" size={11} />{' '}
          {initialized
            ? 'SCROLL TO DRIFT · CLICK TO EXPLORE'
            : 'A NEW PERSPECTIVE AWAITS'}
        </span>
      </footer>
    </>
  );
}

export function MapHud() {
  const scene = useStore((s) => s.scene),
    selected = useStore((s) => s.selectedSystem),
    earned = useStore((s) => s.progress.earned);
  if (scene !== 'MAP' && scene !== 'PLANET') return null;
  const system = systems.find((s) => s.id === selected) || systems[0];
  return (
    <motion.div
      className="map-hud"
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className="eyebrow">
        {scene === 'MAP'
          ? 'YOUR ATLAS OF THE UNKNOWN'
          : system.kind.toUpperCase()}
      </span>
      <h1>
        {scene === 'MAP' ? (
          <>
            A LITTLE
            <br />
            FURTHER.
          </>
        ) : (
          system.name
        )}
      </h1>
      <p>
        {scene === 'MAP'
          ? 'Every point of light is a place to begin. Select a system to plot your course.'
          : system.description}
      </p>
      {scene === 'MAP' ? (
        <div className="map-system-list">
          {systems.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                if (earned >= s.threshold)
                  useStore.getState().navigate('PLANET', s.id);
                else
                  useStore
                    .getState()
                    .notify(`Earn ${s.threshold} NOVA to unlock this sector.`);
              }}
            >
              <span className="world-dot" style={{ background: s.accent }} />
              <span>
                {s.name}
                <small>{s.coordinates}</small>
              </span>
              <Icon
                name={earned >= s.threshold ? 'diagonal' : 'lock'}
                size={15}
              />
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="planet-coordinates">
            COORDINATES &nbsp; {system.coordinates}
          </div>
          <button
            className="primary-button"
            onClick={() =>
              system.destination === 'PLANET'
                ? useStore.getState().navigate('GAME', system.id)
                : useStore.getState().navigate(system.destination, system.id)
            }
          >
            {system.destination === 'GAME' || system.destination === 'PLANET'
              ? 'ENTER SECTOR'
              : 'VISIT DESTINATION'}
            <Icon name="arrow" size={17} />
          </button>
        </>
      )}
      <button
        className="text-button back-link"
        onClick={() =>
          useStore.getState().navigate(scene === 'MAP' ? 'GALAXY' : 'MAP')
        }
      >
        ← {scene === 'MAP' ? 'Return to home system' : 'Back to galaxy map'}
      </button>
    </motion.div>
  );
}

export function Notifications() {
  const notice = useStore((s) => s.notice);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => useStore.setState({ notice: null }), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <div className="notification-region" aria-live="polite">
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            className={`notification ${notice.type}`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Icon
              name={notice.type === 'reward' ? 'token' : 'signal'}
              size={18}
            />
            <span>{notice.text}</span>
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => useStore.setState({ notice: null })}
            >
              <Icon name="close" size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
