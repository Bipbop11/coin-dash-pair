// Coin-eating sounds, synthesized with Web Audio (no audio files). Self-contained.
// Tuning values live here: [start Hz, end Hz] sweep, duration in seconds, peak volume 0-1.
const COIN_SOUND = {
  yellow: { freq: [660, 880], seconds: 0.12, volume: 0.15, wave: 'square' },
  silver: { freq: [1320, 1980], seconds: 0.18, volume: 0.15, wave: 'triangle' }
};

// kind: 'yellow' | 'silver'. Never throws; silently does nothing if audio is unavailable.
window.playCoinSound = function (scene, kind) {
  try {
    const s = COIN_SOUND[kind] || COIN_SOUND.yellow;
    const ctx = scene && scene.sound && scene.sound.context;
    if (!ctx) return;
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = s.wave;
    osc.frequency.setValueAtTime(s.freq[0], t);
    osc.frequency.exponentialRampToValueAtTime(s.freq[1], t + s.seconds * 0.6);
    // Short attack and fast fade-out so the blip does not click.
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(s.volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + s.seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + s.seconds + 0.02);
  } catch (e) { /* audio is optional */ }
};
