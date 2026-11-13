/**
 * Haptik-Vokabular aus fünf Mustern plus Taste und Fehler. Haptik ist der Primärkanal,
 * weil Sound in der Bar untergeht. Auf Web ein No-op.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let enabled = true;
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function run(pattern: () => Promise<void>) {
  if (!enabled || Platform.OS === 'web') return;
  pattern().catch(() => {});
}

export const haptic = {
  key: () =>
    run(() =>
      Platform.OS === 'android'
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    ),
  tick: () =>
    run(() =>
      Platform.OS === 'android'
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick)
        : Haptics.selectionAsync(),
    ),
  lock: () =>
    run(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await wait(70);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }),
  count: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  hit: () =>
    run(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await wait(90);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }),
  miss: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  print: () =>
    run(async () => {
      for (let i = 0; i < 8; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await wait(46);
      }
    }),
};
