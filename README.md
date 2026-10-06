# NOVA VERSE

A full-screen, procedural space experience. Explore a 3D system, defend the asteroid belt, complete missions, earn fictional NOVA, and unlock the Void Sector. Everything works without downloaded models, accounts, or a backend.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite, then click **INITIALIZE**. Audio starts muted. Use the sound control or Settings to enable synthesized ambient and interaction sounds.

```sh
npm run build       # production files in dist/
npm run preview     # serve the production build
npm test            # simulation, economy, collision, quality checks
npm run test:browser
```

The browser tests use Chromium at `/usr/bin/chromium`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to another Chromium path if needed, or omit it on machines with Playwright's bundled browser. The test server uses port 5174.

## Explore and fly

- Click a planet, orbital relay, or its label to travel. The bottom dock and map list provide keyboard-accessible alternatives.
- Scroll the hub to drift closer. Tab and Enter navigate controls; Escape closes overlays or pauses a flight.
- Combat: mouse aims; hold click or Space to fire; WASD / arrows move. On touchscreens, hold the scene to aim/fire, or use the directional pad and FIRE control.
- Every escaped enemy damages your hull. Drones take two hits. Consecutive kills increase the score multiplier; waves grow harder over time.
- Rewards and mission completion are automatic. Flights that reach game over are recorded in the local flight log. Leaving combat preserves earned NOVA but ends that flight.
- Find the unknown signal to discover a hidden world. Its reward can only be claimed once per saved profile.

## Where to configure things

| File                           | Controls                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| `src/config/game.js`           | Pools, health, movement, spawning, damage, difficulty, rewards |
| `src/config/missions.js`       | Objectives, thresholds, rewards, achievement labels            |
| `src/config/galaxy.js`         | Destinations, unlocks, planet appearance, camera routes        |
| `src/config/graphics.js`       | Particle counts, DPR, geometry detail, bloom, auto detection   |
| `src/config/models.js`         | Optional GLB URLs and compression decoder paths                |
| `src/services/audioService.js` | Web Audio tones and ambient synthesis                          |

`src/game/engine.js` owns the simulation, with no React or Three dependency. It uses fixed enemy, projectile, and explosion pools and segment/sphere collision checks. `GameScene` updates instanced meshes and the ship from those pools; only gameplay events update Zustand.

`CameraManager` is the single owner of camera motion. GSAP handles transitions and the hub's ScrollTrigger drift; Motion handles the HTML interfaces. `Universe` keeps one canvas alive across lazy-loaded scene changes. Auto graphics chooses a conservative preset on mobile or software renderers and steps down when sustained frame rate is low. High alone loads bloom. Reduced motion suppresses camera parallax, particle drift, and bloom.

## Add custom assets

Set a model key in `src/config/models.js` to a file under `public/models/`, for example `spaceship: '/models/spaceship.glb'`. Null selects the procedural fallback. Use models normalized around the origin at roughly unit scale, with the ship facing negative Z. The loader uses `useGLTF`, preloads configured files, shares cached geometry/materials between clones, and falls back per asset if a GLB fails. Default enemy/projectile visuals are instanced; configured replacements are cloned into the same fixed pools.

Draco decoding is enabled through the configured decoder URL. For an offline deployment, host the Draco decoder files locally and update that URL. For KTX2 textures, copy Three's Basis transcoder files into `public/basis/` and set `ktx2Path: '/basis/'`; support is detected against the active renderer. No external decoder is fetched by the default procedural scene. Fonts are bundled locally.

The loading screen represents module and renderer initialization; there are no heavyweight art assets in the default build. The main galaxy remains visible while interfaces load. Each major scene and each optional model has an error boundary. Loss of WebGL leaves the map list, wallet, missions, settings, and records available, while combat is disabled.

## Local progress and currency

`MockCryptoService` is the only wallet adapter used by the store. It validates credits and reads/writes `nova-verse.progress.v1` in localStorage. Saved data is normalized on load; unavailable storage produces a wallet warning without interrupting the session. Transaction history is bounded at 60 entries and flight records at 10. There is no login, blockchain, financial value, or online leaderboard. Browser data can be edited or cleared by its owner.

A future server-backed or Web3 adapter belongs behind `cryptoService`; it would need its own authorization and authoritative reward validation. No speculative blockchain dependency is included here.

## Implementation references

- [React Three Fiber installation and React compatibility](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Drei GLTF, Draco, and KTX2 loader configuration](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
