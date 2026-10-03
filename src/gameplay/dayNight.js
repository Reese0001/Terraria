import { DAY_LENGTH_MS, PHASE_RATIOS, SKY_COLORS, DAYNIGHT_PHASES, clamp } from '../core/config.js';

// 昼夜系统
const PHASE_ORDER = [DAYNIGHT_PHASES.DAY, DAYNIGHT_PHASES.DUSK, DAYNIGHT_PHASES.NIGHT, DAYNIGHT_PHASES.DAWN];
const NEXT_PHASE = {
  DAY: DAYNIGHT_PHASES.DUSK,
  DUSK: DAYNIGHT_PHASES.NIGHT,
  NIGHT: DAYNIGHT_PHASES.DAWN,
  DAWN: DAYNIGHT_PHASES.DAY
};

function lerpColor(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}

export class DayNight {
  constructor() {
    this.phase = DAYNIGHT_PHASES.DAY;
    this.phaseProgress = 0;
    this.day = 1;
    this.totalTime = 0;
  }

  phaseDuration() {
    return DAY_LENGTH_MS * PHASE_RATIOS[this.phase];
  }

  update(dt) {
    this.totalTime += dt;
    this.phaseProgress += dt / this.phaseDuration();
    if (this.phaseProgress >= 1.0) {
      this.phaseProgress = 0;
      this.phase = NEXT_PHASE[this.phase];
      if (this.phase === DAYNIGHT_PHASES.DAY) {
        this.day++;
      }
    }
  }

  // 获取整个昼夜周期进度 0-1
  getCycleT() {
    let t = 0;
    for (const p of PHASE_ORDER) {
      if (p === this.phase) {
        t += this.phaseProgress * PHASE_RATIOS[p];
        break;
      }
      t += PHASE_RATIOS[p];
    }
    return t;
  }

  // 天空颜色
  getSkyColor() {
    const cur = SKY_COLORS[this.phase];
    const next = SKY_COLORS[NEXT_PHASE[this.phase]];
    return lerpColor(cur, next, this.phaseProgress);
  }

  // 环境光强度 [0.15, 1.0]
  getAmbientLight() {
    switch (this.phase) {
      case DAYNIGHT_PHASES.DAY: return 1.0;
      case DAYNIGHT_PHASES.DUSK: return 1.0 - this.phaseProgress * 0.6;
      case DAYNIGHT_PHASES.NIGHT: return 0.4 - this.phaseProgress * 0.25;
      case DAYNIGHT_PHASES.DAWN: return 0.15 + this.phaseProgress * 0.85;
    }
    return 1.0;
  }

  isNight() {
    return this.phase === DAYNIGHT_PHASES.NIGHT || this.phase === DAYNIGHT_PHASES.DUSK;
  }

  isDeepNight() {
    return this.phase === DAYNIGHT_PHASES.NIGHT;
  }
}