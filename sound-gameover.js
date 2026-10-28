// Sad-trombone "wha wha wha whaaa" played when the game ends, synthesized with Web Audio (no audio files).
// window.playGameOverSound(scene) returns a stop function that cuts the sound off immediately.
(function () {
  // Tuning: three short falling notes, then a longer last note that slides down with vibrato.
  const TUNING = {
    volume: 0.25,
    notes: [  // start time (s), length (s), frequency (Hz)
      { at: 0.00, len: 0.30, freq: 311 },
      { at: 0.38, len: 0.30, freq: 293 },
      { at: 0.76, len: 0.30, freq: 277 },
      { at: 1.14, len: 0.95, freq: 261 }
    ],
    slideTo: 0.9,          // final note ends at this fraction of its start pitch
    vibratoHz: 6,
    vibratoDepth: 6,       // Hz
    filterHz: 900,         // low-pass cutoff, keeps the sawtooth brassy rather than harsh
    attack: 0.03,
    release: 0.08
  };

  window.playGameOverSound = function (scene) {
    const noop = function () {};
    try {
      const ctx = scene && scene.sound && scene.sound.context;
      if (!ctx) return noop;
      if (ctx.state === 'suspended') ctx.resume().catch(noop);

      const t0 = ctx.currentTime + 0.02;
      const master = ctx.createGain();
      master.gain.value = TUNING.volume;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = TUNING.filterHz;
      filter.connect(master);
      master.connect(ctx.destination);

      const nodes = [master, filter];
      const oscs = [];
      TUNING.notes.forEach((n, i) => {
        const last = i === TUNING.notes.length - 1;
        const start = t0 + n.at;
        const end = start + n.len;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, start);
        if (last) osc.frequency.linearRampToValueAtTime(n.freq * TUNING.slideTo, end);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, start);
        env.gain.linearRampToValueAtTime(1, start + TUNING.attack);
        env.gain.setValueAtTime(1, Math.max(start + TUNING.attack, end - TUNING.release));
        env.gain.linearRampToValueAtTime(0, end);
        osc.connect(env);
        env.connect(filter);
        nodes.push(env);
        if (last) {
          const lfo = ctx.createOscillator();
          const depth = ctx.createGain();
          lfo.frequency.value = TUNING.vibratoHz;
          depth.gain.value = TUNING.vibratoDepth;
          lfo.connect(depth);
          depth.connect(osc.frequency);
          lfo.start(start);
          lfo.stop(end + 0.05);
          oscs.push(lfo);
          nodes.push(depth);
        }
        osc.start(start);
        osc.stop(end + 0.05);
        oscs.push(osc);
      });

      let stopped = false;
      return function stop() {
        if (stopped) return;
        stopped = true;
        oscs.forEach((o) => { try { o.stop(); } catch (e) { /* already stopped */ } });
        nodes.forEach((n) => { try { n.disconnect(); } catch (e) { /* already disconnected */ } });
      };
    } catch (e) {
      return noop;  // audio is a nicety; never break the game over it
    }
  };
})();
