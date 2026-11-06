import * as WebBrowser from 'expo-web-browser';
import { createElement, useRef, useState, type ComponentType, type Ref } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

import { decideRequest, injectedScript, siteUrl } from '../lib/webpage';
import { colors, fonts, space } from '../lib/theme';
import { OutlineButton } from './ui';

// Les types de react-native-webview 14 se réduisent à `never` avec React 19.3 :
// on décrit ici les seules propriétés utilisées.
type WebViewNavigation = { url: string; isTopFrame?: boolean; navigationType?: string };
type WebViewHandle = { reload: () => void };
type WebViewProps = {
  ref?: Ref<WebViewHandle>;
  source: { uri: string };
  style?: object;
  injectedJavaScriptBeforeContentLoaded?: string;
  injectedJavaScript?: string;
  onShouldStartLoadWithRequest?: (req: WebViewNavigation) => boolean;
  onLoadEnd?: () => void;
  onError?: () => void;
  onHttpError?: (e: { nativeEvent: { statusCode: number } }) => void;
  onContentProcessDidTerminate?: () => void;
  onRenderProcessGone?: () => void;
  allowsBackForwardNavigationGestures?: boolean;
  sharedCookiesEnabled?: boolean;
  setSupportMultipleWindows?: boolean;
  applicationNameForUserAgent?: string;
  pullToRefreshEnabled?: boolean;
};
const WebView = RNWebView as unknown as ComponentType<WebViewProps>;


/** Affiche une page de la version mobile du site, sans son en-tête ni sa barre de navigation. */
export function SitePage({ path }: { path: string }) {
  const ref = useRef<WebViewHandle>(null);
  const browserOpen = useRef(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const url = siteUrl(path);

  if (Platform.OS === 'web') {
    // Aperçu web de développement : iframe simple.
    return (
      <View style={{ flex: 1, backgroundColor: colors.night }}>
        {createElement('iframe', { src: url, title: path, style: { flex: 1, border: 0, width: '100%', height: '100%' } })}
      </View>
    );
  }

  const onShouldStart = (req: WebViewNavigation) => {
    const d = decideRequest(req);
    if (d === 'allow') return true;
    if (d === 'external' && !browserOpen.current) {
      if (req.url.startsWith('mailto:') || req.url.startsWith('tel:')) {
        Linking.openURL(req.url).catch(() => undefined);
      } else {
        browserOpen.current = true;
        WebBrowser.openBrowserAsync(req.url)
          .catch(() => undefined)
          .finally(() => {
            browserOpen.current = false;
          });
      }
    }
    return false;
  };

  if (failed) {
    return (
      <View style={st.center}>
        <Text style={st.msg}>Cette page n’a pas pu être chargée. Vérifiez votre connexion.</Text>
        <OutlineButton
          label="Réessayer"
          onPress={() => {
            setFailed(false);
            ref.current?.reload();
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      <WebView
        ref={ref}
        source={{ uri: url }}
        style={{ flex: 1, backgroundColor: colors.night }}
        injectedJavaScriptBeforeContentLoaded={injectedScript()}
        injectedJavaScript={injectedScript()}
        onShouldStartLoadWithRequest={onShouldStart}
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={(e) => e.nativeEvent.statusCode >= 500 && setFailed(true)}
        // Si le moteur web s'arrête (page trop lourde), on recharge au lieu de fermer l'app.
        onContentProcessDidTerminate={() => ref.current?.reload()}
        onRenderProcessGone={() => setFailed(true)}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        setSupportMultipleWindows={false}
        applicationNameForUserAgent="Cercle127App/1.0"
        pullToRefreshEnabled
      />
      {loading && (
        <View style={st.loader} pointerEvents="none">
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.md, backgroundColor: colors.night },
  msg: { fontFamily: fonts.body, color: colors.text, textAlign: 'center', fontSize: 15 },
  loader: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.night },
});
