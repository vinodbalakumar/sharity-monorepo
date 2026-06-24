import { Platform } from 'react-native';
const memoryStore = new Map();
function createNativeStorage() {
    if (Platform.OS === 'web') {
        return {
            getString(key) {
                try {
                    const storage = globalThis.localStorage;
                    return storage ? storage.getItem(key) : null;
                }
                catch {
                    return null;
                }
            },
            remove(key) {
                try {
                    const storage = globalThis.localStorage;
                    if (storage) {
                        storage.removeItem(key);
                    }
                }
                catch {
                    // Ignore web storage failures.
                }
            },
            setString(key, value) {
                try {
                    const storage = globalThis.localStorage;
                    if (storage) {
                        storage.setItem(key, value);
                    }
                }
                catch {
                    // Ignore web storage failures.
                }
            }
        };
    }
    try {
        // MMKV is not available in Expo Go, so fall back safely when native init fails.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createMMKV } = require('react-native-mmkv');
        const mmkv = createMMKV({ id: 'sharity-app' });
        return {
            getString(key) {
                return mmkv.getString(key) ?? null;
            },
            remove(key) {
                mmkv.remove(key);
            },
            setString(key, value) {
                mmkv.set(key, value);
            }
        };
    }
    catch {
        return {
            getString(key) {
                return memoryStore.get(key) ?? null;
            },
            remove(key) {
                memoryStore.delete(key);
            },
            setString(key, value) {
                memoryStore.set(key, value);
            }
        };
    }
}
const storage = createNativeStorage();
export const appStorage = {
    async getItem(key) {
        return storage.getString(key);
    },
    getString(key) {
        return storage.getString(key);
    },
    async removeItem(key) {
        storage.remove(key);
    },
    remove(key) {
        storage.remove(key);
    },
    async setItem(key, value) {
        storage.setString(key, value);
    },
    setString(key, value) {
        storage.setString(key, value);
    }
};
