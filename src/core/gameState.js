import { INVENTORY_SIZE, HOTBAR_SIZE } from '../core/config.js';

// 全局游戏状态容器
export function createInitialState() {
  return {
    world: null,
    player: null,
    enemies: [],
    drops: [],
    particles: [],
    lights: [],
    dayNight: null,
    camera: null,
    input: null,
    inventory: null,
    ui: {
      showInventory: false,
      showStartMenu: true,
      showDeathScreen: false,
      mouseX: 0,
      mouseY: 0
    },
    running: false,
    canvas: null,
    ctx: null,
    seed: 12345,
    day: 1
  };
}