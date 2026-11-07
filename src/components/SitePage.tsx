import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { createElement, useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

import { saveWebError } from '../lib/crash';
import { decideNavigation, decideRequest, injectedScript, nativeRouteFor, siteUrl } from '../lib/webpage';
import { colors, fonts, space } from '../lib/theme';
import { OutlineButton } from './ui';
import { prepareAppHtml } from '../lib/app-html';
import { useSession } from '../lib/session';

// Les types de react-native-webview 14 se réduisent à `never` avec React 19.3 :
// on décrit ici les seules propriétés utilisées.
type WebViewNavigation = { url: string; isTopFrame?: boolean; navigationType?: string };
type WebViewHandle = { reload: () => void };
type WebViewProps = {
  ref?: Ref<WebViewHandle>;
  source: { html: string; baseUrl: string };
  originWhitelist?: string[];
  style?: object;
  injectedJavaScriptBeforeContentLoaded?: string;
  injectedJavaScript?: string;
  onShouldStartLoadWithRequest?: (req: WebViewNavigation) => boolean;
  onLoadEnd?: () => void;
  onError?: () => void;
  onHttpError?: (e: { nativeEvent: { statusCode: number } }) => void;
  onContentProcessDidTerminate?: () => void;
  onRenderProcessGone?: () => void;
  onMessage?: (e: { nativeEvent: { data: string } }) => void;
  allowsBackForwardNavigationGestures?: boolean;
  sharedCookiesEnabled?: boolean;
  thirdPartyCookiesEnabled?: boolean;
  incognito?: boolean;
  setSupportMultipleWindows?: boolean;
  applicationNameForUserAgent?: string;
  pullToRefreshEnabled?: boolean;
  mediaCapturePermissionGrantType?: 'prompt' | 'grant' | 'deny' | 'grantIfSameHostElsePrompt' | 'grantIfSameHostElseDeny';
  allowsInlineMediaPlayback?: boolean;
  allowFileAccess?: boolean;
  javaScriptCanOpenWindowsAutomatically?: boolean;
};
const WebView = RNWebView as unknown as ComponentType<WebViewProps>;


/** Affiche une page de la version mobile du site, sans son en-tête ni sa barre de navigation. */
export function SitePage({ path }: { path: string }) {
  const { user, isDemo } = useSession();
  return <SitePageContent key={`${path}:${isDemo ? 'demo' : user?.id ?? 'guest'}`} path={path} />;
}

function SitePageContent({ path }: { path: string }) {
  const ref = useRef<WebViewHandle>(null);
  const browserOpen = useRef(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const initialHtmlNavigation = useRef(true);
  const url = siteUrl(path);

  useEffect(() => {
    if (Platform.OS === 'web' || decideNavigation(url) === 'block') return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 20000);
    initialHtmlNavigation.current = true;
    fetch(url, { signal: controller.signal, credentials: 'omit' }).then(async (response) => {
      if (!response.ok) throw new Error('Page indisponible.');
      const content = await response.text();
      if (active) setHtml(prepareAppHtml(content, response.url || url));
    }).catch(() => { if (active) { setFailed(true); setLoading(false); } })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [url, reloadKey]);

  const retryLoad = () => {
    setHtml(null); setFailed(false); setLoading(true);
    setReloadKey((key) => key + 1);
  };

  // L'URL initiale peut venir d'un lien profond, avant tout callback de la WebView.
  if (decideNavigation(url) === 'block') {
    return (
      <View style={st.center}>
        <Text style={st.msg}>Cette page n’est pas disponible dans l’application.</Text>
        <OutlineButton label="Raconter un rêve" onPress={() => router.navigate('/reve')} />
      </View>
    );
  }

  if (Platform.OS === 'web') {
    // Le navigateur doit pouvoir demander le micro/la caméra pour la page intégrée.
    return (
      <View style={{ flex: 1, backgroundColor: colors.night }}>
        {createElement('iframe', { src: url, title: path, allow: 'microphone; camera', style: { flex: 1, border: 0, width: '100%', height: '100%' } })}
      </View>
    );
  }

  const onShouldStart = (req: WebViewNavigation) => {
    const d = decideRequest(req);
    if (d === 'allow') {
      // Toute nouvelle page du site repasse par le nettoyage, plutôt qu’un chargement brut.
      if (/^https?:\/\/(?:www\.)?lecercle127\.com(?:\/|$)/i.test(req.url) && req.isTopFrame !== false) {
        if (initialHtmlNavigation.current && req.navigationType === 'other' && req.url === url) {
          initialHtmlNavigation.current = false;
          return true;
        }
        router.push({ pathname: '/page', params: { path: req.url, title: '' } });
        return false;
      }
      return true;
    }
    if (d === 'native') {
      const route = nativeRouteFor(req.url);
      if (route) router.navigate(route as never);
      return false;
    }
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
          onPress={retryLoad}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      {html && <WebView
        ref={ref}
        source={{ html, baseUrl: url }}
        originWhitelist={['*']}
        style={{ flex: 1, backgroundColor: colors.night }}
        injectedJavaScriptBeforeContentLoaded={injectedScript()}
        injectedJavaScript={injectedScript()}
        onShouldStartLoadWithRequest={onShouldStart}
        onLoadEnd={() => { initialHtmlNavigation.current = false; setLoading(false); }}
        onError={() => setFailed(true)}
        onHttpError={(e) => e.nativeEvent.statusCode >= 500 && setFailed(true)}
        // Si le moteur web s'arrête (page trop lourde), on recharge au lieu de fermer l'app.
        onContentProcessDidTerminate={retryLoad}
        onRenderProcessGone={() => setFailed(true)}
        onMessage={(e) => saveWebError(e.nativeEvent.data)}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        incognito
        setSupportMultipleWindows={false}
        applicationNameForUserAgent="Cercle127App/1.0"
        pullToRefreshEnabled
        // Micro (carnet vocal) et appareil photo (lignes de la main) pour les pages du site.
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        allowsInlineMediaPlayback
        allowFileAccess
        javaScriptCanOpenWindowsAutomatically={false}
      />}
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
