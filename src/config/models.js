// Set a URL to replace a procedural model. Null keeps the zero-download version.
export const models = {
  spaceship: null,
  enemy: null,
  asteroid: null,
  planet: null,
  station: null,
  portal: null,
  projectile: null,
};
export const modelCompression = {
  dracoPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
  ktx2Path: null,
};
// To use KTX2, host Three's basis transcoder in public/basis/ and set ktx2Path to '/basis/'.
