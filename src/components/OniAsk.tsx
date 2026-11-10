// Oni a lu le récit : au plus trois questions facultatives, avant de garder le rêve.
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, GoldButton, Notice, OutlineButton } from './ui';
import type { OniAnswer, OniQuestion } from '../lib/oni-questions';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

const CARD = '#11122a';

type Props = {
  questions: OniQuestion[];
  answers: OniAnswer[];
  onChange: (a: OniAnswer[]) => void;
  onSave: () => void;
  onSkip: () => void;
  onBack: () => void;
  busy?: boolean;
  error?: string | null;
  name?: string;
};

export function OniAsk({ questions, answers, onChange, onSave, onSkip, onBack, busy, error, name }: Props) {
  const get = (id: string): OniAnswer => answers.find((a) => a.id === id) ?? { id, choices: [], text: '' };
  const set = (next: OniAnswer) => onChange([...answers.filter((a) => a.id !== next.id), next]);
  const toggle = (q: OniQuestion, opt: string) => {
    const a = get(q.id);
    const on = a.choices.includes(opt);
    set({ ...a, choices: on ? a.choices.filter((c) => c !== opt) : q.multi ? [...a.choices, opt] : [opt] });
  };
  const answered = answers.some((a) => a.choices.length || a.text.trim());

  return (
    <View style={st.card}>
      <Text style={st.kicker}>{t('ONI A LU VOTRE RÊVE')}</Text>
      <Text style={st.title}>{name ? t('{n}, quelques questions, si vous le voulez', { n: name }) : t('Quelques questions, si vous le voulez')}</Text>
      <Text style={st.vow}>{t('« Je ne cherche pas à tout savoir de vous. Je cherche à comprendre ce que votre rêve signifie pour vous. »')}</Text>
      <Body muted style={{ fontSize: 13 }}>{t('Chaque question est facultative. Vos réponses rejoignent votre rêve, et ce que vous dites prévaut toujours sur les hypothèses d’Oni.')}</Body>

      {questions.map((q, i) => {
        const a = get(q.id);
        return (
          <View key={q.id} style={st.q}>
            <View style={st.qHead}>
              <View style={st.num}><Text style={st.numT}>{i + 1}</Text></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.qLabel}>{t(q.label)}</Text>
                <Text style={st.qText}>{t(q.text)}</Text>
              </View>
            </View>
            {q.options ? (
              <View style={st.opts}>
                {q.options.map((o) => {
                  const on = a.choices.includes(o);
                  return (
                    <Pressable
                      key={o}
                      onPress={() => toggle(q, o)}
                      style={[st.opt, on && st.optOn]}
                      accessibilityRole={q.multi ? 'checkbox' : 'radio'}
                      accessibilityState={{ checked: on }}
                    >
                      <Text style={[st.optT, on && st.optTOn]}>{t(o)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            <TextInput
              value={a.text}
              onChangeText={(text) => set({ ...a, text: text.slice(0, 600) })}
              placeholder={t('En quelques mots, si vous le souhaitez…')}
              placeholderTextColor={colors.muted}
              multiline
              style={st.input}
              accessibilityLabel={t(q.text)}
            />
          </View>
        );
      })}

      {error ? <Notice tone="error" text={error} /> : null}
      <GoldButton label={answered ? t('Garder mon rêve et mes précisions') : t('Garder dans mon Grimoire')} onPress={answered ? onSave : onSkip} loading={busy} />
      {answered ? <OutlineButton label={t('Garder le rêve sans mes réponses')} onPress={onSkip} disabled={busy} /> : null}
      <Pressable onPress={onBack} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'center' }}>
        <Text style={st.back}>{t('‹ Revenir à mon récit')}</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(216,182,107,0.5)', padding: space.md, gap: space.md },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  title: { fontFamily: fonts.title, fontSize: 26, lineHeight: 30, color: colors.text },
  vow: { fontFamily: fonts.titleItalic, fontSize: 17, lineHeight: 23, color: '#f3dca0' },
  q: { gap: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: 'rgba(216,182,107,0.18)' },
  qHead: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  num: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  numT: { fontFamily: fonts.title, fontSize: 17, color: colors.gold },
  qLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.2, color: colors.muted, textTransform: 'uppercase' },
  qText: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 22, color: colors.text },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { borderWidth: 1, borderColor: 'rgba(170,160,230,0.45)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  optOn: { backgroundColor: '#e8cf8f', borderColor: '#e8cf8f' },
  optT: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  optTOn: { color: '#1b1730', fontFamily: fonts.bodyBold },
  input: { minHeight: 64, borderWidth: 1, borderColor: 'rgba(216,182,107,0.3)', borderRadius: radius.md, padding: 12, color: colors.text, fontFamily: fonts.body, fontSize: 15, textAlignVertical: 'top' },
  back: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted },
});
