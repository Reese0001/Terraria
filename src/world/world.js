import { CHUNK_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../core/config.js';
import { ChunkManager } from './chunkManager.js';
import { TILE, isSolidTile } from '../data/tiles.js';
import { generateChunk } from './terrainGen.js';

// 世界管理 - 方块读写接口
export class World {
  constructor(seed) {
    this.seed = seed;
    this.cm = new ChunkManager();
  }

  inBounds(x, y) {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  }

  getTile(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (!this.inBounds(x, y)) return TILE.AIR;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const chunk = this.cm.getChunk(cx, cy);
    if (!chunk || !chunk.generated) return TILE.AIR;
    const lx = x - cx * CHUNK_SIZE;
    const ly = y - cy * CHUNK_SIZE;
    return chunk.getLocal(lx, ly);
  }

  setTile(x, y, id) {
    x = Math.floor(x); y = Math.floor(y);
    if (!this.inBounds(x, y)) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const chunk = this.cm.getOrCreate(cx, cy);
    if (!chunk.generated) generateChunk(chunk, this.seed);
    const lx = x - cx * CHUNK_SIZE;
    const ly = y - cy * CHUNK_SIZE;
    chunk.setLocal(lx, ly, id);
  }

  isSolid(x, y) {
    return isSolidTile(this.getTile(x, y));
  }

  // 确保区块已生成
  ensureGenerated(x, y) {
    if (!this.inBounds(x, y)) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    const chunk = this.cm.getOrCreate(cx, cy);
    if (!chunk.generated) generateChunk(chunk, this.seed);
  }

  // 加载出生点附近初始区块
  loadInitialChunks(centerX, centerY) {
    const range = 3;
    const ccx = Math.floor(centerX / CHUNK_SIZE);
    const ccy = Math.floor(centerY / CHUNK_SIZE);
    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const chunk = this.cm.getOrCreate(ccx + dx, ccy + dy);
        if (!chunk.generated) generateChunk(chunk, this.seed);
      }
    }
  }

  // 根据视口更新区块
  updateChunks(viewport) {
    const pad = CHUNK_SIZE * 2;
    const minCx = Math.floor((viewport.x - pad) / CHUNK_SIZE);
    const maxCx = Math.floor((viewport.x + viewport.w + pad) / CHUNK_SIZE);
    const minCy = Math.floor((viewport.y - pad) / CHUNK_SIZE);
    const maxCy = Math.floor((viewport.y + viewport.h + pad) / CHUNK_SIZE);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.cm.getOrCreate(cx, cy);
        if (!chunk.generated) generateChunk(chunk, this.seed);
      }
    }
    // 卸载远离视口区块
    this.cm.unloadFarChunks(
      viewport.x + viewport.w / 2,
      viewport.y + viewport.h / 2,
      Math.max(viewport.w, viewport.h) + pad
    );
  }
}