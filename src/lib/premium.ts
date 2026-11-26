// Cercle Premium : abonnement mensuel ou annuel, valable sur l'iPhone, Android et l'app web.
// RevenueCat vend (App Store, Google Play, Stripe sur le web) ; le site garde l'accès de chaque compte
// (c127-premium/v1/status) et le vérifie avant chaque lecture payante.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import Purchases, { PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage, type PurchasesStoreProduct } from 'react-native-purchases';

import { api } from './api';
import { FEATURES } from './features';
import { ensurePurchases, revenuecatKey } from './revenuecat';
import { useSession } from './session';

export const PREMIUM_ENTITLEMENT = 'premium';

/** L'abonnement peut-il être proposé sur cet appareil ? */
export function premiumPurchasable(): boolean {
  return FEATURES.premium && !!revenuecatKey();
}

export type PremiumPlan = {
  id: 'annual' | 'monthly';
  price: string;
  perMonth: string | null;
  trialDays: number;
  pkg: PurchasesPackage;
};

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365, D: 1, W: 7, M: 30, Y: 365 };

/** Durée de l'essai gratuit : introPrice (App Store) ou phase gratuite de l'option par défaut (Google Play). */
export function trialDaysOf(product: PurchasesStoreProduct): number {
  const intro = product.introPrice;
  if (intro && intro.price === 0) return intro.periodNumberOfUnits * (UNIT_DAYS[intro.periodUnit] ?? 0);
  const iso = product.defaultOption?.freePhase?.billingPeriod?.iso8601;
  const m = iso ? /^P(\d+)([DWMY])$/.exec(iso) : null;
  return m ? Number(m[1]) * (UNIT_DAYS[m[2]] ?? 0) : 0;
}

/** Les deux forfaits de l'offre « default », l'annuel en premier. */
export async function loadPremiumPlans(userId: string): Promise<PremiumPlan[]> {
  await ensurePurchases(userId);
  const offerings = await Purchases.getOfferings();
  const plans: PremiumPlan[] = [];
  for (const pkg of offerings.current?.availablePackages ?? []) {
    const id = pkg.packageType === PACKAGE_TYPE.ANNUAL ? 'annual' : pkg.packageType === PACKAGE_TYPE.MONTHLY ? 'monthly' : null;
    if (!id) continue;
    plans.push({ id, price: pkg.product.priceString, perMonth: pkg.product.pricePerMonthString, trialDays: trialDaysOf(pkg.product), pkg });
  }
  return plans.sort((a, b) => (a.id === 'annual' ? -1 : b.id === 'annual' ? 1 : 0));
}

export function isPremiumInfo(info: CustomerInfo): boolean {
  return !!info.entitlements.active[PREMIUM_ENTITLEMENT];
}

/** Ouvre la fenêtre de paiement (App Store, Google Play ou Stripe). Renvoie null si la personne annule. */
export async function buyPremium(userId: string, plan: PremiumPlan): Promise<boolean | null> {
  await ensurePurchases(userId);
  try {
    const r = await Purchases.purchasePackage(plan.pkg);
    return isPremiumInfo(r.customerInfo);
  } catch (e) {
    if ((e as { userCancelled?: boolean })?.userCancelled) return null;
    throw e;
  }
}

export async function restorePremium(userId: string): Promise<boolean> {
  await ensurePurchases(userId);
  return isPremiumInfo(await Purchases.restorePurchases());
}

/** Lien vers la gestion de l'abonnement (résiliation), fourni par la boutique qui l'a vendu. */
export async function premiumManagementUrl(userId: string): Promise<string | null> {
  await ensurePurchases(userId);
  return (await Purchases.getCustomerInfo()).managementURL;
}

export type PremiumState = { premium: boolean; until: Date | null; loading: boolean; refresh: () => void };

/** L'accès Premium du compte, tel que le site le connaît (la même vérité que pour les lectures). */
export function usePremium(): PremiumState {
  const { token, isDemo } = useSession();
  const [state, setState] = useState<{ premium: boolean; until: Date | null; loading: boolean }>({ premium: false, until: null, loading: true });
  const load = useCallback(() => {
    let active = true;
    if (!token || isDemo) { setState({ premium: false, until: null, loading: false }); return () => { active = false; }; }
    api.premiumStatus(token).then(
      (s) => { if (active) setState({ premium: s.premium, until: s.until ? new Date(s.until) : null, loading: false }); },
      () => { if (active) setState((p) => ({ ...p, loading: false })); },
    );
    return () => { active = false; };
  }, [token, isDemo]);
  useFocusEffect(load);
  return { ...state, refresh: () => { load(); } };
}
