import { useEffect, useRef } from 'react';
import { useSpooky } from './SpookyContext.jsx';
import { playDrone } from './audio.js';

// Watches game state and fires atmosphere at the right dramatic moments:
//  - a wrong answer has a chance of a full jump scare
//  - opening a clue occasionally curses it (low drone + green flicker)
export function useScareTriggers(state) {
  const { triggerScare, shakeScreen, fx } = useSpooky() || {};
  const prevLocked = useRef(0);
  const prevClue = useRef(null);

  useEffect(() => {
    if (!state || !fx) return;

    // Wrong answer -> someone new got locked out.
    const locked = state.lockedOut?.length || 0;
    if (locked > prevLocked.current) {
      if (Math.random() < 0.45) triggerScare?.('wrong');
      else shakeScreen?.();
    }
    prevLocked.current = locked;

    // New clue opened -> small chance it's "cursed".
    const key = state.activeClue
      ? `${state.activeClue.catIndex}-${state.activeClue.clueIndex}`
      : null;
    if (key && key !== prevClue.current) {
      if (Math.random() < 0.18) {
        playDrone();
        document.body.classList.add('cursed');
        setTimeout(() => document.body.classList.remove('cursed'), 2600);
      }
    }
    prevClue.current = key;
  }, [state, fx, triggerScare, shakeScreen]);
}
