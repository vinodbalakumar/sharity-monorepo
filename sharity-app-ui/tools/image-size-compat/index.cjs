// Metro in Expo SDK 54 passes file paths; image-size 2 accepts only byte arrays.
// Keep the patched parser and adapt the old synchronous local-file API.
const fs = require('node:fs');
const engine = require('image-size-engine');
function imageSize(input) {
  return engine.imageSize(typeof input === 'string' ? fs.readFileSync(input) : input);
}
Object.assign(imageSize, engine, { imageSize, default: imageSize });
module.exports = imageSize;
