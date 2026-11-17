import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Notice } from '../components/ui';
import { t } from '../i18n';
import { api } from '../lib/api';
import { SISTERS } from '../lib/content';
import { recordSister } from '../lib/portes';
import { explicitCrisis } from '../lib/renouveau';
import { colors, fonts, radius, space } from '../lib/theme';

type Message = { role: 'user' | 'assistant'; content: string };

export default function Conversation() {
  const { sister: slug } = useLocalSearchParams<{ sister?: string }>();
  return <ConversationForSister key={slug ?? ''} slug={slug} />;
}

function ConversationForSister({ slug }: { slug?: string }) {
  const sister = SISTERS.find((s) => s.slug === slug);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const session = useRef(Crypto.randomUUID().replace(/-/g, ''));
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const crisis = explicitCrisis(text);

  const send = async () => {
    const message = text.trim();
    if (!sister || !message || !consent || crisis || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await api.sisterChat({ sister: sister.slug, message, history: messages, session: session.current, consent });
      setMessages((old) => [...old, { role: 'user', content: message }, { role: 'assistant', content: result.answer }]);
      setText('');
      recordSister(sister.slug).catch(() => undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('La conversation est momentanément indisponible.'));
    } finally { lock.current = false; setBusy(false); }
  };

  if (!sister) return <SafeAreaView style={st.screen}><Text style={st.text}>{t('Cette page n’est pas disponible dans l’application.')}</Text><Pressable onPress={() => router.back()}><Text style={st.link}>{t('Retour')}</Text></Pressable></SafeAreaView>;
  return (
    <SafeAreaView style={st.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={st.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={st.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Retour')} onPress={() => router.back()} hitSlop={10}><Text style={st.back}>‹</Text></Pressable>
          <Text style={st.headerTitle}>{sister.name} · {t(sister.verb)}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={t('Mon chemin')} onPress={() => router.push({ pathname: '/chemin', params: { s: sister.slug } })}><Text style={st.link}>{t('Mon chemin')}</Text></Pressable>
        </View>
        <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          <View style={st.identity}>
            <Image source={sister.image} style={st.portrait} />
            <Text style={st.title}>{sister.name}</Text>
            <Text style={st.muted}>{t(sister.role)}</Text>
          </View>
          <View style={st.assistant}><Text style={st.text}>{t('Que souhaitez-vous partager avec moi aujourd’hui ?')}</Text></View>
          {messages.map((message, i) => <View key={i} style={message.role === 'user' ? st.user : st.assistant}><Text style={message.role === 'user' ? st.userText : st.text}>{message.content}</Text></View>)}
          {busy && <ActivityIndicator color={colors.gold} accessibilityLabel={t('Demande en cours…')} />}
          {error ? <Notice tone="error" text={error} /> : null}
          {crisis && <Notice tone="error" text={t('Si tu traverses une crise, contacte une personne de confiance ou un professionnel. En France, le 3114 répond 24 h/24 ; en danger immédiat, appelle le 15 ou le 112.')} />}
        </ScrollView>
        <View style={st.composer}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} aria-checked={consent} onPress={() => setConsent((v) => !v)} style={st.consent}>
            <Text style={st.link}>{consent ? '☑' : '☐'}</Text>
            <Text style={st.muted}>{t('J’accepte l’envoi de mes messages et de cet échange au service de dialogue par IA.')}</Text>
          </Pressable>
          <View style={st.inputRow}>
            <TextInput value={text} onChangeText={setText} editable={!busy} multiline maxLength={4000} placeholder={t('Écris ton message…')} placeholderTextColor={colors.muted} accessibilityLabel={t('Écris ton message…')} style={st.input} />
            <Pressable onPress={() => void send()} disabled={busy || !consent || !text.trim() || crisis} accessibilityRole="button" accessibilityLabel={t('Envoyer')} accessibilityState={{ disabled: busy || !consent || !text.trim() || crisis }} style={[st.send, (busy || !consent || !text.trim() || crisis) && { opacity: 0.45 }]}><Text style={st.sendText}>➤</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderColor: colors.border },
  back: { color: colors.gold, fontSize: 36, lineHeight: 40 },
  headerTitle: { flex: 1, fontFamily: fonts.title, fontSize: 22, color: colors.text },
  title: { fontFamily: fonts.title, fontSize: 30, color: colors.gold },
  content: { padding: space.md, gap: 12, paddingBottom: 24 },
  identity: { alignItems: 'center', gap: 4, paddingVertical: 10 },
  portrait: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: colors.gold },
  assistant: { alignSelf: 'flex-start', maxWidth: '90%', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, backgroundColor: colors.surface },
  user: { alignSelf: 'flex-end', maxWidth: '90%', borderRadius: radius.md, padding: 14, backgroundColor: '#e8cf8f' },
  text: { color: colors.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  userText: { color: colors.night, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, flexShrink: 1 },
  link: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 12 },
  composer: { padding: 12, gap: 8, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.night },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 6 },
  input: { flex: 1, maxHeight: 110, minHeight: 42, color: colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: 10, paddingVertical: 8 },
  send: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.gold },
  sendText: { color: colors.night, fontSize: 19 },
});
