import { appendFileSync } from 'node:fs';
import { imagePlan } from './lib.mjs';
const [name, tag] = process.argv.slice(2);
const plan = imagePlan(name, tag);
if (!process.env.GITHUB_OUTPUT) throw new Error('This helper runs in GitHub Actions');
for (const key of ['context', 'dockerfile', 'image']) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${plan[key]}\n`);
