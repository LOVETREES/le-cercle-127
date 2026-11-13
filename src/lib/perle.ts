// La Perle d'Oni en achat intégré (Google Play, via RevenueCat). Android seulement pour l'instant :
// sur iPhone, l'offre reste masquée (règles d'Apple) jusqu'à l'achat intégré Apple.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { PRODUCT_CATEGORY, type PurchasesStoreProduct } from 'react-native-purchases';

import { FEATURES } from './features';
import { PERLE_PRODUCTS, type PerleProductId } from './perle-logic';

const KEY: string | undefined = (Constants.expoConfig?.extra as { revenuecatAndroidKey?: string } | undefined)?.revenuecatAndroidKey;

/** L'offre peut-elle être montrée sur cet appareil ? */
export function perleAvailable(): boolean {
  return Platform.OS === 'android' && FEATURES.perleAndroid && !!KEY;
}

let configuredFor: string | null = null;

/** Relie les achats au compte du Cercle (identifiant WordPress), jamais à une adresse e-mail. */
async function ensure(userId: string): Promise<void> {
  if (!KEY) throw new Error('perle-indisponible');
  const appUserID = `wp-${userId}`;
  if (configuredFor === null) {
    Purchases.configure({ apiKey: KEY, appUserID });
  } else if (configuredFor !== appUserID) {
    await Purchases.logIn(appUserID);
  }
  configuredFor = appUserID;
}

export type PerleOffer = { productId: PerleProductId; price: string; product: PurchasesStoreProduct };

/** Le produit à proposer (bienvenue ou standard) avec son prix affiché par Google, dans la devise de la personne. */
export async function loadPerleOffer(userId: string, productId: PerleProductId): Promise<PerleOffer | null> {
  await ensure(userId);
  const products = await Purchases.getProducts([productId], PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  const product = products.find((p) => p.identifier === productId);
  return product ? { productId, price: product.priceString, product } : null;
}

/** Ouvre la fenêtre de paiement Google Play. Renvoie la transaction, ou null si la personne annule. */
export async function buyPerle(userId: string, offer: PerleOffer): Promise<{ transactionId: string; productId: PerleProductId } | null> {
  await ensure(userId);
  try {
    const r = await Purchases.purchaseStoreProduct(offer.product);
    return { transactionId: r.transaction.transactionIdentifier, productId: offer.productId };
  } catch (e) {
    if ((e as { userCancelled?: boolean })?.userCancelled) return null;
    throw e;
  }
}

export { PERLE_PRODUCTS };
