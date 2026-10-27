import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { root, components } from './lib.mjs';

const ids = new Set(components.map(entry => entry.name));
assert.equal(ids.size, components.length, 'Component IDs must be unique');
for (const entry of components) {
  assert.match(entry.path, /^[a-z0-9-]+$/, 'Component paths must remain within the repository');
  assert.ok(existsSync(resolve(root, entry.path)), `Missing component ${entry.name}`);
  assert.ok(!existsSync(resolve(root, entry.path, '.git')), `Nested Git repository: ${entry.name}`);
  for (const dependency of entry.dependsOn) assert.ok(ids.has(dependency), `Unknown dependency ${dependency}`);
  assert.ok(existsSync(resolve(root, entry.path, entry.kind === 'java' ? 'pom.xml' : entry.kind === 'infrastructure' ? 'docker-compose.yml' : 'package-lock.json')));
}
const index = execFileSync('git', ['ls-files', '--stage', '-z'], { cwd: root }).toString().split('\0').filter(Boolean);
for (const row of index) {
  assert.ok(!row.startsWith('160000 '), 'Git submodules are not component imports');
  const path = row.split('\t')[1];
  assert.ok(!/(^|\/)(node_modules|target|\.deployment-private|\.migration-private|test-results|dist-e2e)(\/|$)/.test(path), `Generated/private file tracked: ${path}`);
  assert.ok(!/(^|\/)\.env(?:\.|$)/.test(path) || /\.env\.(example|prod|qa)$/.test(path), `Local environment tracked: ${path}`);
  const content = readFileSync(resolve(root, path));
  if (content.length < 15000000 && !content.subarray(0, 4096).includes(0)) {
    const text = content.toString('utf8');
    assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s*[A-Za-z0-9+/=\r\n]{100,}-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text), `Private key tracked: ${path}`);
    assert.ok(!/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|(?:AKIA|ASIA)[A-Z0-9]{16})\b/.test(text), `Credential-shaped value tracked: ${path}`);
  }
}
const sources = JSON.parse(readFileSync(resolve(root, 'docs/migration/sources.json'), 'utf8'));
for (const source of sources.sources) {
  assert.equal(source.originalCommitCount, source.importedCommitCount, `Commit count mismatch: ${source.name}`);
  execFileSync('git', ['merge-base', '--is-ancestor', source.importedCommit, 'HEAD'], { cwd: root });
}
console.log(`Workspace valid: ${components.length} components; ${sources.sources.reduce((sum, source) => sum + source.originalCommitCount, 0)} source commits preserved; no nested component repositories.`);
