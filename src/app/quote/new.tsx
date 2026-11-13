import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_DARE_LENGTH } from '@/domain';
import { feedback } from '@/feedback';
import { useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { PlayerChip } from '@/ui/PlayerChip';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

export default function NewQuote() {
  const { session, store, newQuote } = useStore();
  const params = useLocalSearchParams<{ target?: string }>();
  const [challengerId, setChallengerId] = useState(store.meId ?? session?.players[0]?.id ?? '');
  const [targetId, setTargetId] = useState<string | null>(params.target ?? null);
  const [dare, setDare] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/" />;

  const pickChallenger = (id: string) => {
    setChallengerId(id);
    if (id === targetId) setTargetId(null);
  };

  const submit = () => {
    if (!targetId) return;
    const res = newQuote({ challengerId, targetId, dare });
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return;
    }
    feedback.lock();
    router.replace(`/quote/${res.value}`);
  };

  const ready = !!targetId && dare.trim().length > 0;

  return (
    <Screen scroll>
      <View style={{ gap: 10 }}>
        <T variant="label">WER QUOTET</T>
        <View style={styles.grid}>
          {session.players.map((p) => (
            <PlayerChip
              key={p.id}
              name={p.name}
              selected={p.id === challengerId}
              badge={p.id === store.meId ? 'ICH' : undefined}
              onPress={() => pickChallenger(p.id)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <T variant="label">WEN</T>
        <View style={styles.grid}>
          {session.players
            .filter((p) => p.id !== challengerId)
            .map((p) => (
              <PlayerChip key={p.id} name={p.name} selected={p.id === targetId} onPress={() => setTargetId(p.id)} />
            ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <View style={styles.labelRow}>
          <T variant="label">QUOTE, DASS DU …</T>
          <Text style={[styles.counter, dare.length > MAX_DARE_LENGTH - 20 && { color: colors.warn }]}>
            {dare.length}/{MAX_DARE_LENGTH}
          </Text>
        </View>
        <TextInput
          testID="dare-input"
          accessibilityLabel="Aufgabe"
          value={dare}
          onChangeText={(t) => {
            setDare(t);
            setError(null);
          }}
          maxLength={MAX_DARE_LENGTH}
          multiline
          placeholder="… dem Kellner ein Lied widmest. Laut."
          placeholderTextColor={colors.text2}
          selectionColor={colors.signal}
          style={styles.dare}
        />
        <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
          Nichts, was Gesundheit oder Fremde gefährdet. Veto ist immer erlaubt.
        </T>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={{ flex: 1 }} />
      <BlockButton testID="quote-submit" label="QUOTE STELLEN" onPress={submit} disabled={!ready} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  counter: { fontFamily: fonts.pixel, fontSize: 11, color: colors.text2 },
  dare: {
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    lineHeight: 28,
    padding: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
