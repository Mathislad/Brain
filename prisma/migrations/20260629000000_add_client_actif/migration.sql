-- Migration isolée : ajout de la valeur CLIENT_ACTIF à l'enum ProspectStatus.
-- PostgreSQL interdit l'utilisation d'une valeur d'enum ajoutée dans la même
-- transaction que l'instruction ALTER TYPE. Cette migration doit être commitée
-- seule, avant toute migration qui consommerait CLIENT_ACTIF.

ALTER TYPE "ProspectStatus" ADD VALUE 'CLIENT_ACTIF';
