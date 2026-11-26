// Écran caméra propre à l'app pour photographier la paume. Il remplace la fenêtre photo d'iOS
// (UIImagePickerController), dont l'aperçu restait noir sur certains iPhone : ici, expo-camera pilote
// directement l'objectif arrière. Affiché par-dessus l'écran (pas de Modal natif), avec un cadre de visée.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { colors, fonts, space } from '../lib/theme';

type Props = { onTaken: (uri: string, width: number, height: number) => void; onClose: () => void };

export function PalmCamera({ onTaken, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shoot = async () => {
    if (!cam.current || !ready || busy) return;
    setBusy(true);
    try {
      const pic = await cam.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (pic?.uri) onTaken(pic.uri, pic.width, pic.height);
      else setError(t('La photo n’a pas pu être prise. Réessayez.'));
    } catch {
      setError(t('La photo n’a pas pu être prise. Réessayez.'));
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (!permission) {
    body = <ActivityIndicator color={colors.gold} />;
  } else if (!permission.granted) {
    body = (
      <View style={st.center}>
        <Text style={st.msg}>{t('Le Cercle 127 a besoin de l’appareil photo pour photographier ta main.')}</Text>
        {permission.canAskAgain ? (
          <Pressable style={st.btn} onPress={requestPermission} accessibilityRole="button"><Text style={st.btnText}>{t('Autoriser l’appareil photo')}</Text></Pressable>
        ) : (
          <Pressable style={st.btn} onPress={() => Linking.openSettings()} accessibilityRole="button"><Text style={st.btnText}>{t('Ouvrir les réglages')}</Text></Pressable>
        )}
      </View>
    );
  } else {
    body = (
      <>
        <CameraView
          ref={cam}
          style={StyleSheet.absoluteFill}
          facing="back"
          mode="picture"
          onCameraReady={() => setReady(true)}
          onMountError={() => setError(t('L’appareil photo n’a pas pu démarrer. Fermez puis rouvrez cet écran, ou utilisez « Choisir une photo ».'))}
        />
        <View style={st.frameWrap} pointerEvents="none">
          <View style={st.frame} />
          <Text style={st.hint}>{t('Paume ouverte, doigts légèrement écartés, toute la main dans le cadre')}</Text>
        </View>
      </>
    );
  }

  return (
    <View style={st.root} accessibilityViewIsModal>
      {body}
      {error ? <Text style={st.error} accessibilityRole="alert">{error}</Text> : null}
      <View style={st.bar}>
        <Pressable onPress={onClose} style={st.side} accessibilityRole="button" accessibilityLabel={t('Fermer l’appareil photo')}>
          <Text style={st.sideText}>{t('Annuler')}</Text>
        </Pressable>
        <Pressable
          onPress={shoot}
          disabled={!ready || busy || !permission?.granted}
          style={({ pressed }) => [st.shutter, (!ready || busy) && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.94 }] }]}
          accessibilityRole="button"
          accessibilityLabel={t('Prendre la photo')}
        >
          {busy ? <ActivityIndicator color={colors.night} /> : <View style={st.shutterIn} />}
        </Pressable>
        <View style={st.side} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 100, elevation: 100, justifyContent: 'center' },
  center: { alignItems: 'center', gap: space.md, padding: space.lg },
  msg: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: '#fff', textAlign: 'center' },
  btn: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.gold },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.night },
  frameWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 90 },
  frame: { width: '74%', aspectRatio: 0.72, borderRadius: 28, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(242,222,168,0.9)' },
  hint: { maxWidth: '80%', fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: '#fff', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 6 },
  error: { position: 'absolute', top: 70, left: 20, right: 20, padding: 12, borderRadius: 12, backgroundColor: 'rgba(120,30,30,0.85)', color: '#fff', fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 44, paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(0,0,0,0.55)' },
  side: { width: 90, alignItems: 'center' },
  sideText: { fontFamily: fonts.bodyMedium, fontSize: 16, color: '#fff' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterIn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
});
