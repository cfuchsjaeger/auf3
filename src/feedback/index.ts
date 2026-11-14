import { haptic, setHapticsEnabled, type CountStep } from './haptics';
import { initSounds, play, setSoundEnabled } from './sound';

export { initSounds, setHapticsEnabled, setSoundEnabled };
export type { CountStep };

/**
 * Ein Aufruf pro Moment. Bedienung ist nur Haptik, Ton gibt es nur für Countdown und Ergebnis.
 */
export const feedback = {
  key: () => haptic.key(),
  tick: () => haptic.tick(),
  lock: () => haptic.lock(),
  print: () => haptic.print(),
  error: () => haptic.error(),
  count: (step: CountStep) => {
    haptic.count(step);
    play(step === 1 ? 'count1' : step === 2 ? 'count2' : 'count3');
  },
  hit: () => {
    haptic.hit();
    play('hit');
  },
  near: () => {
    haptic.near();
    play('near');
  },
  miss: () => {
    haptic.miss();
    play('miss');
  },
};
