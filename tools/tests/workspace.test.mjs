import test from 'node:test';
import assert from 'node:assert/strict';
import { affectedBy, components, imagePlan, tasksFor } from '../lib.mjs';

test('a storefront-only change does not rebuild backend services', () => {
  assert.deepEqual(affectedBy(['sharity-app-ui/src/App.tsx']), ['sharity-app-ui']);
});
test('marketplace API changes include consumers and transitive BFF dependencies', () => {
  const affected = affectedBy(['marketplace-service/src/main/java/Listing.java']);
  for (const name of ['marketplace-service', 'platform-ai-service', 'platform-web-bff', 'sharity-app-ui', 'sharity-admin-portal']) assert.ok(affected.includes(name));
  assert.ok(!affected.includes('authorization-server'));
});
test('shared configuration and contracts check all core components', () => {
  for (const path of ['workspace.json', 'pom.xml', 'contracts/marketplace.yaml', 'tools/lib.mjs']) {
    assert.equal(affectedBy([path]).length, components.filter(entry => !entry.optional).length);
  }
});
test('documentation alone does not schedule application builds', () => {
  assert.deepEqual(affectedBy(['README.md', 'marketplace-service/README.md', 'deployments/docs/sharity/guide.md']), []);
});
test('Windows paths, removals, and optional integration changes select their owners', () => {
  assert.deepEqual(affectedBy(['sharity-admin-portal\\src\\Removed.jsx']), ['sharity-admin-portal']);
  assert.deepEqual(affectedBy(['tesla-dashboard-services/pom.xml']), ['tesla-dashboard-services']);
});
test('dependency traversal terminates for cycles', () => {
  const entries = [{ name: 'a', path: 'a', dependsOn: ['b'] }, { name: 'b', path: 'b', dependsOn: ['a'] }];
  assert.deepEqual(affectedBy(['a/file.java'], entries), ['a', 'b']);
});
test('image plans use only the selected component and its verified artifact', () => {
  const plan = imagePlan('marketplace-service', 'abc123');
  assert.equal(plan.context, 'marketplace-service');
  assert.equal(plan.composeService, 'marketplace-service');
  assert.equal(plan.imageVariable, 'MARKETPLACE_SERVICE_IMAGE');
  assert.equal(plan.dockerfile, 'deployments/dockerfiles/verified-java.Dockerfile');
  assert.throws(() => imagePlan('../../outside', 'abc123'));
  assert.throws(() => imagePlan('marketplace-service', 'bad;command'));
});
test('deployment configuration changes verify every core component', () => {
  assert.equal(affectedBy(['deployments/docker-compose.yml']).length, components.filter(entry => !entry.optional).length);
});
test('verification runs tests, while builds can package a previously verified service', () => {
  const entry = components.find(component => component.name === 'marketplace-service');
  assert.deepEqual(tasksFor(entry, 'verify')[0][1], ['-B', '-ntp', 'verify']);
  assert.ok(!tasksFor(entry, 'verify')[0][1].includes('-DskipTests'));
});
