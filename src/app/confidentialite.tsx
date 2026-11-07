import { router } from 'expo-router';
import { Body, Card, OutlineButton, Screen, Title } from '../components/ui';
import { t } from '../i18n';

export default function Confidentialite() {
  return (
    <Screen>
      <Title>{t('Vos données et vos choix')}</Title>
      <Card>
        <Title size={24}>{t('Sur cet appareil')}</Title>
        <Body>{t('Sans compte, les récits écrits restent dans le Grimoire local. Le journal de vérification et les fichiers audio sont gardés sur cet appareil, sans synchronisation. Vous pouvez supprimer une note, un rêve ou un audio depuis son écran.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Transformer la voix en texte')}</Title>
        <Body>{t('La dictée et la transcription des audios sur iPhone utilisent le service vocal du système. La reconnaissance sur l’appareil est privilégiée lorsqu’elle est disponible. Sinon, votre accord est demandé avant de recourir au service du téléphone ou du navigateur, qui peut traiter l’audio chez Apple, Google ou son fournisseur. Le micro et la reconnaissance vocale nécessitent vos autorisations. Aucun audio n’est envoyé à Make ou OpenAI par ces fonctions.')}</Body>
        <Body>{t('Le texte reconnu peut être corrigé puis gardé dans le Grimoire. Seul ce texte est synchronisé si vous êtes connecté·e.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Avec un compte')}</Title>
        <Body>{t('Votre adresse e-mail, votre identifiant et vos récits sont utilisés par lecercle127.com pour gérer votre espace et synchroniser le Grimoire écrit. « Supprimer mon compte » dans les réglages demande l’effacement au serveur et nettoie les données locales de l’app. Les délais éventuels des sauvegardes de l’hébergeur sont décrits dans la politique complète.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Une lecture d’Oni')}</Title>
        <Body>{t('Les demandes ne sont proposées que lorsque le serveur active ce service. Votre accord est demandé pour chaque rêve. La demande passe par Make, qui reçoit l’identifiant du rêve et le jeton de votre session pour retrouver le récit. OpenAI traite ensuite le récit et son contexte pour préparer une lecture relue par une personne. Les audios de ce carnet ne sont pas transmis.')}</Body>
        <Body>{t('Selon les conditions standard de l’API OpenAI, les données ne servent pas à entraîner les modèles par défaut. Des journaux techniques peuvent être conservés selon les réglages et conditions du prestataire. Vous pouvez refuser sans perdre l’accès à votre journal.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Micro, notifications et pages du site')}</Title>
        <Body>{t('Le micro est demandé au démarrage d’un enregistrement. Les rappels sont facultatifs et programmés localement. Les pages intégrées retirent le bandeau cookies et les scripts de suivi connus : les mesures facultatives ne sont pas acceptées automatiquement. Les ressources du site nécessitent Internet. La politique complète reste accessible ci-dessous.')}</Body>
      </Card>
      <OutlineButton label={t('Ouvrir la politique complète')} onPress={() => router.push({ pathname: '/page', params: { path: '/confidentialite-le-cercle-127/', title: 'Politique complète', fullPrivacy: '1' } })} />
      <OutlineButton label={t('Gérer mes données')} onPress={() => router.push('/compte')} />
      <Body muted>{t('Responsable : Le Cercle 127 · contact@lecercle127.com. La démonstration locale utilise des exemples fictifs séparés de vos données.')}</Body>
    </Screen>
  );
}
