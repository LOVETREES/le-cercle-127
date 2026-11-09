import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Jeton de session : trousseau sécurisé (iOS Keychain / Android Keystore).
// Sur le web (aperçu de développement uniquement), repli sur AsyncStorage.
export const secure = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

// Données locales non secrètes (brouillons, cache du Grimoire, réglages).
export const local = {
  async getJson<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  async setJson(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(keys: string[]): Promise<void> {
    await AsyncStorage.multiRemove(keys);
  },
};

export const KEYS = {
  token: 'c127.token',
  user: 'c127.user',
  drafts: 'c127.drafts',
  cache: 'c127.dreams-cache',
  reminder: 'c127.reminder',
  oniRequested: 'c127.oni-requested',
  demoActive: 'c127.demo-active',
  demoDreams: 'c127.demo-dreams',
  voiceNotes: 'c127.voice-notes',
  demoVoiceNotes: 'c127.demo-voice-notes',
  journal: 'c127.reality-journal',
  demoJournal: 'c127.demo-reality-journal',
  pendingTranscript: 'c127.pending-transcript',
  palmReadings: 'c127.palm-readings',
  lang: 'c127.lang',
  presenceDays: 'c127.presence-days',
  emotions: 'c127.emotions',
  rituel: 'c127.rituel',
  portes: 'c127.portes',
  demoPendingTranscript: 'c127.demo-pending-transcript',
} as const;
