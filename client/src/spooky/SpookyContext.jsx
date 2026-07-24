import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { loadYouTubeAPI, VIDEOS } from './youtube.js';
import { playScreech, playDrone } from './audio.js';
import Ghosts from './Ghosts.jsx';
import JumpScare from './JumpScare.jsx';

const Ctx = createContext(null);
export const useSpooky = () => useContext(Ctx);

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
];

export function SpookyProvider({ children }) {
  const [fx, setFx] = useState(() => localStorage.getItem('spooky.fx') !== 'off');
  const [ambience, setAmbience] = useState(() => localStorage.getItem('spooky.ambience') !== 'off');
  const [scare, setScare] = useState(null);
  const [invasion, setInvasion] = useState(false);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState('');

  const ambRef = useRef(null);
  const scareRef = useRef(null);
  const fxRef = useRef(fx);
  const ambRefState = useRef(ambience);
  fxRef.current = fx;
  ambRefState.current = ambience;

  useEffect(() => localStorage.setItem('spooky.fx', fx ? 'on' : 'off'), [fx]);
  useEffect(() => localStorage.setItem('spooky.ambience', ambience ? 'on' : 'off'), [ambience]);

  // Players can only start after a user gesture (browser autoplay policy).
  useEffect(() => {
    let started = false;
    const init = async () => {
      if (started) return;
      started = true;
      try {
        const YT = await loadYouTubeAPI();
        ambRef.current = new YT.Player('yt-ambience', {
          videoId: VIDEOS.ambience,
          playerVars: {
            autoplay: 1, loop: 1, playlist: VIDEOS.ambience,
            controls: 0, disablekb: 1, playsinline: 1, modestbranding: 1,
          },
          events: {
            onReady: (e) => {
              e.target.setVolume(15);
              if (ambRefState.current) e.target.playVideo();
              else e.target.pauseVideo();
            },
          },
        });
        scareRef.current = new YT.Player('yt-scare', {
          videoId: VIDEOS.jumpScare,
          playerVars: { controls: 0, disablekb: 1, playsinline: 1, modestbranding: 1 },
          events: { onReady: (e) => e.target.setVolume(80) },
        });
      } catch {
        // No network / YouTube blocked — synthesised audio still covers scares.
      }
    };
    window.addEventListener('pointerdown', init, { once: true });
    window.addEventListener('keydown', init, { once: true });
    return () => {
      window.removeEventListener('pointerdown', init);
      window.removeEventListener('keydown', init);
    };
  }, []);

  useEffect(() => {
    const p = ambRef.current;
    if (!p?.playVideo) return;
    try {
      ambience ? p.playVideo() : p.pauseVideo();
    } catch { /* player not ready yet */ }
  }, [ambience]);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }, []);

  const triggerScare = useCallback((label = '') => {
    if (!fxRef.current) return;
    setScare({ id: Date.now(), label });
    const p = scareRef.current;
    let played = false;
    try {
      if (p?.playVideo) {
        p.seekTo(0);
        p.unMute?.();
        p.playVideo();
        played = true;
      }
    } catch { /* fall through to synth */ }
    if (!played) playScreech();
    setTimeout(() => {
      setScare(null);
      try { scareRef.current?.pauseVideo?.(); } catch { /* ignore */ }
    }, 2600);
  }, []);

  const shakeScreen = useCallback(() => {
    if (!fxRef.current) return;
    setShake(true);
    setTimeout(() => setShake(false), 900);
  }, []);

  const ghostInvasion = useCallback(() => {
    if (!fxRef.current) return;
    setInvasion(true);
    playDrone();
    setTimeout(() => setInvasion(false), 12000);
  }, []);

  // ---- Easter eggs: Konami code, and typing "BOO" ----
  useEffect(() => {
    let konami = [];
    let typed = '';
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;

      konami = [...konami, e.key].slice(-KONAMI.length);
      if (konami.join(',').toLowerCase() === KONAMI.join(',').toLowerCase()) {
        konami = [];
        ghostInvasion();
        flash('👻 THE VEIL HAS TORN 👻');
      }

      if (!typing && /^[a-zA-Z]$/.test(e.key)) {
        typed = (typed + e.key.toLowerCase()).slice(-3);
        if (typed === 'boo') {
          typed = '';
          shakeScreen();
          triggerScare('boo');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ghostInvasion, shakeScreen, triggerScare, flash]);

  const value = {
    fx, setFx,
    ambience, setAmbience,
    triggerScare, shakeScreen, ghostInvasion, flash,
  };

  return (
    <Ctx.Provider value={value}>
      <div className={shake ? 'shake-host' : undefined}>{children}</div>

      {fx && <Ghosts count={invasion ? 34 : 7} frenzied={invasion} />}
      <JumpScare scare={scare} />
      {toast && <div className="spooky-toast">{toast}</div>}

      <div className="spooky-controls">
        <button
          className="spooky-btn"
          title={ambience ? 'Mute ambience' : 'Play ambience'}
          onClick={() => setAmbience((a) => !a)}
        >
          {ambience ? '🔊' : '🔇'}
        </button>
        <button
          className="spooky-btn"
          title={fx ? 'Disable spooky FX (ghosts, scares)' : 'Enable spooky FX'}
          onClick={() => setFx((f) => !f)}
        >
          {fx ? '👻' : '💀'}
        </button>
      </div>

      {/* Both YouTube players are audio-only and kept offscreen. The approved
          sting is a sound-effects video, so its visuals are channel branding —
          the scare visual is JumpScare's drawn face instead. */}
      <div id="yt-ambience" className="yt-hidden" />
      <div id="yt-scare-wrap" className="yt-hidden">
        <div id="yt-scare" />
      </div>
    </Ctx.Provider>
  );
}
