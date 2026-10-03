// 物品类型定义表
// 方块类物品id = 方块id (1-15)
// 工具类: 100-114  材料类: 200-204

export const ITEM_CAT = { BLOCK: 'block', TOOL: 'tool', MATERIAL: 'material', PLACE: 'place' };
export const TOOL_TYPE = { NONE: 'none', PICKAXE: 'pickaxe', AXE: 'axe', SWORD: 'sword' };

const itemDefs = {};

// 方块类物品 (id = tileId)
const blockItems = [
  [1, '草方块', 2], [2, '泥土', 2], [3, '石头', 3], [4, '木头', 4], [5, '木板', 5],
  [6, '铜矿', 6], [7, '铁矿', 7], [8, '金矿', 8], [9, '钻石矿', 9],
  [10, '工作台', 10], [11, '火把', 11], [12, '门', 12], [13, '熔炉', 13], [15, '树叶', 15]
];
blockItems.forEach(([id, name, tileId]) => {
  itemDefs[id] = { id, name, category: ITEM_CAT.BLOCK, tileId, stackLimit: 99, toolType: TOOL_TYPE.NONE, toolTier: 0, mineEff: 1, atk: 0, placeTile: tileId };
});

// 工具类: id, name, type, tier, mineEff, atk
// tier: 木=1 石=2 铁=3 金=4 钻石=5
const tools = [
  [100, '木镐',   'pickaxe', 1, 2.0, 3],
  [101, '木斧',   'axe',     1, 2.0, 3],
  [102, '木剑',   'sword',   1, 1.0, 6],
  [103, '石镐',   'pickaxe', 2, 3.5, 5],
  [104, '石斧',   'axe',     2, 3.5, 5],
  [105, '石剑',   'sword',   2, 1.5, 10],
  [106, '铁镐',   'pickaxe', 3, 5.5, 8],
  [107, '铁斧',   'axe',     3, 5.5, 8],
  [108, '铁剑',   'sword',   3, 2.0, 16],
  [109, '金镐',   'pickaxe', 4, 8.0, 12],
  [110, '金斧',   'axe',     4, 8.0, 12],
  [111, '金剑',   'sword',   4, 3.0, 24],
  [112, '钻石镐', 'pickaxe', 5, 12.0, 18],
  [113, '钻石斧', 'axe',     5, 12.0, 18],
  [114, '钻石剑', 'sword',   5, 4.0, 36]
];
tools.forEach(([id, name, ttype, tier, mineEff, atk]) => {
  itemDefs[id] = { id, name, category: ITEM_CAT.TOOL, tileId: 0, stackLimit: 1, toolType: ttype, toolTier: tier, mineEff, atk, placeTile: 0 };
});

// 材料类
const materials = [
  [200, '铁锭', 99], [201, '金锭', 99], [202, '铁甲', 1], [203, '金甲', 1], [204, '腐肉', 99]
];
materials.forEach(([id, name, stack]) => {
  itemDefs[id] = { id, name, category: ITEM_CAT.MATERIAL, tileId: 0, stackLimit: stack, toolType: TOOL_TYPE.NONE, toolTier: 0, mineEff: 1, atk: 0, placeTile: 0 };
});

export function getItemDef(id) {
  return itemDefs[id] || { id: 0, name: '未知', category: 'material', tileId: 0, stackLimit: 99, toolType: 'none', toolTier: 0, mineEff: 1, atk: 0, placeTile: 0 };
}

export function isBlockItem(id) {
  return getItemDef(id).category === ITEM_CAT.BLOCK;
}

export function isToolItem(id) {
  return getItemDef(id).category === ITEM_CAT.TOOL;
}