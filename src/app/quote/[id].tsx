/**
 * Ablauf einer Quote im Ein-Handy-Modus:
 *   Weitergeben → Range → (Weitergeben → Tippen) × 2 → AUF 3 → Countdown → Reveal
 *   → bei Fehlschlag in Runde 1: Gegenquote, gleiche Range, gleiche Schritte.
 * Die Spielregeln entscheidet die Domänenlogik, dieser Screen inszeniert nur.
 */
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  formatOneIn,
  formatPercent,
  headToHead,
  hunterOf,
  loserIfHit,
  oddsFor,
  playerById,
  playerIdFor,
  rangeVerdict,
  revealLine,
  rivalryLine,
  roundVerdict,
  streakBrokenLine,
  streakTeaser,
  survivalStreak,
  timesPicked,
  type Quote,
  type Role,
  type RoundNo,
  type Session,
} from '@/domain';
import { feedback, type CountStep } from '@/feedback';
import { useFaceDown } from '@/feedback/useFaceDown';
import { useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { Display } from '@/ui/Display';
import { Keypad } from '@/ui/Keypad';
import { PixelAvatar } from '@/ui/PixelAvatar';
import { RangeSlider } from '@/ui/RangeSlider';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

/** Runde 1: Das Target hält nach dem Setzen der Range das Handy, also tippt es zuerst. */
const PICK_ORDER: Record<RoundNo, Role[]> = { 1: ['target', 'challenger'], 2: ['challenger', 'target'] };

function isComplete(r: { picks: { challenger?: number; target?: number } }) {
  return r.picks.challenger !== undefined && r.picks.target !== undefined;
}

function initialRevealedRound(q: Quote | undefined): number {
  if (!q) return 0;
  if (q.status === 'resolved') return q.rounds.length;
  if (q.status === 'picking') return q.rounds.length - 1;
  return 0;
}

export default function QuoteFlow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, quoteEvent, settle } = useStore();
  const quote = session?.quotes.find((q) => q.id === id);

  const [passedTo, setPassedTo] = useState<Role | null>(null);
  const [revealedRound, setRevealedRound] = useState(() => initialRevealedRound(quote));
  const [showReveal, setShowReveal] = useState<number | null>(() =>
    quote?.status === 'resolved' && quote.rounds.length > 0 ? quote.rounds.length : null,
  );
  const [counting, setCounting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !quote) return <Redirect href="/" />;

  const challenger = playerById(session, quote.challengerId);
  const target = playerById(session, quote.targetId);
  const nameOf = (role: Role) => (role === 'challenger' ? challenger.name : target.name);

  const pendingRound = quote.rounds
    .filter(isComplete)
    .map((r) => r.no)
    .filter((n) => n > revealedRound)
    .reduce<number | null>((max, n) => (max === null || n > max ? n : max), null);

  const act = (res: { ok: true } | { ok: false; error: string }) => {
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return false;
    }
    setError(null);
    return true;
  };

  if (quote.status === 'declined') {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <T variant="pixelXL" style={{ color: colors.warn }}>
          ABGE{'\n'}LEHNT.
        </T>
        <T variant="bodyStrong">{target.name} kneift. Zählt im Mut-Ranking wie eine 50.</T>
        <BlockButton label="OK" onPress={() => router.dismissTo('/')} />
      </Screen>
    );
  }

  if (showReveal !== null) {
    const round = quote.rounds[showReveal - 1];
    return (
      <Reveal
        session={session}
        quote={quote}
        roundNo={round.no}
        onCounter={() => {
          setShowReveal(null);
          setPassedTo(null);
        }}
        onReceipt={() => router.replace(`/receipt/${quote.id}`)}
        onVeto={(dareId) => {
          if (act(settle(dareId, 'veto'))) router.replace(`/receipt/${quote.id}`);
        }}
        onDone={() => router.dismissTo('/')}
      />
    );
  }

  if (pendingRound !== null) {
    const round = quote.rounds[pendingRound - 1];
    if (counting) {
      return (
        <Countdown
          onDone={() => {
            setCounting(false);
            setRevealedRound(pendingRound);
            setShowReveal(pendingRound);
            const verdict = roundVerdict(round);
            if (verdict === 'hit') feedback.hit();
            else if (verdict === 'near') feedback.near();
            else feedback.miss();
          }}
        />
      );
    }
    return (
      <Ready
        challengerName={challenger.name}
        targetName={target.name}
        roundNo={round.no}
        onGo={() => setCounting(true)}
      />
    );
  }

  if (quote.status === 'awaitingRange') {
    if (passedTo !== 'target') {
      return <Pass name={target.name} purpose="range" onConfirm={() => setPassedTo('target')} />;
    }
    const h = headToHead(session, quote.challengerId, quote.targetId);
    const history = [
      rivalryLine(challenger.name, target.name, h.aOverB, h.bOverA),
      streakTeaser(target.name, survivalStreak(session, target.id, quote.id)),
    ].filter((line): line is string => line !== null);
    return (
      <RangeStage
        challengerName={challenger.name}
        dare={quote.dare}
        history={history}
        error={error}
        onSet={(range) => {
          if (act(quoteEvent(quote.id, { type: 'setRange', range }))) feedback.lock();
        }}
        onDecline={() => act(quoteEvent(quote.id, { type: 'decline' }))}
      />
    );
  }

  if (quote.status === 'picking' && quote.range !== null) {
    const round = quote.rounds[quote.rounds.length - 1];
    const role = PICK_ORDER[round.no].find((r) => round.picks[r] === undefined)!;
    const other: Role = role === 'challenger' ? 'target' : 'challenger';
    if (passedTo !== role) {
      return <Pass name={nameOf(role)} purpose="pick" roundNo={round.no} onConfirm={() => setPassedTo(role)} />;
    }
    return (
      <PickStage
        key={`${round.no}-${role}`}
        name={nameOf(role)}
        range={quote.range}
        roundNo={round.no}
        otherReady={round.picks[other] !== undefined ? nameOf(other) : null}
        error={error}
        onLock={(value) => {
          if (act(quoteEvent(quote.id, { type: 'pick', role, value }))) {
            feedback.lock();
            setPassedTo(null);
          }
        }}
      />
    );
  }

  return <Redirect href="/" />;
}

// ---------------------------------------------------------------------------

function Pass({
  name,
  purpose,
  roundNo,
  onConfirm,
}: {
  name: string;
  purpose: 'range' | 'pick';
  roundNo?: RoundNo;
  onConfirm: () => void;
}) {
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <T variant="label">{purpose === 'pick' && roundNo === 2 ? 'GEGENQUOTE' : 'WEITERGEBEN'}</T>
      <View style={{ gap: 20, alignItems: 'flex-start' }}>
        <T variant="label">HANDY AN</T>
        <PixelAvatar name={name} size={80} />
        <T variant="pixelXL" style={{ color: colors.signal }}>
          {name.toUpperCase()}
        </T>
        <T variant="bodyStrong" style={{ color: colors.text2 }}>
          {purpose === 'range' ? `${name} setzt die Quote.` : 'Geheim tippen. Alle anderen schauen weg.'}
        </T>
      </View>
      <BlockButton testID="pass-confirm" label={`ICH BIN ${name.toUpperCase()}`} onPress={onConfirm} />
    </Screen>
  );
}

function RangeStage({
  challengerName,
  dare,
  history,
  error,
  onSet,
  onDecline,
}: {
  challengerName: string;
  dare: string;
  history: string[];
  error: string | null;
  onSet: (range: number) => void;
  onDecline: () => void;
}) {
  const [range, setRange] = useState(10);
  const odds = oddsFor(range);
  return (
    <Screen scroll>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PixelAvatar name={challengerName} size={30} />
          <T variant="label">{challengerName.toUpperCase()} QUOTET DICH</T>
        </View>
        <T variant="title">„{dare}“</T>
        {history.length > 0 ? (
          <View style={styles.history} testID="history">
            {history.map((line) => (
              <Text key={line} style={styles.historyLine}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <T variant="label" style={{ textAlign: 'center' }}>
          DEINE QUOTE
        </T>
        <Display testID="range-value" value={String(range)} />
        <RangeSlider value={range} onChange={setRange} />
        <View style={styles.riskRow}>
          <View style={{ gap: 2 }}>
            <T variant="label">DEIN RISIKO</T>
            <Text style={styles.risk}>{formatOneIn(range)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flexShrink: 1, gap: 2 }}>
            <Text style={[styles.verdict, range <= 6 && { color: colors.warn }]}>{rangeVerdict(range)}</Text>
            <T variant="body" style={{ color: colors.text2, fontSize: 13, textAlign: 'right' }}>
              Gegenrisiko {challengerName}: {formatPercent(odds.challengerMust)}
            </T>
          </View>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: 10 }}>
        <BlockButton testID="range-submit" label="QUOTE GEBEN" onPress={() => onSet(range)} />
        <BlockButton label="Ablehnen · zählt als 50" variant="ghost" size="md" onPress={onDecline} />
      </View>
    </Screen>
  );
}

function PickStage({
  name,
  range,
  roundNo,
  otherReady,
  error,
  onLock,
}: {
  name: string;
  range: number;
  roundNo: RoundNo;
  otherReady: string | null;
  error: string | null;
  onLock: (value: number) => void;
}) {
  const [entry, setEntry] = useState('');
  const valid = entry !== '' && Number(entry) >= 1 && Number(entry) <= range;
  const lock = () => valid && onLock(Number(entry));
  const flipAvailable = useFaceDown(valid, lock);

  return (
    <Screen>
      <View style={styles.pickHeader}>
        <T variant="label">
          QUOTE {range} · {roundNo === 1 ? 'RUNDE 1' : 'GEGENQUOTE'}
        </T>
        {otherReady ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, backgroundColor: colors.signal }} />
            <Text style={styles.readyText}>{otherReady.toUpperCase()} IST BEREIT</Text>
          </View>
        ) : null}
      </View>
      <T variant="bodyStrong">{name} tippt, geheim.</T>
      <Display
        testID="pick-value"
        value={entry === '' ? '_' : entry}
        corner={`1 – ${range}`}
        align="right"
        height={140}
        fontSize={104}
      />
      <Keypad value={entry} max={range} onChange={setEntry} onSubmit={lock} submitLabel="SPERREN" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.flipHint}>
        <Text style={styles.flipTitle}>{flipAvailable ? 'HANDY UMDREHEN' : 'SPERREN, DANN WEITERGEBEN'}</Text>
        <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
          {flipAvailable
            ? 'Display nach unten sperrt deine Zahl. Oder SPERREN drücken.'
            : 'Niemand sieht deine Zahl. Danach ist die andere Person dran.'}
        </T>
      </View>
    </Screen>
  );
}

function Ready({
  challengerName,
  targetName,
  roundNo,
  onGo,
}: {
  challengerName: string;
  targetName: string;
  roundNo: RoundNo;
  onGo: () => void;
}) {
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <T variant="label">{roundNo === 1 ? 'RUNDE 1' : 'GEGENQUOTE'} · BEIDE ZAHLEN GESPERRT</T>
      <View style={styles.cards}>
        {[challengerName, targetName].map((n) => (
          <View key={n} style={styles.lockedCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PixelAvatar name={n} size={30} />
              <T variant="label">{n.toUpperCase()}</T>
            </View>
            <Text style={[styles.cardNumber, { color: colors.lineStrong }]}>?</Text>
          </View>
        ))}
      </View>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <BlockButton testID="auf3" label="AUF 3" size="hero" onPress={onGo} style={{ width: 280 }} />
        <T variant="body" style={{ color: colors.text2 }}>
          Alle schauen her.
        </T>
      </View>
    </Screen>
  );
}

const COUNT_STEP_MS = 620;

/** Drei Schläge, jeder stärker: Ziffer springt groß herein, Haptik und Ton steigern sich. */
function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  const finish = useEffectEvent(onDone);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 1.6);

  const punch = useEffectEvent((step: CountStep) => {
    feedback.count(step);
    if (!reduceMotion) {
      scale.value = 1.5 + step * 0.15;
      scale.value = withSpring(1, { damping: 11, stiffness: 260, mass: 0.6 });
    }
  });

  useEffect(() => {
    punch(1);
    const timers = [
      setTimeout(() => {
        setN(2);
        punch(2);
      }, COUNT_STEP_MS),
      setTimeout(() => {
        setN(1);
        punch(3);
      }, COUNT_STEP_MS * 2),
      setTimeout(() => finish(), COUNT_STEP_MS * 3),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Animated.Text
        testID="countdown"
        accessibilityLiveRegion="assertive"
        style={[{ fontFamily: fonts.pixelBold, fontSize: 220, lineHeight: 230, color: colors.signal }, style]}>
        {n}
      </Animated.Text>
    </Screen>
  );
}

/** Die Zahl knallt von unten herein, mit kleinem Überschwingen. */
function SlamNumber({ value, delay, color }: { value: number; delay: number; color: string }) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(reduceMotion ? 0 : 56);
  const scale = useSharedValue(reduceMotion ? 1 : 1.35);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const spring = { damping: 12, stiffness: 320, mass: 0.7 };
    y.value = withDelay(delay, withSpring(0, spring));
    scale.value = withDelay(delay, withSpring(1, spring));
    opacity.value = withDelay(delay, withTiming(1, { duration: 80 }));
  }, [delay, opacity, reduceMotion, scale, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <Animated.Text accessibilityLabel={String(value)} style={[styles.cardNumber, { color }, style]}>
      {value}
    </Animated.Text>
  );
}

const BURST = Array.from({ length: 16 }, (_, i) => ({
  angle: (i / 16) * Math.PI * 2 + (i % 2) * 0.2,
  distance: 110 + (i % 3) * 38,
  size: 8 + (i % 4) * 4,
  color: i % 3 === 0 ? colors.text : colors.ink,
  delay: (i % 4) * 25,
}));

/** Pixelquadrate fliegen aus der Mitte, 350 ms, dann weg. */
function PixelBurst() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BURST.map((p, i) => (
        <Shard key={i} {...p} />
      ))}
    </View>
  );
}

function Shard({ angle, distance, size, color, delay }: (typeof BURST)[number]) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: Math.cos(angle) * distance * t.value },
      { translateY: Math.sin(angle) * distance * t.value },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: '50%', top: '42%', width: size, height: size, backgroundColor: color },
        style,
      ]}
    />
  );
}

/** Bei Treffer: kurzer Blitz, kurzes Wackeln, Pixelausbruch. Nichts länger als 400 ms. */
function HitStage({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const flash = useSharedValue(reduceMotion ? 0 : 1);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    flash.value = withTiming(0, { duration: 180 });
    shake.value = withSequence(
      withTiming(-7, { duration: 40 }),
      withTiming(7, { duration: 60 }),
      withTiming(-5, { duration: 60 }),
      withTiming(3, { duration: 50 }),
      withTiming(0, { duration: 40 }),
    );
  }, [flash, reduceMotion, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[{ flex: 1 }, shakeStyle]}>{children}</Animated.View>
      {!reduceMotion ? <PixelBurst /> : null}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.text }, flashStyle]} />
    </View>
  );
}

function Reveal({
  session,
  quote,
  roundNo,
  onCounter,
  onReceipt,
  onVeto,
  onDone,
}: {
  session: Session;
  quote: Quote;
  roundNo: RoundNo;
  onCounter: () => void;
  onReceipt: () => void;
  onVeto: (dareId: string) => void;
  onDone: () => void;
}) {
  const round = quote.rounds[roundNo - 1];
  const c = round.picks.challenger!;
  const t = round.picks.target!;
  const verdict = roundVerdict(round) ?? 'miss';
  const challenger = playerById(session, quote.challengerId);
  const target = playerById(session, quote.targetId);
  const hunter = playerById(session, playerIdFor(quote, hunterOf(roundNo)));
  const loser = playerById(session, playerIdFor(quote, loserIfHit(roundNo)));
  const dare = session.dares.find((d) => d.quoteId === quote.id);
  const seed = `${quote.id}:${roundNo}`;
  const range = quote.range ?? 2;
  const counter = roundNo === 1 && verdict !== 'hit';

  const lines: string[] = [];
  if (verdict === 'hit') {
    lines.push(
      revealLine({
        kind: 'hit',
        seed,
        loserName: loser.name,
        hunterName: hunter.name,
        value: c,
        loserTimesPickedValue: timesPicked(session, loser.id, c),
        round: roundNo,
      }),
    );
    const broken = streakBrokenLine(loser.name, survivalStreak(session, loser.id, quote.id));
    if (broken) lines.push(broken);
  } else if (verdict === 'near') {
    lines.push(revealLine({ kind: 'near', seed, survivorName: loser.name, a: c, b: t, round: roundNo }));
    if (counter) lines.push(`Gegenquote. ${target.name} jagt jetzt.`);
  } else if (counter) {
    lines.push(revealLine({ kind: 'counter', seed, newHunterName: target.name }));
  } else {
    lines.push(revealLine({ kind: 'miss', seed }));
  }

  const hit = verdict === 'hit';
  const ink = hit ? colors.ink : colors.text;
  const cards = (
    <View style={styles.cards}>
      {[
        { p: challenger, v: c, delay: 0 },
        { p: target, v: t, delay: 140 },
      ].map(({ p, v, delay }) => (
        <View key={p.id} style={[styles.revealCard, !hit && { borderColor: colors.line, borderWidth: layout.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PixelAvatar name={p.name} size={30} />
            <T variant="label">{p.name.toUpperCase()}</T>
          </View>
          <SlamNumber value={v} delay={delay} color={colors.text} />
        </View>
      ))}
    </View>
  );

  if (hit) {
    return (
      <HitStage>
        <Screen background={colors.signal}>
          <View style={styles.revealHeader}>
            <Text style={[styles.revealMeta, { color: ink }]}>
              QUOTE {range} · {roundNo === 1 ? 'RUNDE 1' : 'GEGENQUOTE'}
            </Text>
            <Text style={[styles.revealMeta, { color: ink }]}>{formatOneIn(range).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
            <Text testID="reveal-title" style={[styles.revealTitle, { color: ink }]}>
              TREF{'\n'}FER.
            </Text>
            {cards}
            <View style={[styles.dareBox, { borderColor: ink }]}>
              <Text style={[styles.revealMeta, { color: ink }]}>{loser.name.toUpperCase()} MUSS</Text>
              <Text style={[styles.revealDare, { color: ink }]}>{quote.dare}</Text>
              {lines.map((line) => (
                <Text key={line} style={[styles.revealLine, { color: ink }]}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
          <View style={{ gap: 10 }}>
            <BlockButton testID="receipt-button" label="BELEG DRUCKEN" variant="dark" onPress={onReceipt} />
            {dare && dare.status === 'open' ? (
              <BlockButton
                label="Veto · kostet Ehre"
                variant="ghost"
                size="md"
                ghostColor={colors.ink}
                onPress={() => onVeto(dare.id)}
              />
            ) : null}
          </View>
        </Screen>
      </HitStage>
    );
  }

  const title = verdict === 'near' ? 'KNAPP.' : counter ? 'DANE\nBEN.' : 'NIEMAND\nMUSS.';
  const titleColor = verdict === 'near' ? colors.warn : counter ? colors.text : colors.text2;
  return (
    <Screen>
      <View style={styles.revealHeader}>
        <T variant="label">
          QUOTE {range} · {roundNo === 1 ? 'RUNDE 1' : 'GEGENQUOTE'}
        </T>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <Text testID="reveal-title" style={[styles.revealTitle, { color: titleColor }]}>
          {title}
        </Text>
        {cards}
        {lines.map((line, i) => (
          <T key={line} variant="bodyStrong" style={{ color: i === 0 && counter ? colors.signal : colors.text2 }}>
            {line}
          </T>
        ))}
      </View>
      {counter ? (
        <BlockButton testID="counter-button" label="GEGENQUOTE" onPress={onCounter} />
      ) : (
        <View style={{ gap: 10 }}>
          <BlockButton testID="done-button" label="FERTIG" onPress={onDone} />
          <BlockButton label="Beleg ansehen" variant="ghost" size="md" onPress={onReceipt} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  history: { borderLeftWidth: 3, borderColor: colors.warn, paddingLeft: 10, gap: 2 },
  historyLine: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text2 },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: layout.border,
    borderColor: colors.line,
    paddingTop: 14,
    gap: 12,
  },
  risk: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.text },
  verdict: { fontFamily: fonts.pixelBold, fontSize: 16, color: colors.signal, letterSpacing: 1 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
  pickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readyText: { fontFamily: fonts.pixel, fontSize: 11, color: colors.signal },
  flipHint: { borderWidth: layout.border, borderColor: colors.signal, padding: 14, gap: 4 },
  flipTitle: { fontFamily: fonts.pixelBold, fontSize: 14, color: colors.signal, letterSpacing: 1 },
  cards: { flexDirection: 'row', gap: 12 },
  lockedCard: {
    flex: 1,
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  revealCard: { flex: 1, backgroundColor: colors.ink, padding: 16, gap: 10, overflow: 'hidden' },
  cardNumber: { fontFamily: fonts.pixelBold, fontSize: 80, lineHeight: 86, color: colors.text },
  revealHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  revealMeta: { fontFamily: fonts.pixel, fontSize: 12, letterSpacing: 1 },
  revealTitle: { fontFamily: fonts.pixelBold, fontSize: 60, lineHeight: 62, letterSpacing: 2 },
  dareBox: { borderTopWidth: layout.border, paddingTop: 16, gap: 6 },
  revealDare: { fontFamily: fonts.bodyBold, fontSize: 24, lineHeight: 28 },
  revealLine: { fontFamily: fonts.bodyMedium, fontSize: 14, opacity: 0.8 },
});
