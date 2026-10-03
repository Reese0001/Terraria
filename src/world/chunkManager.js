import { CHUNK_SIZE } from '../core/config.js';

// 区块数据结构
export class Chunk {
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;
    this.tiles = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    this.generated = false;
    this.dirty = false;
    this.modified = false; // 玩家修改过，卸载时保留
  }

  getLocal(lx, ly) {
    return this.tiles[ly * CHUNK_SIZE + lx];
  }

  setLocal(lx, ly, id) {
    this.tiles[ly * CHUNK_SIZE + lx] = id;
    this.dirty = true;
    this.modified = true;
  }
}

// 区块管理器
export class ChunkManager {
  constructor() {
    this.chunks = new Map();
  }

  key(cx, cy) {
    return cx + ',' + cy;
  }

  getChunk(cx, cy) {
    return this.chunks.get(this.key(cx, cy));
  }

  getOrCreate(cx, cy) {
    const k = this.key(cx, cy);
    let c = this.chunks.get(k);
    if (!c) {
      c = new Chunk(cx, cy);
      this.chunks.set(k, c);
    }
    return c;
  }

  has(cx, cy) {
    return this.chunks.has(this.key(cx, cy));
  }

  // 卸载远离视口的区块（修改过的保留）
  unloadFarChunks(viewCenterX, viewCenterY, radius) {
    const minCx = Math.floor((viewCenterX - radius) / CHUNK_SIZE);
    const maxCx = Math.floor((viewCenterX + radius) / CHUNK_SIZE);
    const minCy = Math.floor((viewCenterY - radius) / CHUNK_SIZE);
    const maxCy = Math.floor((viewCenterY + radius) / CHUNK_SIZE);
    const toDelete = [];
    for (const [k, chunk] of this.chunks) {
      if (chunk.cx < minCx || chunk.cx > maxCx || chunk.cy < minCy || chunk.cy > maxCy) {
        if (!chunk.modified) {
          toDelete.push(k);
        }
      }
    }
    toDelete.forEach(k => this.chunks.delete(k));
  }
}