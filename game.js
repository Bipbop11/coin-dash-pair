/* global Phaser, COIN_DASH */
const FONT = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const INK = '#2b2f45';
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
    this.makeTextures();
    this.drawBackground();
    this.hud = this.add.text(c.width / 2, 22, '', { font: '600 16px ' + FONT, color: INK }).setOrigin(0.5).setDepth(10);
    this.player = this.add.image(c.width / 2, c.height / 2, 'tex-player');
    this.physics.add.existing(this.player);
    this.player.body.setSize(24, 24).setOffset(10, 10);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.image(100, 100, 'tex-coin');
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9, 9, 9);
    this.placeCoin();
    this.silver = this.add.image(0, 0, 'tex-silver');
    this.physics.add.existing(this.silver);
    this.silver.body.setCircle(9, 9, 9);
    this.hideSilver();
    this.boostUntil = 0;
    this.nextSilverAt = this.time.now + this.silverDelay();
    this.green = this.add.image(0, 0, 'tex-green');
    this.physics.add.existing(this.green);
    this.green.body.setCircle(9, 9, 9);
    this.hideGreen();
    this.droneBoostUntil = 0;
    this.dronesFast = false;
    this.nextGreenAt = this.time.now + this.greenDelay();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.image(90 + i * 270, 100, 'tex-drone');
      this.drones.add(drone);
      drone.body.setSize(26, 26).setOffset(9, 9);
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
      this.add.image(-10, -5, 'tex-grandma')
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

  // Flat-design visuals: every sprite is drawn once into a texture, with a soft baked-in drop shadow.
  makeTextures() {
    const c = COIN_DASH.colors;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const done = (key, w, h) => { g.generateTexture(key, w, h); g.clear(); };
    const shadow = (fn) => { [0.05, 0.07, 0.09].forEach((a, i) => { g.fillStyle(0x2b2f45, a); fn(3 - i); }); };
    // Player: accent rounded square with a simple face (visual 28px, hitbox 24px).
    shadow(grow => g.fillRoundedRect(8 - grow, 11 - grow, 28 + grow * 2, 28 + grow * 2, 9 + grow));
    g.fillStyle(c.player, 1).fillRoundedRect(8, 8, 28, 28, 9);
    g.fillStyle(0xffffff, 0.2).fillRoundedRect(8, 8, 28, 12, { tl: 9, tr: 9, bl: 0, br: 0 });
    g.fillStyle(0xffffff, 1).fillCircle(17, 22, 3).fillCircle(27, 22, 3);
    done('tex-player', 44, 44);
    // Drone: coral rounded square with a white ring "lens".
    shadow(grow => g.fillRoundedRect(9 - grow, 12 - grow, 26 + grow * 2, 26 + grow * 2, 8 + grow));
    g.fillStyle(c.drone, 1).fillRoundedRect(9, 9, 26, 26, 8);
    g.fillStyle(0xffffff, 1).fillCircle(22, 22, 8);
    g.fillStyle(c.drone, 1).fillCircle(22, 22, 4.5);
    g.fillStyle(0xffffff, 1).fillCircle(22, 22, 1.8);
    done('tex-drone', 44, 44);
    // Coins: flat disc, inner ring, embossed symbol (light edge below, dark edge above).
    const star = (o, col, a) => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 2.6 : 5.4, t = -Math.PI / 2 + i * Math.PI / 5;
        pts.push({ x: 18 + o + Math.cos(t) * r, y: 18 + o + Math.sin(t) * r });
      }
      g.fillStyle(col, a).fillPoints(pts, true);
    };
    const bolt = (o, col, a) => {
      g.fillStyle(col, a).fillPoints([{ x: 19.5, y: 11.5 }, { x: 14.5, y: 19 }, { x: 18, y: 19 },
        { x: 16.5, y: 25 }, { x: 22, y: 16.5 }, { x: 18.5, y: 16.5 }].map(p => ({ x: p.x + o, y: p.y + o })), true);
    };
    const chevrons = (o, col, a) => {
      g.lineStyle(2, col, a);
      [-3, 2.5].forEach(dx => g.strokePoints([{ x: 14.5 + dx + o, y: 13.5 + o }, { x: 19 + dx + o, y: 18 + o },
        { x: 14.5 + dx + o, y: 22.5 + o }], false));
    };
    const coin = (key, base, rim, symbol) => {
      shadow(grow => g.fillCircle(18, 21, 10 + grow));
      g.fillStyle(rim, 1).fillCircle(18, 18, 11);
      g.fillStyle(base, 1).fillCircle(18, 18, 9);
      g.lineStyle(1.2, rim, 0.9).strokeCircle(18, 18, 7);
      symbol(0.8, 0xffffff, 0.8);
      symbol(0, rim, 1);
      done(key, 36, 36);
    };
    coin('tex-coin', c.coin, 0xd9951a, star);
    coin('tex-silver', c.silver, 0x8e9aab, bolt);
    coin('tex-green', c.green, 0x1f9a65, chevrons);
    // Grandma: lilac rounded dress, soft grey hair, charcoal pan. Canvas origin offset so the dress centre
    // matches the old container layout.
    const ox = 35, oy = 30;
    shadow(grow => g.fillRoundedRect(ox - 11 - grow, oy - 7 + 3 - grow, 22 + grow * 2, 26 + grow * 2, 10));
    g.fillStyle(0x4a4e69, 1).fillRoundedRect(ox + 8, oy + 2, 12, 4, 2);
    g.fillStyle(0x4a4e69, 1).fillCircle(ox + 29, oy + 4, 9);
    g.fillStyle(0x6b7090, 1).fillCircle(ox + 29, oy + 4, 5.5);
    g.fillStyle(c.grandma, 1).fillRoundedRect(ox - 11, oy - 7, 22, 26, 10);
    g.fillStyle(0xe8dcff, 1).fillRoundedRect(ox - 7, oy + 9, 14, 4, 2);
    g.fillStyle(0xe6e8ee, 1).fillCircle(ox, oy - 19, 6);
    g.fillStyle(0xf6cfb0, 1).fillCircle(ox, oy - 12, 9);
    g.fillStyle(0xe6e8ee, 1).fillRoundedRect(ox - 9, oy - 21, 18, 7, { tl: 8, tr: 8, bl: 0, br: 0 });
    g.fillStyle(0x4a4e69, 1).fillCircle(ox - 3, oy - 10, 1.2).fillCircle(ox + 3, oy - 10, 1.2);
    done('tex-grandma', 90, 70);
    g.destroy();
    // Container child is centred on the container; shift so the dress sits at the container centre.
  }

  drawBackground() {
    const c = COIN_DASH;
    const bg = this.add.graphics().setDepth(-10);
    bg.fillStyle(c.colors.background, 1).fillRect(0, 0, c.width, c.height);
    // Dot grid instead of hard lines.
    bg.fillStyle(0xc9c6d6, 0.7);
    for (let x = 20; x < c.width; x += 40) for (let y = 64; y < c.height; y += 40) bg.fillCircle(x, y, 1.6);
    // Floating HUD bar with a soft shadow.
    [3, 2, 1].forEach(k => bg.fillStyle(0x2b2f45, 0.05)
      .fillRoundedRect(130 - k * 2, 9 - k * 2, c.width - 260 + k * 4, 32 + k * 4, 16 + k * 2));
    bg.fillStyle(0xffffff, 1).fillRoundedRect(130, 6, c.width - 260, 32, 16);
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

  // Rounded white card over a frosted wash, used by the pause and end screens.
  card(w, h) {
    const c = COIN_DASH;
    const g = this.add.graphics();
    g.fillStyle(0xf4f1ea, 0.6).fillRect(0, 0, c.width, c.height);
    [3, 2, 1].forEach(k => g.fillStyle(0x2b2f45, 0.05)
      .fillRoundedRect(c.width / 2 - w / 2 - k * 4, c.height / 2 - h / 2 - k * 4 + 6, w + k * 8, h + k * 8, 22 + k * 4));
    g.fillStyle(0xffffff, 1).fillRoundedRect(c.width / 2 - w / 2, c.height / 2 - h / 2, w, h, 22);
    return g;
  }

  togglePause() {
    if (this.finished) return;
    const c = COIN_DASH;
    if (!this.paused) {
      this.paused = true;
      this.pausedAt = this.time.now;
      this.physics.pause();
      this.pauseOverlay = this.add.container(0, 0, [
        this.card(460, 110),
        this.add.text(c.width / 2, c.height / 2, 'Paused\nPress P to resume',
          { font: '600 22px ' + FONT, color: INK, align: 'center', lineSpacing: 10 }).setOrigin(0.5)
      ]).setDepth(20);
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
    const boost = boosted ? `   Boost: ${Math.ceil((this.boostUntil - now) / 1000)}s` : '';
    const droneBoost = dronesFast ? `   Drones x${COIN_DASH.droneBoostFactor}: ${Math.ceil((this.droneBoostUntil - now) / 1000)}s` : '';
    this.hud.setText(`Coins ${this.score}  ·  Best ${this.highScore}  ·  Lives ${this.lives}  ·  Time ${seconds}s${boost}${droneBoost}`);
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
    this.card(460, 190).setDepth(20);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\n${best}\nPress R to try again`,
      { font: '600 22px ' + FONT, color: INK, align: 'center', lineSpacing: 10 }
    ).setOrigin(0.5).setDepth(21);
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
