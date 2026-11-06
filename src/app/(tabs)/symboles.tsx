import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, Eyebrow, Notice, Screen, Title } from '../../components/ui';
import { api, type Symbol127 } from '../../lib/api';
import { colors, fonts, radius, space } from '../../lib/theme';

const SUGGESTIONS = ['arbre', 'eau', 'maison', 'serpent', 'chute', 'dents', 'lune', 'forêt'];

export default function Symboles() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Symbol127[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recherche dans le dictionnaire du site (plus de 3 900 symboles), avec un léger délai de frappe.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.searchSymbols(term);
        if (!cancelled) {
          setResults(r);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Recherche impossible.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  const active = q.trim().length >= 2;
  const shown = active ? results : [];

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Eyebrow>Dictionnaire des symboles oniriques</Eyebrow>
        <Title>Le sens des symboles</Title>
        <Body muted>Sens possibles, pas une interprétation de votre rêve.</Body>
      </View>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Rechercher un symbole : arbre, eau, maison…"
        placeholderTextColor="#6f7090"
        style={st.search}
        accessibilityLabel="Rechercher un symbole"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        returnKeyType="search"
      />

      {q.trim().length < 2 && (
        <View style={st.chips}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={st.chip} onPress={() => setQ(s)} accessibilityRole="button" accessibilityLabel={`Chercher ${s}`}>
              <Text style={st.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {active && loading && <ActivityIndicator color={colors.gold} />}
      {active && error && <Notice tone="error" text={error} />}
      {active && !loading && !error && results.length === 0 && <Body muted>Aucun symbole trouvé pour « {q.trim()} ».</Body>}

      <View style={{ gap: space.sm }}>
        {shown.map((r) => (
          <Pressable
            key={r.id}
            style={({ pressed }) => [st.item, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: '/page', params: { path: r.link, title: r.title } })}
            accessibilityRole="link"
            accessibilityLabel={r.title}
          >
            <Text style={st.itemTitle}>{r.title}</Text>
            <Text style={st.itemText} numberOfLines={3}>
              {r.excerpt}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={st.all}
        onPress={() => router.push({ pathname: '/page', params: { path: '/symboles-oniriques/', title: 'Symboles' } })}
        accessibilityRole="link"
      >
        <Text style={st.allText}>Parcourir tout le dictionnaire  ›</Text>
      </Pressable>
    </Screen>
  );
}

const st = StyleSheet.create({
  search: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0d1124',
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(170,160,230,0.45)', paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontFamily: fonts.body, color: colors.text, fontSize: 14 },
  item: { padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 6 },
  itemTitle: { fontFamily: fonts.title, fontSize: 21, color: colors.text },
  itemText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  all: { alignItems: 'center', padding: space.md },
  allText: { fontFamily: fonts.bodyBold, color: colors.gold, fontSize: 15 },
});
