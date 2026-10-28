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
  // Silver coin: appears after a random delay; eating it speeds the player up for a while.
  silverMinSeconds: 5,
  silverMaxSeconds: 12,
  boostFactor: 1.5,
  boostSeconds: 5,
  // Green coin: appears after a random delay; eating it makes the drones faster for a while.
  greenMinSeconds: 8,
  greenMaxSeconds: 16,
  droneBoostFactor: 2,
  droneBoostSeconds: 5,
  colors: { background: 0xf4f1ea, player: 0x4f5bff, coin: 0xffc83d, drone: 0xff7a7a, silver: 0xd5dbe3, green: 0x3ccf91,
    grandma: 0xb59cff }
};
