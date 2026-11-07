import { Redirect, Stack, useLocalSearchParams, type Href } from 'expo-router';

import { SitePage } from '../components/SitePage';
import { nativeRouteFor, siteUrl } from '../lib/webpage';

// Page générique : affiche une page de la version mobile du site.
export default function Page() {
  const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>();
  const native = nativeRouteFor(siteUrl(path ?? '/'));
  if (native) return <Redirect href={native as Href} />;
  return (
    <>
      <Stack.Screen options={{ title: title ?? '' }} />
      <SitePage path={path ?? '/'} />
    </>
  );
}
