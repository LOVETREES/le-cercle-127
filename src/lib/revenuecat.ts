// Une seule connexion RevenueCat pour toute l'app (Perle d'Oni, Cercle Premium), reliée au compte du Cercle.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

type Extra = { revenuecatIosKey?: string; revenuecatAndroidKey?: string; revenuecatWebKey?: string };
const EXTRA = (Constants.expoConfig?.extra ?? {}) as Extra;

/** La clé publique RevenueCat de cette plateforme ; absente tant qu'elle n'est pas renseignée dans app.json. */
export function revenuecatKey(): string | undefined {
  const key = Platform.select({ ios: EXTRA.revenuecatIosKey, android: EXTRA.revenuecatAndroidKey, web: EXTRA.revenuecatWebKey });
  return key || undefined;
}

let configuredFor: string | null = null;

/** Relie les achats au compte du Cercle (« wp-<numéro> », le même sur toutes les plateformes), jamais à une adresse e-mail. */
export async function ensurePurchases(userId: string): Promise<void> {
  const key = revenuecatKey();
  if (!key) throw new Error('achats-indisponibles');
  const appUserID = `wp-${userId}`;
  if (configuredFor === null) Purchases.configure({ apiKey: key, appUserID });
  else if (configuredFor !== appUserID) await Purchases.logIn(appUserID);
  configuredFor = appUserID;
}
