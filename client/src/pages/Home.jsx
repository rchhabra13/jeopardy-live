import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpooky } from '../spooky/SpookyContext.jsx';
import { playCreak } from '../spooky/audio.js';

export default function Home() {
  const nav = useNavigate();
  const { triggerScare, flash, ghostInvasion } = useSpooky() || {};
  const clicks = useRef(0);

  // Easter egg: rap on the title 13 times and something answers.
  function knock() {
    clicks.current += 1;
    if (clicks.current === 13) {
      clicks.current = 0;
      triggerScare?.('thirteen');
    } else if (clicks.current === 7) {
      flash?.('SOMETHING NOTICED YOU');
      ghostInvasion?.();
    } else {
      playCreak();
    }
  }

  return (
    <div className="screen home">
      <h1 className="logo" onClick={knock} title="don't">
        JEOPARDY!
      </h1>
      <p className="tagline">Trivia buzz-in — in the room, or from beyond.</p>
      <div className="home-actions">
        <button className="btn big" onClick={() => nav('/host')}>
          Host a Séance
        </button>
        <button className="btn big secondary" onClick={() => nav('/play')}>
          Join a Game
        </button>
        <button className="btn ghost" onClick={() => nav('/editor')}>
          Board Editor
        </button>
      </div>
      <p className="hint">
        Host on a shared screen (TV / laptop). Players buzz in from their phones using the room
        link — same WiFi for in-person, or over the internet once deployed.
      </p>
      <p className="hint small muted">
        👻 toggles ghosts &amp; jump scares · 🔊 toggles ambience. Some keys are cursed.
      </p>
    </div>
  );
}
