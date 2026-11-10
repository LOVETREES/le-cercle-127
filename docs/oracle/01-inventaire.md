# Oracle 127 — Étape 1 : ce qui tourne réellement en production

Relevé du 10/11/2026 sur https://lecercle127.com/oracle-127/ (page WordPress n° 17454, modifiée le 29/10/2026).
L'onglet **Oracle** de l'application affiche cette page dans une WebView (`src/app/(tabs)/oracle.tsx` → `SitePage`).

## Les trois couches présentes sur la page

| Couche | Où | Rôle | Statut |
|---|---|---|---|
| **Le Reliquaire** (`#c127t`) | Script et styles écrits **dans le contenu de la page 17454** (≈ 62 Ko de JS en ligne) | Le moteur **visible** : cartes du jour / mois / année, rituel en 5 étapes (Seuil, Portes, Rencontre, Dialogue, Cercle), portes Corne / Ivoire, passages Seuil · Dialogue · Chemin · Labyrinthe, sceau rejouable | **Utilisé** |
| **Oracle vivant** (`site-wordpress/c127-oracle-vivant`, v1.1.2) | Extension de ce dépôt, chargée dans le paquet Boost | Animations, badges « Nouvelle lame », collection « Lames découvertes », son, lien avec la lecture de la main, message `c127-oracle-reveal` vers l'app | **Utilisé** (couche par-dessus) |
| **Fusion** (thème Onirologue 7.4.3.1, `Oracle127FusionConfig`) | Données injectées par le thème (≈ 446 Ko) | Ancien moteur : 127 cartes riches (message, voix, ombre, passage, planète, métal, note, pierre, plante, animal…) | **Chargé mais pas affiché** : 446 Ko téléchargés pour rien sur mobile |

Images : `wp-content/plugins/oracle-127-2.9.1-images/assets/images/edition-127/card-001.jpg … card-127.jpg` (700 × 1200), sauf 20 lames qui ont une image personnalisée.

## Les 127 lames canoniques

- **Une lame = une combinaison non vide des 7 Sœurs** (masque de 7 bits : Oni 1, Alka 2, Naïa 4, Terra 8, Ignis 16, Astria 32, Irma 64). 2⁷ − 1 = 127 : chaque combinaison existe une fois et une seule (vérifié).
- Les **numéros et les Sœurs** du Reliquaire et de Fusion **concordent pour les 127 lames**.
- Les **noms divergent** : seulement 6 identiques au nom Fusion. Par rapport au « titre poétique » Fusion : 9 identiques, 59 en sont le début (« Le Désert » / « Le Désert sans nord »), 59 différents (« La Lucidité » / « La Nuit sans songe »).
- Le Reliquaire porte une **définition courte pour chacune des 127 lames** ; Fusion porte les textes longs (voix, ombre, passage…).
- Données extraites : `src/lib/oracle/lames.json` (numéro, nom, masque, Sœurs, définition, image) — **référence proposée : les noms du Reliquaire**, ceux que les gens voient aujourd'hui.

## Le tirage actuel (déjà solide)

- **Sceau** : SHA-256 de (intention + date + paquet + 8 octets de `crypto.getRandomValues`), 4 premiers octets → sceau hexadécimal.
- **Paquet** : mélange de Fisher-Yates piloté par mulberry32 initialisé par le sceau, **sans biais** (tirage par rejet). Un sceau rejoue exactement le même tirage.
- **Cartes du jour / mois / année** : hachage FNV-1a de la date de Paris → la même carte pour tout le monde ce jour-là.
- Limite : trois tirages par jour.

## Ce qui rend l'écran « indigeste » (relevé sur iPhone)

1. Les lames entières (cadre, titre, illustration, 5 portraits, planètes, légende) affichées à ⅓ de largeur d'écran : illisibles.
2. Badges « Nouvelle lame » / « Déjà rencontrée · ×2 » qui débordent et se chevauchent.
3. Le nom de la lame répété (dans la lame, sous la lame, dans la lecture, dans l'arche du paquet).
4. Six blocs de texte d'un coup sous les trois cartes.
5. Bouton « Mélanger le paquet » qui chevauche sa légende ; une capsule vide (série de jours masquée mais forcée à l'affichage).
6. Page « Les 127 portes » : miniatures de lames illisibles et liens « Rêver de… » répétés de porte en porte.

## Annexe : correspondance des noms

| N° | Reliquaire (affiché) | Sœurs | Fusion · nom | Fusion · titre poétique |
|---|---|---|---|---|
| 001 | Le Seuil | Irma | La Porte du Songe | Le Seuil |
| 002 | L’Étoile intérieure | Astria | Le Miroir Noir | L’Étoile intérieure |
| 003 | L’Étoile au carrefour | Astria · Irma | Le Noyau du Vrai Soi | L’Étoile au carrefour |
| 004 | La Première Flamme | Ignis | La Rivière Intérieure | La Première Flamme |
| 005 | Le Feu du passage | Ignis · Irma | La Coupe des Marées | Le Feu du passage |
| 006 | La Flamme qui montre le nord | Ignis · Astria | L’Écho du Cœur | La Flamme qui montre le nord |
| 007 | Le Triangle vivant | Ignis · Astria · Irma | La Racine | La Flamme qui ouvre la route |
| 008 | La Racine | Terra | La Pierre-Mémoire | La Racine |
| 009 | Le Pas sur la terre | Terra · Irma | Le Corps du Monde | Le Pas sur la terre |
| 010 | La Racine & horizon | Terra · Astria | La Braise | La Racine et l’horizon |
| 011 | Le Triangle vivant | Terra · Astria · Irma | Le Creuset | La Pierre sous l’étoile |
| 012 | La Forge | Terra · Ignis | La Mue | La Braise sous la pierre |
| 013 | Le Franchissement | Terra · Ignis · Irma | L’Étoile-Seuil | La Braise du seuil |
| 014 | L’Ascension | Terra · Ignis · Astria | Le Collier d’Indra | Le Feu qui trouve le nord |
| 015 | Songe | Terra · Ignis · Astria · Irma | La Roue des Cycles | Le Vestibule de braise |
| 016 | La Source sensible | Naïa | Le Fil d’Or | La Source sensible |
| 017 | Le Gué | Naïa · Irma | Le Tissage Invisible | Le Courant au carrefour |
| 018 | Le Courant | Naïa · Astria | La Constellation des Liens | La Marée des étoiles |
| 019 | La Navigation | Naïa · Astria · Irma | Le Carrefour | La Barque et l’étoile |
| 020 | L’Alchimie | Naïa · Ignis | La Balance des Possibles | Le Feu sous l’eau |
| 021 | La Traversée | Naïa · Ignis · Irma | La Porte de Corne | La Vapeur du passage |
| 022 | La Transmutation | Naïa · Ignis · Astria | Graine qui veille | La Brume incandescente |
| 023 | L’Antichambre | Naïa · Ignis · Astria · Irma | Source qui veille | L’Antichambre flottante |
| 024 | La Rive | Naïa · Terra | Écorce qui veille | La Rivière trouve sa rive |
| 025 | La Passe | Naïa · Terra · Irma | Souffle qui veille | La Rive du premier pas |
| 026 | La Vallée | Naïa · Terra · Astria | Cendre qui veille | Le Delta sous les astres |
| 027 | La Chambre | Naïa · Terra · Astria · Irma | Étoile qui veille | La Chambre froide |
| 028 | Le Creuset | Naïa · Terra · Ignis | Fil qui veille | La Source et la forge |
| 029 | Le Portique | Naïa · Terra · Ignis · Irma | Pierre qui veille | Le Portique aveugle |
| 030 | Le Cloître | Naïa · Terra · Ignis · Astria | Rivière qui veille | Le Cloître sans issue |
| 031 | La Veille | Naïa · Terra · Ignis · Astria · Irma | Clé qui veille | La Veille sans songe |
| 032 | Le Lien | Alka | Graine qui revient | Le Fil invisible |
| 033 | La Clef | Alka · Irma | Source qui revient | Le Nœud du choix |
| 034 | Le Fil d’Ariane | Alka · Astria | Écorce qui revient | La Constellation des liens |
| 035 | Le Carrefour | Alka · Astria · Irma | Souffle qui revient | Le Fil vers l’étoile |
| 036 | Le Nœud | Alka · Ignis | Cendre qui revient | Le Nœud qui brûle |
| 037 | Le Dénouement | Alka · Ignis · Irma | Étoile qui revient | Le Nœud d’étincelles |
| 038 | La Quête | Alka · Ignis · Astria | Fil qui revient | La Trame ardente |
| 039 | La Galerie | Alka · Ignis · Astria · Irma | Pierre qui revient | La Galerie des étincelles |
| 040 | Le Pont | Alka · Terra | Rivière qui revient | Les Racines reliées |
| 041 | La Jonction | Alka · Terra · Irma | Clé qui revient | Les Racines nouées |
| 042 | L’Itinéraire | Alka · Terra · Astria | Graine qui relie | Le Réseau des racines |
| 043 | Le Corridor | Alka · Terra · Astria · Irma | Source qui relie | Le Corridor de pierre |
| 044 | Le Façonnage | Alka · Terra · Ignis | Écorce qui relie | La Forge reliée |
| 045 | L’Escalier | Alka · Terra · Ignis · Irma | Souffle qui relie | L’Escalier de braise |
| 046 | La Rampe | Alka · Terra · Ignis · Astria | Cendre qui relie | La Rampe sans fin |
| 047 | L’Attente | Alka · Terra · Ignis · Astria · Irma | Étoile qui relie | L’Attente aride |
| 048 | La Confluence | Alka · Naïa | Fil qui relie | Le Fil sous l’eau |
| 049 | L’Alliance | Alka · Naïa · Irma | Pierre qui relie | Le Pont sur le courant |
| 050 | La Constellation | Alka · Naïa · Astria | Rivière qui relie | Les Liens de marée |
| 051 | Le Couloir | Alka · Naïa · Astria · Irma | Clé qui relie | Le Couloir des eaux |
| 052 | La Métamorphose | Alka · Naïa · Ignis | Graine qui transforme | La Trame et le remous |
| 053 | L’Arche | Alka · Naïa · Ignis · Irma | Source qui transforme | L’Arche sur l’abîme |
| 054 | La Voûte | Alka · Naïa · Ignis · Astria | Écorce qui transforme | La Voûte suspendue |
| 055 | Le Silence | Alka · Naïa · Ignis · Astria · Irma | Souffle qui transforme | Le Silence suspendu |
| 056 | L’Entrelacs | Alka · Naïa · Terra | Cendre qui transforme | Le Delta tissé |
| 057 | Le Parvis | Alka · Naïa · Terra · Irma | Étoile qui transforme | Le Parvis silencieux |
| 058 | Le Porche | Alka · Naïa · Terra · Astria | Fil qui transforme | Le Porche sans flamme |
| 059 | L’Obscurité | Alka · Naïa · Terra · Astria · Irma | Pierre qui transforme | L’Obscurité froide |
| 060 | L’Enceinte | Alka · Naïa · Terra · Ignis | Rivière qui transforme | L’Enceinte close |
| 061 | La Nuit | Alka · Naïa · Terra · Ignis · Irma | Clé qui transforme | La Nuit sans étoile |
| 062 | L’Immobilité | Alka · Naïa · Terra · Ignis · Astria | Graine qui protège | L’Immobilité close |
| 063 | La Lucidité | Alka · Naïa · Terra · Ignis · Astria · Irma | Source qui protège | La Nuit sans songe |
| 064 | L’Entrée | Oni | Écorce qui protège | Le Songe |
| 065 | La Porte | Oni · Irma | Souffle qui protège | Le Seuil du rêve |
| 066 | Le Signe | Oni · Astria | Cendre qui protège | La Carte des étoiles |
| 067 | La Vision | Oni · Astria · Irma | Étoile qui protège | Le Songe qui montre la voie |
| 068 | Le Réveil | Oni · Ignis | Fil qui protège | L’Étincelle dans la nuit |
| 069 | L’Initiation | Oni · Ignis · Irma | Pierre qui protège | L’Éveil de la braise |
| 070 | L’Éveil | Oni · Ignis · Astria | Rivière qui protège | La Comète du rêve |
| 071 | Le Souterrain | Oni · Ignis · Astria · Irma | Clé qui protège | Le Souterrain de braise |
| 072 | La Descente | Oni · Terra | Graine qui éclaire | Le Rêve prend racine |
| 073 | La Crypte | Oni · Terra · Irma | Source qui éclaire | Le Rêve enraciné |
| 074 | Le Sanctuaire | Oni · Terra · Astria | Écorce qui éclaire | La Racine sous les astres |
| 075 | Le Caveau | Oni · Terra · Astria · Irma | Souffle qui éclaire | Le Caveau sans flamme |
| 076 | La Caverne | Oni · Terra · Ignis | Cendre qui éclaire | La Braise du songe |
| 077 | La Faille | Oni · Terra · Ignis · Irma | Étoile qui éclaire | La Faille ardente |
| 078 | Le Puits | Oni · Terra · Ignis · Astria | Fil qui éclaire | Le Puits sans eau |
| 079 | L’Enracinement | Oni · Terra · Ignis · Astria · Irma | Pierre qui éclaire | L’Enracinement sec |
| 080 | L’Immersion | Oni · Naïa | Rivière qui éclaire | L’Eau du songe |
| 081 | Le Plongeon | Oni · Naïa · Irma | Clé qui éclaire | Le Songe au bord de l’eau |
| 082 | L’Intuition | Oni · Naïa · Astria | Graine qui appelle | Le Reflet des étoiles |
| 083 | La Nef | Oni · Naïa · Astria · Irma | Source qui appelle | La Nef des eaux |
| 084 | La Purification | Oni · Naïa · Ignis | Écorce qui appelle | Ce qui brûle sous l’eau |
| 085 | Le Temple | Oni · Naïa · Ignis · Irma | Souffle qui appelle | Le Temple noyé |
| 086 | L’Autel | Oni · Naïa · Ignis · Astria | Cendre qui appelle | L’Autel flottant |
| 087 | L’Absence | Oni · Naïa · Ignis · Astria · Irma | Étoile qui appelle | L’Absence flottante |
| 088 | La Source | Oni · Naïa · Terra | Fil qui appelle | La Source du songe |
| 089 | Le Refuge | Oni · Naïa · Terra · Irma | Pierre qui appelle | Le Refuge des sources |
| 090 | L’Abri | Oni · Naïa · Terra · Astria | Rivière qui appelle | L’Abri sous la pluie |
| 091 | La Retraite | Oni · Naïa · Terra · Astria · Irma | Clé qui appelle | La Retraite éteinte |
| 092 | L’Atelier | Oni · Naïa · Terra · Ignis | Graine qui traverse | L’Atelier sans plan |
| 093 | L’Hésitation | Oni · Naïa · Terra · Ignis · Irma | Source qui traverse | L’Hésitation sans cap |
| 094 | La Contemplation | Oni · Naïa · Terra · Ignis · Astria | Écorce qui traverse | La Contemplation dénouée |
| 095 | La Solitude | Oni · Naïa · Terra · Ignis · Astria · Irma | Souffle qui traverse | Les Fragments sans fil |
| 096 | Le Fil | Oni · Alka | Cendre qui traverse | Le Fil du rêve |
| 097 | L’Indice | Oni · Alka · Irma | Étoile qui traverse | Le Seuil tissé de songes |
| 098 | La Carte | Oni · Alka · Astria | Fil qui traverse | La Constellation rêvée |
| 099 | Le Défilé | Oni · Alka · Astria · Irma | Pierre qui traverse | Le Défilé des astres |
| 100 | Le Déchiffrement | Oni · Alka · Ignis | Rivière qui traverse | L’Étincelle tissée |
| 101 | La Brèche | Oni · Alka · Ignis · Irma | Clé qui traverse | La Brèche d’étincelles |
| 102 | L’Ouverture | Oni · Alka · Ignis · Astria | Graine qui apaise | L’Ouverture ardente |
| 103 | Le Repli | Oni · Alka · Ignis · Astria · Irma | Source qui apaise | Le Repli sans rive |
| 104 | L’Inscription | Oni · Alka · Terra | Écorce qui apaise | Les Racines du rêve |
| 105 | Le Portail | Oni · Alka · Terra · Irma | Souffle qui apaise | Le Portail de pierre |
| 106 | La Passerelle | Oni · Alka · Terra · Astria | Cendre qui apaise | La Passerelle sur le vide |
| 107 | La Suspension | Oni · Alka · Terra · Astria · Irma | Étoile qui apaise | La Suspension sans souffle |
| 108 | Le Tunnel | Oni · Alka · Terra · Ignis | Fil qui apaise | Le Tunnel sans étoile |
| 109 | L’Égarement | Oni · Alka · Terra · Ignis · Irma | Pierre qui apaise | L’Égarement sans cap |
| 110 | Le Doute | Oni · Alka · Terra · Ignis · Astria | Rivière qui apaise | Le Doute sans rive |
| 111 | La Sécheresse | Oni · Alka · Terra · Ignis · Astria · Irma | Clé qui apaise | La Rivière silencieuse |
| 112 | Le Miroir | Oni · Alka · Naïa | Graine qui choisit | La Trame des eaux |
| 113 | Le Dédale | Oni · Alka · Naïa · Irma | Source qui choisit | Le Dédale des eaux |
| 114 | Le Labyrinthe | Oni · Alka · Naïa · Astria | Écorce qui choisit | Le Labyrinthe sans issue |
| 115 | La Dépouille | Oni · Alka · Naïa · Astria · Irma | Souffle qui choisit | La Dépouille froide |
| 116 | Le Méandre | Oni · Alka · Naïa · Ignis | Cendre qui choisit | Le Méandre errant |
| 117 | Le Désert | Oni · Alka · Naïa · Ignis · Irma | Étoile qui choisit | Le Désert sans nord |
| 118 | La Clairière | Oni · Alka · Naïa · Ignis · Astria | Fil qui choisit | La Clairière sans bord |
| 119 | L’Ailleurs | Oni · Alka · Naïa · Ignis · Astria · Irma | Pierre qui choisit | Le Ciel sans sol |
| 120 | Le Cercle | Oni · Alka · Naïa · Terra | Rivière qui choisit | Le Cercle sans flamme |
| 121 | Le Repos | Oni · Alka · Naïa · Terra · Irma | Clé qui choisit | Le Repos sans flamme |
| 122 | Le Belvédère | Oni · Alka · Naïa · Terra · Astria | Le Belvédère | Le Belvédère immobile |
| 123 | L’Inertie | Oni · Alka · Naïa · Terra · Astria · Irma | L’Inertie | La Braise endormie |
| 124 | L’Avant-seuil | Oni · Alka · Naïa · Terra · Ignis | L’Avant-seuil | L’Avant-seuil sans nord |
| 125 | L’Errance | Oni · Alka · Naïa · Terra · Ignis · Irma | L’Errance | La Marche sans étoile |
| 126 | L’Indécision | Oni · Alka · Naïa · Terra · Ignis · Astria | L’Indécision | Le Carrefour immobile |
| 127 | La Sortie | Oni · Alka · Naïa · Terra · Ignis · Astria · Irma | La Sortie | La Sortie du Labyrinthe |