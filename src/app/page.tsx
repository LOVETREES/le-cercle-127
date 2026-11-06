import { Stack, useLocalSearchParams } from 'expo-router';

import { SitePage } from '../components/SitePage';

// Page générique : affiche une page de la version mobile du site.
export default function Page() {
  const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: title ?? '' }} />
      <SitePage path={path ?? '/'} />
    </>
  );
}
