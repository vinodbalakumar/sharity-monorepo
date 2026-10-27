import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { affectedBy, components, root } from './lib.mjs';

const [base, head = 'HEAD'] = process.argv.slice(2);
const names = !base || /^0+$/.test(base) ? components.filter(entry => !entry.optional).map(entry => entry.name)
  : affectedBy(execFileSync('git', ['diff', '--name-only', '-z', base, head], { cwd: root }).toString().split('\0').filter(Boolean));
const matrix = names.map(name => components.find(entry => entry.name === name));
console.log(JSON.stringify(matrix));
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(matrix)}\nany=${matrix.length > 0}\n`);
