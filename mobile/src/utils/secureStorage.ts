import EncryptedStorage from 'react-native-encrypted-storage';

const secureStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await EncryptedStorage.getItem(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await EncryptedStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await EncryptedStorage.removeItem(name);
    },
};

export default secureStorage;
