#!/bin/bash

# Script pour tester les webhooks Stripe en local

echo "🔧 Configuration des webhooks Stripe pour le développement local"
echo ""

# Vérifier si Stripe CLI est installé
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI n'est pas installé"
    echo ""
    echo "Pour l'installer sur macOS:"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "Autres OS: https://stripe.com/docs/stripe-cli#install"
    exit 1
fi

echo "✅ Stripe CLI est installé"
echo ""

# Vérifier la connexion à Stripe
echo "🔑 Vérification de la connexion à Stripe..."
if ! stripe --version &> /dev/null; then
    echo "❌ Erreur lors de la vérification de Stripe CLI"
    exit 1
fi

echo "✅ Stripe CLI fonctionnel"
echo ""

# Démarrer le forwarding
echo "🚀 Démarrage du forwarding des webhooks..."
echo ""
echo "📝 IMPORTANT: Copiez le webhook secret (whsec_...) qui s'affichera"
echo "   et collez-le dans votre fichier .env.local pour STRIPE_WEBHOOK_SECRET"
echo ""
echo "🌐 Les webhooks seront forwardés vers: http://localhost:3001/api/webhooks/stripe"
echo ""
echo "⚡ Événements qui seront capturés:"
echo "   - checkout.session.completed (paiement réussi)"
echo "   - checkout.session.async_payment_succeeded"
echo "   - checkout.session.async_payment_failed"
echo ""
echo "-------------------------------------------------------------------"
echo ""

# Lancer le forwarding (ajustez le port si nécessaire)
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe

# Note: Cette commande bloque le terminal. Utilisez Ctrl+C pour arrêter.
