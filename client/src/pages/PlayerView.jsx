import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socket } from '../socket.js';
import Board from '../components/Board.jsx';
import ClueModal from '../components/ClueModal.jsx';
import Scoreboard from '../components/Scoreboard.jsx';

export default function PlayerView() {
  const { code } = useParams();
  const [roomCode, setRoomCode] = useState(code || '');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const onState = (s) => setState(s);
    socket.on('state:update', onState);
    return () => socket.off('state:update', onState);
  }, []);

  function join(e) {
    e.preventDefault();
    const rc = roomCode.trim().toUpperCase();
    if (!rc || !name.trim()) {
      setError('Enter your name and the room code.');
      return;
    }
    socket.emit('player:join', { roomCode: rc, name: name.trim() }, (res) => {
      if (res?.ok) {
        setRoomCode(res.roomCode);
        setJoined(true);
        setError('');
      } else {
        setError(res?.error || 'Could not join');
      }
    });
  }

  // ---------- JOIN FORM ----------
  if (!joined || !state) {
    return (
      <div className="screen join">
        <h1 className="logo small">Join a Game</h1>
        <form className="join-card" onSubmit={join}>
          <label>Room Code</label>
          <input
            className="input code-input"
            value={roomCode}
            maxLength={4}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
          />
          <label>Your Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex"
          />
          {error && <p className="error">{error}</p>}
          <button className="btn big" type="submit">
            Join
          </button>
          <Link to="/" className="muted">
            Home
          </Link>
        </form>
      </div>
    );
  }

  // ---------- IN GAME ----------
  return (
    <div className="screen player-game">
      <header className="player-bar">
        <span className="room-code">Room {roomCode}</span>
        <span className="board-title">{state.board.title}</span>
      </header>

      {state.phase === 'board' && (
        <p className="waiting big-waiting">Waiting for the host to pick a clue…</p>
      )}

      <Board board={state.board} interactive={false} />

      <Scoreboard players={state.players} buzzedPlayerId={state.buzzedPlayerId} />

      <ClueModal
        state={state}
        role="player"
        myId={socket.id}
        onBuzz={() => socket.emit('player:buzz')}
      />
    </div>
  );
}
