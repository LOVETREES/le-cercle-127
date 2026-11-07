import { router } from 'expo-router';
import { Body, Card, OutlineButton, Screen, Title } from '../components/ui';

export default function Confidentialite() {
  return (
    <Screen>
      <Title>Vos données et vos choix</Title>
      <Card>
        <Title size={24}>Sur cet appareil</Title>
        <Body>Sans compte, les récits écrits restent dans le Grimoire local. Les enregistrements vocaux restent uniquement sur cet appareil, même avec un compte. Vous pouvez supprimer un rêve ou un audio depuis son écran.</Body>
      </Card>
      <Card>
        <Title size={24}>Avec un compte</Title>
        <Body>Votre adresse e-mail, votre identifiant et vos récits sont utilisés par lecercle127.com pour gérer votre espace et synchroniser le Grimoire écrit. « Supprimer mon compte » dans les réglages demande l’effacement au serveur et nettoie les données locales de l’app. Les délais éventuels des sauvegardes de l’hébergeur sont décrits dans la politique complète.</Body>
      </Card>
      <Card>
        <Title size={24}>Une lecture d’Oni</Title>
        <Body>Les demandes ne sont proposées que lorsque le serveur active ce service. Votre accord est demandé pour chaque rêve. La demande passe par Make, qui reçoit l’identifiant du rêve et le jeton de votre session pour retrouver le récit. OpenAI traite ensuite le récit et son contexte pour préparer une lecture relue par une personne. Les audios de ce carnet ne sont pas transmis.</Body>
        <Body>Selon les conditions standard de l’API OpenAI, les données ne servent pas à entraîner les modèles par défaut. Des journaux techniques peuvent être conservés selon les réglages et conditions du prestataire. Vous pouvez refuser sans perdre l’accès à votre journal.</Body>
      </Card>
      <Card>
        <Title size={24}>Micro, notifications et pages du site</Title>
        <Body>Le micro est demandé au démarrage d’un enregistrement. Les rappels sont facultatifs et programmés localement. Les pages provenant du site peuvent charger leurs propres ressources et outils de mesure : consultez les choix de cookies et la politique complète avant de les utiliser.</Body>
      </Card>
      <OutlineButton label="Ouvrir la politique complète" onPress={() => router.push({ pathname: '/page', params: { path: '/confidentialite-le-cercle-127/', title: 'Politique complète', fullPrivacy: '1' } })} />
      <OutlineButton label="Gérer mes données" onPress={() => router.push('/compte')} />
      <Body muted>Responsable : Le Cercle 127 · contact@lecercle127.com. La démonstration locale utilise des exemples fictifs séparés de vos données.</Body>
    </Screen>
  );
}
