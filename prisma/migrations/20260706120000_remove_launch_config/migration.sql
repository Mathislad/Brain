-- Chantier 3 : suppression de la fonctionnalité « Lancement » (lanceur de
-- sessions de travail). La table LaunchConfig n'est plus utilisée par le code.
-- Destructif et assumé : les configurations de sessions sont perdues.

DROP TABLE IF EXISTS "LaunchConfig";
