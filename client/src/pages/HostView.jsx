import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../socket.js';
import { BOARDS, boardTitles, randomBoard, boardByIndex } from '../game/boards/index.js';
import Board from '../components/Board.jsx';
import ClueModal from '../components/ClueModal.jsx';
import Scoreboard from '../components/Scoreboard.jsx';

const CUSTOM_KEY = 'jeopardy.customBoard';

export default function HostView() {
  const [state, setState] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [source, setSource] = useState('random'); // 'random' | 'pick' | 'custom' | 'import'
  const [pickIndex, setPickIndex] = useState(0);
  const [importedBoard, setImportedBoard] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onState = (s) => setState(s);
    socket.on('state:update', onState);
    return () => socket.off('state:update', onState);
  }, []);

  function chosenBoard() {
    if (source === 'random') return randomBoard();
    if (source === 'pick') return boardByIndex(pickIndex);
    if (source === 'custom') {
      const raw = localStorage.getItem(CUSTOM_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    if (source === 'import') return importedBoard;
    return null;
  }

  function createRoom() {
    const board = chosenBoard();
    if (!board?.categories?.length) {
      setError('No valid board selected.');
      return;
    }
    setError('');
    socket.emit('host:createRoom', { board }, (res) => {
      if (res?.ok) setRoomCode(res.roomCode);
      else setError(res?.error || 'Failed to create room');
    });
  }

  function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const board = JSON.parse(reader.result);
        if (!board?.categories?.length) throw new Error('bad shape');
        setImportedBoard(board);
        setSource('import');
        setError('');
      } catch {
        setError('That file is not a valid board JSON.');
      }
    };
    reader.readAsText(file);
  }

  const hasCustom = !!localStorage.getItem(CUSTOM_KEY);

  // ---------- SETUP (before room exists) ----------
  if (!roomCode || !state) {
    return (
      <div className="screen host-setup">
        <h1 className="logo small">Host a Game</h1>
        <div className="setup-card">
          <label className="radio">
            <input
              type="radio"
              checked={source === 'random'}
              onChange={() => setSource('random')}
            />
            Random board (surprise me)
          </label>

          <label className="radio">
            <input type="radio" checked={source === 'pick'} onChange={() => setSource('pick')} />
            Pick a board
          </label>
          {source === 'pick' && (
            <select
              className="select"
              value={pickIndex}
              onChange={(e) => setPickIndex(Number(e.target.value))}
            >
              {boardTitles.map((t, i) => (
                <option key={i} value={i}>
                  {t}
                </option>
              ))}
            </select>
          )}

          <label className={`radio ${hasCustom ? '' : 'disabled'}`}>
            <input
              type="radio"
              disabled={!hasCustom}
              checked={source === 'custom'}
              onChange={() => setSource('custom')}
            />
            My custom board {hasCustom ? '' : '(none saved — use the editor)'}
          </label>

          <label className="radio">
            <input
              type="radio"
              checked={source === 'import'}
              onChange={() => setSource('import')}
            />
            Import a board JSON
          </label>
          {source === 'import' && (
            <input className="file" type="file" accept="application/json" onChange={onImportFile} />
          )}

          {error && <p className="error">{error}</p>}

          <button className="btn big" onClick={createRoom}>
            Create Room
          </button>
          <div className="setup-links">
            <Link to="/editor">Open Board Editor</Link>
            <Link to="/">Home</Link>
          </div>
          <p className="muted small">{BOARDS.length} boards in the library.</p>
        </div>
      </div>
    );
  }

  // ---------- GAME ----------
  const inviteUrl = `${window.location.origin}/play/${roomCode}`;

  function copyLink() {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    // navigator.clipboard only exists in a secure context (HTTPS or localhost),
    // so plain-HTTP deployments need the legacy execCommand path.
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = inviteUrl;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch {
        // Nothing to do — the URL is shown next to the button for manual copying.
      }
      document.body.removeChild(ta);
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteUrl).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  return (
    <div className="screen host-game">
      <header className="host-bar">
        <div className="room-info">
          <span className="room-code">Room {roomCode}</span>
          <button className="btn tiny" onClick={copyLink}>
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>
          <span className="invite-url">{inviteUrl}</span>
        </div>
        <div className="host-bar-actions">
          <button
            className="btn tiny secondary"
            onClick={() => socket.emit('host:reset', { board: randomBoard() })}
          >
            New random board
          </button>
          <button className="btn tiny secondary" onClick={() => socket.emit('host:reset', {})}>
            Reset scores
          </button>
        </div>
      </header>

      <div className="game-layout">
        <div className="board-area">
          <h2 className="board-title">{state.board.title}</h2>
          <Board
            board={state.board}
            interactive={state.phase === 'board'}
            onSelect={(catIndex, clueIndex) =>
              socket.emit('host:selectClue', { catIndex, clueIndex })
            }
          />
        </div>
        <Scoreboard
          players={state.players}
          buzzedPlayerId={state.buzzedPlayerId}
          onSetScore={(playerId, score) => socket.emit('host:setScore', { playerId, score })}
        />
      </div>

      <ClueModal
        state={state}
        role="host"
        myId={socket.id}
        onReveal={() => socket.emit('host:reveal')}
        onJudge={(correct) => socket.emit('host:judge', { correct })}
        onClose={() => socket.emit('host:closeClue')}
      />
    </div>
  );
}
