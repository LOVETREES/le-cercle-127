import json
import re
import subprocess
import time
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path('evidence')
OUT.mkdir(exist_ok=True)

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True, errors='replace')

def snapshot(name):
    adb('shell', 'uiautomator', 'dump', '/sdcard/window.xml')
    xml = adb('shell', 'cat', '/sdcard/window.xml')
    (OUT / (name + '.xml')).write_text(xml)
    with (OUT / (name + '.png')).open('wb') as f:
        subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=f, check=True)
    return ET.fromstring(xml)

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if not unicodedata.combining(c))

def click(root, words):
    for word in words:
        for node in root.iter('node'):
            label = norm(node.get('text', '') + ' ' + node.get('content-desc', ''))
            if norm(word) not in label:
                continue
            box = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
            if len(box) == 4 and box[2] > box[0] and box[3] > box[1]:
                adb('shell', 'input', 'tap', str((box[0] + box[2]) // 2), str((box[1] + box[3]) // 2))
                time.sleep(2)
                return True
    return False

report = {'apk': '1.0.6', 'api': adb('shell', 'getprop', 'ro.build.version.sdk').strip()}
report['package'] = adb('shell', 'dumpsys', 'package', 'com.lecercle127.app')
(OUT / 'package.txt').write_text(report.pop('package'))
adb('shell', 'monkey', '-p', 'com.lecercle127.app', '1')
time.sleep(15)
root = snapshot('01-first-launch')
click(root, ['Plus tard', 'Decouvrir l’application d’abord', 'Later'])
adb('shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', 'cercle127://page?path=%2Fterra-gardienne-de-lancrage%2F&title=Terra', 'com.lecercle127.app')
time.sleep(20)
for i in range(12):
    root = snapshot(f'02-terra-{i:02d}')
    labels = norm(' '.join(n.get('text', '') + ' ' + n.get('content-desc', '') for n in root.iter('node')))
    if any(s in labels for s in ['choisir une photo', 'prendre une photo', 'ou importer']):
        report['photo_button_found'] = click(root, ['Choisir une photo', 'Prendre une photo', 'ou importer'])
        break
    if click(root, ['Main gauche', 'Left hand']):
        root = snapshot('03-hand-selected')
        click(root, ['Continuer', 'Continue'])
    elif click(root, ['Plus tard', 'Reessayer', 'Continuer', 'Continue']):
        pass
    else:
        adb('shell', 'input', 'swipe', '540', '1700', '540', '600', '400')
    time.sleep(2)
else:
    report['photo_button_found'] = False

time.sleep(4)
root = snapshot('04-after-photo-tap')
packages = sorted(set(n.get('package', '') for n in root.iter('node')))
report['packages_after_photo_tap'] = packages
report['picker_opened'] = any(any(k in p for k in ['documentsui', 'photopicker', 'providers.media', 'gallery']) for p in packages)
(OUT / 'activity.txt').write_text(adb('shell', 'dumpsys', 'activity', 'activities'))
if report['picker_opened']:
    adb('shell', 'input', 'keyevent', '4')
    time.sleep(2)
    root = snapshot('05-cancelled')
    report['reopen_tapped'] = click(root, ['Choisir une photo', 'Prendre une photo', 'ou importer'])
    root = snapshot('06-reopened')
    report['reopened_packages'] = sorted(set(n.get('package', '') for n in root.iter('node')))
(OUT / 'logcat.txt').write_text(adb('logcat', '-d', '-t', '3000'))
(OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False, indent=2))
if not report.get('picker_opened'):
    raise SystemExit('Le sélecteur photo n’a pas été observé : consulter les captures, sans conclure automatiquement à un défaut de l’app.')
