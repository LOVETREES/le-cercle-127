import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { SISTERS } from '../lib/content';
import { archetypalEchoes } from '../lib/echos';
import { colors, fonts, radius, space } from '../lib/theme';

type Echo = ReturnType<typeof archetypalEchoes>[number];
// Une préférence temporaire par personne ; aucun texte du journal n'est conservé ici.
const hidden = new Map<string, Set<string>>();
const displayWord = (word: string) => ({ etoile: 'étoile', etoiles: 'étoiles', quete: 'quête', quetes: 'quêtes', enferme: 'enfermé', enfermee: 'enfermée', bloque: 'bloqué', bloquee: 'bloquée', colere: 'colère', coleres: 'colères' } as Record<string, string>)[word] ?? word;

export function EchoGrimoire({ echoes, owner }: { echoes: Echo[]; owner: string }) {
  const [, update] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = echoes.filter((echo) => !hidden.get(owner)?.has(echo.key));
  if (!visible.length) return null;
  const ignore = (key: string) => {
    hidden.set(owner, new Set([...(hidden.get(owner) ?? []), key]));
    if (expanded === key) setExpanded(null);
    update((n) => n + 1);
  };
  return <View style={{ gap: 8 }}>
    {visible.map((echo) => {
      const isExpanded = expanded === echo.key;
      return <View key={echo.key} style={st.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} aria-expanded={isExpanded} accessibilityLabel={t('Écho du Grimoire : {nom}', { nom: t(echo.title) })} onPress={() => setExpanded(isExpanded ? null : echo.key)} style={st.summary}>
          <View style={{ flex: 1, gap: 3 }}><Text style={st.badge}>{t('ÉCHO DU GRIMOIRE')}</Text><Text style={st.title}>{t(echo.title)}</Text></View>
          <Text style={st.chevron}>{isExpanded ? '⌃' : '⌄'}</Text>
        </Pressable>
        {isExpanded && <View style={st.body}>
          <Text style={st.text}>{t(echo.question)}</Text>
          <Text style={st.muted}>{t('Mots repérés dans {n} pages', { n: echo.matched })}</Text>
          <View style={st.tags}>{echo.foundWords.map((word) => <Text key={word} style={st.tag}>{t(displayWord(word))}</Text>)}</View>
          <Text style={st.muted}>{t('Piste symbolique fondée sur des mots de tes quinze dernières pages. Le contexte et les négations ne sont pas reconnus ; à toi de voir si elle te parle.')}</Text>
          <View style={st.actions}>
            {echo.sisters.map((slug) => {
              const sister = SISTERS.find((s) => s.slug === slug);
              return sister ? <Pressable key={slug} accessibilityRole="link" onPress={() => router.push({ pathname: '/page', params: { path: sister.path, title: sister.name } })}><Text style={st.link}>{t('Découvrir {v0}', { v0: sister.name })} ›</Text></Pressable> : null;
            })}
            <Pressable accessibilityRole="button" accessibilityLabel={t('Masquer cet écho pour cette session')} onPress={() => ignore(echo.key)}><Text style={st.muted}>{t('Ignorer')}</Text></Pressable>
          </View>
        </View>}
      </View>;
    })}
  </View>;
}

const st = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  summary: { flexDirection: 'row', alignItems: 'center', padding: space.md, gap: 10 },
  badge: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.4 },
  title: { color: colors.text, fontFamily: fonts.title, fontSize: 22 },
  chevron: { color: colors.gold, fontSize: 24 },
  body: { padding: space.md, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  text: { color: colors.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { color: colors.text, fontFamily: fonts.body, fontSize: 12, borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  link: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 13 },
});
