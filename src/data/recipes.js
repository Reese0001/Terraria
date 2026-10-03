// 制作配方表
// { id, inputs: [{itemId, count}], output: {itemId, count}, needWorkbench, needFurnace }

import { TILE } from './tiles.js';

const recipes = [
  // 基础配方 (无需工作台)
  { id: 'r_plank',    inputs: [{ itemId: TILE.WOOD, count: 1 }],                       output: { itemId: TILE.PLANK, count: 4 }, needWorkbench: false, needFurnace: false },
  { id: 'r_torch',    inputs: [{ itemId: TILE.WOOD, count: 1 }, { itemId: TILE.PLANK, count: 1 }], output: { itemId: TILE.TORCH, count: 4 }, needWorkbench: false, needFurnace: false },

  // 工作台与熔炉
  { id: 'r_workbench',inputs: [{ itemId: TILE.PLANK, count: 4 }],                     output: { itemId: TILE.WORKBENCH, count: 1 }, needWorkbench: false, needFurnace: false },
  { id: 'r_furnace',  inputs: [{ itemId: TILE.STONE, count: 8 }],                     output: { itemId: TILE.FURNACE, count: 1 }, needWorkbench: true, needFurnace: false },

  // 木工具 (需工作台)
  { id: 'r_wpick',    inputs: [{ itemId: TILE.PLANK, count: 3 }, { itemId: TILE.WOOD, count: 2 }], output: { itemId: 100, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_waxe',     inputs: [{ itemId: TILE.PLANK, count: 3 }, { itemId: TILE.WOOD, count: 2 }], output: { itemId: 101, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_wsword',   inputs: [{ itemId: TILE.PLANK, count: 2 }, { itemId: TILE.WOOD, count: 1 }], output: { itemId: 102, count: 1 }, needWorkbench: true, needFurnace: false },

  // 石工具 (需工作台)
  { id: 'r_spick',    inputs: [{ itemId: TILE.STONE, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 103, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_saxe',     inputs: [{ itemId: TILE.STONE, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 104, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_ssword',   inputs: [{ itemId: TILE.STONE, count: 2 }, { itemId: TILE.PLANK, count: 1 }], output: { itemId: 105, count: 1 }, needWorkbench: true, needFurnace: false },

  // 锭 (需熔炉)
  { id: 'r_iron_ingot',  inputs: [{ itemId: TILE.IRON_ORE, count: 1 }],  output: { itemId: 200, count: 1 }, needWorkbench: false, needFurnace: true },
  { id: 'r_gold_ingot',  inputs: [{ itemId: TILE.GOLD_ORE, count: 1 }],  output: { itemId: 201, count: 1 }, needWorkbench: false, needFurnace: true },

  // 铁工具 (需工作台)
  { id: 'r_ipick',    inputs: [{ itemId: 200, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 106, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_iaxe',     inputs: [{ itemId: 200, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 107, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_isword',   inputs: [{ itemId: 200, count: 2 }, { itemId: TILE.PLANK, count: 1 }], output: { itemId: 108, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_iarmor',   inputs: [{ itemId: 200, count: 8 }],               output: { itemId: 202, count: 1 }, needWorkbench: true, needFurnace: false },

  // 金工具 (需工作台)
  { id: 'r_gpick',    inputs: [{ itemId: 201, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 109, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_gaxe',     inputs: [{ itemId: 201, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 110, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_gsword',   inputs: [{ itemId: 201, count: 2 }, { itemId: TILE.PLANK, count: 1 }], output: { itemId: 111, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_garmor',   inputs: [{ itemId: 201, count: 8 }],               output: { itemId: 203, count: 1 }, needWorkbench: true, needFurnace: false },

  // 钻石工具 (需工作台)
  { id: 'r_dpick',    inputs: [{ itemId: TILE.DIAMOND_ORE, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 112, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_daxe',     inputs: [{ itemId: TILE.DIAMOND_ORE, count: 3 }, { itemId: TILE.PLANK, count: 2 }], output: { itemId: 113, count: 1 }, needWorkbench: true, needFurnace: false },
  { id: 'r_dsword',   inputs: [{ itemId: TILE.DIAMOND_ORE, count: 2 }, { itemId: TILE.PLANK, count: 1 }], output: { itemId: 114, count: 1 }, needWorkbench: true, needFurnace: false }
];

const recipeMap = {};
recipes.forEach(r => { recipeMap[r.id] = r; });

export function getRecipe(id) {
  return recipeMap[id];
}

export function getAllRecipes() {
  return recipes;
}