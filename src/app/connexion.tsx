import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Field, GoldButton, Notice, Title } from '../components/ui';
import { api } from '../lib/api';
import { validateEmail } from '../lib/model';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';

type Mode = 'login' | 'register' | 'forgot';

export default function Connexion() {
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { signIn, signUp } = useSession();
  const [mode, setMode] = useState<Mode>(params.mode === 'register' ? 'register' : 'login');
  const [pseudonym, setPseudonym] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      if (mode === 'forgot') {
        if (!validateEmail(email)) throw new Error('Indiquez une adresse e-mail valide.');
        setInfo(await api.forgotPassword(email));
        return;
      }
      if (!email.trim() || !password) throw new Error('Adresse e-mail et mot de passe requis.');
      if (mode === 'login') {
        await signIn(email, password);
        router.back();
        return;
      }
      if (pseudonym.trim().length < 2) throw new Error('Choisissez un pseudonyme (2 caractères au moins).');
      if (!validateEmail(email)) throw new Error('Indiquez une adresse e-mail valide.');
      if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      if (!consent) throw new Error('Merci d’accepter la politique de confidentialité pour créer votre compte.');
      const r = await signUp(pseudonym, email, password);
      if (r === 'signed-in') {
        router.back();
      } else {
        setMode('login');
        setInfo('Votre compte est créé. Connectez-vous pour entrer dans votre Grimoire.');
      }
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.night }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
        <Title size={32}>
          {mode === 'login' ? 'Entrer dans mon Grimoire' : mode === 'register' ? 'Créer mon compte' : 'Mot de passe oublié'}
        </Title>
        <Body muted>
          {mode === 'register'
            ? 'Gratuit. Vos rêves restent liés à votre compte et ne sont jamais partagés.'
            : mode === 'forgot'
              ? 'Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.'
              : 'Le même compte que sur lecercle127.com.'}
        </Body>

        {mode === 'register' && (
          <Field label="Pseudonyme" value={pseudonym} onChangeText={setPseudonym} autoComplete="nickname" maxLength={40} />
        )}
        <Field
          label={mode === 'login' ? 'Adresse e-mail ou identifiant' : 'Adresse e-mail'}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        {mode !== 'forgot' && (
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            textContentType={mode === 'register' ? 'newPassword' : 'password'}
          />
        )}

        {mode === 'register' && (
          <Pressable
            style={st.consent}
            onPress={() => setConsent(!consent)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
          >
            <View style={[st.box, consent && st.boxOn]}>{consent && <Text style={st.check}>✓</Text>}</View>
            <Text style={st.consentText}>
              J’ai lu la{' '}
              <Text
                style={st.link}
                onPress={() =>
                  router.push({ pathname: '/page', params: { path: '/confidentialite-le-cercle-127/', title: 'Confidentialité' } })
                }
              >
                politique de confidentialité
              </Text>{' '}
              et j’accepte que mes rêves soient conservés dans mon Grimoire.
            </Text>
          </Pressable>
        )}

        {error && <Notice tone="error" text={error} />}
        {info && <Notice tone="success" text={info} />}

        <GoldButton
          label={mode === 'login' ? 'Entrer dans mon Grimoire' : mode === 'register' ? 'Créer mon compte' : 'Recevoir le lien'}
          onPress={submit}
          loading={busy}
        />

        <View style={st.switches}>
          {mode !== 'login' && (
            <Pressable onPress={() => setMode('login')} accessibilityRole="button">
              <Text style={st.link}>J’ai déjà un compte</Text>
            </Pressable>
          )}
          {mode !== 'register' && (
            <Pressable onPress={() => setMode('register')} accessibilityRole="button">
              <Text style={st.link}>Créer un compte gratuit</Text>
            </Pressable>
          )}
          {mode === 'login' && (
            <Pressable onPress={() => setMode('forgot')} accessibilityRole="button">
              <Text style={st.link}>Mot de passe oublié ?</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  consent: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxOn: { backgroundColor: colors.gold },
  check: { color: colors.night, fontWeight: '700' },
  consentText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.text },
  link: { fontFamily: fonts.bodyBold, color: colors.gold, fontSize: 14 },
  switches: { gap: space.md, alignItems: 'center', paddingTop: space.sm, borderRadius: radius.md },
});
