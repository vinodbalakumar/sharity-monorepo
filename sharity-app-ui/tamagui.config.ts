import { config } from '@tamagui/config';
import { Platform } from 'react-native';
import { createTamagui } from 'tamagui';

const family = Platform.select({ web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', ios: 'System', default: 'sans-serif' });
export const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    ...config.fonts,
    body: { ...config.fonts.body, family },
    heading: { ...config.fonts.heading, family }
  }
});

export default tamaguiConfig;

type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
