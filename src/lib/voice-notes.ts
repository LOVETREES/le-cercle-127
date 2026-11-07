import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { KEYS, local } from './storage';

export type VoiceNote = { id: string; createdAt: string; durationMillis: number; uri: string; transcript?: string };
type StoredNote = Omit<VoiceNote, 'uri'> & { filename?: string; blob?: Blob };
const DB_NAME = 'c127-voice-notes';
const generations = { personal: 0, demo: 0 };

async function withVoiceStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>, demo = false): Promise<T> {
  if (typeof indexedDB === 'undefined') throw new Error('Le stockage vocal est indisponible dans ce navigateur.');
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME + (demo ? '-demo' : ''), 1);
    request.onupgradeneeded = () => request.result.createObjectStore('notes', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Impossible d’ouvrir le carnet vocal local.'));
    request.onblocked = () => reject(new Error('Fermez les autres onglets du carnet vocal puis réessayez.'));
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('notes', mode);
      const request = operation(transaction.objectStore('notes'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(new Error('Le carnet vocal n’a pas pu être enregistré. Vérifiez l’espace disponible.'));
      transaction.onabort = () => reject(new Error('L’enregistrement local a été interrompu.'));
    });
  } finally { db.close(); }
}

export async function listVoiceNotes(demo = false): Promise<VoiceNote[]> {
  if (Platform.OS === 'web') {
    const notes = await withVoiceStore<StoredNote[]>('readonly', (store) => store.getAll(), demo);
    return notes.filter((note) => note.blob).map((note) => ({ ...note, uri: URL.createObjectURL(note.blob!) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const notes = await local.getJson<StoredNote[]>(demo ? KEYS.demoVoiceNotes : KEYS.voiceNotes, []);
  return notes.map((note) => ({ ...note, uri: new File(Paths.document, demo ? 'c127-voice-demo' : 'c127-voice', note.filename!).uri })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveVoiceNote(uri: string, durationMillis: number, demo = false): Promise<string> {
  const scope = demo ? 'demo' : 'personal';
  const generation = generations[scope];
  const assertCurrent = () => {
    if (generation !== generations[scope]) throw new Error('Enregistrement annulé : les données locales ont été effacées.');
  };
  const id = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const note: StoredNote = { id, createdAt: new Date().toISOString(), durationMillis };
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Le fichier audio n’est plus disponible.');
    const blob = await response.blob();
    if (blob.size === 0) throw new Error('L’enregistrement est vide. Réessayez.');
    await withVoiceStore('readwrite', (store) => { assertCurrent(); return store.put({ ...note, blob }); }, demo);
    return id;
  }
  const directory = new Directory(Paths.document, demo ? 'c127-voice-demo' : 'c127-voice');
  directory.create({ intermediates: true, idempotent: true });
  note.filename = `${id}.m4a`;
  const destination = new File(directory, note.filename);
  await new File(uri).move(destination);
  try {
    const key = demo ? KEYS.demoVoiceNotes : KEYS.voiceNotes;
    const notes = await local.getJson<StoredNote[]>(key, []);
    assertCurrent();
    await local.setJson(key, [note, ...notes]);
  } catch (error) {
    if (destination.exists) {
      if (generation === generations[scope]) await destination.move(new File(uri));
      else await destination.delete();
    }
    throw error;
  }
  return id;
}

export async function updateVoiceTranscript(id: string, transcript: string, demo = false): Promise<void> {
  const generation = generations[demo ? 'demo' : 'personal'];
  if (Platform.OS === 'web') {
    await withVoiceStore('readwrite', (store) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result && generation === generations[demo ? 'demo' : 'personal']) store.put({ ...request.result, transcript: transcript.slice(0, 20000) });
      };
      return request;
    }, demo);
  } else {
    const key = demo ? KEYS.demoVoiceNotes : KEYS.voiceNotes;
    const notes = await local.getJson<StoredNote[]>(key, []);
    if (generation !== generations[demo ? 'demo' : 'personal']) return;
    if (!notes.some((note) => note.id === id)) return;
    await local.setJson(key, notes.map((note) => note.id === id ? { ...note, transcript: transcript.slice(0, 20000) } : note));
  }
}

export async function deleteVoiceNote(id: string, demo = false): Promise<void> {
  if (Platform.OS === 'web') {
    await withVoiceStore('readwrite', (store) => store.delete(id), demo);
    return;
  }
  const key = demo ? KEYS.demoVoiceNotes : KEYS.voiceNotes;
  const notes = await local.getJson<StoredNote[]>(key, []);
  const note = notes.find((item) => item.id === id);
  if (note?.filename) {
    const file = new File(Paths.document, demo ? 'c127-voice-demo' : 'c127-voice', note.filename);
    if (file.exists) await file.delete();
  }
  await local.setJson(key, notes.filter((item) => item.id !== id));
}

export async function clearVoiceNotes(demo = false): Promise<void> {
  generations[demo ? 'demo' : 'personal'] += 1;
  if (Platform.OS === 'web') {
    await withVoiceStore('readwrite', (store) => store.clear(), demo);
  } else {
    const directory = new Directory(Paths.document, demo ? 'c127-voice-demo' : 'c127-voice');
    if (directory.exists) await directory.delete();
    await local.remove([demo ? KEYS.demoVoiceNotes : KEYS.voiceNotes]);
  }
}

export function releaseVoiceUrls(notes: VoiceNote[]): void {
  if (Platform.OS === 'web') notes.forEach((note) => URL.revokeObjectURL(note.uri));
}
