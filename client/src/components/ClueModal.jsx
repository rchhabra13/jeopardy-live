// Full-screen active-clue overlay. Renders differently for host vs player.
export default function ClueModal({ state, role, myId, onReveal, onJudge, onClose, onBuzz }) {
  const { activeClue, phase, board, players, buzzedPlayerId, answerRevealed, lockedOut } = state;
  if (!activeClue) return null;

  const cat = board.categories[activeClue.catIndex];
  const clue = cat?.clues[activeClue.clueIndex];
  if (!clue) return null;

  const buzzedPlayer = players.find((p) => p.id === buzzedPlayerId);
  const iAmLockedOut = lockedOut?.includes(myId);
  const iBuzzed = buzzedPlayerId === myId;

  return (
    <div className="modal-overlay">
      <div className="clue-modal">
        <div className="clue-meta">
          {cat?.title} — ${clue.value}
        </div>

        <div className="clue-text">{clue.clue}</div>

        {answerRevealed && clue.answer && (
          <div className="answer-reveal">
            <span className="answer-label">Answer</span>
            <span className="answer-text">{clue.answer}</span>
          </div>
        )}

        {/* ---------- HOST CONTROLS ---------- */}
        {role === 'host' && (
          <div className="host-controls">
            {!answerRevealed && <div className="host-answer">Answer: {clue.answer}</div>}

            {phase === 'clue' && (
              <>
                <p className="waiting">Waiting for a buzz…</p>
                <div className="btn-row">
                  <button className="btn" onClick={onReveal}>
                    Reveal Answer
                  </button>
                  <button className="btn secondary" onClick={onClose}>
                    No one got it →
                  </button>
                </div>
              </>
            )}

            {phase === 'buzzed' && (
              <>
                <p className="buzzed-name">🔔 {buzzedPlayer?.name} buzzed in!</p>
                <div className="btn-row">
                  <button className="btn correct" onClick={() => onJudge(true)}>
                    ✓ Correct (+${clue.value})
                  </button>
                  <button className="btn wrong" onClick={() => onJudge(false)}>
                    ✗ Wrong (−${clue.value})
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ---------- PLAYER CONTROLS ---------- */}
        {role === 'player' && (
          <div className="player-controls">
            {phase === 'clue' &&
              (iAmLockedOut ? (
                <p className="locked">You already guessed — locked out for this clue.</p>
              ) : (
                <button className="buzzer" onClick={onBuzz}>
                  BUZZ
                </button>
              ))}

            {phase === 'buzzed' && (
              <p className={`buzz-status ${iBuzzed ? 'me' : ''}`}>
                {iBuzzed ? '🔔 You buzzed! Answer out loud.' : `🔔 ${buzzedPlayer?.name} buzzed in`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
