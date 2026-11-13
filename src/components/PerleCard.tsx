// La Perle d'Oni : lecture approfondie relue par une personne, achetée dans l'app (Google Play).
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, GoldButton, Notice } from './ui';
import { api, type PerleStatus } from '../lib/api';
import { buyPerle, loadPerleOffer, perleAvailable, type PerleOffer } from '../lib/perle';
import { addPendingPerle, consentsComplete, listPendingPerles, pickPerleProduct, removePendingPerle, type PerleConsents } from '../lib/perle-logic';
import { colors, fonts, space } from '../lib/theme';
import { t } from '../i18n';

const CGV = 'https://lecercle127.com/conditions-generales-de-vente/';

function Tick({ on, onPress, children }: { on: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={st.tick} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
      <View style={[st.box, on && st.boxOn]}>{on ? <Text style={st.mark}>✓</Text> : null}</View>
      <Text style={st.tickText}>{children}</Text>
    </Pressable>
  );
}

export function PerleCard({ dreamId, userId, token }: { dreamId: string; userId: string; token: string }) {
  const [status, setStatus] = useState<PerleStatus | null>(null);
  const [offer, setOffer] = useState<PerleOffer | null>(null);
  const [open, setOpen] = useState(false);
  const [consents, setConsents] = useState<PerleConsents>({ cgv: false, ai: false, withdrawal: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    // Achats payés mais pas encore confirmés au site : on réessaie d'abord.
    for (const p of await listPendingPerles()) {
      try { await api.claimPerle(token, p); await removePendingPerle(p.transactionId); } catch { /* plus tard */ }
    }
    const s = await api.perleStatus(token);
    setStatus(s);
    if (!s.perles.some((p) => p.dreamId === dreamId)) setOffer(await loadPerleOffer(userId, pickPerleProduct(s.welcomeEligible)));
  }, [dreamId, token, userId]);

  useEffect(() => {
    if (!perleAvailable()) return;
    let active = true;
    const run = async () => { try { await refresh(); } catch { if (active) setStatus(null); } };
    void run();
    return () => { active = false; };
  }, [refresh]);

  if (!perleAvailable()) return null;
  const mine = status?.perles.find((p) => p.dreamId === dreamId);
  if (mine) {
    return (
      <Card>
        <Eyebrow>{t('La Perle d’Oni')}</Eyebrow>
        <Body muted>
          {mine.status === 'livree'
            ? t('Votre Perle a été livrée : elle se trouve dans la lecture de ce rêve.')
            : mine.status === 'remboursee'
              ? t('Cette Perle a été remboursée.')
              : t('Votre Perle est en préparation. Une personne du Cercle la relit : elle arrive ici sous 48 heures.')}
        </Body>
      </Card>
    );
  }
  if (!status || !offer) return null;

  const pay = async () => {
    if (!consentsComplete(consents)) { setMsg({ tone: 'error', text: t('Cochez les trois accords pour continuer.') }); return; }
    setBusy(true); setMsg(null);
    try {
      const bought = await buyPerle(userId, offer);
      if (!bought) return;
      const claim = { dreamId, productId: bought.productId, transactionId: bought.transactionId, at: new Date().toISOString() };
      await addPendingPerle(claim);
      try {
        await api.claimPerle(token, claim);
        await removePendingPerle(claim.transactionId);
        setMsg({ tone: 'success', text: t('Merci ! Votre Perle est en préparation : elle arrive ici sous 48 heures.') });
      } catch {
        setMsg({ tone: 'success', text: t('Paiement reçu. La confirmation sera envoyée dès que le réseau le permet : votre Perle n’est pas perdue.') });
      }
      await refresh().catch(() => undefined);
    } catch {
      setMsg({ tone: 'error', text: t('Le paiement n’a pas abouti. Vous n’avez pas été débité·e.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Eyebrow>{t('La Perle d’Oni')}</Eyebrow>
      <Text style={st.title}>{t('Une lecture approfondie, relue par une personne')}</Text>
      <Body muted>
        {t('Oni explore votre rêve en profondeur (symboles, climat, liens avec votre vie), puis une personne du Cercle relit, ajuste et valide la lecture. Elle arrive ici sous 48 heures.')}
      </Body>
      {status.welcomeEligible ? <Text style={st.welcome}>{t('Première Perle : prix de bienvenue')}</Text> : null}
      {!open ? (
        <GoldButton label={t('Recevoir la Perle · {v0}', { v0: offer.price })} onPress={() => setOpen(true)} />
      ) : (
        <View style={{ gap: space.sm }}>
          <Tick on={consents.cgv} onPress={() => setConsents({ ...consents, cgv: !consents.cgv })}>
            {t('J’accepte les conditions générales de vente.')}{' '}
            <Text style={st.link} onPress={() => Linking.openURL(CGV).catch(() => undefined)}>{t('Les lire')}</Text>
          </Tick>
          <Tick on={consents.ai} onPress={() => setConsents({ ...consents, ai: !consents.ai })}>
            {t('J’accepte que mon récit soit transmis à Oni (Make, puis OpenAI) pour préparer la lecture, relue ensuite par une personne.')}
          </Tick>
          <Tick on={consents.withdrawal} onPress={() => setConsents({ ...consents, withdrawal: !consents.withdrawal })}>
            {t('Je demande que la lecture commence tout de suite et je renonce à mon droit de rétractation.')}
          </Tick>
          <GoldButton label={t('Payer {v0} avec Google Play', { v0: offer.price })} onPress={pay} loading={busy} disabled={!consentsComplete(consents)} />
        </View>
      )}
      {msg ? <Notice tone={msg.tone} text={msg.text} /> : null}
      <Body muted style={{ fontSize: 12 }}>
        {t('Paiement unique, sans abonnement. Ni diagnostic ni prédiction : une lecture symbolique pour nourrir votre réflexion.')}
      </Body>
    </Card>
  );
}

const st = StyleSheet.create({
  title: { fontFamily: fonts.title, fontSize: 21, lineHeight: 27, color: colors.text },
  welcome: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  tick: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.gold },
  mark: { color: colors.night, fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 16 },
  tickText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  link: { color: colors.gold, fontFamily: fonts.bodyBold },
});
