import { haptic, setHapticsEnabled } from './haptics';
import { initSounds, play, setSoundEnabled } from './sound';

export { initSounds, setHapticsEnabled, setSoundEnabled };

/** Ein Aufruf pro Moment: Haptik und Ton gehören zusammen. */
export const feedback = {
  key: () => {
    haptic.key();
    play('key');
  },
  tick: () => {
    haptic.tick();
    play('tick');
  },
  lock: () => {
    haptic.lock();
    play('lock');
  },
  count: () => {
    haptic.count();
    play('count');
  },
  hit: () => {
    haptic.hit();
    play('hit');
  },
  miss: () => {
    haptic.miss();
    play('miss');
  },
  counter: () => {
    haptic.miss();
    play('counter');
  },
  print: () => {
    haptic.print();
    play('print');
  },
  error: () => haptic.error(),
};
