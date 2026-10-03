import { MAX_PARTICLES, TILE_SIZE } from '../core/config.js';

// 粒子系统 - 对象池
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, vx, vy, color, life, size = 2) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({ x, y, vx, vy, life, maxLife: life, color, size });
  }

  // 挖掘碎屑
  emitMine(x, y, color) {
    for (let i = 0; i < 6; i++) {
      this.emit(
        x + 0.5, y + 0.5,
        (Math.random() - 0.5) * 4,
        -Math.random() * 3 - 1,
        color, 0.5 + Math.random() * 0.3, 2
      );
    }
  }

  // 攻击命中
  emitHit(x, y) {
    for (let i = 0; i < 8; i++) {
      this.emit(
        x, y,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5 - 1,
        '#FF5722', 0.3 + Math.random() * 0.2, 2
      );
    }
  }

  // 僵尸死亡
  emitDeath(x, y) {
    for (let i = 0; i < 12; i++) {
      this.emit(
        x, y,
        (Math.random() - 0.5) * 6,
        -Math.random() * 4 - 1,
        '#8BC34A', 0.6 + Math.random() * 0.4, 3
      );
    }
  }

  // 燃烧
  emitBurn(x, y) {
    this.emit(
      x + (Math.random() - 0.5) * 0.5, y,
      (Math.random() - 0.5) * 1,
      -Math.random() * 2 - 1,
      '#FF6B35', 0.4, 2
    );
  }

  // 放置方块
  emitPlace(x, y, color) {
    for (let i = 0; i < 4; i++) {
      this.emit(
        x + 0.5, y + 0.5,
        (Math.random() - 0.5) * 2,
        -Math.random() * 2,
        color, 0.3, 2
      );
    }
  }

  update(dt) {
    const dts = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dts;
      p.y += p.vy * dts;
      p.vy += 8 * dts; // 粒子重力
      p.life -= dts;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    for (const p of this.particles) {
      const sx = p.x * TILE_SIZE - camera.x;
      const sy = p.y * TILE_SIZE - camera.y;
      if (sx < -10 || sx > camera.w + 10 || sy < -10 || sy > camera.h + 10) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(sx, sy, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}