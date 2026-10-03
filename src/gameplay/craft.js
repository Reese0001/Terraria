import { getAllRecipes } from '../data/recipes.js';
import { TILE } from '../data/tiles.js';

// 制作系统
export class CraftSystem {
  // 检测玩家附近是否有工作台/熔炉
  checkStations(world, player, radius = 3) {
    const cx = Math.floor(player.x + player.w / 2);
    const cy = Math.floor(player.y + player.h / 2);
    let nearWB = false, nearFurnace = false;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const t = world.getTile(cx + dx, cy + dy);
        if (t === TILE.WORKBENCH) nearWB = true;
        if (t === TILE.FURNACE) nearFurnace = true;
      }
    }
    return { nearWB, nearFurnace };
  }

  // 获取可制作配方列表
  getAvailableRecipes(inventory, nearWB, nearFurnace) {
    const all = getAllRecipes();
    const result = [];
    for (const r of all) {
      if (r.needWorkbench && !nearWB) continue;
      if (r.needFurnace && !nearFurnace) continue;
      const canCraft = r.inputs.every(inp => inventory.countItem(inp.itemId) >= inp.count);
      result.push({ recipe: r, canCraft });
    }
    return result;
  }

  // 执行制作
  craft(recipeId, inventory) {
    const all = getAllRecipes();
    const r = all.find(x => x.id === recipeId);
    if (!r) return false;

    // 二次校验材料
    for (const inp of r.inputs) {
      if (inventory.countItem(inp.itemId) < inp.count) return false;
    }
    // 扣除材料
    for (const inp of r.inputs) {
      inventory.removeItem(inp.itemId, inp.count);
    }
    // 添加产物
    const remaining = inventory.addItem(r.output.itemId, r.output.count);
    return { success: true, outputItemId: r.output.itemId, outputCount: r.output.count, dropped: remaining };
  }
}