// Fiche Google Play : remplit UNIQUEMENT ce qui est vide (textes fr-FR, coordonnées, icône, bannière, captures).
// Ne remplace jamais ce qui a déjà été saisi dans la Play Console. Usage : GSA='<clé JSON>' node scripts/play-listing.js
const crypto = require('crypto');
const fs = require('fs');
const PKG = 'com.lecercle127.app';
const LANG = 'fr-FR';
const k = JSON.parse(process.env.GSA || '{}');
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}`;
const UP = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}`;
const txt = (f) => fs.readFileSync(`store/play/${LANG}/${f}`, 'utf8').trim();
(async () => {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const jwt = unsigned + '.' + crypto.sign('RSA-SHA256', Buffer.from(unsigned), k.private_key).toString('base64url');
  const t = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt })).json();
  if (!t.access_token) throw new Error('jeton refusé');
  const H = { Authorization: 'Bearer ' + t.access_token };
  const j = async (r, what, ok404) => { const x = await r.json().catch(() => ({})); if (!r.ok && !(ok404 && r.status === 404)) throw new Error(what + ' : ' + r.status + ' ' + JSON.stringify(x.error || x)); return r.ok ? x : null; };
  const edit = await j(await fetch(API + '/edits', { method: 'POST', headers: H }), 'ouverture');
  const E = `${API}/edits/${edit.id}`;
  let changed = 0;

  const det = await j(await fetch(`${E}/details`, { headers: H }), 'coordonnées');
  console.log('Coordonnées actuelles :', JSON.stringify(det));
  const want = { defaultLanguage: det.defaultLanguage || LANG, contactEmail: det.contactEmail || 'contact@lecercle127.com', contactWebsite: det.contactWebsite || 'https://lecercle127.com/application/' };
  if (want.contactEmail !== det.contactEmail || want.contactWebsite !== det.contactWebsite || want.defaultLanguage !== det.defaultLanguage) {
    await j(await fetch(`${E}/details`, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(want) }), 'coordonnées (écriture)');
    console.log('→ coordonnées complétées'); changed++;
  }

  const cur = (await j(await fetch(`${E}/listings/${LANG}`, { headers: H }), 'fiche', true)) || {};
  console.log('Fiche actuelle :', JSON.stringify({ titre: cur.title, courte: cur.shortDescription, longue: (cur.fullDescription || '').slice(0, 60) }));
  const L = { language: LANG, title: cur.title || txt('title.txt'), shortDescription: cur.shortDescription || txt('short.txt'), fullDescription: cur.fullDescription || txt('full.txt') };
  if (L.title !== cur.title || L.shortDescription !== cur.shortDescription || L.fullDescription !== cur.fullDescription) {
    await j(await fetch(`${E}/listings/${LANG}`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(L) }), 'fiche (écriture)');
    console.log('→ textes de la fiche complétés'); changed++;
  }

  const imgs = { icon: ['icone-512.png'], featureGraphic: ['banniere-1024x500.png'], phoneScreenshots: ['1-accueil-1080x1920.png', '2-reve-1080x1920.png', '3-grimoire-1080x1920.png', '4-symboles-1080x1920.png'] };
  for (const [type, files] of Object.entries(imgs)) {
    const have = (await j(await fetch(`${E}/listings/${LANG}/${type}`, { headers: H }), 'images ' + type)).images || [];
    console.log(`Images ${type} : ${have.length} déjà en ligne`);
    if (have.length) continue;
    for (const f of files) {
      await j(await fetch(`${UP}/edits/${edit.id}/listings/${LANG}/${type}?uploadType=media`, { method: 'POST', headers: { ...H, 'Content-Type': 'image/png' }, body: fs.readFileSync('store/android/' + f) }), 'image ' + f);
      console.log('→ image ajoutée :', f); changed++;
    }
  }

  if (!changed) { await fetch(E, { method: 'DELETE', headers: H }); console.log('Rien à compléter : la fiche était déjà remplie.'); return; }
  await j(await fetch(`${E}:commit`, { method: 'POST', headers: H }), 'validation');
  console.log(`TERMINÉ : ${changed} élément(s) ajouté(s) à la fiche Play Store.`);
})().catch((e) => { console.log('REFUS DE GOOGLE —', e.message); process.exit(1); });
