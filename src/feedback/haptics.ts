/**
 * Haptik ist der Primärkanal, weil Ton in der Bar untergeht.
 * Tasten und Regler bleiben leicht, der Countdown steigert sich, Treffer und Knapp sind unterscheidbar.
 * Auf Web ein No-op.
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

const android = Platform.OS === 'android';

export type CountStep = 1 | 2 | 3;

export const haptic = {
  key: () =>
    run(() =>
      android
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    ),
  tick: () =>
    run(() =>
      android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick) : Haptics.selectionAsync(),
    ),
  lock: () =>
    run(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await wait(70);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }),
  /** Crescendo: leicht, mittel, schwer. */
  count: (step: CountStep) =>
    run(() =>
      Haptics.impactAsync(
        step === 1
          ? Haptics.ImpactFeedbackStyle.Light
          : step === 2
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy,
      ),
    ),
  hit: () =>
    run(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await wait(90);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }),
  /** Knapp: zwei kurze, leichte Impulse. */
  near: () =>
    run(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await wait(110);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }),
  /** Daneben: ein weicher Impuls. */
  miss: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  print: () =>
    run(async () => {
      for (let i = 0; i < 8; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await wait(46);
      }
    }),
};
