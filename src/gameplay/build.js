import { TILE, getTileDef } from '../data/tiles.js';
import { SAFEHOUSE_FILL_LIMIT } from '../core/config.js';

// 建造系统 - 安全屋判定与光源管理
export class BuildSystem {
  // 洪水填充检测封闭空间
  checkSafeHouse(world, seedX, seedY) {
    if (world.isSolid(seedX, seedY)) return false;
    const visited = new Set();
    const queue = [[seedX, seedY]];
    let hasDoor = false;
    let hasLight = false;
    let count = 0;

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = x + ',' + y;
      if (visited.has(key)) continue;
      visited.add(key);
      count++;

      if (count > SAFEHOUSE_FILL_LIMIT) return false; // 超限非封闭

      const tile = world.getTile(x, y);
      if (tile === TILE.DOOR) hasDoor = true;
      if (tile === TILE.TORCH) hasLight = true;

      // 向四个方向扩展
      const neighbors = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
      for (const [nx, ny] of neighbors) {
        const nkey = nx + ',' + ny;
        if (visited.has(nkey)) continue;
        const nt = world.getTile(nx, ny);
        // 非实心方块可穿过 (空气、火把、门)
        if (!getTileDef(nt).solid) {
          queue.push([nx, ny]);
        }
      }
    }

    return count <= SAFEHOUSE_FILL_LIMIT && hasDoor && hasLight && count > 4;
  }

  // 放置方块后处理 (火把注册光源等)
  onPlace(lights, x, y, tileId) {
    if (tileId === TILE.TORCH) {
      lights.register(x, y, 5, 1.0);
    }
  }

  // 移除方块后处理
  onRemove(lights, x, y, tileId) {
    if (tileId === TILE.TORCH) {
      lights.unregister(x, y);
    }
  }

  // 扫描世界中已有的火把并注册光源 (加载区块时)
  scanLights(world, lights, range) {
    for (let y = range.minY; y <= range.maxY; y++) {
      for (let x = range.minX; x <= range.maxX; x++) {
        if (world.getTile(x, y) === TILE.TORCH) {
          lights.register(x, y, 5, 1.0);
        }
      }
    }
  }
}