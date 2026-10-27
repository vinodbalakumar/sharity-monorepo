import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { components, root, tasksFor } from './lib.mjs';

const [task, selector = 'all', ...flags] = process.argv.slice(2);
if (task === 'list') {
  console.table(components.map(({ name, kind, optional }) => ({ component: name, kind, optional: !!optional })));
  process.exit(0);
}
if (!['install', 'verify', 'build'].includes(task) || flags.some(flag => !['--dry-run', '--include-optional'].includes(flag))) {
  console.error('Usage: node tools/workspace.mjs list|install|verify|build [all|apps|component] [--dry-run] [--include-optional]');
  process.exit(2);
}
const selected = components.filter(entry => selector === 'all' ? !entry.optional || flags.includes('--include-optional')
  : selector === 'apps' ? ['storefront', 'admin'].includes(entry.kind) : entry.name === selector);
if (!selected.length) { console.error(`Unknown component: ${selector}`); process.exit(2); }
for (const entry of selected) {
  for (const [command, args] of tasksFor(entry, task)) {
    const cwd = entry.kind === 'infrastructure' ? root : resolve(root, entry.path);
    console.log(`[${entry.name}] ${command} ${args.join(' ')}`);
    if (flags.includes('--dry-run')) continue;
    let executable = command;
    let parameters = args;
    if (process.platform === 'win32' && command === 'npm') {
      executable = process.execPath;
      parameters = [resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), ...args];
    } else if (process.platform === 'win32' && command === 'mvn') {
      // Maven's Windows entry point is a batch file. Only fixed task arguments enter cmd.
      if (args.some(arg => !/^[A-Za-z0-9=-]+$/.test(arg))) throw new Error('Unsafe Maven argument');
      executable = process.env.ComSpec || 'cmd.exe';
      parameters = ['/d', '/s', '/c', `mvn.cmd ${args.join(' ')}`];
    }
    const result = spawnSync(executable, parameters, { cwd, stdio: 'inherit', shell: false });
    if (result.error) { console.error(result.error.message); process.exit(1); }
    if (result.status !== 0) process.exit(result.status || 1);
  }
}
