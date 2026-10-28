/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
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
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.silver, () => {
      if (this.finished || !this.silver.visible) return;
      this.hideSilver();
      // Eating another silver coin while boosted restarts the timer instead of stacking.
      this.boostUntil = this.time.now + c.boostSeconds * 1000;
      this.nextSilverAt = this.time.now + this.silverDelay();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-O', () => this.finish('You ended the game.'));
    this.input.keyboard.on('keydown-P', () => this.togglePause());
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
      this.boostUntil += pausedFor;
      this.nextSilverAt += pausedFor;
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
    if (!this.silver.visible && now >= this.nextSilverAt) this.showSilver();
    const seconds = Math.max(0, Math.ceil((this.deadline - now) / 1000));
    const boost = boosted ? `   Boost: ${Math.ceil((this.boostUntil - now) / 1000)}s` : '';
    this.hud.setText(`Coins: ${this.score}                       Time: ${seconds}s${boost}`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    // Ending while paused (O key) must not leave the pause box under the end screen.
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
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
