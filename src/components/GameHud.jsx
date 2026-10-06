import { motion } from 'motion/react';
import { useStore } from '../store/useStore.js';
import { input } from '../game/input.js';
import Icon from './ui/Icon.jsx';

export default function GameHud() {
  const gameReady = useStore((s) => s.gameReady);
  const status = useStore((s) => s.gameStatus),
    score = useStore((s) => s.score),
    health = useStore((s) => s.health),
    combo = useStore((s) => s.combo),
    wave = useStore((s) => s.wave),
    earnings = useStore((s) => s.sessionEarnings),
    webgl = useStore((s) => s.webglAvailable);
  return (
    <>
      <div className="combat-top">
        <div>
          <span className="micro-label">FLIGHT SCORE</span>
          <strong>{String(score).padStart(6, '0')}</strong>
          <span className="combo">×{combo} COMBO</span>
        </div>
        <div className="combat-health">
          <span className="micro-label">
            HULL INTEGRITY <b>{health}%</b>
          </span>
          <div className="health-track">
            <i
              style={{
                width: `${health}%`,
                background: health <= 40 ? '#efa594' : undefined,
              }}
            />
          </div>
          <small>
            WAVE {String(wave).padStart(2, '0')} <span>+{earnings} NOVA</span>
          </small>
        </div>
        <button
          className="icon-button pause-button"
          onClick={() => useStore.getState().pauseGame()}
          disabled={!['playing', 'paused'].includes(status)}
          aria-label={status === 'paused' ? 'Resume game' : 'Pause game'}
        >
          <Icon name={status === 'paused' ? 'play' : 'pause'} />
        </button>
      </div>
      {status === 'playing' && (
        <>
          <div className="combat-caption">
            PROTECT THE FRONTIER <span>NO CONTACTS MAY PASS</span>
          </div>
          <div className="game-controls-hint">
            <span>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> MOVE
            </span>
            <span>
              <Icon name="mouse" size={13} /> AIM
            </span>
            <span>
              <kbd>SPACE</kbd> / CLICK TO FIRE
            </span>
            <span>
              <kbd>ESC</kbd> PAUSE
            </span>
          </div>
          <TouchControls />
        </>
      )}
      {status !== 'playing' && (
        <div className="game-modal-backdrop">
          <motion.section
            className="game-briefing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            aria-label={
              status === 'briefing'
                ? 'Flight briefing'
                : status === 'paused'
                  ? 'Flight paused'
                  : 'Flight complete'
            }
          >
            <div className="briefing-icon">
              <Icon
                name={
                  status === 'over'
                    ? 'trophy'
                    : status === 'paused'
                      ? 'pause'
                      : 'target'
                }
                size={34}
              />
            </div>
            <span className="eyebrow">
              {status === 'briefing'
                ? 'SECTOR 03 · ASTEROID BELT'
                : status === 'paused'
                  ? 'TAKE A BREATH, EXPLORER'
                  : 'EVERY FLIGHT IS A NEW BEGINNING'}
            </span>
            <h2>
              {status === 'briefing'
                ? 'Hold the frontier.'
                : status === 'paused'
                  ? 'A moment in orbit.'
                  : 'Until the next flight.'}
            </h2>
            <p>
              {status === 'briefing'
                ? 'Clear the debris. Take down rogue drones. Bring something back from the unknown.'
                : status === 'paused'
                  ? 'Your ship is safe. The stars can wait.'
                  : 'Your rewards are secured in your NOVA vault.'}
            </p>
            {status === 'briefing' ? (
              <div className="briefing-controls">
                <div>
                  <Icon name="mouse" />
                  <span>
                    MOUSE / TOUCH<small>Aim & hold to fire</small>
                  </span>
                </div>
                <div>
                  <span className="key-glyph">WASD</span>
                  <span>
                    ARROW KEYS<small>Move your ship</small>
                  </span>
                </div>
                <div>
                  <span className="key-glyph">ESC</span>
                  <span>
                    PAUSE FLIGHT<small>Space also fires</small>
                  </span>
                </div>
              </div>
            ) : status === 'over' ? (
              <div className="flight-results">
                <div>
                  <small>FINAL SCORE</small>
                  <strong>{score.toLocaleString()}</strong>
                </div>
                <div>
                  <small>FLIGHT EARNINGS</small>
                  <strong className="mint">
                    +{earnings} <em>NOVA</em>
                  </strong>
                </div>
              </div>
            ) : null}
            {!webgl && (
              <p className="warning">
                WebGL is unavailable. Combat needs 3D support; your wallet and
                missions are still accessible.
              </p>
            )}
            <button
              className="primary-button"
              disabled={!webgl || !gameReady}
              onClick={() => {
                document.activeElement?.blur();
                status === 'paused'
                  ? useStore.getState().pauseGame()
                  : useStore.getState().startGame();
              }}
            >
              {!gameReady && webgl
                ? 'PREPARING SHIP…'
                : status === 'paused'
                  ? 'RESUME FLIGHT'
                  : status === 'over'
                    ? 'FLY AGAIN'
                    : 'LAUNCH FLIGHT'}
              <Icon name="arrow" size={18} />
            </button>
            <button
              className="text-button"
              onClick={() => useStore.getState().navigate('GALAXY')}
            >
              Return to the galaxy
            </button>
          </motion.section>
        </div>
      )}
    </>
  );
}

function TouchControls() {
  const movement = [
    ['KeyW', '↑', 'Move up'],
    ['KeyA', '←', 'Move left'],
    ['KeyS', '↓', 'Move down'],
    ['KeyD', '→', 'Move right'],
  ];
  return (
    <div className="touch-controls">
      <div className="touch-dpad">
        {movement.map(([code, label, name]) => (
          <button
            key={code}
            aria-label={name}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              input.keys.add(code);
            }}
            onPointerUp={() => input.keys.delete(code)}
            onPointerCancel={() => input.keys.delete(code)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className="touch-fire"
        aria-label="Fire weapon"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          input.keys.add('Space');
        }}
        onPointerUp={() => input.keys.delete('Space')}
        onPointerCancel={() => input.keys.delete('Space')}
      >
        <Icon name="target" size={28} />
        <span>FIRE</span>
      </button>
    </div>
  );
}
