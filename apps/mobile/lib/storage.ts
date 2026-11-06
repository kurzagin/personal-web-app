import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ENDPOINT: '@kurzagin:endpoint',
  TOKEN: '@kurzagin:token',
  USERNAME: '@kurzagin:username',
} as const;

export const DEFAULT_ENDPOINT = 'https://kurzagin.com';

export interface StoredSession {
  endpoint: string;
  token: string | null;
  username: string | null;
}

export async function loadStoredSession(): Promise<StoredSession> {
  try {
    const [endpoint, token, username] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ENDPOINT),
      AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.USERNAME),
    ]);
    return {
      endpoint: endpoint || DEFAULT_ENDPOINT,
      token: token || null,
      username: username || null,
    };
  } catch (err) {
    console.warn('Failed to load session from storage:', err);
    return {
      endpoint: DEFAULT_ENDPOINT,
      token: null,
      username: null,
    };
  }
}

export async function saveStoredSession(endpoint: string, token: string, username: string): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ENDPOINT, endpoint.trim()),
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token.trim()),
      AsyncStorage.setItem(STORAGE_KEYS.USERNAME, username.trim()),
    ]);
  } catch (err) {
    console.warn('Failed to save session to storage:', err);
  }
}

export async function clearStoredSession(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USERNAME),
    ]);
  } catch (err) {
    console.warn('Failed to clear session:', err);
  }
}
