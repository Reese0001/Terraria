import { HOTBAR_SIZE } from '../core/config.js';

// 输入系统 - 键盘/鼠标事件采集与指令分发
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keysDown = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseLeft = false;
    this.mouseRight = false;
    this.mouseInGame = true;
    this.wheelDelta = 0;

    // 边沿触发事件 (每帧消费后清空)
    this.jumpPressed = false;
    this.inventoryToggled = false;
    this.slotPressed = -1;
    this.escapePressed = false;
    this.leftClickPressed = false;  // 单次点击事件
    this.rightClickPressed = false;
    this.craftClicked = -1; // 点击的配方索引
    this.uiClickX = -1;
    this.uiClickY = -1;

    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('wheel', (e) => this._onWheel(e));
    this.canvas.addEventListener('mouseleave', () => { this.mouseInGame = false; });
    this.canvas.addEventListener('mouseenter', () => { this.mouseInGame = true; });
  }

  _onKeyDown(e) {
    const code = e.code;
    if (this.keysDown.has(code)) return; // 持续按住不重复触发
    this.keysDown.add(code);

    if (code === 'Space') { this.jumpPressed = true; e.preventDefault(); }
    if (code === 'KeyE') this.inventoryToggled = true;
    if (code === 'Escape') this.escapePressed = true;
    // 数字键1-9
    for (let i = 1; i <= 9; i++) {
      if (code === 'Digit' + i) this.slotPressed = i - 1;
    }
  }

  _onKeyUp(e) {
    this.keysDown.delete(e.code);
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  _onMouseDown(e) {
    if (e.button === 0) { this.mouseLeft = true; this.leftClickPressed = true; this.uiClickX = this.mouseX; this.uiClickY = this.mouseY; }
    if (e.button === 2) { this.mouseRight = true; this.rightClickPressed = true; }
  }

  _onMouseUp(e) {
    if (e.button === 0) this.mouseLeft = false;
    if (e.button === 2) this.mouseRight = false;
  }

  _onWheel(e) {
    this.wheelDelta += Math.sign(e.deltaY);
    e.preventDefault();
  }

  isLeft() { return this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft'); }
  isRight() { return this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight'); }
  isUp() { return this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp'); }
  isDown() { return this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown'); }

  // 每帧末清空边沿事件
  endFrame() {
    this.jumpPressed = false;
    this.inventoryToggled = false;
    this.slotPressed = -1;
    this.escapePressed = false;
    this.leftClickPressed = false;
    this.rightClickPressed = false;
    this.craftClicked = -1;
    this.uiClickX = -1;
    this.uiClickY = -1;
    this.wheelDelta = 0;
  }
}