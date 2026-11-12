// Import direct d'un .aab dans Google Play (API Android Publisher) : canal de test fermé « alpha », en brouillon.
// Usage : GSA='<clé JSON>' node scripts/play-upload.js <fichier.aab> <nom de version>
const crypto = require('crypto');
const fs = require('fs');
const PKG = 'com.lecercle127.app';
const [aab, name] = process.argv.slice(2);
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
  await j(await fetch(`${API}/edits/${edit.id}/tracks/alpha`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ track: 'alpha', releases: [{ name, versionCodes: [String(bundle.versionCode)], status: 'draft', releaseNotes: [{ language: 'fr-FR', text: 'Version de test du Cercle 127 : lecture du jour d’Oni, Oracle, Labyrinthe vivant, journal intime.' }] }] }) }), 'test fermé');
  console.log('Version placée dans le test fermé (brouillon)');
  await j(await fetch(`${API}/edits/${edit.id}:commit`, { method: 'POST', headers: H }), 'validation');
  console.log('TERMINÉ : la version', name, 'attend dans Tests fermés → « Envoyer pour examen ».');
})().catch((e) => { console.log('REFUS DE GOOGLE —', e.message); process.exit(1); });
