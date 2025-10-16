# Configuration Stripe - Paiement à la génération

Ce projet utilise Stripe pour implémenter un modèle de paiement "pay-per-generation" : **2€ par génération d'image**.

## 🔑 Variables d'environnement

Les variables suivantes doivent être configurées dans `.env.local` (local) et dans Vercel (production) :

```env
# Stripe (obligatoire)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de votre application (pour les redirections Stripe)
NEXT_PUBLIC_URL=http://localhost:3000  # En local
# NEXT_PUBLIC_URL=https://votre-app.vercel.app  # En production
```

## 📋 Flux de paiement

### 1. Création du projet (avec upload d'image)
- L'utilisateur upload une image et entre un prompt
- Le bouton "Générer (2€)" crée un projet dans la base de données avec `payment_status='pending'`
- Une session Stripe Checkout est créée avec le `project_id` dans les metadata
- L'utilisateur est redirigé vers Stripe pour payer

### 2. Paiement sur Stripe
- L'utilisateur entre ses coordonnées bancaires
- Si le paiement est accepté, Stripe envoie un webhook `checkout.session.completed`

### 3. Webhook de confirmation
- Le webhook `/api/webhooks/stripe` reçoit la confirmation
- La signature est vérifiée pour sécurité
- Le projet est mis à jour : `payment_status='paid'`, `status='pending'`

### 4. Génération de l'image
- L'utilisateur revient sur le dashboard
- Il voit un badge "✓ Payé" et un bouton "Générer maintenant"
- En cliquant, l'API `/api/generate` vérifie le paiement et lance la génération
- L'image est générée et enregistrée

## 🔧 Configuration du webhook Stripe

### En développement (local)

1. Installez Stripe CLI :
```bash
brew install stripe/stripe-cli/stripe
```

2. Connectez-vous à votre compte Stripe :
```bash
stripe login
```

3. Écoutez les webhooks localement (dans un terminal séparé) :
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

4. Récupérez le webhook secret affiché (commence par `whsec_...`) et mettez-le dans `.env.local` :
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. Pour tester un paiement :
```bash
stripe trigger checkout.session.completed
```

### En production (Vercel)

1. Allez sur votre Dashboard Stripe : https://dashboard.stripe.com/webhooks

2. Cliquez sur "Add endpoint"

3. Configurez :
   - **URL du endpoint** : `https://votre-app.vercel.app/api/webhooks/stripe`
   - **Description** : "Production webhook for AI image generation"
   - **Événements à écouter** : Sélectionnez `checkout.session.completed`

4. Une fois créé, cliquez sur votre webhook et révélez le "Signing secret" (commence par `whsec_...`)

5. Ajoutez-le dans Vercel :
   - Allez dans Settings → Environment Variables
   - Ajoutez `STRIPE_WEBHOOK_SECRET` avec la valeur du signing secret

6. Redéployez votre application pour que la variable soit prise en compte

## 🔒 Sécurité

### Vérifications implémentées :

1. **Signature du webhook** : Chaque webhook est vérifié avec `stripe.webhooks.constructEvent()`
2. **User ownership** : L'API vérifie que `project.user_id === auth.uid()`
3. **Payment status** : L'API `/api/generate` refuse les projets non payés (status 402)
4. **Metadata validation** : Le webhook vérifie que `project_id` et `user_id` sont présents

### Points critiques :

- ⚠️ Le webhook `/api/webhooks/stripe` est **public** (pas de middleware auth) car Stripe doit y accéder
- ✅ La sécurité est assurée par la vérification de la signature cryptographique
- ✅ Tous les autres endpoints nécessitent un token Bearer valide

## 🧪 Test du flux complet

### 1. En local :
```bash
# Terminal 1 : Lancer l'app
npm run dev

# Terminal 2 : Écouter les webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### 2. Dans le navigateur :
1. Créez un compte / Connectez-vous
2. Uploadez une image et entrez un prompt
3. Cliquez sur "Générer (2€)"
4. Sur Stripe Checkout, utilisez la carte de test : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
5. Validez le paiement
6. Vous êtes redirigé vers le dashboard
7. Cliquez sur "Générer maintenant" sur votre projet payé
8. L'image est générée !

## 📊 Tarification

- **Prix par génération** : 2,00 EUR
- Défini dans `src/lib/stripe.ts` :
  ```typescript
  export const PRICE_PER_GENERATION = 2.00;
  export const PRICE_IN_CENTS = 200;
  ```

Pour modifier le prix, changez ces constantes et redéployez.

## 🐛 Débogage

### Logs utiles :
- `✅ Project created: <id>` : Projet créé avec succès
- `✅ Stripe checkout session created: <session_id>` : Session Stripe créée
- `💰 Payment successful for session: <session_id>` : Paiement reçu
- `✅ Project updated successfully: <id>` : Projet marqué comme payé
- `✅ Project verified and paid: <id>` : Génération autorisée

### Erreurs communes :
- `❌ Webhook signature verification failed` : Le `STRIPE_WEBHOOK_SECRET` est incorrect
- `❌ Payment not completed` : Le projet n'est pas marqué comme payé (webhook pas reçu ?)
- `❌ User not owner of project` : Tentative d'accès à un projet d'un autre utilisateur
- `❌ Missing metadata in session` : Le `project_id` ou `user_id` n'a pas été enregistré

## 📚 Ressources

- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Cartes de test Stripe](https://stripe.com/docs/testing#cards)
