import { useState } from 'react';
import { Link } from 'react-router-dom';
import { emptyBoard, boardByIndex, boardTitles } from '../game/boards/index.js';

const CUSTOM_KEY = 'jeopardy.customBoard';

export default function BoardEditor() {
  const [board, setBoard] = useState(() => {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : emptyBoard();
  });
  const [status, setStatus] = useState('');

  function update(mutator) {
    setBoard((b) => {
      const next = structuredClone(b);
      mutator(next);
      return next;
    });
  }

  function save() {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(board));
    setStatus('Saved. It will appear as "My custom board" when hosting.');
    setTimeout(() => setStatus(''), 2500);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${board.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed?.categories?.length) throw new Error('bad');
        setBoard(parsed);
        setStatus('Imported.');
      } catch {
        setStatus('Invalid board JSON.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="screen editor">
      <header className="editor-bar">
        <h1 className="logo small">Board Editor</h1>
        <div className="editor-actions">
          <select
            className="select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value === '') return;
              if (e.target.value === 'blank') setBoard(emptyBoard());
              else setBoard(boardByIndex(Number(e.target.value)));
              setStatus('Loaded as a starting template — edit and save.');
            }}
          >
            <option value="">Load template…</option>
            <option value="blank">Blank board</option>
            {boardTitles.map((t, i) => (
              <option key={i} value={i}>
                {t}
              </option>
            ))}
          </select>
          <label className="btn tiny secondary file-btn">
            Import JSON
            <input type="file" accept="application/json" hidden onChange={importJson} />
          </label>
          <button className="btn tiny secondary" onClick={exportJson}>
            Export JSON
          </button>
          <button className="btn tiny" onClick={save}>
            Save
          </button>
        </div>
      </header>

      {status && <p className="status">{status}</p>}

      <input
        className="input title-input"
        value={board.title}
        onChange={(e) => update((b) => (b.title = e.target.value))}
        placeholder="Board title"
      />

      <div className="editor-grid">
        {board.categories.map((cat, ci) => (
          <div className="editor-col" key={ci}>
            <input
              className="input cat-input"
              value={cat.title}
              onChange={(e) => update((b) => (b.categories[ci].title = e.target.value))}
              placeholder={`Category ${ci + 1}`}
            />
            {cat.clues.map((clue, ii) => (
              <div className="editor-clue" key={ii}>
                <span className="editor-value">${clue.value}</span>
                <textarea
                  className="input clue-input"
                  value={clue.clue}
                  onChange={(e) => update((b) => (b.categories[ci].clues[ii].clue = e.target.value))}
                  placeholder="Clue (the prompt)"
                  rows={2}
                />
                <input
                  className="input answer-input"
                  value={clue.answer}
                  onChange={(e) =>
                    update((b) => (b.categories[ci].clues[ii].answer = e.target.value))
                  }
                  placeholder="Answer"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="editor-footer">
        <Link to="/host" className="btn secondary">
          Go Host →
        </Link>
        <Link to="/" className="muted">
          Home
        </Link>
      </div>
    </div>
  );
}
