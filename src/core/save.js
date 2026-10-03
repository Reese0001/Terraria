const SAVE_KEY = 'terraria_save';
const SAVE_VERSION = 1;
import { CHUNK_SIZE } from '../core/config.js';

// 存档系统
export const Save = {
  save(state) {
    try {
      const data = {
        version: SAVE_VERSION,
        seed: state.seed,
        player: {
          x: state.player.x,
          y: state.player.y,
          hp: state.player.hp,
          inventory: state.player.inventory.slots,
          selectedSlot: state.player.selectedSlot
        },
        dayNight: {
          phase: state.dayNight.phase,
          phaseProgress: state.dayNight.phaseProgress,
          day: state.dayNight.day,
          totalTime: state.dayNight.totalTime
        },
        chunkDeltas: this._collectChunkDeltas(state.world)
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('存档失败:', e);
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== SAVE_VERSION) {
        console.warn('存档版本不匹配');
        return null;
      }
      return data;
    } catch (e) {
      console.warn('读取存档失败:', e);
      return null;
    }
  },

  apply(state, data) {
    try {
      state.seed = data.seed;
      if (data.player) {
        state.player.x = data.player.x;
        state.player.y = data.player.y;
        state.player.hp = data.player.hp;
        if (data.player.inventory) {
          state.player.inventory.slots = data.player.inventory;
        }
        state.player.selectedSlot = data.player.selectedSlot || 0;
      }
      if (data.dayNight) {
        state.dayNight.phase = data.dayNight.phase;
        state.dayNight.phaseProgress = data.dayNight.phaseProgress;
        state.dayNight.day = data.dayNight.day;
        state.dayNight.totalTime = data.dayNight.totalTime || 0;
      }
      if (data.chunkDeltas) {
        this._applyChunkDeltas(state.world, data.chunkDeltas);
      }
      return true;
    } catch (e) {
      console.warn('应用存档失败:', e);
      return false;
    }
  },

  _collectChunkDeltas(world) {
    const deltas = [];
    for (const chunk of world.cm.chunks.values()) {
      if (chunk.modified) {
        deltas.push({
          cx: chunk.cx,
          cy: chunk.cy,
          tiles: Array.from(chunk.tiles)
        });
      }
    }
    return deltas;
  },

  _applyChunkDeltas(world, deltas) {
    for (const d of deltas) {
      const chunk = world.cm.getOrCreate(d.cx, d.cy);
      chunk.generated = true;
      for (let i = 0; i < d.tiles.length; i++) {
        chunk.tiles[i] = d.tiles[i];
      }
      chunk.modified = true;
    }
  },

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  clear() {
    localStorage.removeItem(SAVE_KEY);
  }
};