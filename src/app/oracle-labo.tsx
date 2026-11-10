// Laboratoire des sept qubits : une Sœur par qubit, une mesure = une lame. Pédagogique, à part du tirage.
import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/ui';
import { lameByMask, SISTERS } from '../lib/oracle/engine';
import { lameText } from '../lib/oracle/localize';
import { H, X, isSuperposed, ket, measure, outcomes, type QState } from '../lib/oracle/qubits';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

const GOLD2 = '#f3dca0';
const CARD = '#11122a';
const START: QState[] = Array(7).fill('0');
const bits = (n: number) => Array.from(Crypto.getRandomBytes(n), (b) => b & 1);

export default function OracleLabo() {
  const [qs, setQs] = useState<QState[]>(START);
  const [result, setResult] = useState<{ bits: number[]; mask: number } | null>(null);

  const apply = (i: number, gate: Record<QState, QState>) => {
    setQs((l) => l.map((q, j) => (j === i ? gate[q] : q)));
    setResult(null);
  };
  const n = outcomes(qs);
  const lame = result && result.mask ? lameByMask(result.mask) : undefined;

  return (
    <Screen>
      <View style={{ gap: space.xs, alignItems: 'center' }}>
        <Text style={st.kicker}>{t('ORACLE 127 · LABORATOIRE')}</Text>
        <Text style={st.title}>{t('Les sept qubits')}</Text>
        <Text style={st.lead}>
          {t('Un qubit par Sœur. Chaque mesure donne 7 bits : exactement l’une des 127 lames, ou l’état vide (aucune Sœur), qui n’en est pas une. 2⁷ − 1 = 127.')}
        </Text>
      </View>

      <View style={st.card}>
        {SISTERS.map((s, i) => (
          <View key={s.name} style={st.row}>
            <Text style={st.sname}>{s.glyph} {s.name}</Text>
            <Text style={[st.ket, isSuperposed(qs[i]) && { color: GOLD2 }]}>{ket(qs[i])}</Text>
            <Pressable onPress={() => apply(i, H)} style={st.gate} accessibilityRole="button" accessibilityLabel={t('Porte H sur {s}', { s: s.name })}>
              <Text style={st.gateT}>H</Text>
            </Pressable>
            <Pressable onPress={() => apply(i, X)} style={st.gate} accessibilityRole="button" accessibilityLabel={t('Porte X sur {s}', { s: s.name })}>
              <Text style={st.gateT}>X</Text>
            </Pressable>
            <Text style={st.bit}>{result ? result.bits[i] : '·'}</Text>
          </View>
        ))}
        <Text style={st.small}>{t('{n} issue(s) possible(s), toutes équiprobables.', { n })}</Text>
      </View>

      <View style={st.btns}>
        <Pressable onPress={() => { setQs(Array(7).fill('+')); setResult(null); }} style={st.ghost} accessibilityRole="button">
          <Text style={st.ghostT}>{t('H partout')}</Text>
        </Pressable>
        <Pressable onPress={() => { setQs(START); setResult(null); }} style={st.ghost} accessibilityRole="button">
          <Text style={st.ghostT}>{t('Réinitialiser')}</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => setResult(measure(qs, bits))} style={st.cta} accessibilityRole="button">
        <Text style={st.ctaT}>{t('Mesurer')}</Text>
      </Pressable>

      {result ? (
        <View style={st.card}>
          <Text style={st.kicker}>{t('MESURE')} · {result.bits.slice().reverse().join('')}</Text>
          {lame ? (
            <>
              <Text style={st.lname}>{t('Lame {n}', { n: String(lame.n).padStart(3, '0') })} · {lameText(lame).name}</Text>
              <Text style={st.text}>{lameText(lame).definition}</Text>
              <Text style={st.small}>{SISTERS.filter((_, i) => result.bits[i]).map((s) => s.name).join(' · ')}</Text>
            </>
          ) : (
            <Text style={st.text}>{t('0000000 : aucune Sœur. C’est le 128ᵉ état, le seul qui ne correspond à aucune lame. Mesurez à nouveau.')}</Text>
          )}
        </View>
      ) : null}

      <Text style={st.veil}>
        {t('Simulation mathématique locale de qubits indépendants, à but pédagogique. Elle ne fournit pas le hasard des tirages de l’Oracle.')}
      </Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold, textAlign: 'center' },
  title: { fontFamily: fonts.title, fontSize: 30, color: colors.text },
  lead: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.muted, textAlign: 'center' },
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sname: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  ket: { width: 44, fontFamily: fonts.title, fontSize: 20, color: colors.text, textAlign: 'center' },
  gate: { width: 40, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  gateT: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.gold },
  bit: { width: 18, fontFamily: fonts.bodyBold, fontSize: 16, color: GOLD2, textAlign: 'center' },
  small: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  btns: { flexDirection: 'row', gap: space.sm },
  ghost: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  ghostT: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
  cta: { backgroundColor: '#e8cf8f', borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  ctaT: { fontFamily: fonts.title, fontSize: 20, color: '#1b1730' },
  lname: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  veil: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' },
});
