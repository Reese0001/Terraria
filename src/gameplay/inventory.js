import { INVENTORY_SIZE, HOTBAR_SIZE, STACK_LIMIT, clamp } from '../core/config.js';
import { getItemDef } from '../data/items.js';

// 背包系统
export class Inventory {
  constructor() {
    this.slots = new Array(INVENTORY_SIZE).fill(null);
    this.selectedSlot = 0;
  }

  // 添加物品，返回剩余未入包数量
  addItem(itemId, count = 1) {
    if (itemId <= 0 || count <= 0) return 0;
    const def = getItemDef(itemId);
    const limit = def.stackLimit;

    // 先堆叠到同id未满格
    let remaining = count;
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const s = this.slots[i];
      if (s && s.itemId === itemId && s.count < limit) {
        const add = Math.min(limit - s.count, remaining);
        s.count += add;
        remaining -= add;
      }
    }
    // 再填空格
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      if (!this.slots[i]) {
        const add = Math.min(limit, remaining);
        this.slots[i] = { itemId, count: add };
        remaining -= add;
      }
    }
    return remaining;
  }

  // 移除物品，返回是否成功
  removeItem(itemId, count = 1) {
    if (this.countItem(itemId) < count) return false;
    let remaining = count;
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const s = this.slots[i];
      if (s && s.itemId === itemId) {
        const take = Math.min(s.count, remaining);
        s.count -= take;
        remaining -= take;
        if (s.count <= 0) this.slots[i] = null;
      }
    }
    return remaining === 0;
  }

  // 统计物品总数
  countItem(itemId) {
    let total = 0;
    for (const s of this.slots) {
      if (s && s.itemId === itemId) total += s.count;
    }
    return total;
  }

  // 获取选中格物品
  getSelected() {
    return this.slots[this.selectedSlot];
  }

  // 设置选中格
  selectSlot(index) {
    if (index >= 0 && index < HOTBAR_SIZE) {
      this.selectedSlot = index;
    }
  }

  // 滚轮切换
  scrollSlot(dir) {
    this.selectedSlot = (this.selectedSlot + dir + HOTBAR_SIZE) % HOTBAR_SIZE;
  }

  // 获取快捷栏
  getHotbar() {
    return this.slots.slice(0, HOTBAR_SIZE);
  }

  // 清空
  clear() {
    this.slots.fill(null);
  }
}