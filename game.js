/* global Phaser, COIN_DASH */
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
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.silver = this.add.circle(0, 0, 9, c.colors.silver);
    this.physics.add.existing(this.silver);
    this.silver.body.setCircle(9);
    this.hideSilver();
    this.boostUntil = 0;
    this.nextSilverAt = this.time.now + this.silverDelay();
    this.green = this.add.circle(0, 0, 9, c.colors.green);
    this.physics.add.existing(this.green);
    this.green.body.setCircle(9);
    this.hideGreen();
    this.droneBoostUntil = 0;
    this.dronesFast = false;
    this.nextGreenAt = this.time.now + this.greenDelay();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
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
      this.add.rectangle(0, 6, 22, 26, c.colors.grandma),
      this.add.circle(0, -12, 9, 0xf2c9a0),
      this.add.circle(0, -19, 5, 0xdddddd),
      this.add.rectangle(17, 4, 12, 4, 0x222222),
      this.add.circle(29, 4, 9, 0x444444)
    ]).setSize(26, 40).setVisible(false);
    this.physics.add.existing(this.grandma);
    this.grandma.body.enable = false;
    this.grandmaNextRun = this.time.now + Phaser.Math.Between(c.grandmaDelayMin, c.grandmaDelayMax);
    this.physics.add.overlap(this.player, this.grandma, () => this.finish("grandmom got ya'"));
    // Wizard: robe, face, pointed hat and a staff with a glowing tip. Decoration only, no physics.
    this.wizard = this.add.container(0, 0, [
      this.add.triangle(0, 8, -14, 16, 14, 16, 0, -12, c.colors.wizard),
      this.add.circle(0, -12, 7, 0xf2c9a0),
      this.add.triangle(0, -24, -10, 6, 10, 6, 0, -14, c.colors.wizard),
      this.add.rectangle(16, 2, 3, 34, 0x8b5a2b),
      this.add.circle(16, -16, 5, c.colors.spell)
    ]).setVisible(false);
    this.spellBeam = this.add.graphics();
    this.spellText = this.add.text(18, 32, '', { font: '14px monospace', color: '#f7f06d' });
    this.spell = null;
    this.spellUntil = 0;
    this.wizardLeaveAt = 0;
    this.nextWizardAt = this.time.now + c.wizardEverySeconds * 1000;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-O', () => this.finish('You ended the game.'));
    this.input.keyboard.on('keydown-P', () => this.togglePause());
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
    if (this.finished || this.spell === 'Shield' || this.time.now < this.invulnerableUntil) return;
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

  castSpell() {
    const c = COIN_DASH;
    const now = this.time.now;
    const { x, y } = this.randomSpot();
    this.wizard.setPosition(x, y).setVisible(true);
    this.wizardLeaveAt = now + c.wizardShowSeconds * 1000;
    this.nextWizardAt = now + c.wizardEverySeconds * 1000;
    // A new spell replaces the current one rather than stacking with it.
    this.clearSpell();
    this.spell = Phaser.Utils.Array.GetRandom(['Big', 'Small', 'Shield']);
    this.spellUntil = now + c.wizardEffectSeconds * 1000;
    // Arcade bodies follow the game object's scale, so the hitbox grows/shrinks (and stays centred) too.
    if (this.spell === 'Big') this.player.setScale(c.wizardBigScale);
    else if (this.spell === 'Small') this.player.setScale(c.wizardSmallScale);
    else this.player.setStrokeStyle(3, c.colors.shield);
  }

  clearSpell() {
    this.spell = null;
    this.player.setScale(1);
    this.player.setStrokeStyle();
  }

  updateWizard(now) {
    if (now >= this.nextWizardAt) this.castSpell();
    if (this.spell && now >= this.spellUntil) this.clearSpell();
    this.spellBeam.clear();
    if (!this.wizard.visible) return;
    if (now >= this.wizardLeaveAt) {
      this.wizard.setVisible(false);
      return;
    }
    // Flickering beam from the staff tip to the player while the wizard is on the board.
    this.spellBeam.lineStyle(3, COIN_DASH.colors.spell, Math.floor(now / 80) % 2 ? 0.9 : 0.4);
    this.spellBeam.lineBetween(this.wizard.x + 16, this.wizard.y - 16, this.player.x, this.player.y);
  }

  togglePause() {
    if (this.finished) return;
    const c = COIN_DASH;
    if (!this.paused) {
      this.paused = true;
      this.pausedAt = this.time.now;
      this.physics.pause();
      this.pauseOverlay = this.add.container(0, 0, [
        this.add.rectangle(c.width / 2, c.height / 2, 460, 110, 0x0a1120, 0.95),
        this.add.text(c.width / 2, c.height / 2, 'Paused\nPress P to resume',
          { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }).setOrigin(0.5)
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
      this.nextWizardAt += pausedFor;
      this.wizardLeaveAt += pausedFor;
      this.spellUntil += pausedFor;
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
    this.updateWizard(now);
    if (!this.silver.visible && now >= this.nextSilverAt) this.showSilver();
    if (!this.green.visible && now >= this.nextGreenAt) this.showGreen();
    const dronesFast = now < this.droneBoostUntil;
    if (dronesFast !== this.dronesFast) this.setDroneSpeed(dronesFast);
    const seconds = Math.max(0, Math.ceil((this.deadline - now) / 1000));
    const boost = boosted ? `   Boost: ${Math.ceil((this.boostUntil - now) / 1000)}s` : '';
    const droneBoost = dronesFast ? `   Drones x${COIN_DASH.droneBoostFactor}: ${Math.ceil((this.droneBoostUntil - now) / 1000)}s` : '';
    this.hud.setText(`Coins: ${this.score}   Best: ${this.highScore}   Lives: ${this.lives}   Time: ${seconds}s${boost}${droneBoost}`);
    this.spellText.setText(this.spell ? `Spell: ${this.spell} ${Math.ceil((this.spellUntil - now) / 1000)}s` : '');
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
    this.add.rectangle(c.width / 2, c.height / 2, 460, 190, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\n${best}\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
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
