/**
 * Kurze Chiptune-Sounds (erzeugt von scripts/gen-sounds.mjs). Der Stummschalter gewinnt immer:
 * playsInSilentMode ist aus. Nichts im Spiel hängt von Sound ab.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SOURCES = {
  key: require('../../assets/sounds/key.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  lock: require('../../assets/sounds/lock.wav'),
  count: require('../../assets/sounds/count.wav'),
  hit: require('../../assets/sounds/hit.wav'),
  miss: require('../../assets/sounds/miss.wav'),
  counter: require('../../assets/sounds/counter.wav'),
  print: require('../../assets/sounds/print.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;
let initialized = false;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export async function initSounds() {
  if (initialized) return;
  initialized = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  } catch {
    // Web und ältere Geräte: Standardmodus reicht.
  }
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    try {
      players[name] = createAudioPlayer(SOURCES[name]);
    } catch {
      // Ohne Player bleibt der Sound stumm, das Spiel läuft weiter.
    }
  }
}

export function play(name: SoundName) {
  if (!enabled) return;
  const player = players[name];
  if (!player) return;
  try {
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Sound ist Zugabe, nie Voraussetzung.
  }
}
