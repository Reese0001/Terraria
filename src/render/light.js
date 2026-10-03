import { TILE_SIZE } from '../core/config.js';

// 光照系统 - 环境光 + 点光源
export class LightSystem {
  constructor() {
    this.lights = new Map(); // key "x,y" -> {x, y, radius, intensity}
  }

  register(x, y, radius = 5, intensity = 1.0) {
    this.lights.set(x + ',' + y, { x, y, radius, intensity });
  }

  unregister(x, y) {
    this.lights.delete(x + ',' + y);
  }

  // 渲染光照遮罩
  render(ctx, camera, dayNight) {
    const ambient = dayNight.getAmbientLight();
    const w = camera.w, h = camera.h;

    // 环境光遮罩
    if (ambient < 1.0) {
      ctx.fillStyle = 'rgba(0,0,15,' + (1 - ambient) * 0.85 + ')';
      ctx.fillRect(0, 0, w, h);
    }

    // 点光源 (火把)
    ctx.globalCompositeOperation = 'lighter';
    for (const light of this.lights.values()) {
      const sx = light.x * TILE_SIZE - camera.x + TILE_SIZE / 2;
      const sy = light.y * TILE_SIZE - camera.y + TILE_SIZE / 2;
      // 视口裁剪
      if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) continue;
      const r = light.radius * TILE_SIZE;
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      grad.addColorStop(0, 'rgba(255,220,150,' + (0.8 * light.intensity) + ')');
      grad.addColorStop(0.5, 'rgba(255,180,100,' + (0.3 * light.intensity) + ')');
      grad.addColorStop(1, 'rgba(255,180,100,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}