// The 6x5 grid. `interactive` + `onSelect` only for the host on the board phase.
export default function Board({ board, interactive, onSelect }) {
  if (!board) return null;
  return (
    <div className="board">
      {board.categories.map((cat, ci) => (
        <div className="board-col" key={ci}>
          <div className="cat-head">{cat.title}</div>
          {cat.clues.map((clue, ii) => {
            const done = clue.done;
            return (
              <button
                key={ii}
                className={`cell ${done ? 'done' : ''}`}
                disabled={done || !interactive}
                onClick={() => interactive && !done && onSelect(ci, ii)}
              >
                {done ? '' : `$${clue.value}`}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
