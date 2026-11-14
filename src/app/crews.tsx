import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { feedback } from '@/feedback';
import { useAccount } from '@/state/account';
import { BlockButton } from '@/ui/BlockButton';
import { NameGate } from '@/ui/NameGate';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

export default function Crews() {
  const { status, handle, crews, loadError, refresh, createCrew } = useAccount();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const found = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await createCrew(name.trim());
    setBusy(false);
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return;
    }
    feedback.lock();
    setName('');
    router.push(`/crew/${res.value.id}`);
  };

  return (
    <Screen scroll>
      <View style={{ gap: 6 }}>
        <T variant="label">GRUPPEN</T>
        <Text style={styles.title}>DEINE GRUPPEN</Text>
        {status === 'ready' && handle ? (
          <T variant="body" style={{ color: colors.text2 }}>
            Du bist {handle}.
          </T>
        ) : null}
      </View>

      {status === 'loading' ? <T variant="label">LÄDT …</T> : null}
      {status === 'needsName' ? <NameGate /> : null}

      {status === 'ready' ? (
        <>
          {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
          <View style={{ gap: 10 }}>
            {crews.length === 0 ? (
              <T variant="body" style={{ color: colors.text2 }}>
                Noch keine Gruppe. Gründe eine oder tritt mit einem Code bei.
              </T>
            ) : (
              crews.map((c) => (
                <Pressable
                  key={c.id}
                  testID={`crew-${c.name}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, ${c.memberCount} Leute`}
                  onPress={() => router.push(`/crew/${c.id}`)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.crewName}>{c.name}</Text>
                    <T variant="label">{c.memberCount === 1 ? '1 PERSON' : `${c.memberCount} LEUTE`}</T>
                  </View>
                  <Text style={styles.arrow}>▶</Text>
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.box}>
            <T variant="label">NEUE GRUPPE</T>
            <TextInput
              testID="crew-name-input"
              accessibilityLabel="Name der Gruppe"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              onSubmitEditing={found}
              submitBehavior="submit"
              maxLength={32}
              placeholder="Schniadlerboys"
              placeholderTextColor={colors.text2}
              selectionColor={colors.signal}
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <BlockButton testID="crew-create" label="GRUPPE GRÜNDEN" onPress={found} disabled={!name.trim() || busy} />
          </View>

          <BlockButton testID="crew-join" label="Mit Code beitreten" variant="ghost" size="md" onPress={() => router.push('/join')} />
        </>
      ) : null}

      <View style={{ flex: 1 }} />
      <BlockButton label="Zurück" variant="ghost" size="md" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.pixelBold, fontSize: 30, lineHeight: 34, color: colors.signal, letterSpacing: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardPressed: { borderColor: colors.signal },
  crewName: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.text },
  arrow: { fontFamily: fonts.pixelBold, fontSize: 18, color: colors.signal },
  box: { borderWidth: layout.border, borderColor: colors.text, padding: 16, gap: 12 },
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
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
