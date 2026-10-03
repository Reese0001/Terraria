import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, SKY_COLORS, DAYNIGHT_PHASES } from '../core/config.js';
import { TILE, getTileDef } from '../data/tiles.js';
import { getTileTexture, getTexture } from './texture.js';
import { getItemDef } from '../data/items.js';

// 颜色插值
function lerpColor(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}

function rgbStr(c) {
  return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
}

// 天空层
export function drawSky(ctx, camera, dayNight) {
  const w = camera.w, h = camera.h;
  const sky = dayNight.getSkyColor();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, rgbStr({ r: Math.min(sky.r + 20, 255), g: Math.min(sky.g + 20, 255), b: Math.min(sky.b + 20, 255) }));
  grad.addColorStop(1, rgbStr(sky));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 太阳/月亮
  const phase = dayNight.phase;
  const progress = dayNight.phaseProgress;
  const cycleT = dayNight.getCycleT(); // 0-1 整个昼夜
  if (phase === DAYNIGHT_PHASES.DAY || phase === DAYNIGHT_PHASES.DUSK) {
    // 太阳: 从左到右弧线
    const t = phase === DAYNIGHT_PHASES.DAY ? progress : 1;
    const sx = w * t;
    const sy = h * 0.2 - Math.sin(t * Math.PI) * h * 0.15;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
  } else {
    // 月亮
    const t = phase === DAYNIGHT_PHASES.NIGHT ? progress : 1;
    const mx = w * t;
    const my = h * 0.2 - Math.sin(t * Math.PI) * h * 0.15;
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
    // 星星
    if (phase === DAYNIGHT_PHASES.NIGHT) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + progress * 0.5) + ')';
      for (let i = 0; i < 60; i++) {
        const stx = ((i * 137.5) % w);
        const sty = ((i * 73.3) % (h * 0.5));
        const size = (i % 3 === 0) ? 2 : 1;
        ctx.fillRect(stx, sty, size, size);
      }
    }
  }

  // 远景山脉视差
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  const parallax = camera.x * 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) {
    const wx = x + parallax;
    const y = h * 0.6 + Math.sin(wx * 0.005) * 30 + Math.sin(wx * 0.013) * 20;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

// 地形层
export function drawTerrain(ctx, world, camera, miningTarget) {
  const range = camera.getTileRange();
  for (let gy = range.minY; gy <= range.maxY; gy++) {
    for (let gx = range.minX; gx <= range.maxX; gx++) {
      const tile = world.getTile(gx, gy);
      if (tile === TILE.AIR) continue;
      const tex = getTileTexture(tile);
      const sx = Math.floor(gx * TILE_SIZE - camera.x);
      const sy = Math.floor(gy * TILE_SIZE - camera.y);
      if (tex) {
        ctx.drawImage(tex, sx, sy);
      } else {
        ctx.fillStyle = getTileDef(tile).color;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
      }
      // 挖掘裂纹
      if (miningTarget && miningTarget.x === gx && miningTarget.y === gy && miningTarget.progress > 0) {
        const level = miningTarget.progress < 0.33 ? 1 : (miningTarget.progress < 0.66 ? 2 : 3);
        const crack = getTexture('crack_' + level);
        if (crack) ctx.drawImage(crack, sx, sy);
      }
    }
  }
}

// 实体层
export function drawEntities(ctx, state, camera) {
  const { player, enemies, drops } = state;
  // 掉落物
  for (const d of drops) {
    const sx = Math.floor(d.x * TILE_SIZE - camera.x);
    const sy = Math.floor(d.y * TILE_SIZE - camera.y + Math.sin(d.bob) * 2);
    const def = getItemDef(d.itemId);
    ctx.fillStyle = def.tileId ? getTileDef(def.tileId).color : '#FFD700';
    ctx.fillRect(sx + 4, sy + 4, 8, 8);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 4, sy + 4, 8, 8);
  }

  // 僵尸
  const zTex = getTexture('zombie');
  for (const e of enemies) {
    const sx = Math.floor(e.x * TILE_SIZE - camera.x);
    const sy = Math.floor(e.y * TILE_SIZE - camera.y);
    if (zTex) {
      if (e.facing < 0) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(zTex, -sx - TILE_SIZE, sy);
        ctx.restore();
      } else {
        ctx.drawImage(zTex, sx, sy);
      }
    }
    // 血量条
    if (e.hp < e.maxHp) {
      const bw = 14;
      ctx.fillStyle = '#000'; ctx.fillRect(sx + 1, sy - 4, bw, 3);
      ctx.fillStyle = '#F44336'; ctx.fillRect(sx + 1, sy - 4, bw * (e.hp / e.maxHp), 3);
    }
    // 燃烧特效
    if (e.aiState === 'BURNING') {
      ctx.fillStyle = 'rgba(255,100,0,0.5)';
      ctx.fillRect(sx + 4, sy - 2, 8, 4);
    }
  }

  // 玩家
  const pTex = getTexture(player.facing > 0 ? 'player_r' : 'player_l');
  if (pTex) {
    const sx = Math.floor(player.x * TILE_SIZE - camera.x);
    const sy = Math.floor(player.y * TILE_SIZE - camera.y);
    ctx.drawImage(pTex, sx, sy);
    // 受伤闪烁
    if (player.hurtFlash > 0) {
      ctx.fillStyle = 'rgba(255,0,0,' + (player.hurtFlash * 0.5) + ')';
      ctx.fillRect(sx, sy, TILE_SIZE, 24);
    }
    // 手持工具显示
    const toolId = player.getEquippedTool();
    if (toolId > 0) {
      const def = getItemDef(toolId);
      if (def.category === 'tool') {
        const tx = player.facing > 0 ? sx + 12 : sx - 4;
        const ty = sy + 10;
        const colors = { 1: '#A1887F', 2: '#9E9E9E', 3: '#D8B89C', 4: '#FFD700', 5: '#66E0FF' };
        ctx.fillStyle = colors[def.toolTier] || '#FFF';
        ctx.fillRect(tx, ty, 4, 6);
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(tx + 1, ty + 6, 2, 4);
      }
    }
  }
}

// 交互光标
export function drawCursor(ctx, camera, input, player, miningTarget) {
  if (!input || !input.mouseInGame) return;
  const wx = Math.floor((input.mouseX + camera.x) / TILE_SIZE);
  const wy = Math.floor((input.mouseY + camera.y) / TILE_SIZE);
  const sx = Math.floor(wx * TILE_SIZE - camera.x);
  const sy = Math.floor(wy * TILE_SIZE - camera.y);
  // 距离判定颜色
  const dx = wx - (player.x + player.w / 2);
  const dy = wy - (player.y + player.h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  ctx.strokeStyle = dist <= 5 ? 'rgba(255,255,255,0.8)' : 'rgba(255,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
}