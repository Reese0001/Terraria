import { TILE_SIZE, WORLD_WIDTH } from './core/config.js';
import { createInitialState } from './core/gameState.js';
import { GameLoop } from './core/gameLoop.js';
import { World } from './world/world.js';
import { surfaceHeight } from './world/terrainGen.js';
import { Player } from './entity/player.js';
import { Camera } from './render/camera.js';
import { Input } from './input/input.js';
import { Interact } from './gameplay/interact.js';
import { DayNight } from './gameplay/dayNight.js';
import { EnemySystem } from './entity/enemy.js';
import { ParticleSystem } from './render/particle.js';
import { LightSystem } from './render/light.js';
import { CraftSystem } from './gameplay/craft.js';
import { BuildSystem } from './gameplay/build.js';
import { UI } from './ui/ui.js';
import { initTextures } from './render/texture.js';
import { TILE } from './data/tiles.js';

function init() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initTextures();

  const state = createInitialState();
  state.canvas = canvas;
  state.ctx = ctx;
  state.seed = Math.floor(Math.random() * 1000000) + 1;

  // 世界
  const world = new World(state.seed);
  state.world = world;

  // 出生点: 世界中央地表
  const spawnX = Math.floor(WORLD_WIDTH / 2);
  const spawnSurfaceY = surfaceHeight(spawnX, state.seed);
  // 确保出生点区块已生成
  world.loadInitialChunks(spawnX, spawnSurfaceY);
  // 找到实际地表
  let spawnY = spawnSurfaceY;
  for (let y = spawnSurfaceY; y < spawnSurfaceY + 20; y++) {
    if (world.isSolid(spawnX, y)) {
      spawnY = y - 2; // 站在地表上方
      break;
    }
  }

  // 玩家
  const player = new Player(spawnX + 0.2, spawnY - 2);
  player.spawnPoint = { x: spawnX + 0.2, y: spawnY - 2 };
  state.player = player;

  // 给玩家初始物品 (木镐几个火把)
  player.inventory.addItem(TILE.WOOD, 5);
  player.inventory.addItem(TILE.PLANK, 10);
  player.inventory.addItem(TILE.TORCH, 5);

  // 摄像机
  const camera = new Camera(canvas.width, canvas.height);
  camera.snapTo(player);
  state.camera = camera;
  window.addEventListener('resize', () => {
    camera.resize(canvas.width, canvas.height);
  });

  // 输入
  const input = new Input(canvas);
  state.input = input;

  // 各系统
  state.dayNight = new DayNight();
  state.interact = new Interact();
  state.enemySystem = new EnemySystem();
  state.particles = new ParticleSystem();
  state.lights = new LightSystem();
  state.craftSystem = new CraftSystem();
  state.buildSystem = new BuildSystem();
  state.ui = new UI();
  state.ui.showStartMenu = true;
  state.ui.showInventory = false;
  state.ui.showDeathScreen = false;
  state.running = false;
  state.enemies = [];
  state.drops = [];

  // 扫描初始区块火把注册光源
  const range = camera.getTileRange();
  state.buildSystem.scanLights(world, state.lights, range);

  // 启动游戏循环
  const loop = new GameLoop(state);
  loop.start();

  console.log('像素沙盒生存游戏已启动');
  console.log('种子:', state.seed);
  console.log('出生点:', spawnX, spawnY);
}

try {
  init();
} catch (e) {
  document.body.innerHTML = '<div style="color:red;font-family:monospace;font-size:16px;padding:20px;white-space:pre-wrap;">' +
    '游戏启动失败:\n\n' + e.message + '\n\n' + (e.stack || '') + '</div>';
  console.error(e);
}