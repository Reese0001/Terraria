import { TILE_SIZE } from '../core/config.js';

// 摄像机 - 平滑跟随玩家
export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;
    this.y = 0;
    this.w = canvasWidth;
    this.h = canvasHeight;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }

  follow(player) {
    const targetX = player.x * TILE_SIZE - this.w / 2 + player.w * TILE_SIZE / 2;
    const targetY = player.y * TILE_SIZE - this.h / 2 + player.h * TILE_SIZE / 2;
    this.x += (targetX - this.x) * 0.1;
    this.y += (targetY - this.y) * 0.1;
  }

  // 直接设置（初始化用）
  snapTo(player) {
    this.x = player.x * TILE_SIZE - this.w / 2 + player.w * TILE_SIZE / 2;
    this.y = player.y * TILE_SIZE - this.h / 2 + player.h * TILE_SIZE / 2;
  }

  getViewport() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  // 视口对应的格子范围
  getTileRange() {
    return {
      minX: Math.floor(this.x / TILE_SIZE),
      minY: Math.floor(this.y / TILE_SIZE),
      maxX: Math.floor((this.x + this.w) / TILE_SIZE),
      maxY: Math.floor((this.y + this.h) / TILE_SIZE)
    };
  }

  // 世界像素 -> 屏幕像素
  worldToScreen(wx, wy) {
    return { x: wx - this.x, y: wy - this.y };
  }
}