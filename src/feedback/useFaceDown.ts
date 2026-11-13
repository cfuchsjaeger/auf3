/** Ruft onFaceDown auf, sobald das Handy mit dem Display nach unten liegt. Auf Web inaktiv. */
import { Accelerometer } from 'expo-sensors';
import { useEffect, useEffectEvent, useState } from 'react';
import { Platform } from 'react-native';

import { createFlipDetector } from './flip';

export function useFaceDown(enabled: boolean, onFaceDown: () => void): boolean {
  const [available, setAvailable] = useState(false);
  const handleFaceDown = useEffectEvent(onFaceDown);

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    let cancelled = false;
    let sub: { remove(): void } | null = null;
    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (cancelled) return;
        setAvailable(ok);
        if (!ok || !enabled) return;
        Accelerometer.setUpdateInterval(60);
        const feed = createFlipDetector(Platform.OS as 'ios' | 'android', () => handleFaceDown());
        sub = Accelerometer.addListener(({ z }) => feed(z, Date.now()));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return available;
}
