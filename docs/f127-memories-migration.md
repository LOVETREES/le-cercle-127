# Migration de la table `f127_memories` (pont F127 1.4.0)

## Problème
Sur le serveur, `{prefix}f127_memories` garde des colonnes d'un ancien schéma :
`uuid CHAR(36) NOT NULL UNIQUE` sans défaut, `user_id BIGINT NOT NULL` sans défaut,
`updated_at DATETIME NOT NULL` sans défaut. Le Framework 127 Runtime 0.3.x n'écrit pas
ces colonnes. En mode SQL non strict, MySQL met `uuid = ''` ; une ligne avec `uuid = ''`
existait déjà, donc toute validation de souvenir (admin Framework comprise) échouait
en silence (doublon sur l'index unique `uuid`).

## Migration appliquée (une seule fois, option `c127_f127_memories_schema_v1`)
```sql
UPDATE {prefix}f127_memories SET uuid = UUID() WHERE uuid = '' OR uuid IS NULL;
ALTER TABLE {prefix}f127_memories MODIFY uuid CHAR(36) NULL DEFAULT NULL;
ALTER TABLE {prefix}f127_memories MODIFY user_id BIGINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE {prefix}f127_memories MODIFY updated_at DATETIME NULL DEFAULT NULL;
```
Aucune ligne supprimée, aucune colonne retirée. L'index unique sur `uuid` est conservé
(MySQL autorise plusieurs `NULL`).

## Retour arrière
```sql
UPDATE {prefix}f127_memories SET uuid = UUID() WHERE uuid IS NULL;
UPDATE {prefix}f127_memories SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE {prefix}f127_memories MODIFY uuid CHAR(36) NOT NULL;
ALTER TABLE {prefix}f127_memories MODIFY user_id BIGINT UNSIGNED NOT NULL;
ALTER TABLE {prefix}f127_memories MODIFY updated_at DATETIME NOT NULL;
```
puis `delete_option('c127_f127_memories_schema_v1')` pour pouvoir rejouer la migration.

## Vérification
`GET /wp-json/c127-f127/v1/health` → `memory_schema.migration = "done"` et
`memory_schema.uuid_nullable = true`. « Garder » dans Mon Grimoire renvoie `path: "framework"`
quand la validation officielle du Framework réussit.
