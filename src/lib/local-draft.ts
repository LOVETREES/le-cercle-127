import { local } from './storage';

const prefix = 'c127.private-draft';
const pending = new Map<string, Promise<void>>();
export const draftKey = (owner: string, name: string) => `${prefix}:${owner}:${name}`;

/** Sérialise les frappes et l'effacement : une écriture ancienne ne remplace pas une plus récente. */
export function writeLocalDraft(key: string, text: string | null): Promise<void> {
  const next = (pending.get(key) ?? Promise.resolve()).catch(() => undefined).then(() => local.setJson(key, text));
  pending.set(key, next);
  void next.finally(() => { if (pending.get(key) === next) pending.delete(key); }).catch(() => undefined);
  return next;
}

export async function readLocalDraft(key: string): Promise<string | null> {
  await pending.get(key)?.catch(() => undefined);
  return local.getJson<string | null>(key, null);
}

export async function clearLocalDrafts(owner: string): Promise<void> {
  const keys = ['home', 'chapter-0', 'chapter-1', 'chapter-2', 'chapter-3'].map((name) => draftKey(owner, name));
  await Promise.all(keys.map((key) => writeLocalDraft(key, null)));
  await local.remove(keys);
}
