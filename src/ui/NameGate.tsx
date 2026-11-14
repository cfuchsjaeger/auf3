/** Erster Kontakt mit Gruppen: Name wählen. Dahinter steckt eine anonyme Anmeldung ohne E-Mail. */
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_PLAYER_NAME } from '@/domain';
import { feedback } from '@/feedback';
import { useAccount } from '@/state/account';
import { BlockButton } from './BlockButton';
import { T } from './Text';
import { colors, fonts, layout } from './theme';

export function NameGate({ lead }: { lead?: string }) {
  const { register } = useAccount();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await register(name.trim());
    setBusy(false);
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return;
    }
    feedback.lock();
  };

  return (
    <View style={{ gap: 14 }}>
      <T variant="label">WIE HEISST DU?</T>
      <T variant="title">{lead ?? 'Für Gruppen brauchst du einen Namen.'}</T>
      <TextInput
        testID="name-input"
        accessibilityLabel="Dein Name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError(null);
        }}
        onSubmitEditing={submit}
        submitBehavior="submit"
        returnKeyType="done"
        maxLength={MAX_PLAYER_NAME}
        autoCapitalize="words"
        placeholder="Fuchs"
        placeholderTextColor={colors.text2}
        selectionColor={colors.signal}
        style={styles.input}
      />
      <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
        So sehen dich die anderen. Keine E-Mail, kein Passwort. Löschst du die App, ist das Konto weg.
      </T>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <BlockButton testID="name-submit" label={busy ? 'MOMENT …' : 'WEITER'} onPress={submit} disabled={!name.trim() || busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    paddingHorizontal: 14,
    height: 56,
  },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
