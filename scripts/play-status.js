// Lecture seule : état de l'app dans Google Play (canaux, versions, testeurs). Clé du compte de service dans GSA.
const crypto = require('crypto');
const PKG = 'com.lecercle127.app';
const k = JSON.parse(process.env.GSA || '{}');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
(async () => {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + crypto.sign('RSA-SHA256', Buffer.from(unsigned), k.private_key).toString('base64url');
  const t = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt })).json();
  if (!t.access_token) { console.log('JETON REFUSÉ :', JSON.stringify(t)); process.exit(1); }
  const h = { Authorization: 'Bearer ' + t.access_token };
  const call = async (m, p) => { const r = await fetch(API + p, { method: m, headers: h }); const j = await r.json().catch(() => ({})); return { s: r.status, j }; };
  const e = await call('POST', '/edits');
  console.log('Ouverture (lecture) :', e.s, e.s === 200 ? 'OK' : JSON.stringify(e.j.error || e.j));
  if (e.s !== 200) return;
  const id = e.j.id;
  const tr = await call('GET', `/edits/${id}/tracks`);
  console.log('CANAUX :', tr.s);
  for (const x of tr.j.tracks || []) console.log(' -', x.track, JSON.stringify((x.releases || []).map((r) => ({ nom: r.name, codes: r.versionCodes, statut: r.status }))));
  const b = await call('GET', `/edits/${id}/bundles`);
  console.log('FICHIERS .aab importés :', JSON.stringify((b.j.bundles || []).map((x) => x.versionCode)), b.s === 200 ? '' : JSON.stringify(b.j.error));
  for (const c of ['alpha', 'beta', 'internal']) { const ts = await call('GET', `/edits/${id}/testers/${c}`); console.log('Testeurs', c, ':', ts.s, JSON.stringify(ts.j.googleGroups || ts.j.error?.message || ts.j)); }
  await call('DELETE', `/edits/${id}`);
  // Produits et abonnements (hors « modification ») : nom, état, prix par pays.
  const money = (m) => m ? `${m.units || 0}${m.nanos ? '.' + String(Math.round(m.nanos / 1e7)).padStart(2, '0') : ''} ${m.currencyCode}` : '?';
  const ia = await call('GET', '/inappproducts');
  console.log('PRODUITS INTÉGRÉS (ancienne API) :', ia.s, ia.s === 200 ? '' : JSON.stringify(ia.j.error?.message));
  for (const p of ia.j.inappproduct || []) console.log(' -', p.sku, '|', p.status, '|', p.purchaseType, '|', JSON.stringify(Object.values(p.listings || {})[0]?.title), '| défaut', p.defaultPrice ? p.defaultPrice.priceMicros / 1e6 + ' ' + p.defaultPrice.currency : '?', '| pays', Object.keys(p.prices || {}).length);
  const ot = await call('GET', '/oneTimeProducts');
  console.log('PRODUITS PONCTUELS :', ot.s, ot.s === 200 ? '' : JSON.stringify(ot.j.error?.message));
  for (const p of ot.j.oneTimeProducts || []) {
    console.log(' -', p.productId, '|', JSON.stringify((p.listings || [])[0]?.title));
    for (const o of p.purchaseOptions || []) { const r = o.regionalPricingAndAvailabilityConfigs || []; const fr = r.find((x) => x.regionCode === 'FR'); console.log('    option', o.purchaseOptionId, '|', o.state, '|', r.length, 'pays | FR', money(fr?.price)); }
  }
  const sb = await call('GET', '/subscriptions');
  console.log('ABONNEMENTS :', sb.s, sb.s === 200 ? '' : JSON.stringify(sb.j.error?.message));
  for (const x of sb.j.subscriptions || []) {
    console.log(' -', x.productId, '|', JSON.stringify((x.listings || [])[0]?.title));
    for (const b of x.basePlans || []) { const r = b.regionalConfigs || []; const fr = r.find((y) => y.regionCode === 'FR'); console.log('    forfait', b.basePlanId, '|', b.state, '|', b.autoRenewingBasePlanType ? 'renouvelable ' + b.autoRenewingBasePlanType.billingPeriodDuration : b.prepaidBasePlanType ? 'prépayé' : '', '|', r.length, 'pays | FR', money(fr?.price)); }
  }
  console.log('Lien d’inscription (une fois un test fermé publié) : https://play.google.com/apps/testing/' + PKG);
})().catch((x) => { console.log('ERREUR', x.message); process.exit(1); });
