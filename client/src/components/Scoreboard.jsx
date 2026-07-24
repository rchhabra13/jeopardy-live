// Player list sorted by score. Host can edit a score inline (setScore).
export default function Scoreboard({ players, buzzedPlayerId, onSetScore }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="scoreboard">
      <h3>Players</h3>
      {sorted.length === 0 && <p className="muted">Waiting for players to join…</p>}
      {sorted.map((p) => (
        <div
          key={p.id}
          className={`score-row ${p.id === buzzedPlayerId ? 'buzzed' : ''} ${
            p.connected ? '' : 'offline'
          }`}
        >
          <span className="pname">{p.name}</span>
          {onSetScore ? (
            <input
              className="score-input"
              type="number"
              step="100"
              value={p.score}
              onChange={(e) => onSetScore(p.id, e.target.value)}
            />
          ) : (
            <span className="pscore">${p.score}</span>
          )}
        </div>
      ))}
    </div>
  );
}
