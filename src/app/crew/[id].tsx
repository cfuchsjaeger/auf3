import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Share, StyleSheet, Text, View } from 'react-native';

import { feedback } from '@/feedback';
import { formatInviteCode, inviteMessage, smsUrl, whatsappUrl } from '@/lib/invite';
import { useAccount, type Member } from '@/state/account';
import { BlockButton } from '@/ui/BlockButton';
import { fitPixelSize } from '@/ui/keypad-logic';
import { PixelAvatar } from '@/ui/PixelAvatar';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

export default function CrewDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, crews, userId, handle, members, leave } = useAccount();
  const crew = crews.find((c) => c.id === id);
  const [list, setList] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      members(id).then((res) => {
        if (!active) return;
        if (res.ok) {
          setList(res.value);
          setError(null);
        } else {
          setError(res.error);
        }
      });
      return () => {
        active = false;
      };
    }, [id, members]),
  );

  if (status === 'loading') return null;
  if (!crew) return <Redirect href="/crews" />;

  const message = inviteMessage({ crewName: crew.name, code: crew.inviteCode, inviterName: handle });

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // App fehlt oder der Link ist auf dieser Plattform unbekannt: Teilen-Menü als Rückfall.
      await shareSheet();
    }
  };

  const shareSheet = async () => {
    try {
      await Share.share({ message });
    } catch {
      setError('Teilen hat nicht geklappt.');
    }
  };

  const doLeave = async () => {
    const res = await leave(crew.id);
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return;
    }
    feedback.miss();
    router.dismissTo('/crews');
  };

  return (
    <Screen scroll>
      <View style={{ gap: 6 }}>
        <T variant="label">GRUPPE</T>
        <Text style={[styles.title, { fontSize: fitPixelSize(crew.name, 340, 30), lineHeight: fitPixelSize(crew.name, 340, 30) + 4 }]}>
          {crew.name.toUpperCase()}
        </Text>
      </View>

      <View style={styles.inviteBox}>
        <T variant="label">EINLADEN</T>
        <Text testID="invite-code" numberOfLines={1} accessibilityLabel={`Einladungscode ${crew.inviteCode.split('').join(' ')}`} style={styles.code}>
          {formatInviteCode(crew.inviteCode)}
        </Text>
        <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
          Schick den Link. Wer die App hat, tippt drauf. Sonst Code unter Gruppen, Beitreten eingeben.
        </T>
        <BlockButton testID="invite-whatsapp" label="PER WHATSAPP" onPress={() => open(whatsappUrl(message))} />
        <View style={styles.row}>
          <BlockButton
            testID="invite-sms"
            label="Per Nachricht"
            variant="ghost"
            size="md"
            ghostColor={colors.text}
            onPress={() => open(smsUrl(message, Platform.OS))}
            style={{ flex: 1 }}
          />
          <BlockButton
            testID="invite-share"
            label="Andere App"
            variant="ghost"
            size="md"
            ghostColor={colors.text}
            onPress={shareSheet}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <T variant="label">{list ? (list.length === 1 ? '1 PERSON' : `${list.length} LEUTE`) : 'MITGLIEDER'}</T>
        {list?.map((m) => (
          <View key={m.userId} style={styles.member} testID={`member-${m.handle}`}>
            <PixelAvatar name={m.handle} size={32} />
            <Text style={styles.memberName}>{m.handle}</Text>
            <View style={{ flex: 1 }} />
            {m.role === 'owner' ? <Text style={styles.badge}>GRÜNDER</Text> : null}
            {m.userId === userId ? <Text style={[styles.badge, styles.badgeMe]}>DU</Text> : null}
          </View>
        ))}
        {list && list.length === 1 ? (
          <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
            Noch allein. Lad die anderen ein.
          </T>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BlockButton
        testID="crew-start-event"
        label="EVENT STARTEN"
        variant="paper"
        onPress={() => router.push({ pathname: '/setup', params: { crew: crew.id } })}
      />

      <View style={{ gap: 10 }}>
        {confirmLeave ? (
          <BlockButton label="Wirklich verlassen" variant="ghost" size="md" ghostColor={colors.warn} onPress={doLeave} />
        ) : (
          <BlockButton label="Gruppe verlassen" variant="ghost" size="md" onPress={() => setConfirmLeave(true)} />
        )}
        <BlockButton label="Zurück" variant="ghost" size="md" onPress={() => router.dismissTo('/crews')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.pixelBold, fontSize: 30, lineHeight: 34, color: colors.signal, letterSpacing: 1 },
  inviteBox: { borderWidth: layout.border, borderColor: colors.signal, padding: 16, gap: 12 },
  // Breiteste Zeichen (M, W, Q) müssen in eine Zeile passen, auch auf schmalen Handys.
  code: { fontFamily: fonts.pixelBold, fontSize: 26, lineHeight: 32, color: colors.text, letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 10 },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  memberName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  badge: {
    fontFamily: fonts.pixelBold,
    fontSize: 10,
    color: colors.text2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMe: { color: colors.ink, backgroundColor: colors.signal, borderColor: colors.signal },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
