import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

type StorageValue = string | null;

const nativeStorage = Platform.OS === 'web' ? null : createMMKV({ id: 'sharity-app' });

export const appStorage = {
  getString(key: string): StorageValue {
    if (Platform.OS === 'web') {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    }
    return nativeStorage?.getString(key) ?? null;
  },
  remove(key: string) {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    nativeStorage?.remove(key);
  },
  setString(key: string, value: string) {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    nativeStorage?.set(key, value);
  }
};
