import { BOARDS } from './library.js';

export { BOARDS };

export const boardTitles = BOARDS.map((b) => b.title);

const clone = (obj) =>
  typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

export function randomBoard() {
  return clone(BOARDS[Math.floor(Math.random() * BOARDS.length)]);
}

export function boardByIndex(i) {
  return clone(BOARDS[i] || BOARDS[0]);
}

// Blank 6x5 board for the editor.
export function emptyBoard() {
  return {
    title: 'My Custom Board',
    categories: Array.from({ length: 6 }, (_, c) => ({
      title: `Category ${c + 1}`,
      clues: [200, 400, 600, 800, 1000].map((value) => ({ value, clue: '', answer: '' })),
    })),
  };
}
