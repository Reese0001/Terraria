// 全局配置常量 - 单一来源，无魔法数字
export const TILE_SIZE = 16;
export const CHUNK_SIZE = 16;

export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 500;

export const GRAVITY = 0.04;
export const JUMP_VELOCITY = -0.55;
export const MAX_FALL_SPEED = 1.5;
export const PLAYER_SPEED = 0.15;
export const PLAYER_FRICTION = 0.85;
export const REACH_DISTANCE = 5;

export const DAY_LENGTH_MS = 720000; // 12分钟一个昼夜

export const MAX_ENEMIES = 30;
export const INVENTORY_SIZE = 36;
export const HOTBAR_SIZE = 9;
export const STACK_LIMIT = 99;

export const FIXED_DT = 1000 / 60;
export const MAX_STEPS_PER_FRAME = 5;

export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const ENEMY_WIDTH = 0.8;
export const ENEMY_HEIGHT = 1.8;

export const MAX_PARTICLES = 500;
export const SAFEHOUSE_FILL_LIMIT = 200;

export const DAYNIGHT_PHASES = {
  DAY: 'DAY',
  DUSK: 'DUSK',
  NIGHT: 'NIGHT',
  DAWN: 'DAWN'
};

export const PHASE_RATIOS = { DAY: 0.4, DUSK: 0.1, NIGHT: 0.4, DAWN: 0.1 };

export const SKY_COLORS = {
  DAY:   { r: 0x87, g: 0xCE, b: 0xEB },
  DUSK:  { r: 0xFF, g: 0x8C, b: 0x42 },
  NIGHT: { r: 0x0B, g: 0x10, b: 0x26 },
  DAWN:  { r: 0xC9, g: 0x7B, b: 0x9B }
};

export const DEBUG = false;

export function clamp(v, min, max) {
  return v < min ? min : (v > max ? max : v);
}