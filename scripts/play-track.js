// Place un .aab déjà importé (versionCode) dans un canal Google Play, en brouillon. Remplace la version du canal.
// Usage : GSA='<clé JSON>' node scripts/play-track.js <canal> <versionCode> <nom>
const crypto = require('crypto');
const PKG = 'com.lecercle127.app';
const [track, code, name] = process.argv.slice(2);
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
  await j(await fetch(`${API}/edits/${edit.id}/tracks/${track}`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ track, releases: [{ name, versionCodes: [String(code)], status: 'draft', releaseNotes: [{ language: 'fr-FR', text: 'Version de test du Cercle 127 : lecture du jour d’Oni, Oracle, Labyrinthe vivant, journal intime.' }] }] }) }), 'canal ' + track);
  await j(await fetch(`${API}/edits/${edit.id}:commit`, { method: 'POST', headers: H }), 'validation');
  console.log(`TERMINÉ : ${name} (fichier n° ${code}) est en brouillon dans le canal « ${track} ».`);
})().catch((e) => { console.log('REFUS DE GOOGLE —', e.message); process.exit(1); });
