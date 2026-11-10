// « La rencontre avec Oni » ne s'affiche qu'une fois par appareil (on peut la passer : « Plus tard »).
import { KEYS, local } from './storage';

export async function wasWelcomed(): Promise<boolean> {
  return (await local.getJson<boolean>(KEYS.welcomed, false)) === true;
}

export async function markWelcomed(): Promise<void> {
  await local.setJson(KEYS.welcomed, true);
}
