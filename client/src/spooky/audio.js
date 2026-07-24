// All sound is synthesised with WebAudio — no audio files to ship or load.
// AudioContext is created lazily on the first user gesture (browser autoplay rules).

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Short descending screech + noise burst. Deliberately not deafening.
export function playScreech(volume = 0.25) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;

  const master = ac.createGain();
  master.gain.setValueAtTime(volume, t);
  master.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  master.connect(ac.destination);

  // Wailing tone
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.85);
  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0.6, t);
  osc.connect(oscGain).connect(master);
  osc.start(t);
  osc.stop(t + 0.9);

  // Noise burst for the "hiss"
  const len = Math.floor(ac.sampleRate * 0.35);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(0.35, t);
  noise.connect(bp).connect(noiseGain).connect(master);
  noise.start(t);
}

// Low, slow swell used for the "cursed clue" moment.
export function playDrone(volume = 0.12) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  gain.connect(ac.destination);

  [55, 58.27].forEach((f) => {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = f; // slight detune = unsettling beating
    o.connect(gain);
    o.start(t);
    o.stop(t + 2.3);
  });
}

// Soft creak for hovering/among the UI.
export function playCreak(volume = 0.08) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(220, t);
  o.frequency.linearRampToValueAtTime(140, t + 0.25);
  const g = ac.createGain();
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.3);
}
