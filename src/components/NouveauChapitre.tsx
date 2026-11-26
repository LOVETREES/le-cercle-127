import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { t } from '../i18n';
import { saveEntry, type JournalEntry } from '../lib/journal-intime';
import { currentOwner } from '../lib/palm';
import { explicitCrisis, RENEWAL_PROMPTS, renewalEntry, renewalSuggested } from '../lib/renouveau';
import { colors, fonts, radius, space, textSize } from '../lib/theme';
import { Notice, OutlineButton } from './ui';
import { EclairageSoeur } from './EclairageSoeur';
import { draftKey } from '../lib/local-draft';
import { useLocalDraft } from '../lib/use-local-draft';

const PAGES = [
  { title: 'Voir ce qui pèse', voices: '[Oni]', invitation: 'Un rêve, une situation ou une fatigue revient ? Dépose ce que tu observes. Quel fil, quelle peur ou quelle manière de te protéger aimerais-tu regarder avec douceur ?', label: 'Ce que je remarque' },
  { title: 'Faire place à la douceur', voices: '[Naïa] · [Terra]', invitation: 'Si cela te semble juste, écris quelques mots à une peur, une croyance ou une habitude que tu souhaites laisser évoluer. Tu peux poser les pieds au sol et sentir leur appui, sans te forcer.', label: 'Ma lettre pour moi' },
  { title: 'Choisir un cap', voices: '[Irma] · [Astria]', invitation: 'Y a-t-il un déclencheur ou une habitude que tu aimerais moins nourrir ? Quelle valeur voudrais-tu choisir comme repère, à ton rythme ?', label: 'Mon choix et mon repère' },
  { title: 'Ouvrir une page', voices: '[Ignis] · [Alka]', invitation: 'Quel petit geste réalisable dans les prochaines 24 heures donnerait une place à ce choix ? Si tu le souhaites, ajoute une intention courte pour ton quotidien.', label: 'Mon premier pas et mon intention' },
] as const;
const MIRRORS = ['La Rencontre avec l’Ombre', 'Le Passage du Seuil', 'La Métamorphose', 'L’Unification'] as const;

export function NouveauChapitre({ entries, onChanged }: { entries: JournalEntry[]; onChanged: (entries: JournalEntry[]) => void }) {
  const [opened, setOpened] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const owner = useRef(currentOwner());
  const lock = useRef(false);
  const entry = renewalEntry(entries, step);
  const draft = useLocalDraft(draftKey(currentOwner(), `chapter-${step}`), entry?.text ?? '', opened);
  const text = draft.text;
  const dirty = text !== (entry?.text ?? '');
  const crisis = explicitCrisis(text);
  const completed = PAGES.every((_, i) => !!renewalEntry(entries, i));

  useEffect(() => {
    if (owner.current !== currentOwner()) {
      owner.current = currentOwner(); setOpened(false); setStep(0); setMessage('');
    }
  }, [entries]);

  const open = () => {
    const next = PAGES.findIndex((_, i) => !renewalEntry(entries, i));
    const i = next < 0 ? 3 : next;
    setStep(i); setMessage(''); setError(''); setOpened(true);
  };
  const select = (i: number) => {
    setStep(i); setMessage(''); setError('');
  };
  const save = async () => {
    if (!text.trim() || lock.current) return;
    const savedOwner = currentOwner();
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const next = await saveEntry({ id: entry?.id, text, prompt: RENEWAL_PROMPTS[step] });
      await draft.clear(text.trim());
      if (currentOwner() !== savedOwner) return;
      onChanged(next);
      setMessage(t('Cette page est gardée dans ton journal privé.'));
    } catch {
      setError(t('La page n’a pas pu être gardée. Réessaie.'));
    } finally {
      lock.current = false; setBusy(false);
    }
  };

  return (
    <View style={st.card}>
      <Text style={st.kicker}>{t('UN NOUVEAU CHAPITRE')}</Text>
      <Text style={st.title}>{t('Quand tu souhaites faire de la place')}</Text>
      {renewalSuggested(entries) && !opened && <Text style={st.muted}>{t('Certains mots comme « fatigue » ou « impasse » reviennent dans ton journal. Ce simple repérage local ne connaît pas leur contexte ; cette invitation reste entièrement facultative.')}</Text>}
      <Text style={st.muted}>{t('Un espace facultatif à explorer sur quatre à sept jours, ou au rythme qui te convient. Tes pages restent sur cet appareil, sauf si tu choisis de partager un extrait.')}</Text>
      {!opened ? <OutlineButton label={t(completed ? 'Retrouver mes pages' : 'Découvrir cet espace')} onPress={open} /> : <>
        {!crisis && <><Text style={st.voices}>{PAGES[step].voices}</Text>
        <Text style={st.kicker}>{t(MIRRORS[step])}</Text>
        <Text style={st.title}>{t(PAGES[step].title)}</Text>
        <Text style={st.text}>{t(PAGES[step].invitation)}</Text></>}
        {crisis && <Notice tone="error" text={t('Si tu traverses une crise, ne reste pas seul·e : contacte une personne de confiance ou un professionnel de santé. En France, appelle le 3114, gratuit et accessible 24 h/24. En danger immédiat, appelle le 15 ou le 112.')} />}
        <TextInput value={text} onChangeText={(value) => { draft.set(value); setMessage(''); }} editable={draft.ready && !busy} maxLength={20000} multiline placeholder={t('Quelques mots, à ton rythme…')} placeholderTextColor={colors.muted} accessibilityLabel={t(PAGES[step].label)} style={st.input} />
        {draft.error && <Notice tone="error" text={t('Le brouillon n’a pas pu être enregistré sur cet appareil.')} />}
        <OutlineButton label={t(entry ? 'Mettre à jour cette page' : 'Garder cette page')} onPress={() => void save()} disabled={!draft.ready || busy || !text.trim()} />
        {message ? <Notice text={message} tone="success" /> : null}
        {error ? <Notice text={error} tone="error" /> : null}
        <View style={st.navigation}>
          {step > 0 && <Pressable accessibilityRole="button" disabled={dirty} accessibilityState={{ disabled: dirty }} onPress={() => select(step - 1)}><Text style={[st.link, dirty && { opacity: 0.5 }]}>{t('‹ Page précédente')}</Text></Pressable>}
          {step < PAGES.length - 1 && entry && !crisis && <Pressable accessibilityRole="button" disabled={dirty} accessibilityState={{ disabled: dirty }} onPress={() => select(step + 1)}><Text style={[st.link, dirty && { opacity: 0.5 }]}>{t('Quand je serai prêt·e, continuer ›')}</Text></Pressable>}
        </View>
        {step === PAGES.length - 1 && entry && <Text style={st.text}>{t('Tu peux revenir à ces pages, les modifier ou les supprimer dans ton journal privé.')}</Text>}
        {dirty && <Pressable accessibilityRole="button" onPress={() => { void draft.clear(entry?.text ?? '').catch(() => setError(t('Le brouillon n’a pas pu être enregistré sur cet appareil.'))); setError(''); }}><Text style={st.link}>{t('Annuler mes modifications')}</Text></Pressable>}
        {!crisis && <EclairageSoeur key={`${step}:${text}`} sister={['oni', 'naia', 'irma', 'ignis'][step]} text={text} />}
        <Pressable accessibilityRole="button" disabled={dirty} accessibilityState={{ disabled: dirty }} onPress={() => setOpened(false)}><Text style={[st.link, dirty && { opacity: 0.5 }]}>{t('Fermer cet espace')}</Text></Pressable>
      </>}
      <Text style={st.muted}>{t('Cet espace invite à la réflexion et ne remplace pas une aide professionnelle. En cas de danger immédiat, appelle les secours ; en France, le 3114 est disponible en cas de pensées suicidaires.')}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: space.ms },
  kicker: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: textSize.xs, letterSpacing: 1.5 },
  voices: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14 },
  title: { color: colors.text, fontFamily: fonts.title, fontSize: 25 },
  text: { color: colors.text, fontFamily: fonts.body, fontSize: textSize.md, lineHeight: 23 },
  muted: { color: colors.muted, fontFamily: fonts.body, fontSize: textSize.sm, lineHeight: 20 },
  input: { minHeight: 130, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.body, fontSize: 16, padding: 14, textAlignVertical: 'top' },
  navigation: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.md },
  link: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14 },
});
