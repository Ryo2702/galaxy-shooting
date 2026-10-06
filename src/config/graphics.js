export const graphicsPresets = {
  LOW: {
    particles: 1600,
    galaxyParticles: 2200,
    debris: 30,
    dpr: 1,
    bloom: false,
    segments: 32,
  },
  MEDIUM: {
    particles: 3200,
    galaxyParticles: 5000,
    debris: 65,
    dpr: 1.4,
    bloom: false,
    segments: 48,
  },
  HIGH: {
    particles: 5500,
    galaxyParticles: 8500,
    debris: 100,
    dpr: 1.75,
    bloom: true,
    segments: 64,
  },
};

export function resolveQuality(
  mode,
  device = globalThis.navigator,
  width = globalThis.innerWidth,
) {
  if (graphicsPresets[mode]) return mode;
  if (
    width < 768 ||
    (device?.deviceMemory && device.deviceMemory < 4) ||
    (device?.hardwareConcurrency && device.hardwareConcurrency < 4)
  )
    return 'LOW';
  return (device?.hardwareConcurrency ?? 4) >= 8 ? 'HIGH' : 'MEDIUM';
}
