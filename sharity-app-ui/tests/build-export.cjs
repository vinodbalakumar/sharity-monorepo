const { spawnSync } = require('node:child_process');
// A deterministic production export with same-origin API defaults. Never bake
// workstation .env.local LAN addresses into cross-browser test artifacts.
// Local UI iteration may reuse transforms only when these API defaults are unchanged.
// CI and the default command always clear the cache to prevent stale environment values.
const cacheArgs = process.argv.includes('--incremental') && !process.env.CI ? [] : ['--clear'];
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'export', ...cacheArgs, '--platform', 'web', '--output-dir', 'dist-e2e'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_BFF_BASE_URL: '/bff',
    EXPO_PUBLIC_BFF_PUBLIC_BASE_URL: '',
    EXPO_PUBLIC_MARKETPLACE_BASE_URL: '/marketplace-service/api/v1/marketplace',
    EXPO_PUBLIC_AUTH_USER_BASE_URL: '/bff/api/authorization-server/api/v1'
  }
});
process.exit(result.status ?? 1);
