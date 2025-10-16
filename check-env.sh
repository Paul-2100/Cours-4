#!/bin/bash

# Script de vérification des variables d'environnement
# À exécuter localement pour vérifier que tout est configuré

echo "🔍 Vérification des variables d'environnement..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_env() {
  if [ -z "${!1}" ]; then
    echo -e "${RED}❌ $1 - MANQUANTE${NC}"
    return 1
  else
    # Afficher seulement les 20 premiers caractères
    value="${!1}"
    short_value="${value:0:20}..."
    echo -e "${GREEN}✅ $1${NC} - ${short_value}"
    return 0
  fi
}

# Charger le fichier .env.local s'il existe
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
  echo "📄 Fichier .env.local chargé"
  echo ""
else
  echo -e "${RED}❌ Fichier .env.local non trouvé${NC}"
  echo ""
fi

# Vérifier chaque variable
missing=0

echo "Variables publiques (côté client):"
check_env "NEXT_PUBLIC_SUPABASE_URL" || ((missing++))
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" || ((missing++))

echo ""
echo "Variables privées (côté serveur):"
check_env "SUPABASE_URL" || ((missing++))
check_env "SUPABASE_SERVICE_ROLE_KEY" || ((missing++))

echo ""
echo "API externe:"
check_env "REPLICATE_API_TOKEN" || ((missing++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $missing -eq 0 ]; then
  echo -e "${GREEN}✅ Toutes les variables sont configurées !${NC}"
  echo ""
  echo "📋 Prochaines étapes:"
  echo "1. Copiez ces variables sur Vercel (Settings → Environment Variables)"
  echo "2. Assurez-vous de cocher Production, Preview, et Development"
  echo "3. Redéployez votre projet"
else
  echo -e "${RED}❌ $missing variable(s) manquante(s)${NC}"
  echo ""
  echo "📋 Actions à faire:"
  echo "1. Complétez votre fichier .env.local"
  echo "2. Consultez GUIDE-VERCEL-VARIABLES.md pour savoir où trouver les valeurs"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
