// 方块类型定义表
// id: 0=空气 1=草 2=泥土 3=石头 4=木头 5=木板 6=铜矿 7=铁矿 8=金矿 9=钻石矿
// 10=工作台 11=火把 12=门 13=熔炉 14=基岩 15=树叶

export const TILE = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, PLANK: 5,
  COPPER_ORE: 6, IRON_ORE: 7, GOLD_ORE: 8, DIAMOND_ORE: 9,
  WORKBENCH: 10, TORCH: 11, DOOR: 12, FURNACE: 13, BEDROCK: 14, LEAF: 15
};

const tileDefs = [
  { id: 0,  name: 'air',       hardness: 0,   solid: false, breakable: false, dropId: 0,   minTier: 0, color: '#000000' },
  { id: 1,  name: 'grass',     hardness: 0.6, solid: true,  breakable: true,  dropId: 2,   minTier: 0, color: '#4CAF50' },
  { id: 2,  name: 'dirt',      hardness: 0.6, solid: true,  breakable: true,  dropId: 2,   minTier: 0, color: '#8B5A2B' },
  { id: 3,  name: 'stone',     hardness: 1.5, solid: true,  breakable: true,  dropId: 3,   minTier: 1, color: '#9E9E9E' },
  { id: 4,  name: 'wood',      hardness: 1.0, solid: true,  breakable: true,  dropId: 4,   minTier: 0, color: '#A1887F' },
  { id: 5,  name: 'plank',     hardness: 1.0, solid: true,  breakable: true,  dropId: 5,   minTier: 0, color: '#D7B899' },
  { id: 6,  name: 'copper_ore',hardness: 2.0, solid: true,  breakable: true,  dropId: 6,   minTier: 1, color: '#E08A4B' },
  { id: 7,  name: 'iron_ore',  hardness: 2.5, solid: true,  breakable: true,  dropId: 7,   minTier: 2, color: '#D8B89C' },
  { id: 8,  name: 'gold_ore',  hardness: 3.0, solid: true,  breakable: true,  dropId: 8,   minTier: 3, color: '#FFD700' },
  { id: 9,  name: 'diamond_ore',hardness:4.0, solid: true,  breakable: true,  dropId: 9,   minTier: 3, color: '#66E0FF' },
  { id: 10, name: 'workbench', hardness: 1.0, solid: true,  breakable: true,  dropId: 10,  minTier: 0, color: '#B8860B' },
  { id: 11, name: 'torch',     hardness: 0.1, solid: false, breakable: true,  dropId: 11,  minTier: 0, color: '#FFB347' },
  { id: 12, name: 'door',      hardness: 1.0, solid: false, breakable: true,  dropId: 12,  minTier: 0, color: '#A1887F' },
  { id: 13, name: 'furnace',   hardness: 2.0, solid: true,  breakable: true,  dropId: 13,  minTier: 1, color: '#616161' },
  { id: 14, name: 'bedrock',   hardness: 999, solid: true,  breakable: false, dropId: 0,   minTier: 99,color: '#2A2A2A' },
  { id: 15, name: 'leaf',      hardness: 0.3, solid: false, breakable: true,  dropId: 0,   minTier: 0, color: '#66BB6A' }
];

const nameToId = {};
tileDefs.forEach(d => { nameToId[d.name] = d.id; });

export function getTileDef(id) {
  if (id < 0 || id >= tileDefs.length) return tileDefs[0];
  return tileDefs[id];
}

export function getTileIdByName(name) {
  return nameToId[name] !== undefined ? nameToId[name] : 0;
}

export function isSolidTile(id) {
  return getTileDef(id).solid;
}

export function isBreakableTile(id) {
  return getTileDef(id).breakable;
}