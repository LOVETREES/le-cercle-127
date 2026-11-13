// Coordonnées de la fiche Google Play : retire le numéro de téléphone public (e-mail et site conservés).
// Usage : GSA='<clé JSON>' node scripts/play-details.js
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
  if (!t.access_token) throw new Error('jeton refusé');
  const H = { Authorization: 'Bearer ' + t.access_token };
  const j = async (r, what) => { const x = await r.json().catch(() => ({})); if (!r.ok) throw new Error(what + ' : ' + r.status + ' ' + JSON.stringify(x.error || x)); return x; };
  const edit = await j(await fetch(API + '/edits', { method: 'POST', headers: H }), 'ouverture');
  const E = `${API}/edits/${edit.id}`;
  const d = await j(await fetch(`${E}/details`, { headers: H }), 'lecture');
  const next = { defaultLanguage: d.defaultLanguage, contactEmail: d.contactEmail, contactWebsite: d.contactWebsite };
  await j(await fetch(`${E}/details`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(next) }), 'écriture');
  await j(await fetch(`${E}:commit`, { method: 'POST', headers: H }), 'validation');
  const e2 = await j(await fetch(API + '/edits', { method: 'POST', headers: H }), 'vérification');
  const v = await j(await fetch(`${API}/edits/${e2.id}/details`, { headers: H }), 'relecture');
  await fetch(`${API}/edits/${e2.id}`, { method: 'DELETE', headers: H });
  console.log('Coordonnées maintenant :', JSON.stringify({ email: v.contactEmail, site: v.contactWebsite, telephone: v.contactPhone ? 'ENCORE PRÉSENT' : 'retiré' }));
})().catch((e) => { console.log('REFUS DE GOOGLE —', e.message); process.exit(1); });
