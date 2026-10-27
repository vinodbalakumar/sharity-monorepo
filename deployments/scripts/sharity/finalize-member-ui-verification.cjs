const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const workspace = process.env.SHARITY_WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
const output = path.join(workspace, 'outputs');
const read = name => JSON.parse(fs.readFileSync(path.join(output, name), 'utf8').replace(/^\uFEFF/, ''));
const baseline = read('member-ui-baseline.json');
const final = read('member-ui-final-checks.json');
function cases(report) {
  const result = [];
  function visit(suites) {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) result.push({ title: spec.title, project: test.projectName, status: test.status });
      }
      visit(suite.suites);
    }
  }
  visit(report.suites);
  return result;
}
const finalCases = cases(final);
const failures = cases(baseline).filter(test => test.status === 'unexpected');
const resolved = failures.filter(failed => finalCases.some(test => test.title === failed.title && test.project === failed.project && test.status === 'expected'));
if (failures.length !== baseline.stats.unexpected || resolved.length !== failures.length) throw new Error('A baseline failure has no passing final recheck.');
if (final.stats.unexpected || final.stats.flaky || final.stats.skipped || final.errors?.length) throw new Error('Final focused verification did not pass cleanly.');
if (finalCases.length !== final.stats.expected || !['chromium','firefox','webkit'].every(project => finalCases.some(test => test.project === project))) throw new Error('Final browser coverage is incomplete.');
const bundleDir = path.join(workspace, 'sharity-app-ui/dist-e2e/_expo/static/js/web');
const bundles = fs.readdirSync(bundleDir).filter(name => /^index-.*\.js$/.test(name));
if (bundles.length !== 1) throw new Error('Expected exactly one exported entry bundle.');
const bundle = path.join(bundleDir, bundles[0]);
if (fs.statSync(bundle).mtimeMs > Date.parse(final.stats.startTime)) throw new Error('Export changed after final verification started.');
const record = {
  validationMode: 'full-baseline-plus-focused-final',
  checkedAt: new Date().toISOString(), baselineStats: baseline.stats,
  baselineBundleSha256: read('member-ui-baseline-bundle.json').bundleSha256,
  resolvedBaselineFailures: resolved.map(test => ({title:test.title, project:test.project, baselineStatus:test.status, finalStatus:'expected'})),
  unresolvedFailures: failures.length - resolved.length,
  stats: final.stats, bundle: bundles[0],
  bundleSha256: crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),
};
fs.writeFileSync(path.join(output, 'member-ui-verified.json'), JSON.stringify(record, null, 2));
console.log(JSON.stringify(record));
