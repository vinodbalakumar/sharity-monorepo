const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const imageSize = require('../tools/image-size-compat/index.cjs');
const metroRequire = require('node:module').createRequire(require.resolve('metro'));
const asset = path.resolve(__dirname, '../assets/favicon.png');
test('patched image parser supports Metro file paths and byte buffers', () => {
  const fromFile = imageSize(asset);
  assert.ok(fromFile.width > 0 && fromFile.height > 0);
  assert.deepEqual(imageSize(fs.readFileSync(asset)), fromFile);
  assert.deepEqual(imageSize.imageSize(asset), fromFile);
  assert.deepEqual(imageSize.default(asset), fromFile);
  assert.deepEqual(metroRequire('image-size')(asset), fromFile);
});
test('unsupported or missing input fails explicitly', () => {
  assert.throws(() => imageSize(Buffer.from('invalid image')));
  assert.throws(() => imageSize(path.join(__dirname, 'missing-image.png')));
});
