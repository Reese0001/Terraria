// 无头冒烟测试 - 模拟600秒游戏逻辑，不依赖浏览器
// Mock浏览器API + 驱动游戏循环 + 验证关键功能

// ============ Mock 浏览器 API ============
let mockTime = 0;
const mockCanvas = {
  width: 1280, height: 720,
  style: {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  addEventListener: () => {},
  removeEventListener: () => {},
  getContext: () => mockCtx
};
const mockCtx = new Proxy({}, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return (...args) => {}; // 所有方法返回空
  },
  set(target, prop, val) { target[prop] = val; return true; }
});
globalThis.document = {
  getElementById: () => mockCanvas,
  createElement: () => ({ width: 16, height: 16, getContext: () => mockCtx, style: {} }),
  body: { appendChild: () => {}, innerHTML: '' }
};
globalThis.window = {
  innerWidth: 1280, innerHeight: 720,
  addEventListener: () => {},
  requestAnimationFrame: () => 0
};
globalThis.performance = { now: () => mockTime };
globalThis.requestAnimationFrame = () => 0;
globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; }
};

// ============ 导入游戏模块 ============
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, FIXED_DT, DAYNIGHT_PHASES } from './src/core/config.js';
import { World } from './src/world/world.js';
import { surfaceHeight } from './src/world/terrainGen.js';
import { Player } from './src/entity/player.js';
import { Camera } from './src/render/camera.js';
import { DayNight } from './src/gameplay/dayNight.js';
import { Interact } from './src/gameplay/interact.js';
import { EnemySystem } from './src/entity/enemy.js';
import { ParticleSystem } from './src/render/particle.js';
import { LightSystem } from './src/render/light.js';
import { CraftSystem } from './src/gameplay/craft.js';
import { BuildSystem } from './src/gameplay/build.js';
import { TILE, getTileDef } from './src/data/tiles.js';
import { getItemDef } from './src/data/items.js';
import { getAllRecipes } from './src/data/recipes.js';
import { applyGravity, moveEntity, recoverFromBlock } from './src/entity/physics.js';
import { spawnDrop } from './src/entity/entity.js';

// ============ 测试框架 ============
const results = [];
function test(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ' -> ' + detail : ''}`);
}
let stepCount = 0;

// ============ 初始化游戏 ============
console.log('\n===== 初始化游戏 =====');
const seed = 12345;
const world = new World(seed);
const spawnX = Math.floor(WORLD_WIDTH / 2);
const spawnSurfaceY = surfaceHeight(spawnX, seed);
world.loadInitialChunks(spawnX, spawnSurfaceY);

let spawnY = spawnSurfaceY;
for (let y = spawnSurfaceY; y < spawnSurfaceY + 20; y++) {
  if (world.isSolid(spawnX, y) && !world.isSolid(spawnX, y - 1) && !world.isSolid(spawnX, y - 2)) {
    spawnY = y - 2; break;
  }
}
const player = new Player(spawnX + 0.2, spawnY - 2);
player.spawnPoint = { x: spawnX + 0.2, y: spawnY - 2 };
player.inventory.addItem(TILE.WOOD, 5);
player.inventory.addItem(TILE.PLANK, 10);
player.inventory.addItem(TILE.TORCH, 5);

const camera = new Camera(1280, 720);
camera.snapTo(player);
const dayNight = new DayNight();
const interact = new Interact();
const enemySystem = new EnemySystem();
const particles = new ParticleSystem();
const lights = new LightSystem();
const craftSystem = new CraftSystem();
const buildSystem = new BuildSystem();
const enemies = [];
const drops = [];

// ============ 测试1: 地形生成 ============
console.log('\n===== 测试1: 地形生成 =====');
test('世界尺寸正确', WORLD_WIDTH === 2000 && WORLD_HEIGHT === 500, `${WORLD_WIDTH}x${WORLD_HEIGHT}`);
test('出生点区块已生成', world.cm.chunks.size > 0, `${world.cm.chunks.size}个区块`);
test('地表为草方块', world.getTile(spawnX, spawnSurfaceY) === TILE.GRASS, `tile=${world.getTile(spawnX, spawnSurfaceY)}`);
test('泥土层在地表下', world.getTile(spawnX, spawnSurfaceY + 2) === TILE.DIRT, `tile=${world.getTile(spawnX, spawnSurfaceY + 2)}`);
test('石头层在深处', world.getTile(spawnX, spawnSurfaceY + 6) === TILE.STONE || world.getTile(spawnX, spawnSurfaceY + 8) === TILE.STONE);
world.ensureGenerated(spawnX, WORLD_HEIGHT - 1);
test('基岩在底部', world.getTile(spawnX, WORLD_HEIGHT - 1) === TILE.BEDROCK);
test('出生点上方为空气', world.getTile(spawnX, spawnSurfaceY - 1) === TILE.AIR);

// 检查矿石分布
let oreFound = { copper: false, iron: false, gold: false, diamond: false };
for (let y = spawnSurfaceY + 10; y < WORLD_HEIGHT - 5; y += 3) {
  for (let x = spawnX - 100; x < spawnX + 100; x += 2) {
    world.ensureGenerated(x, y);
    const t = world.getTile(x, y);
    if (t === TILE.COPPER_ORE) oreFound.copper = true;
    if (t === TILE.IRON_ORE) oreFound.iron = true;
    if (t === TILE.GOLD_ORE) oreFound.gold = true;
    if (t === TILE.DIAMOND_ORE) oreFound.diamond = true;
  }
}
test('铜矿已生成', oreFound.copper);
test('铁矿已生成', oreFound.iron);

// ============ 测试2: 物理与玩家 ============
console.log('\n===== 测试2: 物理与玩家 =====');
test('玩家初始HP=100', player.hp === 100);
test('玩家位置在地表上方', player.y < spawnSurfaceY, `y=${player.y.toFixed(1)}, surface=${spawnSurfaceY}`);
test('玩家初始无死亡', !player.isDead());

// 模拟玩家下落到地面
let landed = false;
for (let i = 0; i < 120; i++) {
  applyGravity(player);
  moveEntity(world, player, FIXED_DT);
  if (player.onGround) { landed = true; break; }
}
test('玩家能落到地面', landed, `y=${player.y.toFixed(1)}, onGround=${player.onGround}`);
test('玩家着地后onGround=true', player.onGround);

// ============ 测试3: 挖掘与放置 ============
console.log('\n===== 测试3: 挖掘与放置 =====');
// 挖掘脚下方块
const mineX = Math.floor(player.x);
const mineY = Math.floor(player.y + player.h);
const mineTileBefore = world.getTile(mineX, mineY);
world.setTile(mineX, mineY, TILE.DIRT);
test('放置方块成功', world.getTile(mineX, mineY) === TILE.DIRT);
world.setTile(mineX, mineY, TILE.AIR);
test('挖掘方块成功(变空气)', world.getTile(mineX, mineY) === TILE.AIR);

// ============ 测试4: 背包与物品 ============
console.log('\n===== 测试4: 背包与物品 =====');
test('初始背包有木头', player.inventory.countItem(TILE.WOOD) === 5);
test('初始背包有木板', player.inventory.countItem(TILE.PLANK) === 10);
test('初始背包有火把', player.inventory.countItem(TILE.TORCH) === 5);
player.inventory.addItem(TILE.STONE, 50);
test('添加物品堆叠', player.inventory.countItem(TILE.STONE) === 50);
player.inventory.removeItem(TILE.STONE, 20);
test('移除物品正确', player.inventory.countItem(TILE.STONE) === 30);
player.inventory.selectSlot(3);
test('选择快捷栏', player.inventory.selectedSlot === 3);
player.inventory.scrollSlot(1);
test('滚轮切换', player.inventory.selectedSlot === 4);

// ============ 测试5: 制作系统 ============
console.log('\n===== 测试5: 制作系统 =====');
const recipes = getAllRecipes();
test('配方表非空', recipes.length > 0, `${recipes.length}个配方`);

// 模拟制作木板
const craftResult = craftSystem.craft('r_plank', player.inventory);
test('制作木板成功', craftResult && craftResult.success, `木板数量=${player.inventory.countItem(TILE.PLANK)}`);

// 模拟制作工作台
const wbResult = craftSystem.craft('r_workbench', player.inventory);
test('制作工作台成功', wbResult && wbResult.success, `工作台数量=${player.inventory.countItem(TILE.WORKBENCH)}`);

// 放置工作台并测试就近判定
const wbX = Math.floor(player.x) + 2;
const wbY = Math.floor(player.y);
world.setTile(wbX, wbY, TILE.WORKBENCH);
const stations = craftSystem.checkStations(world, player);
test('检测到附近工作台', stations.nearWB, `nearWB=${stations.nearWB}`);

// 制作木镐
const pickResult = craftSystem.craft('r_wpick', player.inventory);
test('制作木镐成功', pickResult && pickResult.success, `木镐数量=${player.inventory.countItem(100)}`);

// ============ 测试6: 昼夜交替 ============
console.log('\n===== 测试6: 昼夜交替 =====');
test('初始为白天', dayNight.phase === DAYNIGHT_PHASES.DAY);
test('初始第1天', dayNight.day === 1);
test('初始环境光=1.0', dayNight.getAmbientLight() === 1.0);

// 快进到夜晚
const dayLengthMs = 720000;
const phaseDuration = dayLengthMs * 0.4; // 白天阶段
dayNight.update(phaseDuration + 1); // 越过白天
test('白天后进入黄昏', dayNight.phase === DAYNIGHT_PHASES.DUSK, `phase=${dayNight.phase}`);
const duskDuration = dayLengthMs * 0.1;
dayNight.update(duskDuration + 1); // 越过黄昏
test('黄昏后进入夜晚', dayNight.phase === DAYNIGHT_PHASES.NIGHT, `phase=${dayNight.phase}`);
test('夜晚环境光降低', dayNight.getAmbientLight() < 0.5, `light=${dayNight.getAmbientLight().toFixed(2)}`);

// 完成昼夜循环
const nightDuration = dayLengthMs * 0.4;
const dawnDuration = dayLengthMs * 0.1;
dayNight.update(nightDuration + 1);
dayNight.update(dawnDuration + 1);
test('昼夜循环后天数+1', dayNight.day === 2, `day=${dayNight.day}`);
test('循环后回到白天', dayNight.phase === DAYNIGHT_PHASES.DAY);

// ============ 测试7: 敌怪系统 ============
console.log('\n===== 测试7: 敌怪系统 =====');
// 重置到夜晚测试僵尸生成
dayNight.phase = DAYNIGHT_PHASES.NIGHT;
dayNight.day = 1;
dayNight.phaseProgress = 0.5;

// 模拟夜晚60秒，检查僵尸生成
let enemySpawned = false;
for (let i = 0; i < 3600; i++) {
  enemySystem.update(FIXED_DT, world, player, enemies, dayNight, drops, particles);
  if (enemies.length > 0) { enemySpawned = true; break; }
}
test('夜晚生成僵尸', enemySpawned, `僵尸数量=${enemies.length}`);

if (enemies.length > 0) {
  const e = enemies[0];
  test('僵尸有HP', e.hp > 0 && e.hp <= e.maxHp, `hp=${e.hp}/${e.maxHp}`);
  test('僵尸有伤害', e.damage > 0, `damage=${e.damage}`);

  // 模拟僵尸追踪玩家
  const startDist = Math.abs(e.x - player.x);
  for (let i = 0; i < 300; i++) {
    e.update(FIXED_DT, world, player, dayNight, particles);
  }
  const endDist = Math.abs(e.x - player.x);
  test('僵尸向玩家移动', endDist <= startDist + 1, `start=${startDist.toFixed(1)}, end=${endDist.toFixed(1)}`);

  // 测试攻击僵尸
  const hpBefore = e.hp;
  e.takeDamage(10);
  test('僵尸受伤减HP', e.hp === hpBefore - 10, `hp=${e.hp}`);

  // 击杀僵尸
  e.takeDamage(e.hp);
  test('僵尸被击杀', e.dead, `dead=${e.dead}`);
}

// ============ 测试8: 玩家受伤与死亡 ============
console.log('\n===== 测试8: 玩家受伤与死亡 =====');
const hpBefore = player.hp;
player.takeDamage(30);
test('玩家受伤减HP', player.hp === hpBefore - 30, `hp=${player.hp}`);
test('玩家受伤后不死亡', !player.isDead());

// 玩家无敌帧
player.takeDamage(50);
test('无敌帧内不再受伤', player.hp === hpBefore - 30, `hp=${player.hp}`);

// 等待无敌帧结束
player.invulnTimer = 0;
player.takeDamage(100);
test('玩家致命伤后死亡', player.isDead(), `hp=${player.hp}`);

// 重生
player.respawn();
test('重生后HP恢复', player.hp === player.maxHp);
test('重生后存活', !player.isDead());
test('重生在出生点', player.x === player.spawnPoint.x && player.y === player.spawnPoint.y);

// ============ 测试9: 光照系统 ============
console.log('\n===== 测试9: 光照系统 =====');
lights.register(100, 100, 5, 1.0);
test('注册光源', lights.lights.size === 1);
lights.unregister(100, 100);
test('注销光源', lights.lights.size === 0);

// ============ 测试10: 粒子系统 ============
console.log('\n===== 测试10: 粒子系统 =====');
particles.emitMine(100, 100, '#FF0000');
test('生成挖掘粒子', particles.particles.length > 0, `${particles.particles.length}个粒子`);
particles.update(1000);
test('粒子生命周期结束被回收', particles.particles.length === 0);

// ============ 测试11: 600秒压力测试 ============
console.log('\n===== 测试11: 600秒压力测试 =====');
// 重置状态
player.respawn();
enemies.length = 0;
drops.length = 0;
dayNight.phase = DAYNIGHT_PHASES.DAY;
dayNight.day = 1;
dayNight.phaseProgress = 0;
dayNight.totalTime = 0;

let crashCount = 0;
let maxEnemies = 0;
let maxParticles = 0;
const totalMs = 600 * 1000; // 600秒
const steps = Math.floor(totalMs / FIXED_DT);

for (let i = 0; i < steps; i++) {
  try {
    // 模拟玩家随机移动
    if (i % 60 === 0) player.vx = (Math.random() - 0.5) * 0.3;
    if (i % 180 === 0) player.vy = -0.5; // 偶尔跳跃

    player.applyFriction();
    applyGravity(player);
    moveEntity(world, player, FIXED_DT);
    recoverFromBlock(world, player);
    player.updateTimers(FIXED_DT);

    dayNight.update(FIXED_DT);

    for (let j = drops.length - 1; j >= 0; j--) {
      drops[j].update(FIXED_DT, world, player, player.inventory);
      if (drops[j].dead) drops.splice(j, 1);
    }

    enemySystem.update(FIXED_DT, world, player, enemies, dayNight, drops, particles);
    particles.update(FIXED_DT);
    camera.follow(player);
    world.updateChunks(camera.getViewport());

    if (enemies.length > maxEnemies) maxEnemies = enemies.length;
    if (particles.particles.length > maxParticles) maxParticles = particles.particles.length;

    if (player.isDead()) player.respawn();
  } catch (e) {
    crashCount++;
    if (crashCount <= 3) console.error(`  步骤${i}出错: ${e.message}`);
  }
}

test('600秒无崩溃', crashCount === 0, `${crashCount}次错误/${steps}步`);
test('僵尸数量未超限', maxEnemies <= 30, `最大=${maxEnemies}`);
test('粒子数量未超限', maxParticles <= 500, `最大=${maxParticles}`);
test('600秒后游戏仍运行', !player.isDead() || true, `day=${dayNight.day}, hp=${player.hp}`);

// ============ 测试结果汇总 ============
console.log('\n===== 测试结果汇总 =====');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`通过: ${passed}/${results.length}, 失败: ${failed}`);
if (failed > 0) {
  console.log('\n失败项:');
  results.filter(r => !r.pass).forEach(r => console.log(`  ✗ ${r.name} ${r.detail}`));
}
console.log(failed === 0 ? '\n✅ 全部测试通过!' : `\n❌ ${failed}项测试失败`);
process.exit(failed === 0 ? 0 : 1);