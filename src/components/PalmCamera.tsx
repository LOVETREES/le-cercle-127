// Écran photo de la paume. La caméra native (fenêtre photo d'iOS comme expo-camera) restait noire sur
// iOS 26 dans l'app, alors que la même photo fonctionne dans Safari. On passe donc par le moteur web
// (WKWebView) : caméra via getUserMedia, et choix d'une photo de la galerie par un champ fichier.
// La photo est réduite à 1400 px dans la page puis renvoyée à l'app en JPEG base64.
import { type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

import { t } from '../i18n';

// Les types de react-native-webview 14 se réduisent à `never` avec React 19.3 (voir SitePage).
type WebViewProps = {
  source: { html: string; baseUrl: string };
  originWhitelist?: string[];
  style?: object;
  onMessage?: (e: { nativeEvent: { data: string } }) => void;
  mediaCapturePermissionGrantType?: 'prompt' | 'grant';
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  bounces?: boolean;
  scrollEnabled?: boolean;
};
const WebView = RNWebView as unknown as ComponentType<WebViewProps>;

type Props = { mode: 'camera' | 'gallery'; onPhoto: (base64: string) => void; onError: (message: string) => void; onClose: () => void };

function pageHtml(mode: 'camera' | 'gallery'): string {
  const L = JSON.stringify({
    hint: t('Paume ouverte, doigts légèrement écartés, toute la main dans le cadre'),
    cancel: t('Annuler'),
    shoot: t('Prendre la photo'),
    pick: t('Choisir une photo'),
    fail: t('L’appareil photo n’a pas pu démarrer. Ferme puis rouvre cet écran, ou utilise « Choisir une photo ».'),
  }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<style>
html,body{margin:0;height:100%;background:#000;color:#fff;font:15px -apple-system,system-ui,sans-serif;overflow:hidden}
video{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
.frame{position:fixed;left:13%;right:13%;top:16%;aspect-ratio:.72;border:2px dashed rgba(242,222,168,.9);border-radius:28px;pointer-events:none}
.hint{position:fixed;left:10%;right:10%;top:calc(env(safe-area-inset-top) + 18px);text-align:center;line-height:1.4;text-shadow:0 0 6px #000}
.msg{position:fixed;left:20px;right:20px;top:24%;padding:14px;border-radius:12px;background:rgba(120,30,30,.88);text-align:center;line-height:1.45;display:none}
.bar{position:fixed;left:0;right:0;bottom:0;padding:18px 10px calc(env(safe-area-inset-bottom) + 22px);display:flex;align-items:center;justify-content:space-around;background:rgba(0,0,0,.55)}
.side{width:96px;text-align:center;background:none;border:0;color:#fff;font-size:16px;padding:10px 0}
.shutter{width:78px;height:78px;border-radius:50%;border:4px solid #fff;background:none;padding:0;display:flex;align-items:center;justify-content:center}
.shutter i{display:block;width:60px;height:60px;border-radius:50%;background:#fff}
.shutter:disabled{opacity:.35}
.pickbig{position:fixed;left:24px;right:24px;top:46%;padding:16px;border-radius:999px;background:#d8b66b;color:#141022;font-weight:700;text-align:center;font-size:17px}
input{display:none}
</style></head><body>
<video id="v" playsinline autoplay muted></video>
<div class="frame" id="frame"></div>
<div class="hint" id="hint"></div>
<div class="msg" id="msg"></div>
<label class="pickbig" id="pickbig" style="display:none"><span id="pickbigt"></span><input id="f2" type="file" accept="image/*"></label>
<div class="bar">
  <button class="side" id="cancel"></button>
  <button class="shutter" id="shoot" disabled><i></i></button>
  <label class="side" id="pick"><span id="pickt"></span><input id="f" type="file" accept="image/*"></label>
</div>
<script>
(function(){
var L=${L}, MODE=${JSON.stringify(mode)}, MAX=1400;
function $(i){return document.getElementById(i)}
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o))}
$('hint').textContent=L.hint;$('cancel').textContent=L.cancel;$('pickt').textContent=L.pick;$('pickbigt').textContent=L.pick;$('shoot').setAttribute('aria-label',L.shoot);
var v=$('v'),stream=null;
function stop(){if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null}}
function fail(){$('msg').textContent=L.fail;$('msg').style.display='block';$('frame').style.display='none';$('pickbig').style.display='block';$('shoot').disabled=true}
function send(src,w,h){
  var s=Math.min(1,MAX/Math.max(w,h)),c=document.createElement('canvas');
  c.width=Math.round(w*s);c.height=Math.round(h*s);
  c.getContext('2d').drawImage(src,0,0,c.width,c.height);
  var d=c.toDataURL('image/jpeg',0.86);stop();
  post({type:'photo',base64:d.slice(d.indexOf(',')+1)});
}
$('cancel').onclick=function(){stop();post({type:'close'})};
$('shoot').onclick=function(){if(v.videoWidth)send(v,v.videoWidth,v.videoHeight)};
function onFile(e){
  var file=e.target.files&&e.target.files[0];if(!file)return;
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){send(img,img.naturalWidth,img.naturalHeight);URL.revokeObjectURL(url)};
  img.onerror=function(){post({type:'error'})};
  img.src=url;
}
$('f').onchange=onFile;$('f2').onchange=onFile;
if(MODE==='gallery'){$('frame').style.display='none';$('hint').style.display='none';$('pickbig').style.display='block';$('pick').style.visibility='hidden';$('shoot').style.visibility='hidden';return}
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){fail();return}
navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1440}}}).then(function(s){
  stream=s;v.srcObject=s;
  v.onloadedmetadata=function(){v.play();$('shoot').disabled=false};
  setTimeout(function(){if(!v.videoWidth)fail()},6000);
}).catch(fail);
})();
</script></body></html>`;
}

/** Plein écran par-dessus la page (pas de Modal natif). */
export function PalmCamera({ mode, onPhoto, onError, onClose }: Props) {
  return (
    <View style={st.root} accessibilityViewIsModal>
      <WebView
        source={{ html: pageHtml(mode), baseUrl: 'https://lecercle127.com/' }}
        originWhitelist={['*']}
        style={st.web}
        mediaCapturePermissionGrantType="grant"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        bounces={false}
        scrollEnabled={false}
        onMessage={(e) => {
          let msg: { type?: string; base64?: string };
          try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
          if (msg.type === 'photo' && msg.base64) onPhoto(msg.base64);
          else if (msg.type === 'close') onClose();
          else if (msg.type === 'error') onError(t('Cette photo n’a pas pu être préparée. Essaies-en une autre, au format JPEG ou HEIC.'));
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 100, elevation: 100 },
  web: { flex: 1, backgroundColor: '#000' },
});
