/**
 * Vier Töne, nur für Höhepunkte: Countdown, Treffer, Knapp, Daneben.
 * Erzeugt von scripts/gen-sounds.mjs. Der Stummschalter gewinnt immer, nichts im Spiel hängt von Ton ab.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SOURCES = {
  count1: require('../../assets/sounds/count1.wav'),
  count2: require('../../assets/sounds/count2.wav'),
  count3: require('../../assets/sounds/count3.wav'),
  hit: require('../../assets/sounds/hit.wav'),
  near: require('../../assets/sounds/near.wav'),
  miss: require('../../assets/sounds/miss.wav'),
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
      // Ohne Player bleibt der Ton stumm, das Spiel läuft weiter.
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
    // Ton ist Zugabe, nie Voraussetzung.
  }
}
