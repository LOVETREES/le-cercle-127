import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Field, GoldButton, Notice, OutlineButton, Title } from '../components/ui';
import { api } from '../lib/api';
import { validateEmail } from '../lib/model';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

type Mode = 'login' | 'register' | 'forgot';

export default function Connexion() {
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { signIn, signUp, startDemo, user } = useSession();
  const [mode, setMode] = useState<Mode>(params.mode === 'register' ? 'register' : 'login');
  const [pseudonym, setPseudonym] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [consent, setConsent] = useState(false);
  const [adult, setAdult] = useState(false);
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
      setError(e instanceof Error ? e.message : t('Une erreur est survenue.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      if (mode === 'forgot') {
        if (!validateEmail(email)) throw new Error(t('Indiquez une adresse e-mail valide.'));
        setInfo(await api.forgotPassword(email));
        return;
      }
      if (!email.trim() || !password) throw new Error(t('Adresse e-mail et mot de passe requis.'));
      if (mode === 'login') {
        await signIn(email, password);
        router.back();
        return;
      }
      if (pseudonym.trim().length < 2) throw new Error(t('Choisissez un pseudonyme (2 caractères au moins).'));
      if (!validateEmail(email)) throw new Error(t('Indiquez une adresse e-mail valide.'));
      if (password.length < 10) throw new Error(t('Le mot de passe doit contenir au moins 10 caractères.'));
      if (password !== password2) throw new Error(t('Les deux mots de passe ne sont pas identiques.'));
      if (!consent) throw new Error(t('Merci d’accepter la politique de confidentialité pour créer votre compte.'));
      if (!adult) throw new Error(t('Le Grimoire est réservé aux personnes de 15 ans et plus.'));
      const r = await signUp(pseudonym, email, password, adult);
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
          {mode === 'login' ? t('Entrer dans mon Grimoire') : mode === 'register' ? t('Créer mon compte') : t('Mot de passe oublié')}
        </Title>
        <Body muted>
          {mode === 'register'
            ? t('Gratuit. Vos rêves sont privés. Une lecture par l’IA nécessite un accord séparé.')
            : mode === 'forgot'
              ? t('Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.')
              : t('Le même compte que sur lecercle127.com.')}
        </Body>

        {mode === 'register' && (
          <Field label="Pseudonyme" value={pseudonym} onChangeText={setPseudonym} autoComplete="nickname" maxLength={40} />
        )}
        <Field
          label={mode === 'login' ? t('Adresse e-mail ou identifiant') : t('Adresse e-mail')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        {mode !== 'forgot' && (
          <Field
            label={t('Mot de passe')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            textContentType={mode === 'register' ? 'newPassword' : 'password'}
          />
        )}

        {mode === 'register' && (
          <Field
            label={t('Confirmer le mot de passe')}
            value={password2}
            onChangeText={setPassword2}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
        )}

        {mode === 'register' && (
          <Pressable
            style={st.consent}
            onPress={() => setAdult(!adult)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: adult }}
          >
            <View style={[st.box, adult && st.boxOn]}>{adult && <Text style={st.check}>✓</Text>}</View>
            <Text style={st.consentText}>{t('Je confirme avoir au moins 15 ans.')}</Text>
          </Pressable>
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
              {t('J’ai lu la')}{' '}
              <Text
                style={st.link}
                onPress={() =>
                  router.push('/confidentialite')
                }
              >
                {t('politique de confidentialité')}
              </Text>{' '}
              {t('et je demande la création de mon espace privé. L’usage d’Oni fera l’objet d’un accord séparé.')}
            </Text>
          </Pressable>
        )}

        {error && <Notice tone="error" text={error} />}
        {info && <Notice tone="success" text={info} />}

        <GoldButton
          label={mode === 'login' ? t('Entrer dans mon Grimoire') : mode === 'register' ? t('Créer mon compte') : t('Recevoir le lien')}
          onPress={submit}
          loading={busy}
        />
        {mode === 'login' && !user && (
          <View style={{ gap: space.sm }}>
            <OutlineButton label={t('Explorer la démonstration locale')} disabled={busy} onPress={() => run(async () => {
              await startDemo();
              router.replace('/grimoire');
            })} />
            <Body muted>{t('Des rêves et une lecture fictifs pour essayer le Grimoire. Aucun compte créé et aucun envoi à l’IA.')}</Body>
          </View>
        )}

        <View style={st.switches}>
          {mode !== 'login' && (
            <Pressable onPress={() => setMode('login')} accessibilityRole="button">
              <Text style={st.link}>{t('J’ai déjà un compte')}</Text>
            </Pressable>
          )}
          {mode !== 'register' && (
            <Pressable onPress={() => setMode('register')} accessibilityRole="button">
              <Text style={st.link}>{t('Créer un compte gratuit')}</Text>
            </Pressable>
          )}
          {mode === 'login' && (
            <Pressable onPress={() => setMode('forgot')} accessibilityRole="button">
              <Text style={st.link}>{t('Mot de passe oublié ?')}</Text>
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
