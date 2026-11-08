// Terra : lecture détaillée de la main sur photo, et « Ma main dans le temps ».
// La photo est réduite sur le téléphone, envoyée avec l'accord de la personne, puis jamais conservée.
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, GoldButton, Notice, OutlineButton, Screen, Title } from '../components/ui';
import { getLang, locale, t } from '../i18n';
import { api } from '../lib/api';
import { createDetailed, LINE_COLOR, LINE_LABEL, lineTimeline, listDetailed, SECTIONS, type DetailedReading, type Quota } from '../lib/palm-detailed';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';

const fmt = (iso: string, long = true) =>
  new Date(iso).toLocaleDateString(locale(), long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' });

function ReadingView({ item, onDelete }: { item: DetailedReading; onDelete: () => void }) {
  const r = item.reading;
  return (
    <Card style={{ gap: space.md }}>
      <Eyebrow>{`${t('LECTURE DÉTAILLÉE')} · ${fmt(item.at).toUpperCase()}`}</Eyebrow>
      <Title size={26}>{r.title || t('Ta main, aujourd’hui')}</Title>
      {SECTIONS.map(([k, label, color]) =>
        typeof r[k] === 'string' && r[k] ? (
          <View key={k} style={[st.section, { borderLeftColor: color }]}>
            <Text style={[st.sectionTitle, { color }]}>{t(label)}</Text>
            <Text style={st.text}>{r[k] as string}</Text>
          </View>
        ) : null,
      )}
      {r.strengths?.length ? (
        <View style={[st.section, { borderLeftColor: '#a9c98a' }]}>
          <Text style={[st.sectionTitle, { color: '#a9c98a' }]}>{t('Tes forces')}</Text>
          {r.strengths.map((s) => <Text key={s} style={st.text}>• {s}</Text>)}
        </View>
      ) : null}
      {r.watch?.length ? (
        <View style={[st.section, { borderLeftColor: '#eb9a68' }]}>
          <Text style={[st.sectionTitle, { color: '#eb9a68' }]}>{t('À accueillir avec douceur')}</Text>
          {r.watch.map((s) => <Text key={s} style={st.text}>• {s}</Text>)}
        </View>
      ) : null}
      <View style={st.ritual}>
        {r.mudra?.name ? <Text style={st.text}><Text style={st.label}>{t('LE GESTE')}{'\n'}</Text>{r.mudra.name}{r.mudra.how ? ` · ${r.mudra.how}` : ''}</Text> : null}
        {r.mantra ? <Text style={st.mantra}>« {r.mantra} »</Text> : null}
        {r.question ? <Text style={st.text}><Text style={st.label}>{t('QUESTION POUR LE GRIMOIRE')}{'\n'}</Text>{r.question}</Text> : null}
      </View>
      {item.evolution ? (
        <View style={st.evolution}>
          <Text style={[st.sectionTitle, { color: '#8fc8e8' }]}>{t('Ce qui a bougé depuis ta lecture précédente')}</Text>
          <Text style={st.text}>{item.evolution}</Text>
        </View>
      ) : null}
      <Body muted>{t('Une lecture symbolique, pour réfléchir et s’ancrer : jamais un diagnostic ni une prédiction.')}</Body>
      <Pressable onPress={onDelete} accessibilityRole="button">
        <Text style={st.remove}>{t('Supprimer cette lecture')}</Text>
      </Pressable>
    </Card>
  );
}

export default function LectureMain() {
  const { token, isDemo } = useSession();
  const [items, setItems] = useState<DetailedReading[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [open, setOpen] = useState<DetailedReading | null>(null);
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [hand, setHand] = useState<'droite' | 'gauche'>('droite');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'info' | 'error' | 'success'; text: string } | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    listDetailed(token).then(
      (r) => {
        setItems(r.items);
        setQuota(r.quota);
        setOpen((o) => o ?? r.items[0] ?? null);
      },
      (e) => setNotice({ tone: 'error', text: e instanceof Error ? e.message : t('Connexion impossible. Vérifiez votre réseau et réessayez.') }),
    );
  }, [token]);
  useFocusEffect(load);

  const pick = async (camera: boolean) => {
    setNotice(null);
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setNotice({ tone: 'error', text: t('Autorisez l’accès dans les réglages du téléphone pour photographier votre main.') });
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets?.[0]) return;
    // Réduite à 1400 px et recompressée : assez fine pour les lignes, légère à envoyer.
    const a = res.assets[0];
    const big = Math.max(a.width || 0, a.height || 0);
    const actions = big > 1400 ? [a.width >= a.height ? { resize: { width: 1400 } } : { resize: { height: 1400 } }] : [];
    const small = await ImageManipulator.manipulateAsync(a.uri, actions, { compress: 0.86, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    if (small.base64) setPhoto({ uri: small.uri, base64: small.base64 });
  };

  const send = async () => {
    if (!token || !photo || !consent) return;
    setBusy(true);
    setNotice({ tone: 'info', text: t('Terra lit ta main… cela peut prendre une minute.') });
    try {
      const r = await createDetailed(token, `data:image/jpeg;base64,${photo.base64}`, hand, getLang());
      setPhoto(null);
      setConsent(false);
      setItems((l) => [r.item, ...l]);
      setQuota(r.quota);
      setOpen(r.item);
      setNotice({ tone: 'success', text: t('Ta lecture est prête. La photo n’a pas été conservée.') });
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : t('Terra n’a pas pu lire ta main pour le moment. Réessaie dans quelques minutes.') });
    } finally {
      setBusy(false);
    }
  };

  const remove = (item: DetailedReading) =>
    Alert.alert(t('Supprimer cette lecture ?'), t('La lecture et sa fiche d’observations seront effacées de votre compte.'), [
      { text: t('Annuler'), style: 'cancel' },
      {
        text: t('Supprimer'),
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          await api.palmDetailedDelete(token, item.id).catch(() => undefined);
          setItems((l) => l.filter((x) => x.id !== item.id));
          setOpen(null);
        },
      },
    ]);

  const canRead = !!quota && (quota.plus || quota.free_left > 0) && !quota.next_at;
  const timeline = lineTimeline(items);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button">
        <Text style={st.back}>‹ {t('Retour')}</Text>
      </Pressable>
      <View style={{ gap: space.sm }}>
        <Eyebrow>{t('TERRA · LECTURE DÉTAILLÉE DE TA MAIN')}</Eyebrow>
        <Title>{t('Ta main, lue comme un horoscope')}</Title>
        <Body muted>{t('Une photo de ta paume, et Terra te remet une lecture complète. Refais-la au fil des mois pour voir tes lignes évoluer.')}</Body>
      </View>

      {notice && <Notice tone={notice.tone} text={notice.text} />}

      {!token || isDemo ? (
        <Card style={{ gap: space.sm }}>
          <Body>{t('Connecte-toi à ton compte pour recevoir ta lecture détaillée et suivre l’évolution de ta main. La première est offerte.')}</Body>
          <GoldButton label={t('Me connecter')} onPress={() => router.push('/connexion')} />
        </Card>
      ) : quota && !canRead ? (
        <Card>
          <Body>
            {quota.next_at
              ? t('Prochaine lecture détaillée possible le {d}. Les lignes changent lentement : une lecture par mois suffit pour suivre leur évolution.', { d: fmt(quota.next_at) })
              : t('Ta première lecture détaillée t’a été offerte. Les suivantes arrivent avec Le Cercle 127+.')}
          </Body>
        </Card>
      ) : quota ? (
        <Card style={{ gap: space.md }}>
          <Body muted>{t('Pour une bonne photo : paume ouverte et à plat, doigts légèrement écartés, lumière du jour, toute la main dans le cadre.')}</Body>
          <View style={st.hands}>
            {(['droite', 'gauche'] as const).map((h) => (
              <Pressable key={h} onPress={() => setHand(h)} style={[st.chip, hand === h && st.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: hand === h }}>
                <Text style={[st.chipText, hand === h && { color: colors.gold }]}>{h === 'droite' ? t('Main droite') : t('Main gauche')}</Text>
              </Pressable>
            ))}
          </View>
          {photo ? <Image source={{ uri: photo.uri }} style={st.photo} resizeMode="contain" accessibilityLabel={t('Photo de ta main')} /> : null}
          <View style={st.hands}>
            <View style={{ flex: 1 }}><OutlineButton label={t('📷 Photographier')} onPress={() => pick(true)} /></View>
            <View style={{ flex: 1 }}><OutlineButton label={t('Choisir une photo')} onPress={() => pick(false)} /></View>
          </View>
          <Pressable style={st.consent} onPress={() => setConsent((c) => !c)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
            <View style={[st.box, consent && st.boxOn]}>{consent ? <Text style={st.tick}>✓</Text> : null}</View>
            <Text style={[st.text, { flex: 1, fontSize: 13 }]}>
              {t('J’accepte que Terra analyse cette photo pour ma lecture. Elle est transmise de façon sécurisée à un service d’analyse d’image (OpenAI), puis n’est pas conservée : seules les observations de mes lignes sont gardées dans mon compte, et je peux les effacer.')}
            </Text>
          </Pressable>
          <GoldButton label={t('Recevoir ma lecture')} onPress={send} loading={busy} disabled={!photo || !consent || busy} />
          {!quota.plus && quota.free_left > 0 ? <Body muted>{t('Ta première lecture détaillée est offerte.')}</Body> : null}
        </Card>
      ) : null}

      {open ? <ReadingView item={open} onDelete={() => remove(open)} /> : null}

      {items.length ? (
        <Card style={{ gap: space.sm }}>
          <Title size={24}>{t('Ma main dans le temps')}</Title>
          <Body muted>
            {items.length < 2
              ? t('Refais une lecture détaillée dans quelques semaines : Terra comparera tes lignes. Garde la même main et une lumière semblable.')
              : t('Chaque colonne est une lecture. Un changement compte surtout s’il se confirme d’une lecture à l’autre.')}
          </Body>
          {timeline.map((row) => (
            <View key={row.key} style={st.tlRow}>
              <Text style={[st.tlLabel, { color: LINE_COLOR[row.key] }]}>● {t(LINE_LABEL[row.key])}</Text>
              <View style={st.tlCells}>
                {row.cells.map((c) => (
                  <View key={c.at} style={[st.tlCell, c.changed && st.tlChanged, c.faint && { opacity: 0.5 }]}>
                    <Text style={st.tlDate}>{fmt(c.at, false)}</Text>
                    <Text style={st.tlText}>{c.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          {items.map((it) => (
            <Pressable key={it.id} onPress={() => setOpen(it)} accessibilityRole="button">
              <Text style={[st.text, { color: open?.id === it.id ? colors.gold : colors.text }]}>
                {fmt(it.at)} · {it.reading.title || t('Lecture')}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  back: { fontFamily: fonts.bodyMedium, color: colors.gold, fontSize: 15 },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  section: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' },
  ritual: { gap: 10, padding: space.md, borderRadius: radius.md, backgroundColor: 'rgba(216,182,107,0.08)' },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: colors.gold },
  mantra: { fontFamily: fonts.title, fontSize: 21, lineHeight: 27, color: colors.text, fontStyle: 'italic' },
  evolution: { gap: 6, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(143,200,232,0.45)', backgroundColor: 'rgba(143,200,232,0.08)' },
  remove: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  hands: { flexDirection: 'row', gap: space.sm },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  chipOn: { borderColor: colors.gold, backgroundColor: 'rgba(216,182,107,0.1)' },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  photo: { width: '100%', height: 320, borderRadius: radius.md, backgroundColor: '#0b0f20' },
  consent: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxOn: { backgroundColor: colors.gold },
  tick: { color: colors.night, fontWeight: '700' },
  tlRow: { gap: 4 },
  tlLabel: { fontFamily: fonts.bodyBold, fontSize: 13 },
  tlCells: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tlCell: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', minWidth: 92 },
  tlChanged: { borderWidth: 1, borderColor: '#8fc8e8', backgroundColor: 'rgba(143,200,232,0.12)' },
  tlDate: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  tlText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
});
