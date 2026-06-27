#!/bin/bash
# Convertit le template .pages en .docx via AppleScript (Pages.app)
# Usage: bash scripts/convert_template.sh

PAGES_FILE="public/templates/F5L_Contrat_Abonnement_Template.pages"
DOCX_FILE="public/templates/F5L_Contrat_Abonnement_Template.docx"

if [ ! -f "$PAGES_FILE" ]; then
  echo "❌ Template introuvable : $PAGES_FILE"
  echo "   → Copie le fichier .pages dans public/templates/ puis relance ce script."
  exit 1
fi

ABS_PAGES="$(pwd)/$PAGES_FILE"
ABS_DOCX="$(pwd)/$DOCX_FILE"

osascript <<EOF
tell application "Pages"
  set doc to open POSIX file "$ABS_PAGES"
  export doc to POSIX file "$ABS_DOCX" as Microsoft Word
  close doc saving no
end tell
EOF

if [ -f "$DOCX_FILE" ]; then
  echo "✅ Template converti : $DOCX_FILE"
else
  echo "❌ Conversion échouée. Ouvre Pages manuellement, Fichier → Exporter → Word → Enregistre dans public/templates/"
fi
