import { moveEntity, applyGravity, checkCollision } from './physics.js';

// 掉落物实体
export class DroppedItem {
  constructor(x, y, itemId, count = 1) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.1;
    this.vy = -0.2;
    this.w = 0.5;
    this.h = 0.5;
    this.itemId = itemId;
    this.count = count;
    this.pickupCooldown = 0.8;
    this.bob = Math.random() * Math.PI * 2;
    this.onGround = false;
    this.dead = false;
  }

  update(dt, world, player, inventory) {
    this.bob += dt / 200;
    if (this.pickupCooldown > 0) this.pickupCooldown -= dt / 1000;

    applyGravity(this);
    moveEntity(world, this, dt);

    // 拾取
    if (this.pickupCooldown <= 0) {
      const dx = (this.x + this.w / 2) - (player.x + player.w / 2);
      const dy = (this.y + this.h / 2) - (player.y + player.h / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 1.2) {
        const remaining = inventory.addItem(this.itemId, this.count);
        if (remaining < this.count) {
          if (remaining > 0) {
            this.count = remaining;
            this.pickupCooldown = 0.5;
          } else {
            this.dead = true;
          }
        }
      }
    }
  }
}

// 生成掉落物
export function spawnDrop(drops, x, y, itemId, count = 1) {
  if (itemId <= 0 || count <= 0) return;
  drops.push(new DroppedItem(x, y, itemId, count));
}