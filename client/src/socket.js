import { io } from 'socket.io-client';

// Dev (Vite on :5173): the server is a separate process on :3001 — derive from
// hostname so LAN phones connect automatically.
// Production (Docker/instance): the server serves this build, so use same-origin.
const isViteDev = window.location.port === '5173';
const url =
  import.meta.env.VITE_SERVER_URL ||
  (isViteDev ? `http://${window.location.hostname}:3001` : window.location.origin);

export const socket = io(url, { autoConnect: true });
