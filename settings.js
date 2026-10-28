// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
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
  colors: { background: 0x101c31, player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, silver: 0xdfe6ee, green: 0x4cd964 }
};
