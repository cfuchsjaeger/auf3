import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_PLAYER_NAME, MAX_PLAYERS } from '@/domain';
import { feedback } from '@/feedback';
import { useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { PixelAvatar } from '@/ui/PixelAvatar';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

function defaultEventName() {
  const d = new Date();
  return `Abend ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

export default function Setup() {
  const { startEvent } = useStore();
  const [name, setName] = useState(defaultEventName);
  const [players, setPlayers] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [me, setMe] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const n = draft.trim();
    if (!n) return;
    if (players.some((p) => p.toLowerCase() === n.toLowerCase())) {
      feedback.error();
      setError(`${n} ist schon dabei.`);
      return;
    }
    if (players.length >= MAX_PLAYERS) {
      feedback.error();
      setError(`Maximal ${MAX_PLAYERS} Leute.`);
      return;
    }
    feedback.tick();
    setPlayers([...players, n]);
    setDraft('');
    setError(null);
  };

  const remove = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
    if (me >= index && me > 0) setMe(me - 1);
  };

  const go = () => {
    const res = startEvent({ name, players, meIndex: me });
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return;
    }
    feedback.lock();
    router.dismissTo('/');
  };

  return (
    <Screen scroll>
      <T variant="label">NEUES EVENT</T>
      <View style={{ gap: 8 }}>
        <T variant="label">NAME</T>
        <TextInput
          accessibilityLabel="Name des Events"
          value={name}
          onChangeText={setName}
          maxLength={32}
          style={styles.input}
          placeholder="Korfu 2026"
          placeholderTextColor={colors.text2}
          selectionColor={colors.signal}
        />
      </View>

      <View style={{ gap: 8 }}>
        <T variant="label">WER SPIELT · TIPP AUF DICH SELBST = ICH</T>
        {players.map((p, i) => (
          <View key={p} style={styles.playerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${p}${i === me ? ', das bin ich' : ', als ich markieren'}`}
              onPress={() => setMe(i)}
              style={styles.playerMain}>
              <PixelAvatar name={p} size={30} />
              <Text style={styles.playerName}>{p}</Text>
              {i === me ? <Text style={styles.meTag}>ICH</Text> : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${p} entfernen`}
              onPress={() => remove(i)}
              hitSlop={8}
              style={styles.remove}>
              <Text style={styles.removeLabel}>×</Text>
            </Pressable>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            testID="player-input"
            accessibilityLabel="Name hinzufügen"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            submitBehavior="submit"
            returnKeyType="done"
            maxLength={MAX_PLAYER_NAME}
            placeholder={players.length === 0 ? 'Dein Name' : 'Nächste Person'}
            placeholderTextColor={colors.text2}
            selectionColor={colors.signal}
            style={[styles.input, { flex: 1 }]}
          />
          <Pressable
            testID="player-add"
            accessibilityRole="button"
            accessibilityLabel="Hinzufügen"
            onPress={add}
            style={({ pressed }) => [styles.addButton, pressed && { backgroundColor: colors.text }]}>
            <Text style={styles.addLabel}>+</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={{ flex: 1 }} />
      <BlockButton testID="setup-go" label="LOS GEHT'S" onPress={go} disabled={players.length < 2} />
      {players.length < 2 ? (
        <T variant="body" style={{ color: colors.text2, textAlign: 'center' }}>
          Mindestens zwei Leute.
        </T>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 17,
    paddingHorizontal: 14,
    height: 52,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  playerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, minHeight: 52 },
  playerName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  meTag: { fontFamily: fonts.pixelBold, fontSize: 11, color: colors.ink, backgroundColor: colors.signal, paddingHorizontal: 6, paddingVertical: 2 },
  remove: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  removeLabel: { fontFamily: fonts.pixelBold, fontSize: 22, color: colors.text2 },
  addRow: { flexDirection: 'row', gap: 10 },
  addButton: { width: 52, height: 52, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  addLabel: { fontFamily: fonts.pixelBold, fontSize: 26, color: colors.ink },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
