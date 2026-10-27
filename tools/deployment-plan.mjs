import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { imagePlan, root } from './lib.mjs';
try {
  const [name, requestedTag] = process.argv.slice(2);
  if (!name) throw new Error('Specify a component, for example: npm run deploy:plan -- marketplace-service');
  const tag = requestedTag || execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: root }).toString().trim();
  const plan = imagePlan(name, tag);
  const releaseFile = `outputs/plans/${name}-${tag}.env`;
  mkdirSync(resolve(root, 'outputs/plans'), { recursive: true });
  writeFileSync(resolve(root, releaseFile), `${plan.imageVariable}=${plan.image}\n`);
  const compose = ['docker', 'compose', '--project-name', 'sharity-monorepo', '--env-file', 'deployments/.env', '--env-file', releaseFile, '-f', 'deployments/docker-compose.yml'];
  console.log(JSON.stringify({ ...plan, dockerBuild: ['docker', 'build', '--build-context', 'deployment=./deployments', '-f', plan.dockerfile, '-t', plan.image, plan.context],
    releaseFile, pull: [...compose, 'pull', plan.composeService], rollout: [...compose, 'up', '-d', '--no-deps', '--no-build', plan.composeService],
    note: 'Plan only; the generated file contains only the selected image reference. Configure deployments/.env privately for the target. Existing live deployment is unchanged.' }, null, 2));
} catch (error) { console.error(error.message); process.exit(2); }
