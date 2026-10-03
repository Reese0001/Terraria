import { FIXED_DT, MAX_STEPS_PER_FRAME, WORLD_HEIGHT } from '../core/config.js';
import { applyGravity, moveEntity, recoverFromBlock } from '../entity/physics.js';
import { spawnDrop } from '../entity/entity.js';
import { drawSky, drawTerrain, drawEntities, drawCursor } from '../render/render.js';

// 游戏主循环
export class GameLoop {
  constructor(state) {
    this.state = state;
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.saveTimer = 0;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._frame(t));
  }

  _frame(now) {
    if (!this.running) return;
    try {
      const frameTime = Math.min(now - this.lastTime, 250);
      this.lastTime = now;
      this.accumulator += frameTime;

      let steps = 0;
      while (this.accumulator >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
        this._update(FIXED_DT);
        this.accumulator -= FIXED_DT;
        steps++;
      }

      this._render();
    } catch (e) {
      this.running = false;
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;color:red;font-family:monospace;font-size:14px;padding:10px;background:#fff;z-index:9999;white-space:pre-wrap;';
      d.textContent = '运行时错误: ' + e.message + '\n' + (e.stack || '');
      document.body.appendChild(d);
      console.error(e);
    }
    requestAnimationFrame((t) => this._frame(t));
  }

  _update(dt) {
    const s = this.state;
    if (s.ui.showStartMenu || s.ui.showDeathScreen) {
      this._handleMenuInput();
      s.input.endFrame();
      return;
    }

    if (!s.running) return;

    const { input, player, world, camera, dayNight, interact, enemySystem, particles, lights, craftSystem, buildSystem, ui, drops, enemies } = s;

    // 输入处理
    if (input.isLeft()) player.moveLeft();
    else if (input.isRight()) player.moveRight();
    if (input.jumpPressed) player.jump();
    if (input.slotPressed >= 0) player.inventory.selectSlot(input.slotPressed);
    if (input.wheelDelta !== 0) player.inventory.scrollSlot(input.wheelDelta);
    if (input.inventoryToggled) s.ui.showInventory = !s.ui.showInventory;

    // 玩家物理
    player.applyFriction();
    applyGravity(player);
    moveEntity(world, player, dt);
    recoverFromBlock(world, player);
    player.updateTimers(dt);

    // 掉出世界
    if (player.y > WORLD_HEIGHT + 10) {
      player.takeDamage(20);
      player.x = player.spawnPoint.x;
      player.y = player.spawnPoint.y;
      player.vx = 0;
      player.vy = 0;
    }

    // 昼夜
    dayNight.update(dt);

    // 掉落物
    for (let i = drops.length - 1; i >= 0; i--) {
      drops[i].update(dt, world, player, player.inventory);
      if (drops[i].dead) drops.splice(i, 1);
    }

    // 敌怪
    enemySystem.update(dt, world, player, enemies, dayNight, drops, particles);

    // 交互 (挖掘/放置/攻击)
    if (!s.ui.showInventory) {
      const mineResult = interact.update(dt, world, player, input, camera, (x, y, dropId, color, minedTileId) => {
        if (dropId > 0) spawnDrop(drops, x + 0.25, y + 0.25, dropId, 1);
        particles.emitMine(x + 0.5, y + 0.5, color);
        buildSystem.onRemove(lights, x, y, minedTileId);
      });

      if (input.rightClickPressed) {
        interact.tryPlace(world, player, input, camera, (x, y, tileId) => {
          particles.emitPlace(x + 0.5, y + 0.5, '#FFF');
          buildSystem.onPlace(lights, x, y, tileId);
        });
      }

      // 攻击 (左键点击且手持武器或空手)
      if (input.leftClickPressed) {
        enemySystem.playerAttack(player, enemies, particles);
      }
    }

    // 制作菜单点击
    ui.updateHover(input);
    if (input.uiClickX >= 0 && s.ui.showInventory) {
      const action = ui.handleClick(s, input, craftSystem);
      if (action && action.craft) {
        const result = craftSystem.craft(action.craft, player.inventory);
        if (result && result.dropped > 0) {
          spawnDrop(drops, player.x, player.y, result.outputItemId, result.dropped);
        }
      }
    }

    // 粒子
    particles.update(dt);

    // 摄像机
    camera.follow(player);

    // 区块加载
    world.updateChunks(camera.getViewport());

    // 玩家死亡检测
    if (player.isDead() && !s.ui.showDeathScreen) {
      s.ui.showDeathScreen = true;
      // 掉落部分物品
      for (let i = 0; i < player.inventory.slots.length; i++) {
        const slot = player.inventory.slots[i];
        if (slot && Math.random() < 0.5) {
          spawnDrop(drops, player.x, player.y, slot.itemId, slot.count);
          player.inventory.slots[i] = null;
        }
      }
    }

    input.endFrame();
  }

  _handleMenuInput() {
    const s = this.state;
    const { input, ui, craftSystem, player, drops } = s;
    if (input.uiClickX >= 0) {
      const action = ui.handleClick(s, input, craftSystem);
      if (action === 'startGame') {
        s.ui.showStartMenu = false;
        s.running = true;
      } else if (action === 'respawn') {
        s.player.respawn();
        s.ui.showDeathScreen = false;
      } else if (action && action.craft) {
        const result = craftSystem.craft(action.craft, player.inventory);
        if (result && result.dropped > 0) {
          spawnDrop(drops, player.x, player.y, result.outputItemId, result.dropped);
        }
      }
    }
    if (input.inventoryToggled && s.ui.showDeathScreen) {
      // 死亡画面不响应E
    }
  }

  _render() {
    const s = this.state;
    const { ctx, camera } = s;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, camera.w, camera.h);

    if (s.ui.showStartMenu) {
      s.ui.drawStartMenu(ctx, s);
      return;
    }

    // 天空
    drawSky(ctx, camera, s.dayNight);

    // 地形
    const miningTarget = s.interact.getMiningTarget();
    drawTerrain(ctx, s.world, camera, miningTarget);

    // 实体
    drawEntities(ctx, s, camera);

    // 粒子
    s.particles.render(ctx, camera);

    // 光照
    s.lights.render(ctx, camera, s.dayNight);

    // 光标
    if (!s.ui.showInventory && !s.ui.showDeathScreen) {
      drawCursor(ctx, camera, s.input, s.player, miningTarget);
    }

    // HUD
    if (!s.ui.showDeathScreen) {
      s.ui.drawHUD(ctx, s);
    }

    // 背包/制作菜单
    if (s.ui.showInventory && !s.ui.showDeathScreen) {
      s.ui.drawInventoryMenu(ctx, s, s.craftSystem);
    }

    // 死亡画面
    if (s.ui.showDeathScreen) {
      s.ui.drawDeathScreen(ctx, s);
    }
  }
}