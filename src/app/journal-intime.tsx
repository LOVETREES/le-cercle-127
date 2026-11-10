// Le journal intime : écrire (ou dicter) ce que l'on vit, sans que ce soit un rêve.
// Tout reste sur le téléphone ; rien n'est envoyé à Oni ni au site.
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Notice, Screen } from '../components/ui';
import { appendTranscript } from '../lib/dictation';
import { deleteEntry, FEELINGS, listEntries, promptOfDay, saveEntry, type JournalEntry } from '../lib/journal-intime';
import { colors, fonts, radius, space } from '../lib/theme';
import { useDictation } from '../lib/use-dictation';
import { locale, t } from '../i18n';

const GOLD2 = '#f3dca0';
const CARD = '#11122a';

export default function JournalIntime() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [text, setText] = useState('');
  const [feeling, setFeeling] = useState<string | undefined>();
  const [usePrompt, setUsePrompt] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const base = useRef('');
  const prompt = promptOfDay();

  const speech = useDictation({
    onTranscript: useCallback((v: string) => setText(appendTranscript(base.current, v).slice(0, 20000)), []),
  });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listEntries().then((l) => alive && setEntries(l), () => undefined);
      return () => {
        alive = false;
      };
    }, []),
  );

  const reset = () => {
    setText('');
    setFeeling(undefined);
    setUsePrompt(false);
    setEditing(null);
  };
  const save = async () => {
    if (!text.trim()) return;
    if (speech.active) speech.stop();
    setEntries(await saveEntry({ id: editing ?? undefined, text, feeling, prompt: usePrompt ? prompt : undefined }));
    reset();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };
  const edit = (e: JournalEntry) => {
    setEditing(e.id);
    setText(e.text);
    setFeeling(e.feeling);
    setUsePrompt(false);
  };
  const remove = (e: JournalEntry) => {
    const go = async () => {
      setEntries(await deleteEntry(e.id));
      if (editing === e.id) reset();
    };
    if (Platform.OS === 'web') void go();
    else
      Alert.alert(t('Supprimer cette page ?'), t('Elle sera effacée de ce téléphone.'), [
        { text: t('Annuler'), style: 'cancel' },
        { text: t('Supprimer'), style: 'destructive', onPress: () => void go() },
      ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ gap: 4, alignItems: 'center' }}>
          <Text style={st.kicker}>{t('MON JOURNAL INTIME')}</Text>
          <Text style={st.title}>{t('Ce que je vis')}</Text>
          <Text style={st.lead}>{t('Tes pensées, tes ressentis, tes prises de conscience. Ce journal reste sur ton téléphone : il n’est envoyé ni à Oni, ni au site.')}</Text>
        </View>

        <View style={st.card}>
          <Text style={st.date}>{(editing ? t('Modifier la page') : new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })).toUpperCase()}</Text>
          {!editing ? (
            <Pressable onPress={() => setUsePrompt((v) => !v)} style={[st.prompt, usePrompt && st.promptOn]} accessibilityRole="checkbox" accessibilityState={{ checked: usePrompt }}>
              <Text style={st.promptK}>{usePrompt ? t('✦ Invitation du jour') : t('Besoin d’une invitation ?')}</Text>
              <Text style={st.promptT}>{t(prompt)}</Text>
            </Pressable>
          ) : null}
          <TextInput
            value={text}
            onChangeText={setText}
            editable={!speech.active}
            placeholder={usePrompt ? t(prompt) : t('Écris librement…')}
            placeholderTextColor={colors.muted}
            multiline
            style={st.input}
            accessibilityLabel={t('Page du journal')}
          />
          <Pressable
            onPress={() => {
              if (speech.active) speech.stop();
              else {
                base.current = text;
                void speech.start();
              }
            }}
            disabled={speech.phase === 'starting' || speech.phase === 'stopping'}
            style={st.ghost}
            accessibilityRole="button"
          >
            <Text style={st.ghostT}>{speech.active ? t('Arrêter la dictée') : t('🎙 Dicter à voix haute')}</Text>
          </Pressable>
          {speech.error ? <Notice tone="error" text={speech.error} /> : null}

          <Text style={st.label}>{t('Comment je me sens (facultatif)')}</Text>
          <View style={st.chips}>
            {FEELINGS.map((f) => {
              const on = feeling === f;
              return (
                <Pressable key={f} onPress={() => setFeeling(on ? undefined : f)} style={[st.chip, on && st.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                  <Text style={[st.chipT, on && st.chipTOn]}>{t(f)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={() => void save()} disabled={!text.trim()} style={[st.cta, !text.trim() && { opacity: 0.45 }]} accessibilityRole="button">
            <Text style={st.ctaT}>{editing ? t('Enregistrer les changements') : t('Garder cette page')}</Text>
          </Pressable>
          {editing ? (
            <Pressable onPress={reset} accessibilityRole="button" style={{ alignSelf: 'center' }} hitSlop={8}>
              <Text style={st.muted}>{t('Annuler la modification')}</Text>
            </Pressable>
          ) : null}
          {savedMsg ? <Notice tone="success" text={t('Page gardée dans ton journal.')} /> : null}
        </View>

        <Text style={st.kicker}>{entries.length ? t('MES PAGES · {n}', { n: entries.length }) : t('MES PAGES')}</Text>
        {entries.length === 0 ? (
          <Text style={st.muted}>{t('Tes pages s’afficheront ici, de la plus récente à la plus ancienne.')}</Text>
        ) : (
          entries.map((e) => {
            const d = new Date(e.at);
            const isOpen = open === e.id;
            return (
              <Pressable key={e.id} onPress={() => setOpen(isOpen ? null : e.id)} style={st.entry} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                <View style={st.entryHead}>
                  <Text style={st.entryDate}>{d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                  {e.feeling ? <Text style={st.entryFeel}>{t(e.feeling)}</Text> : null}
                </View>
                {e.prompt ? <Text style={st.entryPrompt}>{t(e.prompt)}</Text> : null}
                <Text style={st.entryText} numberOfLines={isOpen ? undefined : 3}>{e.text}</Text>
                {isOpen ? (
                  <View style={st.entryActions}>
                    <Pressable onPress={() => edit(e)} accessibilityRole="button" hitSlop={8}>
                      <Text style={st.action}>{t('Modifier')}</Text>
                    </Pressable>
                    <Pressable onPress={() => remove(e)} accessibilityRole="button" hitSlop={8}>
                      <Text style={[st.action, { color: colors.danger }]}>{t('Supprimer')}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold, textAlign: 'center' },
  title: { fontFamily: fonts.title, fontSize: 32, color: colors.text },
  lead: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center' },
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(216,182,107,0.45)', padding: space.md, gap: space.sm },
  date: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: colors.muted },
  prompt: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 2 },
  promptOn: { borderColor: 'rgba(243,220,160,0.7)', backgroundColor: '#15142c' },
  promptK: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: colors.gold },
  promptT: { fontFamily: fonts.titleItalic, fontSize: 18, lineHeight: 24, color: GOLD2 },
  input: { minHeight: 180, borderWidth: 1, borderColor: 'rgba(216,182,107,0.3)', borderRadius: radius.md, padding: 14, color: colors.text, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  ghost: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 11, alignItems: 'center' },
  ghostT: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: 'rgba(170,160,230,0.45)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: '#e8cf8f', borderColor: '#e8cf8f' },
  chipT: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  chipTOn: { color: '#1b1730', fontFamily: fonts.bodyBold },
  cta: { backgroundColor: '#e8cf8f', borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  ctaT: { fontFamily: fonts.title, fontSize: 20, color: '#1b1730' },
  muted: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, textAlign: 'center' },
  entry: { backgroundColor: CARD, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: 6 },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  entryDate: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.gold, textTransform: 'capitalize', flexShrink: 1 },
  entryFeel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  entryPrompt: { fontFamily: fonts.titleItalic, fontSize: 15, color: GOLD2 },
  entryText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  entryActions: { flexDirection: 'row', gap: space.lg, marginTop: 4 },
  action: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
});
