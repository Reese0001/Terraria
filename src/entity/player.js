import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_FRICTION, JUMP_VELOCITY, clamp } from '../core/config.js';
import { Inventory } from '../gameplay/inventory.js';

// 玩家实体
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = PLAYER_WIDTH;
    this.h = PLAYER_HEIGHT;
    this.onGround = false;
    this.facing = 1; // 1=右, -1=左
    this.maxHp = 100;
    this.hp = 100;
    this.inventory = new Inventory();
    this.selectedSlot = 0;
    this.state = 'alive'; // alive / dead
    this.spawnPoint = { x, y };
    this.invulnTimer = 0;
    this.attackCooldown = 0;
    this.hurtFlash = 0;
  }

  moveLeft() {
    this.vx = -PLAYER_SPEED;
    this.facing = -1;
  }

  moveRight() {
    this.vx = PLAYER_SPEED;
    this.facing = 1;
  }

  jump() {
    if (this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
    }
  }

  applyFriction() {
    if (Math.abs(this.vx) > 0.01) {
      this.vx *= PLAYER_FRICTION;
    } else {
      this.vx = 0;
    }
  }

  takeDamage(dmg) {
    if (this.invulnTimer > 0) return;
    this.hp = clamp(this.hp - dmg, 0, this.maxHp);
    this.hurtFlash = 0.3;
    this.invulnTimer = 0.5;
    if (this.hp <= 0) {
      this.state = 'dead';
    }
  }

  heal(amount) {
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
  }

  isDead() {
    return this.state === 'dead';
  }

  respawn() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp;
    this.state = 'alive';
    this.invulnTimer = 2;
    this.hurtFlash = 0;
  }

  getEquippedTool() {
    const slot = this.inventory.slots[this.selectedSlot];
    return slot ? slot.itemId : 0;
  }

  getCenter() {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }

  updateTimers(dt) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt / 1000;
    if (this.hurtFlash > 0) this.hurtFlash -= dt / 1000;
    if (this.attackCooldown > 0) this.attackCooldown -= dt / 1000;
  }
}