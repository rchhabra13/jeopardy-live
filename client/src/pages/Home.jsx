import { useNavigate } from 'react-router-dom';

export default function Home() {
  const nav = useNavigate();
  return (
    <div className="screen home">
      <h1 className="logo">JEOPARDY!</h1>
      <p className="tagline">Trivia buzz-in — in the room or over a link.</p>
      <div className="home-actions">
        <button className="btn big" onClick={() => nav('/host')}>
          Host a Game
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
    </div>
  );
}
