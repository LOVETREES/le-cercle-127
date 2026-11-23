# Version compacte des fiches de Terra, jointe à la lecture détaillée de la main (Make).
# Source unique : fiches-terra.jsonl (produit par fiches.py). Ne pas éditer le .txt à la main.
# Usage : python3 docs/terra/compact.py  -> écrit fiches-terra-compact.txt à côté.
import json, os, re

here = os.path.dirname(os.path.abspath(__file__))
KEEP = {'Où regarder': 'Où', 'Ce que dit la tradition': 'Tradition', 'La lecture de Terra': 'Terra', 'Ce que Terra ne dit jamais': 'Jamais'}
out = []
for line in open(os.path.join(here, 'fiches-terra.jsonl'), encoding='utf-8'):
    d = json.loads(line)
    titre = d['titre'].replace('Terra · ', '')
    parts, cur, buf = {}, None, []
    for raw in d['texte'].split('\n'):
        m = re.match(r'\*\*(.+?)\.\*\*\s*(.*)', raw)
        if m:
            if cur: parts[cur] = ' '.join(buf).strip()
            cur, buf = m.group(1), [m.group(2)]
        elif cur:
            buf.append(raw.strip())
    if cur: parts[cur] = ' '.join(buf).strip()
    seg = []
    for k, short in KEEP.items():
        v = parts.get(k, '')
        v = re.sub(r'\s*\*\((.+?)\)\*', lambda mm: ' (' + re.sub(r', .*?\((\d{4})\)', r' \1', mm.group(1)) + ')', v)
        v = re.sub(r'^-\s*', '', v).replace(' - ', ' ; ')
        v = re.sub(r'\s+', ' ', v).strip()
        if v: seg.append(f'{short} : {v}')
    out.append(f'• {titre}. ' + ' | '.join(seg))
txt = '\n'.join(out) + '\n'
open(os.path.join(here, 'fiches-terra-compact.txt'), 'w', encoding='utf-8').write(txt)
print(len(out), 'fiches,', len(txt), 'caractères')
