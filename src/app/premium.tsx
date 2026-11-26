// Cercle Premium : la page d'abonnement (achat intégré sur les stores, Stripe sur l'app web).
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, GoldButton, Notice, Screen } from '../components/ui';
import { locale, t } from '../i18n';
import { FEATURES } from '../lib/features';
import { buyPremium, loadPremiumPlans, premiumManagementUrl, premiumPurchasable, restorePremium, usePremium, type PremiumPlan } from '../lib/premium';
import { useSession } from '../lib/session';
import { colors, fonts, radius, sisters, space, textSize, tint } from '../lib/theme';

const CGV = 'https://lecercle127.com/conditions-generales-de-vente/';
const STORE_MANAGE = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: 'https://lecercle127.com/app/',
});

type Benefit = { sister: keyof typeof sisters; title: string; text: string };
const BENEFITS: Benefit[] = [
  { sister: 'oni', title: 'Oni lit chacun de tes rêves', text: 'Une lecture immédiate pour chaque rêve, plus seulement une par jour.' },
  ...(FEATURES.palmDetailed ? [{ sister: 'terra' as const, title: 'Ta main en profondeur', text: 'La lecture détaillée de ta main sur photo, et son évolution dans le temps.' }] : []),
  ...(FEATURES.sisters ? [{ sister: 'naia' as const, title: 'Les Sœurs te répondent', text: 'Quand une émotion te traverse, la Sœur la plus juste te répond.' }] : []),
  // Sur iPhone, pas d'adresse web : Apple refuse tout ce qui ressemble à un renvoi vers un autre moyen de paiement.
  { sister: 'astria', title: 'Partout avec ton compte', text: Platform.OS === 'ios' ? 'Sur tous tes appareils, avec le même compte.' : 'Sur iPhone, sur Android et dans l’app web lecercle127.com/app.' },
];

export default function Premium() {
  const { user, isDemo } = useSession();
  const status = usePremium();
  const [plans, setPlans] = useState<PremiumPlan[] | null>(null);
  const [selected, setSelected] = useState<PremiumPlan['id']>('annual');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [justBought, setJustBought] = useState(false);
  const canBuy = premiumPurchasable() && !!user && !isDemo;
  const premium = status.premium || justBought;

  useEffect(() => {
    if (!canBuy || !user) return;
    let active = true;
    loadPremiumPlans(String(user.id)).then(
      (p) => { if (active) { setPlans(p); if (!p.some((x) => x.id === 'annual') && p[0]) setSelected(p[0].id); } },
      () => { if (active) setPlans([]); },
    );
    return () => { active = false; };
  }, [canBuy, user]);

  const plan = plans?.find((p) => p.id === selected) ?? null;

  const buy = async () => {
    if (!user || !plan || busy) return;
    setBusy(true); setMessage(null);
    try {
      const ok = await buyPremium(String(user.id), plan);
      if (ok) { setJustBought(true); setMessage({ tone: 'success', text: t('Bienvenue dans le Cercle Premium.') }); status.refresh(); }
      else if (ok === false) setMessage({ tone: 'error', text: t('Le paiement est validé, l’accès arrive dans un instant. Reviens sur cette page si besoin.') });
    } catch {
      setMessage({ tone: 'error', text: t('Le paiement n’a pas abouti. Tu n’as pas été débité·e.') });
    } finally { setBusy(false); }
  };

  const restore = async () => {
    if (!user || busy) return;
    setBusy(true); setMessage(null);
    try {
      const ok = await restorePremium(String(user.id));
      if (ok) { setJustBought(true); status.refresh(); }
      setMessage(ok ? { tone: 'success', text: t('Ton abonnement Premium est bien retrouvé.') } : { tone: 'error', text: t('Aucun abonnement Premium trouvé pour ce compte.') });
    } catch {
      setMessage({ tone: 'error', text: t('La restauration n’a pas abouti. Réessaie dans un instant.') });
    } finally { setBusy(false); }
  };

  const manage = async () => {
    const url = (user && premiumPurchasable() ? await premiumManagementUrl(String(user.id)).catch(() => null) : null) ?? STORE_MANAGE;
    void Linking.openURL(url);
  };

  return (
    <Screen>
      <View style={st.hero}>
        <Text style={st.kicker}>{t('✦ CERCLE PREMIUM')}</Text>
        <Text style={st.title} accessibilityRole="header">{t('Aller plus loin avec les Sœurs')}</Text>
        <Body muted>{t('Tout ce qui est gratuit le reste. Le Premium ouvre ce qui demande le plus d’attention aux Sœurs.')}</Body>
      </View>

      <View style={{ gap: space.sm }}>
        {BENEFITS.map((b) => (
          <Card key={b.title} accent={b.sister} style={st.benefit}>
            <View style={[st.dot, { backgroundColor: sisters[b.sister] }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.benefitTitle}>{t(b.title)}</Text>
              <Text style={st.benefitText}>{t(b.text)}</Text>
            </View>
          </Card>
        ))}
      </View>

      {message && <Notice tone={message.tone} text={message.text} />}

      {premium ? (
        <Card accent="astria" style={{ gap: space.sm }}>
          <Text style={st.planTitle}>{t('Tu fais partie du Cercle Premium')}</Text>
          {status.until && <Body muted>{t('Accès ouvert jusqu’au {d}, renouvelé automatiquement sauf résiliation.', { d: status.until.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) })}</Body>}
          <GoldButton size="sm" variant="ghost" label={t('Gérer mon abonnement')} onPress={() => void manage()} />
        </Card>
      ) : !user || isDemo ? (
        <Card style={{ gap: space.sm }}>
          <Body>{t('Connecte-toi pour t’abonner : ton Premium suit ton compte sur tous tes appareils.')}</Body>
          <GoldButton size="sm" label={t('Me connecter')} onPress={() => router.push('/connexion')} />
        </Card>
      ) : !premiumPurchasable() ? (
        <Card style={{ gap: space.xs }}>
          <Text style={st.planTitle}>{t('Le Premium arrive bientôt')}</Text>
          <Body muted>{t('L’abonnement ouvre très prochainement sur cet appareil.')}</Body>
        </Card>
      ) : plans === null ? (
        <ActivityIndicator color={colors.gold} style={{ marginVertical: space.lg }} />
      ) : plans.length === 0 ? (
        <Notice tone="error" text={t('Les offres ne sont pas disponibles pour le moment. Réessaie plus tard.')} />
      ) : (
        <View style={{ gap: space.sm }}>
          <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
            {plans.map((p) => {
              const on = p.id === selected;
              return (
                <Pressable key={p.id} onPress={() => setSelected(p.id)} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on}
                  style={[st.plan, on && st.planOn]}>
                  <View style={[st.radio, on && st.radioOn]}>{on && <View style={st.radioDot} />}</View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={st.planTitle}>{p.id === 'annual' ? t('Annuel') : t('Mensuel')}</Text>
                    <Text style={st.planSub}>
                      {p.id === 'annual' && p.perMonth ? t('{p} par mois, payé une fois par an', { p: p.perMonth }) : t('Sans engagement, résiliable à tout moment')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={st.planPrice}>{p.price}</Text>
                    {p.id === 'annual' && <Text style={st.badge}>{t('Le plus avantageux')}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {plan && (
            <>
              <GoldButton loading={busy} label={plan.trialDays > 0 ? t('Essayer {n} jours gratuitement', { n: plan.trialDays }) : t('M’abonner')} onPress={() => void buy()} />
              <Text style={st.fine}>
                {plan.trialDays > 0
                  ? t('Puis {p} par {u}. Renouvellement automatique, résiliable à tout moment depuis ton compte.', { p: plan.price, u: plan.id === 'annual' ? t('an') : t('mois') })
                  : t('{p} par {u}. Renouvellement automatique, résiliable à tout moment depuis ton compte.', { p: plan.price, u: plan.id === 'annual' ? t('an') : t('mois') })}
              </Text>
            </>
          )}
          <Pressable onPress={() => void restore()} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'center' }}>
            <Text style={st.link}>{t('Restaurer mes achats')}</Text>
          </Pressable>
        </View>
      )}

      <View style={st.legal}>
        <Pressable onPress={() => void Linking.openURL(CGV)} accessibilityRole="link"><Text style={st.legalLink}>{t('Conditions générales de vente')}</Text></Pressable>
        <Text style={st.legalLink}>·</Text>
        <Pressable onPress={() => router.push('/confidentialite')} accessibilityRole="link"><Text style={st.legalLink}>{t('Confidentialité')}</Text></Pressable>
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  hero: { gap: space.xs, paddingTop: space.sm },
  kicker: { fontFamily: fonts.bodyBold, fontSize: textSize.xs, letterSpacing: 2, color: sisters.astria },
  title: { fontFamily: fonts.title, fontSize: textSize.xxl, lineHeight: 34, color: colors.text },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: space.ms, padding: space.md },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  benefitTitle: { fontFamily: fonts.title, fontSize: textSize.lg, color: colors.text },
  benefitText: { fontFamily: fonts.body, fontSize: textSize.sm, lineHeight: 19, color: colors.muted },
  plan: { flexDirection: 'row', alignItems: 'center', gap: space.ms, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  planOn: { borderColor: colors.gold, backgroundColor: tint(colors.gold, 0.08) },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.gold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  planTitle: { fontFamily: fonts.title, fontSize: textSize.xl, color: colors.text },
  planSub: { fontFamily: fonts.body, fontSize: textSize.sm, color: colors.muted },
  planPrice: { fontFamily: fonts.bodyBold, fontSize: textSize.md, color: colors.text },
  badge: { fontFamily: fonts.bodyBold, fontSize: textSize.xs, color: colors.onGold, backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xxs, overflow: 'hidden' },
  fine: { fontFamily: fonts.body, fontSize: textSize.xs, lineHeight: 16, color: colors.muted, textAlign: 'center' },
  link: { fontFamily: fonts.bodyBold, fontSize: textSize.sm, color: colors.gold, paddingVertical: space.sm },
  legal: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, paddingVertical: space.md },
  legalLink: { fontFamily: fonts.body, fontSize: textSize.xs, color: colors.muted, textDecorationLine: 'underline' },
});
