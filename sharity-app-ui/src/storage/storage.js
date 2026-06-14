import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
const nativeStorage = Platform.OS === 'web' ? null : createMMKV({ id: 'sharity-app' });
export const appStorage = {
    getString(key) {
        if (Platform.OS === 'web') {
            return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
        }
        return nativeStorage?.getString(key) ?? null;
    },
    remove(key) {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
            return;
        }
        nativeStorage?.remove(key);
    },
    setString(key, value) {
        if (Platform.OS === 'web') {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
            return;
        }
        nativeStorage?.set(key, value);
    }
};
