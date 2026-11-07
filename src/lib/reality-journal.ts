import { KEYS, local } from './storage';

export type RealityCheck = { id: string; createdAt: string; context: string; observation: string; state: 'awake' | 'uncertain' | 'dream' };
export const REALITY_STATES = [{ value: 'awake', label: 'Je me sens éveillé·e' }, { value: 'uncertain', label: 'Je reste dans le doute' }, { value: 'dream', label: 'Je me souviens d’un rêve' }] as const;
export function makeRealityCheck(context: string, observation: string, state: RealityCheck['state']): RealityCheck {
  if (!context.trim() && !observation.trim()) throw new Error('Notez un contexte ou une observation avant de garder cette vérification.');
  return { id: `check-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), context: context.trim(), observation: observation.trim(), state };
}
export const loadRealityChecks = (demo = false) => local.getJson<RealityCheck[]>(demo ? KEYS.demoJournal : KEYS.journal, []);
export const saveRealityChecks = (entries: RealityCheck[], demo = false) => local.setJson(demo ? KEYS.demoJournal : KEYS.journal, entries);
