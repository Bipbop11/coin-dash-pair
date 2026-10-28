/* global Phaser, COIN_DASH */
/* Procedural "glossy mobile game" art, drawn with canvas gradients into Phaser textures. */
const FONT = '"Baloo 2", "Nunito", "Trebuchet MS", system-ui, sans-serif';

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function hex(n) { return '#' + n.toString(16).padStart(6, '0'); }
function shade(n, k) { // k>0 lighten toward white, k<0 darken
  const t = k < 0 ? 0 : 255, p = Math.abs(k);
  const ch = s => Math.round(((n >> s) & 255) * (1 - p) + t * p);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
function makeTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const t = scene.textures.createCanvas(key, w, h);
  draw(t.getContext(), w, h);
  t.refresh();
}
function softShadow(g, cx, cy, rx, ry) {
  g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
  const s = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  s.addColorStop(0, 'rgba(0,0,0,.45)'); s.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = s; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore();
}
function gloss(g, x, y, w, h, r) { // top highlight band
  g.save(); rr(g, x, y, w, h, r); g.clip();
  const l = g.createLinearGradient(0, y, 0, y + h * 0.55);
  l.addColorStop(0, 'rgba(255,255,255,.65)'); l.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = l; g.fillRect(x, y, w, h * 0.55); g.restore();
}

// Glossy rounded block with a face (player / drone).
function drawBlock(g, s, pad, color, face) {
  const x = pad, y = pad - 2, r = s * 0.32;
  softShadow(g, pad + s / 2, pad + s + 1, s * 0.62, s * 0.2);
  rr(g, x, y + 3, s, s, r); g.fillStyle = shade(color, -0.45); g.fill(); // chunky base edge
  rr(g, x, y, s, s, r);
  const b = g.createLinearGradient(0, y, 0, y + s);
  b.addColorStop(0, shade(color, 0.35)); b.addColorStop(0.55, hex(color)); b.addColorStop(1, shade(color, -0.25));
  g.fillStyle = b; g.fill();
  g.lineWidth = 1.5; g.strokeStyle = shade(color, -0.35); g.stroke();
  gloss(g, x + 2, y + 1.5, s - 4, s * 0.5, r - 2);
  const cx = x + s / 2, cy = y + s * 0.58;
  g.fillStyle = '#fff';
  if (face === 'happy') {
    for (const dx of [-s * 0.2, s * 0.2]) {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx + dx, cy - 2, s * 0.11, s * 0.14, 0, 0, 7); g.fill();
      g.fillStyle = '#16324a'; g.beginPath(); g.arc(cx + dx + 1, cy - 1, s * 0.06, 0, 7); g.fill();
    }
    g.strokeStyle = '#16324a'; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy + 1, s * 0.16, 0.2, Math.PI - 0.2); g.stroke();
  } else {
    g.strokeStyle = '#4a0b18'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - s * 0.32, cy - s * 0.26); g.lineTo(cx - s * 0.08, cy - s * 0.14);
    g.moveTo(cx + s * 0.32, cy - s * 0.26); g.lineTo(cx + s * 0.08, cy - s * 0.14); g.stroke();
    for (const dx of [-s * 0.2, s * 0.2]) {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + dx, cy - 1, s * 0.1, 0, 7); g.fill();
      g.fillStyle = '#4a0b18'; g.beginPath(); g.arc(cx + dx, cy, s * 0.05, 0, 7); g.fill();
    }
    g.fillStyle = '#4a0b18'; rr(g, cx - s * 0.16, cy + s * 0.14, s * 0.32, s * 0.1, 3); g.fill();
  }
}

// Shiny 3D coin: rim, inner face, embossed icon ('$' or 'star').
function drawCoin(g, size, color, icon) {
  const c = size / 2, R = size * 0.42;
  softShadow(g, c, c + R * 0.95, R * 1.0, R * 0.32);
  g.beginPath(); g.arc(c, c + 2, R, 0, 7); g.fillStyle = shade(color, -0.5); g.fill(); // thickness
  g.beginPath(); g.arc(c, c, R, 0, 7);
  let l = g.createLinearGradient(c - R, c - R, c + R, c + R);
  l.addColorStop(0, shade(color, 0.6)); l.addColorStop(0.5, hex(color)); l.addColorStop(1, shade(color, -0.4));
  g.fillStyle = l; g.fill();
  g.beginPath(); g.arc(c, c, R * 0.74, 0, 7);
  l = g.createLinearGradient(c + R, c + R, c - R, c - R);
  l.addColorStop(0, shade(color, 0.3)); l.addColorStop(1, shade(color, -0.2));
  g.fillStyle = l; g.fill();
  g.lineWidth = 1.2; g.strokeStyle = shade(color, -0.45); g.stroke();
  g.save(); g.beginPath(); g.arc(c, c, R, 0, 7); g.clip(); // sheen
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath();
  g.moveTo(c - R, c - R * 0.1); g.quadraticCurveTo(c, c - R * 0.9, c + R, c - R); g.lineTo(c - R, c - R); g.fill(); g.restore();
  const passes = [[1.2, shade(color, 0.7)], [-0.8, shade(color, -0.55)], [0, shade(color, -0.3)]];
  if (icon === 'star') {
    const path = new Path2D();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? R * 0.22 : R * 0.5;
      const px = c + Math.cos(a) * rad, py = c + 1 + Math.sin(a) * rad;
      if (i) path.lineTo(px, py); else path.moveTo(px, py);
    }
    path.closePath();
    for (const [dy, col] of passes) { g.save(); g.translate(0, dy); g.fillStyle = col; g.fill(path); g.restore(); }
  } else {
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${Math.round(R * 1.1)}px ${FONT}`;
    for (const [dy, col] of passes) { g.fillStyle = col; g.fillText(icon, c, c + dy + 1); }
  }
}

function drawGrandma(g, w, h) {
  const cx = w / 2 - 6;
  softShadow(g, cx, h - 4, 18, 5);
  rr(g, cx - 13, 14, 26, 30, 10); // dress
  let l = g.createLinearGradient(0, 14, 0, 44);
  l.addColorStop(0, '#e0a8ff'); l.addColorStop(1, '#8a3fd0'); g.fillStyle = l; g.fill();
  g.strokeStyle = '#5c2599'; g.lineWidth = 1.5; g.stroke();
  gloss(g, cx - 11, 15, 22, 18, 8);
  g.fillStyle = '#ececf4'; g.beginPath(); g.arc(cx, 5, 6, 0, 7); g.fill(); // bun
  l = g.createRadialGradient(cx - 3, 9, 1, cx, 13, 11);
  l.addColorStop(0, '#ffe3c4'); l.addColorStop(1, '#e9a978'); g.fillStyle = l;
  g.beginPath(); g.arc(cx, 14, 9.5, 0, 7); g.fill(); // face
  g.fillStyle = '#ececf4'; g.beginPath(); g.arc(cx, 10, 9.5, Math.PI * 1.05, Math.PI * 1.95); g.fill(); // hair
  g.fillStyle = '#2b2b3a'; g.beginPath(); g.arc(cx - 3.5, 15, 1.3, 0, 7); g.arc(cx + 3.5, 15, 1.3, 0, 7); g.fill();
  g.strokeStyle = '#2a2a33'; g.lineWidth = 4; g.lineCap = 'round'; // pan
  g.beginPath(); g.moveTo(cx + 11, 26); g.lineTo(cx + 22, 26); g.stroke();
  l = g.createRadialGradient(cx + 29, 22, 1, cx + 31, 26, 11);
  l.addColorStop(0, '#8b8b99'); l.addColorStop(1, '#2d2d38'); g.fillStyle = l;
  g.beginPath(); g.arc(cx + 31, 26, 9.5, 0, 7); g.fill();
  g.strokeStyle = '#17171d'; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(cx + 28, 22, 4, 2, -0.6, 0, 7); g.fill();
}

function drawPanel(g, w, h) {
  softShadow(g, w / 2, h - 10, w * 0.45, 10);
  rr(g, 8, 6, w - 16, h - 22, 26);
  const l = g.createLinearGradient(0, 6, 0, h);
  l.addColorStop(0, '#3b4f86'); l.addColorStop(1, '#1b2548'); g.fillStyle = l; g.fill();
  g.lineWidth = 4; g.strokeStyle = '#8fb2ff'; g.stroke();
  gloss(g, 12, 9, w - 24, h - 28, 22);
}

function drawBackground(g, w, h) {
  let l = g.createLinearGradient(0, 0, 0, h);
  l.addColorStop(0, '#2a4f9e'); l.addColorStop(1, '#1b2a66'); g.fillStyle = l; g.fillRect(0, 0, w, h);
  const glow = g.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, w * 0.65);
  glow.addColorStop(0, 'rgba(120,200,255,.45)'); glow.addColorStop(1, 'rgba(120,200,255,0)');
  g.fillStyle = glow; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 50) for (let x = 0; x < w; x += 50) { // soft checker tiles
    if (((x + y) / 50) % 2 === 0) { g.fillStyle = 'rgba(255,255,255,.045)'; g.fillRect(x, y, 50, 50); }
  }
  g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 1;
  g.beginPath();
  for (let x = 0; x <= w; x += 50) { g.moveTo(x + .5, 0); g.lineTo(x + .5, h); }
  for (let y = 0; y <= h; y += 50) { g.moveTo(0, y + .5); g.lineTo(w, y + .5); }
  g.stroke();
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.72);
  v.addColorStop(0, 'rgba(5,10,40,0)'); v.addColorStop(1, 'rgba(5,10,40,.6)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}

function drawHudBar(g, w, h) {
  const l = g.createLinearGradient(0, 0, 0, h);
  l.addColorStop(0, '#5a3dd6'); l.addColorStop(1, '#2e1f86');
  rr(g, -20, -20, w + 40, h + 20, 22); g.fillStyle = l; g.fill();
  g.lineWidth = 3; g.strokeStyle = '#a99bff'; g.stroke();
  gloss(g, 0, 0, w, h - 4, 4);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, h - 3, w, 3);
}

function buildTextures(scene) {
  const c = COIN_DASH.colors;
  makeTex(scene, 'bg', COIN_DASH.width, COIN_DASH.height, drawBackground);
  makeTex(scene, 'hudbar', COIN_DASH.width, 44, drawHudBar);
  makeTex(scene, 'player', 44, 48, g => drawBlock(g, 26, 9, c.player, 'happy'));
  makeTex(scene, 'drone', 46, 50, g => drawBlock(g, 28, 9, c.drone, 'angry'));
  makeTex(scene, 'coinGold', 36, 36, g => drawCoin(g, 36, c.coin, '$'));
  makeTex(scene, 'coinSilver', 36, 36, g => drawCoin(g, 36, c.silver, 'star'));
  makeTex(scene, 'coinGreen', 36, 36, g => drawCoin(g, 36, c.green, 'star'));
  makeTex(scene, 'grandma', 66, 58, drawGrandma);
  makeTex(scene, 'panelS', 480, 130, drawPanel);
  makeTex(scene, 'panelL', 480, 210, drawPanel);
}
const TEXT_STYLE = { fontFamily: FONT, fontStyle: '800', color: '#ffffff', stroke: '#2a1a70', strokeThickness: 5 };

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
    buildTextures(this);
    this.add.image(c.width / 2, c.height / 2, 'bg');
    this.add.image(c.width / 2, 22, 'hudbar').setDepth(50);
    this.hud = this.add.text(18, 22, '', { ...TEXT_STYLE, fontSize: '19px', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(51);
    this.player = this.add.image(c.width / 2, c.height / 2, 'player').setDepth(10);
    this.physics.add.existing(this.player);
    this.player.body.setSize(24, 24).setOffset(10, 8);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.image(100, 100, 'coinGold');
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9, 9, 9);
    this.tweens.add({ targets: this.coin, scale: 1.12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.placeCoin();
    this.silver = this.add.image(0, 0, 'coinSilver');
    this.physics.add.existing(this.silver);
    this.silver.body.setCircle(9, 9, 9);
    this.tweens.add({ targets: this.silver, scale: 1.12, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.hideSilver();
    this.boostUntil = 0;
    this.nextSilverAt = this.time.now + this.silverDelay();
    this.green = this.add.image(0, 0, 'coinGreen');
    this.physics.add.existing(this.green);
    this.green.body.setCircle(9, 9, 9);
    this.tweens.add({ targets: this.green, scale: 1.12, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.hideGreen();
    this.droneBoostUntil = 0;
    this.dronesFast = false;
    this.nextGreenAt = this.time.now + this.greenDelay();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.image(90 + i * 270, 100, 'drone').setDepth(9);
      this.drones.add(drone);
      drone.body.setSize(26, 26).setOffset(10, 7);
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
      this.add.image(6, 3, 'grandma')
    ]).setSize(26, 40).setVisible(false).setDepth(11);
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
        this.add.image(c.width / 2, c.height / 2, 'panelS'),
        this.add.text(c.width / 2, c.height / 2 - 4, 'Paused\nPress P to resume',
          { ...TEXT_STYLE, fontSize: '26px', align: 'center', lineSpacing: 6 }).setOrigin(0.5)
      ]).setDepth(100);
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
    this.hud.setText(`Coins: ${this.score}   Best: ${this.highScore}   Lives: ${this.lives}   Time: ${seconds}s${boost}${droneBoost}`);
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
    this.add.image(c.width / 2, c.height / 2, 'panelL').setDepth(100);
    this.add.text(c.width / 2, c.height / 2 - 4,
      `${reason}\n${this.score} coins collected\n${best}\nPress R to try again`,
      { ...TEXT_STYLE, fontSize: '24px', align: 'center', lineSpacing: 6 }
    ).setOrigin(0.5).setDepth(101);
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
