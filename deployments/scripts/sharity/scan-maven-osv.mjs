import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Generate build-resolved runtime/test inventories after Maven verify:
// python scripts/extract-maven-dependencies.py
// Public dependency coordinates only are sent to OSV. No source or credentials.
const root = path.resolve(process.env.SHARITY_WORKSPACE_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../springbootrestdemo'));
const modules = ['authorization-server','marketplace-service','payment-service','wallet-service','platform-web-bff','tesla-dashboard-services','platform-ai-service'];
const packages = new Map();
const failures = [];
for (const module of modules) {
  try {
    const contents = await readFile(path.join(root, module, 'target/runtime-dependencies.txt'), 'utf8');
    let found = 0;
    for (const line of contents.split(/\r?\n/)) {
      const coordinate = line.trim().split(/\s+/)[0].split(':');
      const scope = coordinate.at(-1);
      if (!['compile','runtime'].includes(scope) || coordinate.length < 5) continue;
      const name = coordinate.slice(0,2).join(':');
      const version = coordinate.at(-2);
      const key = `${name}@${version}`;
      if (!packages.has(key)) packages.set(key, { name, version, modules: [] });
      packages.get(key).modules.push(module);
      found++;
    }
    if (!found) failures.push(`${module}: no resolved dependencies found`);
  } catch { failures.push(`${module}: dependency list unavailable`); }
}
const entries = [...packages.values()];
const findings = [];
for (let i=0; i<entries.length; i+=100) {
  const batch = entries.slice(i,i+100);
  try {
    const response = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: batch.map(p => ({ package: { ecosystem: 'Maven', name: p.name }, version: p.version })) }),
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { results } = await response.json();
    if (!Array.isArray(results) || results.length !== batch.length) throw new Error('Incomplete response');
    results.forEach((result, index) => {
      if (result.vulns?.length) findings.push({ ...batch[index], vulnerabilities: result.vulns.map(v => ({ id: v.id, url: `https://osv.dev/vulnerability/${v.id}` })) });
    });
  } catch (error) { failures.push(`Batch ${i}: ${error.message}`); }
}
await mkdir(path.join(root,'outputs'), { recursive: true });
await writeFile(path.join(root,'outputs/backend-osv-audit.json'), JSON.stringify({ checkedAt: new Date().toISOString(), scope: 'runtime and test classpaths; findings require applicability review', uniquePackages: entries.length, modules, failures, findings }, null, 2));
console.log(JSON.stringify({ uniquePackages: entries.length, incompleteChecks: failures.length, affectedPackages: findings.length }));
if (failures.length || findings.length) process.exitCode=1;
