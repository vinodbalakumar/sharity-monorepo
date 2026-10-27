import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const workspace = JSON.parse(readFileSync(resolve(root, 'workspace.json'), 'utf8'));
export const components = workspace.components;
export function component(name) {
  const found = components.find(entry => entry.name === name);
  if (!found) throw new Error(`Unknown component: ${name}`);
  return found;
}
export function affectedBy(paths, entries = components) {
  const names = new Set(entries.map(entry => entry.name));
  const normal = paths.map(path => path.replaceAll('\\', '/').replace(/^\.\//, ''));
  const global = normal.some(path => ['workspace.json', 'pom.xml', 'package.json', 'package-lock.json'].includes(path)
    || path.startsWith('tools/') || path.startsWith('.github/workflows/') || path.startsWith('contracts/'));
  if (global) return entries.filter(entry => !entry.optional).map(entry => entry.name);
  const selected = new Set();
  for (const path of normal) {
    if (path.startsWith('deployments/') && !path.startsWith('deployments/docs/') && !path.endsWith('.md')) {
      entries.filter(entry => !entry.optional).forEach(entry => selected.add(entry.name));
    }
    for (const entry of entries) {
      if (path === entry.path || path.startsWith(`${entry.path}/`)) {
        if (!path.includes('/docs/') && !path.endsWith('.md')) selected.add(entry.name);
      }
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of entries) {
      if (!selected.has(entry.name) && !entry.optional && entry.dependsOn.some(dep => names.has(dep) && selected.has(dep))) {
        selected.add(entry.name); changed = true;
      }
    }
  }
  return entries.filter(entry => selected.has(entry.name)).map(entry => entry.name);
}
export function tasksFor(entry, task) {
  if (task === 'install') return ['storefront', 'admin'].includes(entry.kind) ? [['npm', ['ci']]] : [];
  if (entry.kind === 'java') return [['mvn', ['-B', '-ntp', task === 'verify' ? 'verify' : 'package', ...(task === 'build' ? ['-DskipTests'] : [])]]];
  if (entry.kind === 'storefront') return task === 'verify'
    ? [['npm', ['run', 'typecheck']], ['npm', ['run', 'test:assets']], ['npm', ['run', 'build:e2e']]]
    : [['npm', ['run', 'build:e2e']]];
  if (entry.kind === 'admin') return [['npm', ['run', 'build']]];
  return [['node', ['tools/check-workspace.mjs']]];
}
export function imagePlan(name, tag) {
  const entry = component(name);
  if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/.test(tag)) throw new Error('Invalid image tag');
  if (entry.kind === 'infrastructure') throw new Error('Nginx uses the reviewed upstream image and deployment configuration');
  const dockerfile = entry.kind === 'java' ? 'verified-java.Dockerfile' : entry.kind === 'storefront' ? 'verified-web.Dockerfile' : 'verified-admin.Dockerfile';
  return { component: name, context: entry.path, dockerfile: `deployments/dockerfiles/${dockerfile}`,
    deploymentContext: 'deployments', composeService: entry.composeService, imageVariable: entry.imageVariable,
    image: `ghcr.io/${workspace.repository}/${name}:${tag}`, health: entry.health };
}
