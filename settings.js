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
  // Lightning: strikes a random spot near the player after a warning ring; a hit ends the game.
  lightningMinSeconds: 3,
  lightningMaxSeconds: 6,
  lightningWarningSeconds: 0.8,
  lightningBoltSeconds: 0.25,
  lightningRadius: 28,
  lightningNearMin: 40,
  lightningNearMax: 110,
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, silver: 0xdfe6ee, green: 0x4cd964,
    grandma: 0xc77dff, lightning: 0xfff3a0 }
};
