import { CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../core/config.js';
import { TILE } from '../data/tiles.js';
import { fBm, valueNoise } from './noise.js';

const BASE_HEIGHT = Math.floor(WORLD_HEIGHT * 0.35);

// 地表高度
function surfaceHeight(x, seed) {
  const n = fBm(x * 0.02, 0, seed, 4);
  return Math.floor(BASE_HEIGHT + (n - 0.5) * 80);
}

// 矿石分布: 根据深度选择矿石
function pickOre(x, y, seed, depth) {
  const r = valueNoise(x * 0.1, y * 0.1, seed + 5000);
  // 越深越稀有矿石
  if (depth > WORLD_HEIGHT * 0.75) {
    // 最深层: 钻石矿
    if (r > 0.92) return TILE.DIAMOND_ORE;
    if (r > 0.85) return TILE.GOLD_ORE;
    if (r > 0.75) return TILE.IRON_ORE;
  } else if (depth > WORLD_HEIGHT * 0.6) {
    // 深层: 金矿
    if (r > 0.9) return TILE.GOLD_ORE;
    if (r > 0.78) return TILE.IRON_ORE;
    if (r > 0.68) return TILE.COPPER_ORE;
  } else if (depth > WORLD_HEIGHT * 0.45) {
    // 中层: 铁矿
    if (r > 0.88) return TILE.IRON_ORE;
    if (r > 0.75) return TILE.COPPER_ORE;
  } else if (depth > WORLD_HEIGHT * 0.38) {
    // 浅层: 铜矿
    if (r > 0.82) return TILE.COPPER_ORE;
  }
  return null;
}

// 生成单个区块
export function generateChunk(chunk, seed) {
  if (chunk.generated) return;
  const baseX = chunk.cx * CHUNK_SIZE;
  const baseY = chunk.cy * CHUNK_SIZE;

  for (let ly = 0; ly < CHUNK_SIZE; ly++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const wx = baseX + lx;
      const wy = baseY + ly;
      let tile = TILE.AIR;

      if (wx < 0 || wx >= WORLD_WIDTH || wy < 0 || wy >= WORLD_HEIGHT) {
        chunk.tiles[ly * CHUNK_SIZE + lx] = TILE.AIR;
        continue;
      }

      // 底部基岩
      if (wy >= WORLD_HEIGHT - 2) {
        tile = TILE.BEDROCK;
      } else {
        const surf = surfaceHeight(wx, seed);

        if (wy < surf) {
          // 地表以上为空气
          tile = TILE.AIR;
        } else if (wy === surf) {
          // 地表为草
          tile = TILE.GRASS;
        } else if (wy < surf + 4) {
          // 泥土层
          tile = TILE.DIRT;
        } else {
          // 石头层
          tile = TILE.STONE;
          // 矿石
          const depth = wy - surf;
          const ore = pickOre(wx, wy, seed, wy);
          if (ore !== null) tile = ore;

          // 洞穴雕刻: 地表下5格内不生成洞穴
          if (depth > 5 && wy < WORLD_HEIGHT - 3) {
            const caveNoise = fBm(wx * 0.05, wy * 0.05, seed + 1000, 4);
            const threshold = 0.62 - (depth / WORLD_HEIGHT) * 0.15;
            if (caveNoise > threshold) {
              tile = TILE.AIR;
            }
          }
        }
      }

      chunk.tiles[ly * CHUNK_SIZE + lx] = tile;
    }
  }

  // 树木生成 (仅地表区块)
  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    const wx = baseX + lx;
    if (wx < 2 || wx >= WORLD_WIDTH - 2) continue;
    const surf = surfaceHeight(wx, seed);
    // 树木随机: 用噪声决定
    const treeRand = valueNoise(wx * 0.7, 0, seed + 7777);
    if (treeRand > 0.93) {
      const treeHeight = 4 + Math.floor(valueNoise(wx * 1.3, 0, seed + 8888) * 3);
      for (let h = 1; h <= treeHeight; h++) {
        const ty = surf - h;
        const localTy = ty - baseY;
        if (localTy >= 0 && localTy < CHUNK_SIZE) {
          if (chunk.tiles[localTy * CHUNK_SIZE + lx] === TILE.AIR) {
            chunk.tiles[localTy * CHUNK_SIZE + lx] = TILE.WOOD;
          }
        }
      }
      // 树叶
      const leafTop = surf - treeHeight;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 1; dy++) {
          const ltx = wx + dx;
          const lty = leafTop + dy;
          const localLx = ltx - baseX;
          const localLy = lty - baseY;
          if (localLx >= 0 && localLx < CHUNK_SIZE && localLy >= 0 && localLy < CHUNK_SIZE) {
            if (chunk.tiles[localLy * CHUNK_SIZE + localLx] === TILE.AIR) {
              if (Math.abs(dx) + Math.abs(dy) <= 3) {
                chunk.tiles[localLy * CHUNK_SIZE + localLx] = TILE.LEAF;
              }
            }
          }
        }
      }
    }
  }

  chunk.generated = true;
  chunk.dirty = true;
}

export { surfaceHeight };