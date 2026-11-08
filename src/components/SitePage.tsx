import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { createElement, useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

import { saveWebError } from '../lib/crash';
import { storePalmMessage } from '../lib/palm';
import { decideNavigation, decidePageRequest, injectedScript, nativeRouteFor, siteUrl } from '../lib/webpage';
import { colors, fonts, space } from '../lib/theme';
import { OutlineButton } from './ui';
import { prepareAppHtml } from '../lib/app-html';
import { useSession } from '../lib/session';
import { t } from '../i18n';

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
  const [html, setHtml] = useState<{ content: string; baseUrl: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [palmSaved, setPalmSaved] = useState(false);
  const url = siteUrl(path);

  useEffect(() => {
    if (!loading || Platform.OS === 'web') return;
    const timer = setTimeout(() => { setFailed(true); setLoading(false); }, 25000);
    return () => clearTimeout(timer);
  }, [loading, reloadKey]);

  useEffect(() => {
    if (Platform.OS === 'web' || decideNavigation(url) === 'block') return;
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 20000);
    fetch(url, { signal: controller.signal, credentials: 'omit' }).then(async (response) => {
      if (!response.ok) throw new Error(t('Page indisponible.'));
      const content = await response.text();
      if (active) setHtml({ content: prepareAppHtml(content, response.url || url), baseUrl: response.url || url });
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
        <Text style={st.msg}>{t('Cette page n’est pas disponible dans l’application.')}</Text>
        <OutlineButton label={t('Raconter un rêve')} onPress={() => router.navigate('/reve')} />
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
    const d = decidePageRequest(req, html?.baseUrl ?? url);
    if (d === 'allow') return true;
    if (d === 'page') {
      router.push({ pathname: '/page', params: { path: req.url, title: '' } });
      return false;
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
        <Text style={st.msg}>{t('Cette page n’a pas pu être chargée. Vérifiez votre connexion.')}</Text>
        <OutlineButton
          label={t('Réessayer')}
          onPress={retryLoad}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.night }}>
      {html && <WebView
        ref={ref}
        source={{ html: html.content, baseUrl: html.baseUrl }}
        originWhitelist={['*']}
        style={{ flex: 1, backgroundColor: colors.night }}
        injectedJavaScriptBeforeContentLoaded={injectedScript()}
        injectedJavaScript={injectedScript()}
        onShouldStartLoadWithRequest={onShouldStart}
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={(e) => e.nativeEvent.statusCode >= 400 && setFailed(true)}
        // Si le moteur web s'arrête (page trop lourde), on recharge au lieu de fermer l'app.
        onContentProcessDidTerminate={retryLoad}
        onRenderProcessGone={() => setFailed(true)}
        onMessage={(e) => {
          try { if (JSON.parse(e.nativeEvent.data)?.type === 'c127-ready') { setLoading(false); return; } } catch { /* diagnostic non JSON */ }
          const data = e.nativeEvent.data;
          storePalmMessage(data).then((r) => { if (r === 'ignored') saveWebError(data); else if (r === 'new') setPalmSaved(true); }, () => saveWebError(data));
        }}
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
      {loading && !html && (
        <View style={st.loader} pointerEvents="none">
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      )}
      {palmSaved && (
        <View style={st.toast} accessibilityLiveRegion="polite">
          <Text style={st.toastText}>{t('✓ Lecture de ta main gardée dans « Mes lectures »')}</Text>
          <View style={st.toastRow}>
            <Text style={st.toastLink} accessibilityRole="button" onPress={() => { setPalmSaved(false); router.push('/mes-lectures'); }}>
              {t('Voir')}
            </Text>
            <Text style={st.toastClose} accessibilityRole="button" onPress={() => setPalmSaved(false)}>
              {t('Fermer')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: space.md, backgroundColor: colors.night },
  msg: { fontFamily: fonts.body, color: colors.text, textAlign: 'center', fontSize: 15 },
  toast: {
    position: 'absolute', left: space.md, right: space.md, bottom: space.lg,
    backgroundColor: '#1d2238', borderColor: colors.gold, borderWidth: 1, borderRadius: 14, padding: space.md, gap: 8,
  },
  toastText: { fontFamily: fonts.bodyMedium, color: colors.text, fontSize: 15 },
  toastRow: { flexDirection: 'row', gap: 24 },
  toastLink: { fontFamily: fonts.bodyBold, color: colors.gold, fontSize: 15 },
  toastClose: { fontFamily: fonts.body, color: colors.muted, fontSize: 15 },
  loader: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.night },
});
