/**
 * Umdreh-Erkennung, plattformneutral und testbar.
 *
 * expo-sensors liefert die Beschleunigung in g, aber mit plattformabhängigem Vorzeichen:
 *  - Android: Rohwert / g, flach mit Display nach oben z ≈ +1
 *  - iOS (CoreMotion): flach mit Display nach oben z ≈ -1
 * Quelle: AccelerometerModule.kt und AccelerometerModule.swift in expo-sensors 58.
 */
export type SensorPlatform = 'ios' | 'android';

export const FACE_DOWN_THRESHOLD = 0.8;
export const FACE_DOWN_HOLD_MS = 300;

/** Normalisiert auf: +1 = Display oben, -1 = Display unten. */
export function screenUpness(z: number, platform: SensorPlatform): number {
  return platform === 'ios' ? -z : z;
}

export function isFaceDownSample(z: number, platform: SensorPlatform): boolean {
  return screenUpness(z, platform) < -FACE_DOWN_THRESHOLD;
}

/**
 * Entprellter Detektor: meldet "umgedreht" erst, wenn die Lage FACE_DOWN_HOLD_MS lang stabil ist,
 * und genau einmal pro Umdrehen.
 */
export function createFlipDetector(platform: SensorPlatform, onFaceDown: () => void) {
  let downSince: number | null = null;
  let fired = false;
  return (z: number, timestampMs: number) => {
    if (isFaceDownSample(z, platform)) {
      downSince ??= timestampMs;
      if (!fired && timestampMs - downSince >= FACE_DOWN_HOLD_MS) {
        fired = true;
        onFaceDown();
      }
    } else {
      downSince = null;
      if (screenUpness(z, platform) > FACE_DOWN_THRESHOLD) fired = false;
    }
  };
}
