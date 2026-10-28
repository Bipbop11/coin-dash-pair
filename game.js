/* global Phaser, COIN_DASH */
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
const hex = n => '#' + n.toString(16).padStart(6, '0');

class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.lives = c.lives;
    this.invulnerableUntil = 0;
    this.finished = false;
    this.paused = false;
    this.pauseOverlay = null;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.buildTextures();
    this.buildBackground();
    this.pills = {
      coins: this.makePill(14, 104, 0xffc533), best: this.makePill(124, 96, 0xc4b5fd),
      lives: this.makePill(226, 84, 0xff5c8a), time: this.makePill(316, 92, 0x5ef2d6),
      boost: this.makePill(414, 130, 0x93c5fd), drone: this.makePill(550, 176, 0x3be58a)
    };
    this.player = this.physics.add.image(c.width / 2, c.height / 2, 'glass-player');
    this.player.body.setSize(24, 24);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.physics.add.image(100, 100, 'coin-gold');
    this.coin.body.setCircle(9, 15, 15);
    this.placeCoin();
    this.silver = this.physics.add.image(0, 0, 'coin-silver');
    this.silver.body.setCircle(9, 15, 15);
    this.hideSilver();
    this.boostUntil = 0;
    this.nextSilverAt = this.time.now + this.silverDelay();
    this.green = this.physics.add.image(0, 0, 'coin-green');
    this.green.body.setCircle(9, 15, 15);
    this.hideGreen();
    this.droneBoostUntil = 0;
    this.dronesFast = false;
    this.nextGreenAt = this.time.now + this.greenDelay();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.drones.create(90 + i * 270, 100, 'glass-drone');
      drone.body.setSize(26, 26);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      this.deadline += c.coinBonusSeconds * 1000;
      window.playCoinSound(this, 'yellow');
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.silver, () => {
      if (this.finished || !this.silver.visible) return;
      this.hideSilver();
      window.playCoinSound(this, 'silver');
      // Eating another silver coin while boosted restarts the timer instead of stacking.
      this.boostUntil = this.time.now + c.boostSeconds * 1000;
      this.nextSilverAt = this.time.now + this.silverDelay();
    });
    this.physics.add.overlap(this.player, this.green, () => {
      if (this.finished || !this.green.visible) return;
      this.hideGreen();
      // Eating another green coin while drones are fast restarts the timer instead of stacking.
      this.droneBoostUntil = this.time.now + c.droneBoostSeconds * 1000;
      this.nextGreenAt = this.time.now + this.greenDelay();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.hitDrone());
    // Grandma: dress + head, with a frying pan held out to her right.
    this.grandma = this.add.container(-100, -100, [
      this.add.rectangle(0, 6, 22, 26, c.colors.grandma, 0.75).setStrokeStyle(2, 0xe9d5ff),
      this.add.circle(0, -12, 9, 0xffd9bd).setStrokeStyle(2, 0xffffff, 0.8),
      this.add.circle(0, -19, 5, 0xe5e7ff),
      this.add.rectangle(17, 4, 12, 4, 0x94a3b8),
      this.add.circle(29, 4, 9, 0x1e293b).setStrokeStyle(2, 0x5ef2d6)
    ]).setSize(26, 40).setVisible(false);
    this.physics.add.existing(this.grandma);
    this.grandma.body.enable = false;
    this.grandmaNextRun = this.time.now + Phaser.Math.Between(c.grandmaDelayMin, c.grandmaDelayMax);
    this.physics.add.overlap(this.player, this.grandma, () => this.finish("grandmom got ya'"));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-O', () => this.finish('You ended the game.'));
    this.input.keyboard.on('keydown-P', () => this.togglePause());
  }

  // ---- Glassmorphism / neon visuals: all textures are drawn in code on 2D canvases ----
  makeTex(key, w, h, draw) {
    if (this.textures.exists(key)) return;
    const t = this.textures.createCanvas(key, w, h);
    draw(t.getContext(), w, h);
    t.refresh();
  }

  roundRectPath(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  // Translucent glass square with a gradient border and soft glow.
  glassSquare(key, size, box, radius, c1, c2) {
    this.makeTex(key, size, size, g => {
      const o = (size - box) / 2;
      g.shadowColor = c1; g.shadowBlur = 16;
      this.roundRectPath(g, o, o, box, box, radius);
      const fill = g.createLinearGradient(o, o, o + box, o + box);
      fill.addColorStop(0, c1 + '99'); fill.addColorStop(1, c2 + '33');
      g.fillStyle = fill; g.fill();
      g.shadowBlur = 0;
      g.lineWidth = 2;
      const stroke = g.createLinearGradient(o, o, o + box, o + box);
      stroke.addColorStop(0, '#ffffff'); stroke.addColorStop(0.5, c1); stroke.addColorStop(1, c2);
      g.strokeStyle = stroke; this.roundRectPath(g, o, o, box, box, radius); g.stroke();
      // glass highlight on the top half
      g.save(); this.roundRectPath(g, o + 2, o + 2, box - 4, box - 4, radius - 1); g.clip();
      const hl = g.createLinearGradient(0, o, 0, o + box / 2);
      hl.addColorStop(0, 'rgba(255,255,255,0.45)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = hl; g.fillRect(o, o, box, box / 2);
      g.restore();
    });
  }

  // Glowing gradient coin with a shine highlight.
  glowCoin(key, c1, c2, c3) {
    this.makeTex(key, 48, 48, g => {
      g.shadowColor = c2; g.shadowBlur = 14;
      g.beginPath(); g.arc(24, 24, 12, 0, Math.PI * 2);
      const f = g.createLinearGradient(14, 12, 34, 36);
      f.addColorStop(0, c1); f.addColorStop(0.55, c2); f.addColorStop(1, c3);
      g.fillStyle = f; g.fill();
      g.shadowBlur = 0;
      g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,0.75)'; g.stroke();
      g.beginPath(); g.arc(24, 24, 7.5, 0, Math.PI * 2);
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
      g.save(); g.translate(19, 18); g.rotate(-0.7);
      const s = g.createLinearGradient(0, 0, 8, 0);
      s.addColorStop(0, 'rgba(255,255,255,0.95)'); s.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = s; g.beginPath(); g.ellipse(3, 0, 5, 2, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    });
  }

  buildTextures() {
    this.glassSquare('glass-player', 64, 26, 7, '#5ef2d6', '#6a8bff');
    this.glassSquare('glass-drone', 64, 28, 7, '#ff5c8a', '#ff9a4d');
    this.glowCoin('coin-gold', '#fff3b0', '#ffc533', '#ff8a2b');
    this.glowCoin('coin-silver', '#ffffff', '#b8c6e0', '#7f8fb5');
    this.glowCoin('coin-green', '#d4ffd9', '#3be58a', '#12a67a');
    this.makeTex('orb', 256, 256, g => {
      const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.4, 'rgba(255,255,255,0.35)');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    });
    this.makeTex('bg', COIN_DASH.width, COIN_DASH.height, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#0d0626'); bg.addColorStop(0.5, '#0a1236'); bg.addColorStop(1, '#04101f');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      const glow = (x, y, rad, col) => {
        const r = g.createRadialGradient(x, y, 0, x, y, rad);
        r.addColorStop(0, col); r.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = r; g.fillRect(0, 0, w, h);
      };
      glow(120, 90, 300, 'rgba(124,58,237,0.35)');
      glow(700, 420, 320, 'rgba(14,165,233,0.28)');
      glow(660, 80, 220, 'rgba(236,72,153,0.20)');
      g.fillStyle = 'rgba(255,255,255,0.05)';
      for (let x = 20; x < w; x += 40) for (let y = 20; y < h; y += 40) g.fillRect(x, y, 2, 2);
    });
  }

  buildBackground() {
    const c = COIN_DASH;
    this.add.image(c.width / 2, c.height / 2, 'bg');
    const orbs = [[150, 380, 0x8b5cf6, 1.6], [650, 150, 0x22d3ee, 1.4], [400, 260, 0xf472b6, 1.1], [720, 430, 0x6366f1, 1.5]];
    orbs.forEach(([x, y, col, sc], i) => {
      const orb = this.add.image(x, y, 'orb').setTint(col).setAlpha(0.22).setScale(sc).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: orb, x: x + Phaser.Math.Between(-90, 90), y: y + Phaser.Math.Between(-60, 60),
        alpha: 0.12, duration: 5000 + i * 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });
  }

  glassPanel(x, y, w, h, r, accent) {
    const g = this.add.graphics();
    g.fillStyle(0x0b1030, 0.72).fillRoundedRect(x, y, w, h, r);
    g.fillStyle(0xffffff, 0.07).fillRoundedRect(x, y, w, h / 2, { tl: r, tr: r, bl: 0, br: 0 });
    g.lineStyle(1.5, accent, 0.8).strokeRoundedRect(x, y, w, h, r);
    return g;
  }

  makePill(x, w, color) {
    const g = this.glassPanel(x, 9, w, 28, 14, color);
    const text = this.add.text(x + w / 2, 23, '', { fontFamily: FONT, fontSize: '14px', fontStyle: '600', color: hex(color) }).setOrigin(0.5);
    const container = this.add.container(0, 0, [g, text]);
    return { container, text };
  }

  // Storage can be blocked (private mode, file://, policies), so never let it break the game.
  loadHighScore() {
    try {
      return Number(localStorage.getItem(COIN_DASH.highScoreKey)) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem(COIN_DASH.highScoreKey, String(this.highScore));
    } catch (e) { /* ignore */ }
  }

  placeCoin() {
    const { x, y } = this.randomSpot();
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  randomSpot() {
    const c = COIN_DASH;
    // Avoid spawning a coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    return { x, y };
  }

  silverDelay() {
    const c = COIN_DASH;
    return Phaser.Math.Between(c.silverMinSeconds * 1000, c.silverMaxSeconds * 1000);
  }

  showSilver() {
    const { x, y } = this.randomSpot();
    this.silver.setVisible(true);
    this.silver.body.enable = true;
    this.silver.setPosition(x, y);
    this.silver.body.reset(x, y);
  }

  hideSilver() {
    this.silver.setVisible(false);
    this.silver.body.enable = false;
  }

  greenDelay() {
    const c = COIN_DASH;
    return Phaser.Math.Between(c.greenMinSeconds * 1000, c.greenMaxSeconds * 1000);
  }

  showGreen() {
    const { x, y } = this.randomSpot();
    this.green.setVisible(true);
    this.green.body.enable = true;
    this.green.setPosition(x, y);
    this.green.body.reset(x, y);
  }

  hideGreen() {
    this.green.setVisible(false);
    this.green.body.enable = false;
  }

  // Keep each drone's direction (walls may have flipped it) but set its speed exactly.
  setDroneSpeed(fast) {
    const c = COIN_DASH;
    const speed = c.droneSpeed * (fast ? c.droneBoostFactor : 1);
    this.drones.getChildren().forEach(drone => {
      const v = drone.body.velocity;
      if (v.length() > 0) v.scale(speed / v.length());
    });
    this.dronesFast = fast;
  }

  hitDrone() {
    if (this.finished || this.time.now < this.invulnerableUntil) return;
    this.lives--;
    if (this.lives <= 0) {
      this.finish('A drone caught you!');
      return;
    }
    this.invulnerableUntil = this.time.now + COIN_DASH.invulnerableSeconds * 1000;
  }

  startGrandmaRun() {
    const c = COIN_DASH;
    // Start just outside a corner that is far from the player and run towards the opposite corner,
    // aimed a little off so the runs do not all cross the centre.
    const corners = [[-40, 4], [c.width + 40, 4], [-40, c.height + 40], [c.width + 40, c.height + 40]]
      .filter(([x, y]) => Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 300);
    const [x, y] = Phaser.Utils.Array.GetRandom(corners);
    const angle = Phaser.Math.Angle.Between(x, y, c.width - x + Phaser.Math.Between(-200, 200), c.height + 44 - y);
    this.grandma.setPosition(x, y).setVisible(true);
    this.grandma.body.enable = true;
    this.grandma.body.reset(x, y);
    this.grandma.body.setVelocity(Math.cos(angle) * c.grandmaSpeed, Math.sin(angle) * c.grandmaSpeed);
  }

  updateGrandma() {
    const c = COIN_DASH;
    const g = this.grandma;
    if (!g.body.enable) {
      if (this.time.now >= this.grandmaNextRun) this.startGrandmaRun();
      return;
    }
    if (g.x < -60 || g.x > c.width + 60 || g.y < -20 || g.y > c.height + 60) {
      g.body.stop();
      g.body.enable = false;
      g.setVisible(false);
      this.grandmaNextRun = this.time.now + Phaser.Math.Between(c.grandmaDelayMin, c.grandmaDelayMax);
    }
  }

  togglePause() {
    if (this.finished) return;
    const c = COIN_DASH;
    if (!this.paused) {
      this.paused = true;
      this.pausedAt = this.time.now;
      this.physics.pause();
      this.pauseOverlay = this.add.container(0, 0, [
        this.glassPanel(c.width / 2 - 230, c.height / 2 - 55, 460, 110, 24, 0x8b5cf6),
        this.add.text(c.width / 2, c.height / 2, 'Paused\nPress P to resume',
          { fontFamily: FONT, fontSize: '24px', fontStyle: '600', color: '#ffffff', align: 'center', lineSpacing: 12 }).setOrigin(0.5)
      ]);
    } else {
      // Push the deadline back by the time spent paused so the clock picks up where it stopped.
      const pausedFor = this.time.now - this.pausedAt;
      this.deadline += pausedFor;
      this.invulnerableUntil += pausedFor;
      this.grandmaNextRun += pausedFor;
      this.boostUntil += pausedFor;
      this.nextSilverAt += pausedFor;
      this.droneBoostUntil += pausedFor;
      this.nextGreenAt += pausedFor;
      this.paused = false;
      this.physics.resume();
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }

  update() {
    if (this.finished || this.paused) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const now = this.time.now;
    const boosted = now < this.boostUntil;
    const speed = COIN_DASH.playerSpeed * (boosted ? COIN_DASH.boostFactor : 1);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(speed);
    this.player.body.setVelocity(direction.x, direction.y);
    // Blink while invulnerable; driven from update so it freezes along with the pause.
    const invulnerable = now < this.invulnerableUntil;
    this.player.setAlpha(invulnerable && Math.floor(now / 100) % 2 ? 0.25 : 1);
    this.updateGrandma();
    if (!this.silver.visible && now >= this.nextSilverAt) this.showSilver();
    if (!this.green.visible && now >= this.nextGreenAt) this.showGreen();
    const dronesFast = now < this.droneBoostUntil;
    if (dronesFast !== this.dronesFast) this.setDroneSpeed(dronesFast);
    const seconds = Math.max(0, Math.ceil((this.deadline - now) / 1000));
    const p = this.pills;
    p.coins.text.setText(`\u25cf ${this.score} coins`);
    p.best.text.setText(`Best ${this.highScore}`);
    p.lives.text.setText(`\u2665 ${this.lives}`);
    p.time.text.setText(`${seconds}s`);
    p.boost.container.setVisible(boosted);
    if (boosted) p.boost.text.setText(`Boost ${Math.ceil((this.boostUntil - now) / 1000)}s`);
    p.drone.container.setVisible(dronesFast);
    if (dronesFast) p.drone.text.setText(`Drones x${COIN_DASH.droneBoostFactor} ${Math.ceil((this.droneBoostUntil - now) / 1000)}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    // Sad trombone; the returned stop function cuts it off if R restarts the scene.
    this.events.once('shutdown', window.playGameOverSound(this));
    this.physics.pause();
    // Ending while paused (O key) must not leave the pause box under the end screen.
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    const isNewBest = this.score > this.highScore;
    if (isNewBest) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    const best = `${isNewBest ? 'New high score! ' : ''}Best: ${this.highScore}`;
    const c = COIN_DASH;
    this.glassPanel(c.width / 2 - 230, c.height / 2 - 95, 460, 190, 28, 0x5ef2d6);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\n${best}\nPress R to try again`,
      { fontFamily: FONT, fontSize: '24px', fontStyle: '600', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
