// La Perle d'Oni : règles pures (sans le SDK d'achat), testées à part.
import { currentOwner } from './palm';
import { KEYS, local } from './storage';

/** Produits Google Play (identiques dans RevenueCat). La première Perle d'un compte est au prix de bienvenue. */
export const PERLE_PRODUCTS = { welcome: 'perle_oni_bienvenue', standard: 'perle_oni' } as const;
export type PerleProductId = (typeof PERLE_PRODUCTS)[keyof typeof PERLE_PRODUCTS];

export function pickPerleProduct(welcomeEligible: boolean): PerleProductId {
  return welcomeEligible ? PERLE_PRODUCTS.welcome : PERLE_PRODUCTS.standard;
}

export function isPerleProduct(id: string): id is PerleProductId {
  return id === PERLE_PRODUCTS.welcome || id === PERLE_PRODUCTS.standard;
}

/** Les trois accords demandés avant le paiement (comme sur le site). */
export type PerleConsents = { cgv: boolean; ai: boolean; withdrawal: boolean };
export const consentsComplete = (c: PerleConsents) => c.cgv && c.ai && c.withdrawal;

/** Un achat payé mais pas encore confirmé par le site (réseau coupé…) : gardé pour réessayer. */
export type PendingPerle = { dreamId: string; productId: PerleProductId; transactionId: string; at: string };
const keyFor = (owner = currentOwner()) => `${KEYS.perlePending}:${owner}`;

export async function listPendingPerles(): Promise<PendingPerle[]> {
  const l = await local.getJson<PendingPerle[]>(keyFor(), []);
  return Array.isArray(l) ? l : [];
}

export async function addPendingPerle(p: PendingPerle): Promise<void> {
  const l = (await listPendingPerles()).filter((x) => x.transactionId !== p.transactionId);
  await local.setJson(keyFor(), [...l, p]);
}

export async function removePendingPerle(transactionId: string): Promise<void> {
  await local.setJson(keyFor(), (await listPendingPerles()).filter((x) => x.transactionId !== transactionId));
}
