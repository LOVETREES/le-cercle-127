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
        <Body>{t('Les demandes ne sont proposées que lorsque le serveur active ce service. Votre accord est demandé pour chaque rêve. La demande passe par Make, qui reçoit l’identifiant du rêve et le jeton de votre session pour retrouver le récit. OpenAI traite ensuite le récit et son contexte pour préparer une lecture. Une lecture par jour s’affiche aussitôt et une personne du Cercle la relit ensuite ; les suivantes sont relues avant de vous parvenir. Si un récit laisse paraître une détresse, Oni n’interprète pas : elle oriente vers le 3114 et une personne du Cercle est prévenue en priorité. Les audios de ce carnet ne sont pas transmis.')}</Body>
        <Body>{t('Selon les conditions standard de l’API OpenAI, les données ne servent pas à entraîner les modèles par défaut. Des journaux techniques peuvent être conservés selon les réglages et conditions du prestataire. Vous pouvez refuser sans perdre l’accès à votre journal.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Ce qui reste sur le téléphone')}</Title>
        <Body>{t('Le journal intime, le profil « Faisons connaissance », la date, l’heure et le lieu de naissance du Labyrinthe vivant, les tirages de l’Oracle gardés, les gestes accomplis et les émotions de Naïa sont gardés sur cet appareil et ne sont pas envoyés. Le ciel de naissance est calculé sur le téléphone. Chaque élément peut être modifié ou effacé depuis son écran.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Ce que vous joignez à un rêve')}</Title>
        <Body>{t('Les réponses facultatives aux questions d’Oni et, si vous l’avez accepté, quelques lignes de votre profil (prénom choisi, tranche d’âge, domaines de vie, ce qui compte en ce moment) sont ajoutées au récit sous « Précisions pour Oni ». Elles suivent alors le rêve : synchronisées avec votre Grimoire si vous êtes connecté·e, et lues par Oni seulement si vous demandez une lecture.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Bilans du Labyrinthe dans votre compte (sur accord)')}</Title>
        <Body>{t('Si vous cochez « Retrouver mes bilans entre l’application et le site », vos bilans de la semaine sont gardés dans votre compte lecercle127.com : uniquement la semaine et vos sept réponses de 0 à 4, jamais votre naissance ni un texte. Décochez pour arrêter ; « Effacer mes bilans de mon compte » les supprime du serveur, et la suppression du compte les efface aussi.')}</Body>
      </Card>
      <Card>
        <Title size={24}>{t('Oracle : hasard quantique (facultatif)')}</Title>
        <Body>{t('Désactivée par défaut, cette option demande quelques octets aléatoires au générateur quantique public de l’université Humboldt de Berlin (lfdr.de). La requête ne contient ni votre question, ni vos lames, ni aucun identifiant ; comme toute connexion, elle laisse voir l’adresse IP au serveur. Sans réponse, le tirage se fait avec le hasard du téléphone seul. La simulation des sept qubits est entièrement locale.')}</Body>
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
