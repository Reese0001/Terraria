import { TILE_SIZE } from '../core/config.js';
import { TILE } from '../data/tiles.js';

const SIZE = TILE_SIZE;
const cache = new Map();

function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function noiseDots(ctx, color, count, seed) {
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280 * SIZE) | 0;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280 * SIZE) | 0;
    px(ctx, x, y, color);
  }
}

function makeTileTexture(id) {
  const c = createCanvas(SIZE, SIZE);
  const ctx = c.getContext('2d');
  switch (id) {
    case TILE.GRASS:
      fill(ctx, '#4CAF50');
      ctx.fillStyle = '#66BB6A'; ctx.fillRect(0, 0, SIZE, 3);
      noiseDots(ctx, '#388E3C', 12, id);
      noiseDots(ctx, '#81C784', 8, id + 1);
      break;
    case TILE.DIRT:
      fill(ctx, '#8B5A2B');
      noiseDots(ctx, '#6D4C2A', 16, id);
      noiseDots(ctx, '#A57A4A', 8, id + 1);
      break;
    case TILE.STONE:
      fill(ctx, '#9E9E9E');
      noiseDots(ctx, '#757575', 14, id);
      noiseDots(ctx, '#BDBDBD', 8, id + 1);
      px(ctx, 3, 5, '#757575'); px(ctx, 4, 5, '#757575'); px(ctx, 4, 6, '#757575');
      px(ctx, 10, 10, '#757575'); px(ctx, 11, 10, '#757575');
      break;
    case TILE.WOOD:
      fill(ctx, '#A1887F');
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(0, 0, SIZE, 1); ctx.fillRect(0, SIZE-1, SIZE, 1);
      px(ctx, 8, 8, '#6D4C41'); px(ctx, 7, 9, '#6D4C41'); px(ctx, 9, 7, '#6D4C41');
      noiseDots(ctx, '#BCAAA4', 6, id);
      break;
    case TILE.PLANK:
      fill(ctx, '#D7B899');
      ctx.fillStyle = '#BC9B7A';
      ctx.fillRect(0, 5, SIZE, 1); ctx.fillRect(0, 10, SIZE, 1);
      noiseDots(ctx, '#C9A57B', 8, id);
      break;
    case TILE.COPPER_ORE:
      fill(ctx, '#9E9E9E');
      noiseDots(ctx, '#757575', 10, id);
      px(ctx, 4, 4, '#E08A4B'); px(ctx, 5, 4, '#D17A3B'); px(ctx, 4, 5, '#D17A3B');
      px(ctx, 10, 8, '#E08A4B'); px(ctx, 11, 9, '#D17A3B');
      px(ctx, 7, 12, '#E08A4B'); px(ctx, 8, 11, '#D17A3B');
      break;
    case TILE.IRON_ORE:
      fill(ctx, '#9E9E9E');
      noiseDots(ctx, '#757575', 10, id);
      px(ctx, 4, 4, '#D8B89C'); px(ctx, 5, 4, '#C9A88C'); px(ctx, 4, 5, '#C9A88C');
      px(ctx, 10, 8, '#D8B89C'); px(ctx, 11, 9, '#C9A88C');
      px(ctx, 7, 12, '#D8B89C');
      break;
    case TILE.GOLD_ORE:
      fill(ctx, '#9E9E9E');
      noiseDots(ctx, '#757575', 10, id);
      px(ctx, 4, 4, '#FFD700'); px(ctx, 5, 4, '#FFC107'); px(ctx, 4, 5, '#FFC107');
      px(ctx, 10, 8, '#FFD700'); px(ctx, 11, 9, '#FFC107');
      px(ctx, 7, 12, '#FFD700');
      break;
    case TILE.DIAMOND_ORE:
      fill(ctx, '#9E9E9E');
      noiseDots(ctx, '#757575', 10, id);
      px(ctx, 4, 4, '#66E0FF'); px(ctx, 5, 4, '#4DD0E1'); px(ctx, 4, 5, '#4DD0E1');
      px(ctx, 10, 8, '#66E0FF'); px(ctx, 11, 9, '#4DD0E1');
      px(ctx, 7, 12, '#66E0FF');
      break;
    case TILE.WORKBENCH:
      fill(ctx, '#8D6E63');
      ctx.fillStyle = '#D7B899'; ctx.fillRect(0, 0, SIZE, 4);
      ctx.fillStyle = '#6D4C41'; ctx.fillRect(0, 4, SIZE, 1);
      ctx.fillStyle = '#A1887F'; ctx.fillRect(1, 5, 6, 10); ctx.fillRect(9, 5, 6, 10);
      px(ctx, 3, 8, '#5D4037'); px(ctx, 11, 8, '#5D4037');
      break;
    case TILE.TORCH:
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#FFB347'; ctx.fillRect(7, 2, 2, 3);
      ctx.fillStyle = '#FF6B35'; ctx.fillRect(7, 1, 2, 2);
      ctx.fillStyle = '#8D6E63'; ctx.fillRect(7, 5, 2, 11);
      break;
    case TILE.DOOR:
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#A1887F'; ctx.fillRect(3, 0, 10, SIZE);
      ctx.fillStyle = '#8D6E63'; ctx.fillRect(3, 0, 1, SIZE); ctx.fillRect(12, 0, 1, SIZE);
      ctx.fillStyle = '#6D4C41'; ctx.fillRect(7, 4, 2, 2);
      break;
    case TILE.FURNACE:
      fill(ctx, '#616161');
      ctx.fillStyle = '#424242'; ctx.fillRect(0, 0, SIZE, 2);
      ctx.fillStyle = '#FF6B35'; ctx.fillRect(5, 8, 6, 4);
      ctx.fillStyle = '#757575'; ctx.fillRect(4, 7, 8, 1);
      break;
    case TILE.BEDROCK:
      fill(ctx, '#2A2A2A');
      noiseDots(ctx, '#1A1A1A', 20, id);
      noiseDots(ctx, '#3A3A3A', 10, id + 1);
      break;
    case TILE.LEAF:
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#66BB6A';
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        if (((x * 7 + y * 13) % 5) !== 0) ctx.fillRect(x, y, 1, 1);
      }
      noiseDots(ctx, '#4CAF50', 10, id);
      break;
    default:
      fill(ctx, '#FF00FF');
  }
  return c;
}

// 玩家精灵 16x24
function makePlayerTexture(facing) {
  const w = SIZE, h = 24;
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');
  const skin = '#FFCC80', shirt = '#1976D2', pants = '#424242', hair = '#5D4037', shoe = '#3E2723';
  // 头
  ctx.fillStyle = skin; ctx.fillRect(5, 2, 6, 6);
  ctx.fillStyle = hair; ctx.fillRect(5, 1, 6, 2);
  // 眼睛
  if (facing > 0) { px(ctx, 8, 5, '#000'); px(ctx, 10, 5, '#000'); }
  else { px(ctx, 5, 5, '#000'); px(ctx, 7, 5, '#000'); }
  // 身体
  ctx.fillStyle = shirt; ctx.fillRect(4, 8, 8, 8);
  // 手臂
  ctx.fillStyle = skin; ctx.fillRect(3, 9, 1, 6); ctx.fillRect(12, 9, 1, 6);
  // 腿
  ctx.fillStyle = pants; ctx.fillRect(5, 16, 2, 5); ctx.fillRect(9, 16, 2, 5);
  // 鞋
  ctx.fillStyle = shoe; ctx.fillRect(5, 21, 3, 1); ctx.fillRect(9, 21, 3, 1);
  return c;
}

// 僵尸精灵 16x24
function makeZombieTexture() {
  const w = SIZE, h = 24;
  const c = createCanvas(w, h);
  const ctx = c.getContext('2d');
  const skin = '#8BC34A', shirt = '#37474F', pants = '#1B5E20';
  ctx.fillStyle = skin; ctx.fillRect(5, 2, 6, 6);
  px(ctx, 6, 5, '#000'); px(ctx, 9, 5, '#000');
  ctx.fillStyle = shirt; ctx.fillRect(4, 8, 8, 8);
  ctx.fillStyle = skin; ctx.fillRect(3, 9, 1, 6); ctx.fillRect(12, 9, 1, 6);
  ctx.fillStyle = pants; ctx.fillRect(5, 16, 2, 5); ctx.fillRect(9, 16, 2, 5);
  ctx.fillStyle = '#33691E'; ctx.fillRect(5, 21, 3, 1); ctx.fillRect(9, 21, 3, 1);
  return c;
}

// 挖掘裂纹 4级
function makeCrackTexture(level) {
  const c = createCanvas(SIZE, SIZE);
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  if (level >= 1) {
    ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(8, 8); ctx.stroke();
  }
  if (level >= 2) {
    ctx.beginPath(); ctx.moveTo(13, 3); ctx.lineTo(6, 10); ctx.lineTo(10, 14); ctx.stroke();
  }
  if (level >= 3) {
    ctx.beginPath(); ctx.moveTo(3, 13); ctx.lineTo(8, 8); ctx.moveTo(10, 14); ctx.lineTo(14, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(11, 11); ctx.stroke();
  }
  return c;
}

let initialized = false;

export function initTextures() {
  if (initialized) return;
  for (let id = 1; id <= 15; id++) {
    cache.set('tile_' + id, makeTileTexture(id));
  }
  cache.set('player_r', makePlayerTexture(1));
  cache.set('player_l', makePlayerTexture(-1));
  cache.set('zombie', makeZombieTexture());
  for (let lv = 1; lv <= 3; lv++) {
    cache.set('crack_' + lv, makeCrackTexture(lv));
  }
  initialized = true;
}

export function getTexture(name) {
  return cache.get(name) || null;
}

export function getTileTexture(id) {
  return cache.get('tile_' + id);
}