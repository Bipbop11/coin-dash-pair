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
  // Bushes block the player and drones (grandma runs straight through); placed randomly each round.
  bushCount: 5,
  bushRadius: 26,
  bushStartClearance: 80,
  // Wizard: shows up every few seconds and casts a random spell (big, small or shield) on the player.
  wizardEverySeconds: 10,
  wizardShowSeconds: 1.5,
  wizardEffectSeconds: 10,
  wizardBigScale: 1.6,
  wizardSmallScale: 0.6,
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, silver: 0xdfe6ee,
    green: 0x4cd964, grandma: 0xc77dff, bush: 0x2f8f46, bushLight: 0x43b05c, trunk: 0x6b4a2b, wizard: 0x5b5fef,
    spell: 0xf7f06d, shield: 0xffffff }
};
