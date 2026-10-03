// 值噪声 + 分形布朗运动 (fBm)
// 基于种子的确定性伪随机，双线性插值 + smoothstep 平滑

function hash2(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695040888963407) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = (h * 1274126177) | 0;
  h = (h ^ (h >>> 16)) | 0;
  return ((h >>> 0) / 4294967295);
}

function smooth(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function valueNoise(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = x0 + 1, y1 = y0 + 1;
  const sx = smooth(x - x0), sy = smooth(y - y0);
  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x1, y0, seed);
  const n01 = hash2(x0, y1, seed);
  const n11 = hash2(x1, y1, seed);
  const ix0 = lerp(n00, n10, sx);
  const ix1 = lerp(n01, n11, sx);
  return lerp(ix0, ix1, sy);
}

export function fBm(x, y, seed, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
  let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise(x * frequency, y * frequency, seed + i * 101) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return total / maxValue;
}