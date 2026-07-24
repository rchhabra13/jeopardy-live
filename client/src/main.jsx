import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import HostView from './pages/HostView.jsx';
import PlayerView from './pages/PlayerView.jsx';
import BoardEditor from './components/BoardEditor.jsx';
import { SpookyProvider } from './spooky/SpookyContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SpookyProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<HostView />} />
          <Route path="/play" element={<PlayerView />} />
          <Route path="/play/:code" element={<PlayerView />} />
          <Route path="/editor" element={<BoardEditor />} />
        </Routes>
      </SpookyProvider>
    </BrowserRouter>
  </React.StrictMode>
);
