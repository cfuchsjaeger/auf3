/** Beitreten per Link (auf3://join?code=…) oder per eingetipptem Code. */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { feedback } from '@/feedback';
import { INVITE_CODE_LENGTH, isValidInviteCode, normalizeInviteCode } from '@/lib/invite';
import { useAccount, type CrewPreview } from '@/state/account';
import { BlockButton } from '@/ui/BlockButton';
import { fitPixelSize } from '@/ui/keypad-logic';
import { NameGate } from '@/ui/NameGate';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

type Lookup =
  | { kind: 'found'; code: string; preview: CrewPreview }
  | { kind: 'missing'; code: string }
  | { kind: 'error'; code: string; message: string };

export default function Join() {
  const params = useLocalSearchParams<{ code?: string }>();
  const { status, preview, join } = useAccount();
  const [input, setInput] = useState(params.code ?? '');
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [busy, setBusy] = useState(false);

  const code = normalizeInviteCode(input);
  const valid = isValidInviteCode(code);
  const malformed = code.length >= INVITE_CODE_LENGTH && !valid;
  const ready = status === 'ready';

  useEffect(() => {
    if (!ready || !valid) return;
    let active = true;
    preview(code).then((res) => {
      if (!active) return;
      if (!res.ok) setLookup({ kind: 'error', code, message: res.error });
      else if (!res.value) setLookup({ kind: 'missing', code });
      else setLookup({ kind: 'found', code, preview: res.value });
    });
    return () => {
      active = false;
    };
  }, [ready, valid, code, preview]);

  // Solange zum aktuellen Code kein Ergebnis da ist, wird gesucht.
  const current: Lookup | { kind: 'loading' } | null =
    lookup?.code === code ? lookup : ready && valid ? { kind: 'loading' } : null;

  const doJoin = async () => {
    if (busy) return;
    setBusy(true);
    const res = await join(code);
    setBusy(false);
    if (!res.ok) {
      feedback.error();
      setLookup({ kind: 'error', code, message: res.error });
      return;
    }
    feedback.hit();
    router.replace(`/crew/${res.value.id}`);
  };

  return (
    <Screen scroll>
      <T variant="label">BEITRETEN</T>
      {status === 'loading' ? <T variant="label">LÄDT …</T> : null}
      {status === 'needsName' ? <NameGate lead="Erst dein Name, dann die Gruppe." /> : null}

      {ready ? (
        <>
          <View style={{ gap: 8 }}>
            <T variant="label">EINLADUNGSCODE</T>
            <TextInput
              testID="join-code-input"
              accessibilityLabel="Einladungscode"
              value={input}
              onChangeText={setInput}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              placeholder="BG2C-M6S8"
              placeholderTextColor={colors.text2}
              selectionColor={colors.signal}
              style={styles.input}
            />
            {malformed ? (
              <Text style={styles.error}>Dieser Code kann nicht stimmen. Codes haben kein 0, O, 1, I oder L.</Text>
            ) : null}
          </View>

          {current?.kind === 'loading' ? <T variant="label">SUCHE GRUPPE …</T> : null}
          {current?.kind === 'missing' ? <Text style={styles.error}>Diese Einladung gibt es nicht.</Text> : null}
          {current?.kind === 'error' ? <Text style={styles.error}>{current.message}</Text> : null}

          {current?.kind === 'found' ? (
            <View style={styles.preview} testID="join-preview">
              <T variant="label">{current.preview.alreadyMember ? 'DU BIST SCHON DABEI' : 'DU TRITTST BEI'}</T>
              <Text
                style={[
                  styles.crewName,
                  { fontSize: fitPixelSize(current.preview.name, 300, 28), lineHeight: fitPixelSize(current.preview.name, 300, 28) + 4 },
                ]}>
                {current.preview.name.toUpperCase()}
              </Text>
              <T variant="body" style={{ color: colors.text2 }}>
                {current.preview.memberCount === 1 ? '1 Person' : `${current.preview.memberCount} Leute`}
              </T>
              {current.preview.alreadyMember ? (
                <BlockButton
                  label="ÖFFNEN"
                  onPress={() => router.replace(`/crew/${current.preview.crewId}`)}
                />
              ) : (
                <BlockButton testID="join-submit" label={busy ? 'MOMENT …' : 'BEITRETEN'} onPress={doJoin} disabled={busy} />
              )}
            </View>
          ) : null}
        </>
      ) : null}

      <View style={{ flex: 1 }} />
      <BlockButton label="Zurück" variant="ghost" size="md" onPress={() => router.dismissTo('/crews')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.lcd,
    color: colors.signal,
    fontFamily: fonts.pixelBold,
    fontSize: 28,
    letterSpacing: 3,
    paddingHorizontal: 14,
    height: 64,
  },
  preview: { borderWidth: layout.border, borderColor: colors.signal, padding: 16, gap: 10 },
  crewName: { fontFamily: fonts.pixelBold, fontSize: 28, lineHeight: 32, color: colors.signal, letterSpacing: 1 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
