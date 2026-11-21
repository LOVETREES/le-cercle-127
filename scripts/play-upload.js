// Import direct d’un .aab dans Google Play : brouillon en alpha, soumission en production.
// Usage : GSA='<clé JSON>' node scripts/play-upload.js <fichier.aab> <nom de version> [alpha|production]
const crypto = require('crypto');
const fs = require('fs');
const PKG = 'com.lecercle127.app';
const [aab, name, track = 'alpha'] = process.argv.slice(2);
if (!['alpha', 'production'].includes(track)) throw new Error('Canal Google Play inconnu');
const status = track === 'production' ? 'completed' : 'draft';
const releaseNotes = [{
  language: 'fr-FR',
  text: 'Un accueil simplifié pour raconter un rêve et ouvrir votre Grimoire. Retrouvez le Grimoire amélioré, votre parcours onirique et vos lectures avec Oni et Terra.',
}];
const k = JSON.parse(process.env.GSA || '{}');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UP = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;
(async () => {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + crypto.sign('RSA-SHA256', Buffer.from(unsigned), k.private_key).toString('base64url');
  const t = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt })).json();
  if (!t.access_token) throw new Error('jeton refusé : ' + JSON.stringify(t));
  const H = { Authorization: 'Bearer ' + t.access_token };
  const j = async (r, what) => { const x = await r.json().catch(() => ({})); if (!r.ok) throw new Error(what + ' : ' + r.status + ' ' + JSON.stringify(x.error || x)); return x; };
  const edit = await j(await fetch(API + '/edits', { method: 'POST', headers: H }), 'ouverture');
  console.log('Modification ouverte');
  const bundle = await j(await fetch(`${UP}/edits/${edit.id}/bundles?uploadType=media`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/octet-stream' }, body: fs.readFileSync(aab) }), 'import du .aab');
  console.log('Fichier importé, versionCode', bundle.versionCode);
  await j(await fetch(`${API}/edits/${edit.id}/tracks/${track}`, {
    method: 'PUT',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ track, releases: [{ name, versionCodes: [String(bundle.versionCode)], status, releaseNotes }] }),
  }), 'canal ' + track);
  await j(await fetch(`${API}/edits/${edit.id}:commit`, { method: 'POST', headers: H }), 'validation');
  console.log(`Version ${name} (code ${bundle.versionCode}) validée sur « ${track} », statut ${status}.`);
})().catch((e) => { console.log('REFUS DE GOOGLE —', e.message); process.exit(1); });
