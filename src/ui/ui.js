import { TILE_SIZE, HOTBAR_SIZE, INVENTORY_SIZE, DAYNIGHT_PHASES } from '../core/config.js';
import { TILE, getTileDef } from '../data/tiles.js';
import { getItemDef } from '../data/items.js';
import { getTileTexture } from '../render/texture.js';

// UI系统
export class UI {
  constructor() {
    this.craftScroll = 0;
    this.hoverRecipe = -1;
  }

  // 绘制物品图标
  drawItemIcon(ctx, x, y, itemId, count) {
    const def = getItemDef(itemId);
    if (def.category === 'block' && def.tileId > 0) {
      const tex = getTileTexture(def.tileId);
      if (tex) {
        ctx.drawImage(tex, x, y, 20, 20);
      } else {
        ctx.fillStyle = getTileDef(def.tileId).color;
        ctx.fillRect(x, y, 20, 20);
      }
    } else {
      // 工具/材料用颜色方块+首字
      const colors = {
        100: '#A1887F', 103: '#9E9E9E', 106: '#D8B89C', 109: '#FFD700', 112: '#66E0FF',
        200: '#D8B89C', 201: '#FFD700', 202: '#9E9E9E', 203: '#FFD700', 204: '#8BC34A'
      };
      ctx.fillStyle = colors[itemId] || '#FFF';
      ctx.fillRect(x + 2, y + 2, 16, 16);
      ctx.fillStyle = '#000';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(def.name.charAt(0), x + 10, y + 14);
    }
    if (count > 1) {
      ctx.fillStyle = '#FFF';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(count, x + 19, y + 19);
      ctx.fillText(count, x + 19, y + 19);
    }
  }

  // HUD
  drawHUD(ctx, state) {
    const { player, dayNight, camera } = state;
    // 血量条 - 红心
    const hearts = Math.ceil(player.maxHp / 20);
    const hpFull = Math.ceil(player.hp / 20);
    for (let i = 0; i < hearts; i++) {
      const hx = 10 + i * 22, hy = 10;
      ctx.fillStyle = i < hpFull ? '#F44336' : '#424242';
      this.drawHeart(ctx, hx, hy, 9);
    }

    // 时间指示器
    const phase = dayNight.phase;
    const phaseIcons = { DAY: '☀', DUSK: '🌆', NIGHT: '🌙', DAWN: '🌅' };
    const phaseNames = { DAY: '白天', DUSK: '黄昏', NIGHT: '夜晚', DAWN: '黎明' };
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(camera.w - 130, 8, 120, 24);
    ctx.fillStyle = '#FFF';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(phaseNames[phase] + ' 第' + dayNight.day + '天', camera.w - 122, 25);

    // 快捷栏
    const slotSize = 40;
    const barW = HOTBAR_SIZE * slotSize;
    const barX = (camera.w - barW) / 2;
    const barY = camera.h - slotSize - 10;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const sx = barX + i * slotSize;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(sx, barY, slotSize, slotSize);
      ctx.strokeStyle = i === player.selectedSlot ? '#FFF' : '#666';
      ctx.lineWidth = i === player.selectedSlot ? 3 : 1;
      ctx.strokeRect(sx, barY, slotSize, slotSize);
      const slot = player.inventory.slots[i];
      if (slot) {
        this.drawItemIcon(ctx, sx + 10, barY + 10, slot.itemId, slot.count);
      }
      // 序号
      ctx.fillStyle = '#AAA';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText((i + 1), sx + 3, barY + 10);
    }
  }

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
    ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size * 0.8, x, y + size);
    ctx.bezierCurveTo(x, y + size * 0.8, x + size, y + size * 0.6, x + size, y + size * 0.3);
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
    ctx.fill();
  }

  // 背包/制作菜单
  drawInventoryMenu(ctx, state, craftSystem) {
    const { player, world, camera } = state;
    const w = camera.w, h = camera.h;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    // 左侧背包
    const invX = 40, invY = 60;
    const cols = 9, rows = 4;
    const slotSize = 36;
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('背包', invX, invY - 10);
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const sx = invX + col * slotSize, sy = invY + row * slotSize;
      ctx.fillStyle = 'rgba(60,60,60,0.9)';
      ctx.fillRect(sx, sy, slotSize - 2, slotSize - 2);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, slotSize - 2, slotSize - 2);
      const slot = player.inventory.slots[i];
      if (slot) this.drawItemIcon(ctx, sx + 8, sy + 8, slot.itemId, slot.count);
    }

    // 右侧制作
    const stations = craftSystem.checkStations(world, player);
    const recipes = craftSystem.getAvailableRecipes(player.inventory, stations.nearWB, stations.nearFurnace);
    const craftX = invX + cols * slotSize + 40;
    const craftY = 60;
    ctx.fillStyle = '#FFF';
    ctx.fillText('制作' + (stations.nearWB ? ' [工作台]' : '') + (stations.nearFurnace ? ' [熔炉]' : ''), craftX, craftY - 10);

    this._recipeRects = [];
    for (let i = 0; i < recipes.length; i++) {
      const r = recipes[i];
      const ry = craftY + i * 32;
      if (ry > h - 80) break;
      const rect = { x: craftX, y: ry, w: 280, h: 28, recipeId: r.recipe.id, canCraft: r.canCraft };
      this._recipeRects.push(rect);
      ctx.fillStyle = r.canCraft ? 'rgba(50,100,50,0.8)' : 'rgba(80,30,30,0.6)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = this.hoverRecipe === i ? '#FFF' : '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      // 配方名
      const outDef = getItemDef(r.recipe.output.itemId);
      ctx.fillStyle = r.canCraft ? '#FFF' : '#999';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(outDef.name + ' x' + r.recipe.output.count, rect.x + 8, rect.y + 18);
      // 材料
      const matStr = r.recipe.inputs.map(inp => {
        const d = getItemDef(inp.itemId);
        const have = player.inventory.countItem(inp.itemId);
        return d.name.charAt(0) + ':' + have + '/' + inp.count;
      }).join(' ');
      ctx.font = '9px monospace';
      ctx.fillText(matStr, rect.x + 120, rect.y + 18);
    }

    ctx.fillStyle = '#AAA';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('按 E 关闭', w / 2, h - 20);
  }

  // 开始菜单
  drawStartMenu(ctx, state) {
    const w = state.camera.w, h = state.camera.h;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('像素沙盒生存', w / 2, h * 0.2);
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    ctx.fillText('Terraria 风格 2D 侧视沙盒生存游戏', w / 2, h * 0.2 + 30);

    // 开始按钮
    const btnW = 200, btnH = 50;
    const btnX = (w - btnW) / 2, btnY = h * 0.4;
    this._startBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('开始游戏', w / 2, btnY + 32);

    // 操作说明
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    const helpX = w / 2 - 150;
    let hy = h * 0.55;
    const lines = [
      '操作说明:',
      'WASD / 方向键 - 移动',
      '空格 - 跳跃',
      '鼠标左键 - 挖掘方块',
      '鼠标右键 - 放置方块',
      'E - 打开背包/制作菜单',
      '数字键 1-9 - 选择快捷栏物品',
      '鼠标滚轮 - 切换选中物品',
      '',
      '提示: 砍树获取木头, 制作工作台,',
      '合成工具, 挖矿, 建造房屋,',
      '夜晚小心僵尸!'
    ];
    for (const line of lines) {
      ctx.fillText(line, helpX, hy);
      hy += 20;
    }
  }

  // 死亡画面
  drawDeathScreen(ctx, state) {
    const w = state.camera.w, h = state.camera.h;
    ctx.fillStyle = 'rgba(80,0,0,0.8)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#F44336';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('你死了', w / 2, h * 0.4);
    // 重生按钮
    const btnW = 200, btnH = 50;
    const btnX = (w - btnW) / 2, btnY = h * 0.5;
    this._respawnBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    ctx.fillStyle = '#F44336';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('重生', w / 2, btnY + 32);
  }

  // 处理UI点击, 返回动作
  handleClick(state, input, craftSystem) {
    if (input.uiClickX < 0) return null;
    const mx = input.uiClickX, my = input.uiClickY;

    // 开始菜单
    if (state.ui.showStartMenu && this._startBtn) {
      const b = this._startBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        return 'startGame';
      }
    }

    // 死亡画面
    if (state.ui.showDeathScreen && this._respawnBtn) {
      const b = this._respawnBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        return 'respawn';
      }
    }

    // 制作菜单
    if (state.ui.showInventory && this._recipeRects) {
      for (const r of this._recipeRects) {
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          if (r.canCraft) return { craft: r.recipeId };
          return null;
        }
      }
    }

    return null;
  }

  // 鼠标悬停在配方上
  updateHover(input) {
    this.hoverRecipe = -1;
    if (!this._recipeRects) return;
    for (let i = 0; i < this._recipeRects.length; i++) {
      const r = this._recipeRects[i];
      if (input.mouseX >= r.x && input.mouseX <= r.x + r.w &&
          input.mouseY >= r.y && input.mouseY <= r.y + r.h) {
        this.hoverRecipe = i;
        break;
      }
    }
  }
}