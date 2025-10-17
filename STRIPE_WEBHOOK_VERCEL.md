# 🔧 Configuration du Webhook Stripe pour Vercel (Production)

## ❌ Problème
Le paiement fonctionne mais le statut reste en `pending_payment` car le webhook `checkout.session.completed` n'est jamais reçu par votre application.

## ✅ Solution : Configurer le webhook dans Stripe Dashboard

### Étape 1 : Créer le webhook endpoint dans Stripe

1. **Allez sur votre Stripe Dashboard**
   - URL : https://dashboard.stripe.com/test/webhooks
   - (Utilisez le mode TEST pour les tests)

2. **Cliquez sur "Add endpoint"**

3. **Configurez l'endpoint :**
   
   **URL du endpoint :**
   ```
   https://cours-4.vercel.app/api/webhooks/stripe
   ```
   
   **Description :**
   ```
   Production webhook for payment confirmation
   ```
   
   **Événements à écouter :**
   - Cliquez sur "Select events"
   - Recherchez et sélectionnez : `checkout.session.completed`
   - Vous pouvez aussi ajouter (optionnel) :
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`

4. **Cliquez sur "Add endpoint"**

### Étape 2 : Récupérer le Webhook Secret

1. **Dans la liste des webhooks**, cliquez sur celui que vous venez de créer

2. **Cliquez sur "Reveal" dans la section "Signing secret"**

3. **Copiez le secret** (commence par `whsec_...`)
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Étape 3 : Mettre à jour la variable d'environnement sur Vercel

1. **Allez sur votre projet Vercel**
   - URL : https://vercel.com/paul-2100s-projects/cours-4/settings/environment-variables

2. **Trouvez la variable `STRIPE_WEBHOOK_SECRET`**

3. **Mettez à jour avec le nouveau secret** (celui que vous venez de copier)

4. **Assurez-vous qu'elle est disponible pour "Production, Preview, and Development"**

5. **Cliquez sur "Save"**

### Étape 4 : Redéployer l'application

**IMPORTANT** : Les variables d'environnement ne sont appliquées qu'au prochain déploiement !

**Option 1 - Redéploiement automatique (recommandé) :**
```bash
git add -A
git commit -m "Update Stripe webhook configuration"
git push origin main
```

**Option 2 - Redéploiement manuel :**
1. Allez sur https://vercel.com/paul-2100s-projects/cours-4
2. Onglet "Deployments"
3. Cliquez sur les 3 points (...) du dernier déploiement
4. Cliquez sur "Redeploy"

### Étape 5 : Tester le webhook

1. **Testez depuis Stripe Dashboard** (sans faire un vrai paiement)
   - Dans votre webhook → onglet "Send test webhook"
   - Événement : `checkout.session.completed`
   - Cliquez sur "Send test webhook"
   
2. **Vérifiez les logs Vercel**
   - https://vercel.com/paul-2100s-projects/cours-4/logs
   - Vous devriez voir :
     ```
     ✅ Webhook verified: checkout.session.completed
     💰 Payment successful for session: cs_test_...
     ```

3. **Testez avec un vrai paiement**
   - Créez un projet
   - Payez avec la carte de test : `4242 4242 4242 4242`
   - Le statut devrait passer à `paid` automatiquement

---

## 🔍 Vérification de la configuration actuelle

### Vérifier l'URL du webhook
```
✅ Correcte : https://cours-4.vercel.app/api/webhooks/stripe
❌ Incorrecte : https://cours-4.vercel.app/dashboard/api/webhooks/stripe
```

### Vérifier les événements écoutés
```
✅ Minimum requis : checkout.session.completed
✅ Recommandé aussi :
   - checkout.session.async_payment_succeeded
   - checkout.session.async_payment_failed
```

---

## 🐛 Débogage

### Logs à vérifier sur Vercel

**Si le webhook ne fonctionne pas**, regardez les logs sur :
https://vercel.com/paul-2100s-projects/cours-4/logs

**Logs attendus quand ça marche :**
```
✅ Webhook verified: checkout.session.completed
💰 Payment successful for session: cs_test_a1LtcvhP5VeJsTh7Fc0YIIt...
📦 Metadata: { project_id: 'xxx', user_id: 'yyy' }
✅ Project updated successfully: xxx
🚀 Project ready for generation
```

**Erreurs possibles :**

**Erreur 1 : Signature invalide**
```
❌ Webhook signature verification failed: No signatures found matching the expected signature
```
→ Le `STRIPE_WEBHOOK_SECRET` sur Vercel ne correspond pas au webhook

**Erreur 2 : Secret non configuré**
```
❌ STRIPE_WEBHOOK_SECRET not configured
```
→ Variable d'environnement manquante ou mal nommée sur Vercel

**Erreur 3 : 404 Not Found**
→ L'URL du webhook est incorrecte (vérifiez `/api/webhooks/stripe` sans `/dashboard`)

---

## 📝 Checklist finale

- [ ] Webhook créé sur https://dashboard.stripe.com/test/webhooks
- [ ] URL : `https://cours-4.vercel.app/api/webhooks/stripe` (sans `/dashboard`)
- [ ] Événement : `checkout.session.completed` sélectionné
- [ ] Webhook secret copié (commence par `whsec_...`)
- [ ] Variable `STRIPE_WEBHOOK_SECRET` mise à jour sur Vercel
- [ ] Application redéployée (push git ou redeploy manuel)
- [ ] Test webhook depuis Stripe Dashboard → ✅ Success
- [ ] Test paiement réel → Statut passe de `pending_payment` à `paid` → ✅

---

## 🚨 Note importante sur NEXT_PUBLIC_URL

J'ai remarqué que votre `.env.local` contient :
```
NEXT_PUBLIC_URL=https://cours-4.vercel.app/dashboard
```

Cela va créer des URLs incorrectes ! Corrigez sur Vercel :

**Variable Vercel à corriger :**
- `NEXT_PUBLIC_URL` = `https://cours-4.vercel.app` (SANS `/dashboard`)

Puis redéployez l'application.

---

## ✅ Une fois configuré

Après configuration, le flux sera :

1. Utilisateur paie sur Stripe Checkout
2. ✅ Stripe envoie `checkout.session.completed` → `https://cours-4.vercel.app/api/webhooks/stripe`
3. ✅ Webhook vérifie la signature
4. ✅ Projet mis à jour : `payment_status = 'paid'`, `status = 'pending'`
5. ✅ Utilisateur redirigé vers dashboard
6. ✅ Bouton "Générer maintenant" visible
7. ✅ Génération autorisée

Le statut ne restera plus bloqué en `pending_payment` ! 🎉
