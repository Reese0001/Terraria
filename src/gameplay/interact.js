import { REACH_DISTANCE, TILE_SIZE } from '../core/config.js';
import { TILE, getTileDef, isBreakableTile } from '../data/tiles.js';
import { getItemDef, isToolItem } from '../data/items.js';

// 交互系统 - 挖掘与放置
export class Interact {
  constructor() {
    this.miningTarget = null; // { x, y, progress, tileId }
  }

  // 获取鼠标指向的格子坐标
  getTargetTile(input, camera) {
    const wx = Math.floor((input.mouseX + camera.x) / TILE_SIZE);
    const wy = Math.floor((input.mouseY + camera.y) / TILE_SIZE);
    return { x: wx, y: wy };
  }

  // 距离判定
  inReach(player, tx, ty) {
    const dx = tx - (player.x + player.w / 2);
    const dy = ty - (player.y + player.h / 2);
    return Math.sqrt(dx * dx + dy * dy) <= REACH_DISTANCE;
  }

  // 获取手持镐子等级和挖掘效率
  getMineAbility(player) {
    const toolId = player.getEquippedTool();
    const def = getItemDef(toolId);
    if (def.toolType === 'pickaxe') {
      return { tier: def.toolTier, eff: def.mineEff };
    }
    // 空手
    return { tier: 0, eff: 1 };
  }

  // 挖掘更新 (每帧调用)
  update(dt, world, player, input, camera, onMineComplete) {
    if (!input.mouseLeft) {
      this.miningTarget = null;
      return null;
    }

    const target = this.getTargetTile(input, camera);
    if (!this.inReach(player, target.x, target.y)) {
      this.miningTarget = null;
      return null;
    }

    const tileId = world.getTile(target.x, target.y);
    if (tileId === TILE.AIR || !isBreakableTile(tileId)) {
      this.miningTarget = null;
      return null;
    }

    const def = getTileDef(tileId);
    const ability = this.getMineAbility(player);

    // 镐子等级校验
    if (def.minTier > ability.tier) {
      this.miningTarget = null;
      return null;
    }

    // 初始化或切换目标
    if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
      this.miningTarget = { x: target.x, y: target.y, progress: 0, tileId };
    }

    // 累计进度
    this.miningTarget.progress += (dt / 1000) * ability.eff / def.hardness * 1.5;

    if (this.miningTarget.progress >= 1.0) {
      // 挖掘完成
      const dropId = def.dropId;
      const minedTileId = tileId;
      world.setTile(target.x, target.y, TILE.AIR);
      this.miningTarget = null;
      if (onMineComplete) onMineComplete(target.x, target.y, dropId, def.color, minedTileId);
      return { mined: true, x: target.x, y: target.y, dropId, color: def.color };
    }

    return { mining: true, x: target.x, y: target.y, progress: this.miningTarget.progress };
  }

  // 放置方块 (右键按下时调用)
  tryPlace(world, player, input, camera, onPlace) {
    const target = this.getTargetTile(input, camera);
    if (!this.inReach(player, target.x, target.y)) return false;

    const slot = player.inventory.getSelected();
    if (!slot) return false;

    const def = getItemDef(slot.itemId);
    if (def.category !== 'block' || def.placeTile === 0) return false;

    // 目标格必须为空气
    if (world.getTile(target.x, target.y) !== TILE.AIR) return false;

    // 不能与玩家AABB重叠
    if (this.overlapsPlayer(target.x, target.y, player)) return false;

    // 放置
    world.setTile(target.x, target.y, def.placeTile);
    player.inventory.removeItem(slot.itemId, 1);
    if (onPlace) onPlace(target.x, target.y, def.placeTile);
    return true;
  }

  overlapsPlayer(tx, ty, player) {
    return tx + 1 > player.x && tx < player.x + player.w &&
           ty + 1 > player.y && ty < player.y + player.h;
  }

  getMiningTarget() {
    return this.miningTarget;
  }

  resetMining() {
    this.miningTarget = null;
  }
}