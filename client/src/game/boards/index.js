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

export const CATEGORIES_PER_BOARD = 6;

// Every category across every board, flattened into one pickable pool.
// `id` is stable (board index + category index) so the picker can track selections.
export const allCategories = BOARDS.flatMap((b, bi) =>
  b.categories.map((c, ci) => ({
    id: `${bi}-${ci}`,
    theme: b.title,
    title: c.title,
  }))
);

export const themes = [...new Set(allCategories.map((c) => c.theme))];

function categoryById(id) {
  const [bi, ci] = id.split('-').map(Number);
  return clone(BOARDS[bi].categories[ci]);
}

// Build a playable board out of hand-picked category ids.
export function boardFromCategoryIds(ids, title = 'Custom Mix') {
  return { title, categories: ids.map(categoryById) };
}

// Six random categories pulled from across every theme.
export function randomMixBoard() {
  const pool = [...allCategories];
  const picked = [];
  while (picked.length < CATEGORIES_PER_BOARD && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return boardFromCategoryIds(picked.map((c) => c.id), 'Random Mix');
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
