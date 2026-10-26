const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const root = process.env.SHARITY_WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
const ui = path.join(root, 'sharity-app-ui');
const localRequire = createRequire(path.join(ui, 'package.json'));
const cli = path.join(path.dirname(localRequire.resolve('@playwright/test')), 'cli.js');
for (const item of [
  { file: 'feature-boundaries.spec.ts', grep: 'rewards', name: 'quality-rewards-final' },
  { file: 'screen-audit.spec.ts', grep: 'refund-request', name: 'quality-recovery-final' },
  { file: 'catalog-integrity.spec.ts', grep: 'out-of-stock', name: 'quality-stock-final' },
]) {
  const out = fs.openSync(path.join(root, `outputs/${item.name}.log`), 'w');
  const err = fs.openSync(path.join(root, `outputs/${item.name}.err.log`), 'w');
  const result = spawnSync(process.execPath, [cli, 'test', item.file, '--grep', item.grep, '--workers=2', '--reporter=list,json'], {
    cwd: ui, env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: path.join(root, `outputs/${item.name}.json`) },
    stdio: ['ignore', out, err],
  });
  fs.closeSync(out); fs.closeSync(err);
  if (result.status !== 0) { console.error(`${item.name} failed; inspect its report.`); process.exit(1); }
  console.log(`${item.name} passed`);
}
