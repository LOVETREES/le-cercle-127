import { SitePage } from '../../components/SitePage';
import { Screen } from '../../components/ui';

// L'Oracle 127 (127 cartes, tirage) reprend la page mobile du site.
export default function Oracle() {
  return (
    <Screen scroll={false}>
      <SitePage path="/oracle-127/" />
    </Screen>
  );
}
