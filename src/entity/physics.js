import { GRAVITY, MAX_FALL_SPEED, clamp } from '../core/config.js';

// 检查实体AABB是否与实心方块碰撞
function checkCollision(world, x, y, w, h) {
  const minX = Math.floor(x);
  const maxX = Math.floor(x + w - 0.001);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + h - 0.001);
  for (let gy = minY; gy <= maxY; gy++) {
    for (let gx = minX; gx <= maxX; gx++) {
      if (world.isSolid(gx, gy)) return true;
    }
  }
  return false;
}

// 分轴碰撞移动
export function moveEntity(world, entity, dt) {
  const maxV = Math.max(Math.abs(entity.vx), Math.abs(entity.vy));
  const steps = Math.max(1, Math.ceil(maxV / 0.3));
  const sx = entity.vx / steps;
  const sy = entity.vy / steps;

  entity.onGround = false;

  for (let i = 0; i < steps; i++) {
    // X轴
    const newX = entity.x + sx;
    if (!checkCollision(world, newX, entity.y, entity.w, entity.h)) {
      entity.x = newX;
    } else {
      entity.vx = 0;
    }

    // Y轴
    const newY = entity.y + sy;
    if (!checkCollision(world, entity.x, newY, entity.w, entity.h)) {
      entity.y = newY;
    } else {
      if (sy > 0) entity.onGround = true;
      entity.vy = 0;
    }
  }
}

// 应用重力
export function applyGravity(entity) {
  entity.vy += GRAVITY;
  if (entity.vy > MAX_FALL_SPEED) entity.vy = MAX_FALL_SPEED;
}

// 嵌入方块恢复: 向上推出到最近空气格
export function recoverFromBlock(world, entity) {
  if (checkCollision(world, entity.x, entity.y, entity.w, entity.h)) {
    for (let up = 1; up < 5; up++) {
      if (!checkCollision(world, entity.x, entity.y - up, entity.w, entity.h)) {
        entity.y -= up;
        entity.vy = 0;
        return true;
      }
    }
  }
  return false;
}

export { checkCollision };
