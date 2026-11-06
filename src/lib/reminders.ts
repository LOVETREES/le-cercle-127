import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { KEYS, local } from './storage';

// Rappel local du matin : aucune donnée envoyée à un serveur (rappel programmé sur l'appareil).
export type Reminder = { enabled: boolean; hour: number; minute: number };
export const DEFAULT_REMINDER: Reminder = { enabled: false, hour: 7, minute: 30 };

const CHANNEL = 'rappel-du-matin';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function loadReminder(): Promise<Reminder> {
  return local.getJson(KEYS.reminder, DEFAULT_REMINDER);
}

/** Active ou coupe le rappel. Retourne false si l'autorisation est refusée. */
export async function saveReminder(r: Reminder): Promise<boolean> {
  if (Platform.OS === 'web') {
    await local.setJson(KEYS.reminder, r);
    return true;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (r.enabled) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Rappel du matin',
        // eslint-disable-next-line import/namespace -- énumération ré-exportée, documentée en SDK 58
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) {
      await local.setJson(KEYS.reminder, { ...r, enabled: false });
      return false;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Un rêve vous attend ?',
        body: 'Notez-le dans votre Grimoire avant qu’il ne s’efface.',
        data: { url: '/reve' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
        channelId: Platform.OS === 'android' ? CHANNEL : undefined,
      },
    });
  }
  await local.setJson(KEYS.reminder, r);
  return true;
}
