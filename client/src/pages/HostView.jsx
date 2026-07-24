import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../socket.js';
import {
  BOARDS,
  boardTitles,
  randomBoard,
  boardByIndex,
  allCategories,
  themes,
  boardFromCategoryIds,
  randomMixBoard,
  categoryIdsForTitles,
  CATEGORIES_PER_BOARD,
} from '../game/boards/index.js';
import Board from '../components/Board.jsx';
import ClueModal from '../components/ClueModal.jsx';
import Scoreboard from '../components/Scoreboard.jsx';
import { useScareTriggers } from '../spooky/useScareTriggers.js';

const CUSTOM_KEY = 'jeopardy.customBoard';

export default function HostView() {
  const [state, setState] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [source, setSource] = useState('random'); // 'random' | 'pick' | 'custom' | 'import'
  const [pickIndex, setPickIndex] = useState(0);
  const [pickedCats, setPickedCats] = useState([]); // category ids for the custom mix
  const [catFilter, setCatFilter] = useState('all');
  const [importedBoard, setImportedBoard] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useScareTriggers(state);

  useEffect(() => {
    const onState = (s) => setState(s);
    socket.on('state:update', onState);
    return () => socket.off('state:update', onState);
  }, []);

  function toggleCat(id) {
    setPickedCats((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < CATEGORIES_PER_BOARD
          ? [...prev, id]
          : prev // ignore extra picks once 6 are chosen
    );
  }

  function chosenBoard() {
    if (source === 'random') return randomBoard();
    if (source === 'mix') return randomMixBoard();
    if (source === 'categories') {
      if (pickedCats.length !== CATEGORIES_PER_BOARD) return null;
      return boardFromCategoryIds(pickedCats);
    }
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
      setError(
        source === 'categories'
          ? `Pick exactly ${CATEGORIES_PER_BOARD} categories (${pickedCats.length} selected).`
          : 'No valid board selected.'
      );
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

          <label className="radio">
            <input type="radio" checked={source === 'mix'} onChange={() => setSource('mix')} />
            Random mix — 6 categories from across every theme
          </label>

          <label className="radio">
            <input
              type="radio"
              checked={source === 'categories'}
              onChange={() => setSource('categories')}
            />
            Choose my own categories
          </label>
          {source === 'categories' && (
            <div className="cat-picker">
              <div className="cat-picker-bar">
                <select
                  className="select"
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                >
                  <option value="all">All themes ({allCategories.length})</option>
                  {themes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <span className={`cat-count ${pickedCats.length === CATEGORIES_PER_BOARD ? 'ok' : ''}`}>
                  {pickedCats.length}/{CATEGORIES_PER_BOARD}
                </span>
                {pickedCats.length > 0 && (
                  <button className="btn tiny secondary" onClick={() => setPickedCats([])}>
                    Clear
                  </button>
                )}
              </div>
              <div className="cat-list">
                {allCategories
                  .filter((c) => catFilter === 'all' || c.theme === catFilter)
                  .map((c) => {
                    const on = pickedCats.includes(c.id);
                    const full = pickedCats.length >= CATEGORIES_PER_BOARD;
                    return (
                      <button
                        key={c.id}
                        className={`cat-chip ${on ? 'on' : ''}`}
                        disabled={!on && full}
                        onClick={() => toggleCat(c.id)}
                      >
                        <span className="chip-title">{c.title}</span>
                        <span className="chip-theme">{c.theme}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
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
          <p className="muted small">
            {BOARDS.length} boards · {allCategories.length} categories in the library.
          </p>
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
            onClick={() => {
              // Exclude what's currently on screen so a reroll can never hand
              // back the same 6 categories, and pull from the full pool of
              // 138 rather than cycling through only the 23 fixed boards.
              const excludeIds = categoryIdsForTitles(state.board.categories.map((c) => c.title));
              socket.emit('host:reset', { board: randomMixBoard(excludeIds) });
            }}
          >
            🔀 Shuffle categories
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
