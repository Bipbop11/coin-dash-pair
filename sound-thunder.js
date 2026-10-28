// Thunder crack for the lightning strike: a burst of low-passed noise, synthesized with Web Audio.
const THUNDER_SOUND = { seconds: 0.9, volume: 0.35, filterHz: [2500, 200] };

// Never throws; silently does nothing if audio is unavailable.
window.playThunderSound = function (scene) {
  try {
    const s = THUNDER_SOUND;
    const ctx = scene && scene.sound && scene.sound.context;
    if (!ctx) return;
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * s.seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    // Sweeping the filter down turns the sharp crack into a rumble.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(s.filterHz[0], t);
    filter.frequency.exponentialRampToValueAtTime(s.filterHz[1], t + s.seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(s.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + s.seconds);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + s.seconds);
  } catch (e) { /* audio is optional */ }
};
