// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  coinBonusSeconds: 1,
  lives: 3,
  invulnerableSeconds: 1.5,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  highScoreKey: 'coinDash.highScore',
  grandmaSpeed: 520,
  grandmaDelayMin: 2000,
  grandmaDelayMax: 5000,
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, grandma: 0xc77dff }
};
