import { ENEMY_WIDTH, ENEMY_HEIGHT, MAX_ENEMIES, clamp } from '../core/config.js';
import { moveEntity, applyGravity, checkCollision } from './physics.js';
import { TILE } from '../data/tiles.js';
import { spawnDrop } from './entity.js';
import { getItemDef } from '../data/items.js';

let nextId = 1;

// 僵尸实体
export class Enemy {
  constructor(x, y, day) {
    this.id = nextId++;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = ENEMY_WIDTH;
    this.h = ENEMY_HEIGHT;
    this.onGround = false;
    this.maxHp = 20 + day * 5;
    this.hp = this.maxHp;
    this.damage = 5 + day * 1;
    this.speed = 0.04 + Math.min(day * 0.003, 0.04);
    this.aiState = 'CHASING'; // IDLE/CHASING/ATTACKING/BURNING/DEAD
    this.burnTimer = 0;
    this.attackCooldown = 0;
    this.facing = 1;
    this.dead = false;
    this.hurtFlash = 0;
  }

  takeDamage(dmg) {
    this.hp = clamp(this.hp - dmg, 0, this.maxHp);
    this.hurtFlash = 0.2;
    if (this.hp <= 0) {
      this.aiState = 'DEAD';
      this.dead = true;
    }
  }

  update(dt, world, player, dayNight, particles) {
    if (this.dead) return;

    if (this.hurtFlash > 0) this.hurtFlash -= dt / 1000;
    if (this.attackCooldown > 0) this.attackCooldown -= dt / 1000;

    // 白天燃烧判定
    if (dayNight.phase === 'DAY' || dayNight.phase === 'DAWN') {
      // 检查上方是否有遮挡
      const cx = Math.floor(this.x + this.w / 2);
      const cy = Math.floor(this.y);
      let blocked = false;
      for (let y = cy - 1; y >= cy - 10; y--) {
        if (world.isSolid(cx, y)) { blocked = true; break; }
      }
      if (!blocked) {
        this.aiState = 'BURNING';
        this.burnTimer += dt / 1000;
        if (this.burnTimer > 0.5) {
          this.burnTimer = 0;
          this.takeDamage(3);
          if (particles) particles.emitBurn(this.x + this.w / 2, this.y);
        }
        // 燃烧时仍追踪
      }
    } else {
      if (this.aiState === 'BURNING') this.aiState = 'CHASING';
    }

    if (this.dead) return;

    // 追踪AI
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dist = Math.abs(dx);
    this.facing = dx > 0 ? 1 : -1;

    if (dist > 0.5) {
      this.vx = this.facing * this.speed;
    } else {
      this.vx = 0;
    }

    // 跳跃越障: 前方有实心方块且onGround
    if (this.onGround && dist > 0.5) {
      const aheadX = Math.floor(this.x + this.w / 2 + this.facing * 0.6);
      const footY = Math.floor(this.y + this.h - 0.1);
      if (world.isSolid(aheadX, footY) && !world.isSolid(aheadX, footY - 1)) {
        this.vy = -0.5;
        this.onGround = false;
      }
    }

    // 物理
    applyGravity(this);
    moveEntity(world, this, dt);

    // 攻击玩家
    if (this.attackCooldown <= 0) {
      if (this.overlapsPlayer(player)) {
        player.takeDamage(this.damage);
        this.attackCooldown = 1000;
      }
    }

    // 掉出世界
    if (this.y > 600) this.dead = true;
  }

  overlapsPlayer(player) {
    return this.x + this.w > player.x && this.x < player.x + player.w &&
           this.y + this.h > player.y && this.y < player.y + player.h;
  }
}

// 敌怪系统
export class EnemySystem {
  constructor() {
    this.spawnCooldown = 0;
  }

  update(dt, world, player, enemies, dayNight, drops, particles) {
    // 移除死亡僵尸
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].dead) {
        const e = enemies[i];
        if (e.aiState !== 'BURNING' || e.hp <= 0) {
          // 掉落 (燃烧死亡不掉落)
          if (e.aiState !== 'BURNING') {
            spawnDrop(drops, e.x, e.y, 204, 1); // 腐肉
            if (Math.random() < 0.3) spawnDrop(drops, e.x, e.y, 2, 1); // 泥土
          }
        }
        enemies.splice(i, 1);
        continue;
      }
      enemies[i].update(dt, world, player, dayNight, particles);
    }

    // 夜晚生成
    if (dayNight.isDeepNight()) {
      this.spawnCooldown -= dt;
      if (this.spawnCooldown <= 0 && enemies.length < MAX_ENEMIES) {
        this.spawnCooldown = 2000 + Math.random() * 3000;
        this.trySpawn(world, player, enemies, dayNight);
      }
    }
  }

  trySpawn(world, player, enemies, dayNight) {
    const count = Math.min(5 + dayNight.day * 2, MAX_ENEMIES) - enemies.length;
    if (count <= 0) return;

    const pcx = Math.floor(player.x);
    const viewRadius = 20; // 屏幕外
    for (let attempt = 0; attempt < 10; attempt++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const sx = pcx + side * (viewRadius + Math.random() * 10);
      // 确保区块已生成
      world.ensureGenerated(sx, Math.floor(player.y));
      // 找地表
      for (let y = Math.floor(player.y) - 30; y < Math.floor(player.y) + 30; y++) {
        if (y < 0 || y > 498) continue;
        if (world.isSolid(sx, y) && !world.isSolid(sx, y - 1) && !world.isSolid(sx, y - 2)) {
          const e = new Enemy(sx, y - 2 - ENEMY_HEIGHT, dayNight.day);
          enemies.push(e);
          return;
        }
      }
    }
  }

  // 玩家攻击僵尸
  playerAttack(player, enemies, particles) {
    if (player.attackCooldown > 0) return;
    const toolId = player.getEquippedTool();
    const def = getItemDef(toolId);
    const damage = def.atk > 0 ? def.atk : 2; // 空手伤害2

    let hit = false;
    for (const e of enemies) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      const dx = ex - px;
      const dy = ey - py;
      if (Math.abs(dx) < 1.8 && Math.abs(dy) < 2 && Math.sign(dx) === player.facing) {
        e.takeDamage(damage);
        if (particles) particles.emitHit(ex, ey);
        hit = true;
      }
    }
    if (hit) player.attackCooldown = 400;
  }
}