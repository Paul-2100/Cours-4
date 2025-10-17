# 🚀 ACTIONS REQUISES POUR RÉPARER LES WEBHOOKS STRIPE

## ⚠️ Problème actuel
- ✅ Le paiement Stripe fonctionne
- ❌ Le webhook `checkout.session.completed` n'est jamais reçu
- ❌ Le statut reste bloqué à `pending_payment`
- ❌ L'utilisateur ne peut pas générer son image

---

## ✅ SOLUTION EN 4 ÉTAPES

### 📍 ÉTAPE 1 : Créer le webhook sur Stripe (5 min)

1. Ouvrez https://dashboard.stripe.com/test/webhooks
2. Cliquez sur **"Add endpoint"**
3. Remplissez :
   - **Endpoint URL** : `https://cours-4.vercel.app/api/webhooks/stripe`
   - **Description** : `Production webhook`
   - **Events** : Sélectionnez `checkout.session.completed`
4. Cliquez sur **"Add endpoint"**

### 📍 ÉTAPE 2 : Copier le Webhook Secret

1. Dans la liste des webhooks, cliquez sur celui créé
2. Cliquez sur **"Reveal"** dans "Signing secret"
3. **Copiez le secret** (commence par `whsec_...`)

### 📍 ÉTAPE 3 : Mettre à jour les variables Vercel (3 min)

1. Ouvrez https://vercel.com/paul-2100s-projects/cours-4/settings/environment-variables

2. **Mettez à jour 2 variables :**

   **Variable 1 : STRIPE_WEBHOOK_SECRET**
   - Cliquez sur "Edit"
   - Collez le nouveau secret (de l'étape 2)
   - Save

   **Variable 2 : NEXT_PUBLIC_URL**
   - Vérifiez qu'elle contient : `https://cours-4.vercel.app`
   - ❌ PAS : `https://cours-4.vercel.app/dashboard`
   - Si incorrecte, éditez et corrigez

### 📍 ÉTAPE 4 : Redéployer (1 min)

**Depuis votre terminal :**
```bash
cd "/Users/paul_michel/Desktop/AIinProd/Cours 4"
git add -A
git commit -m "Fix Stripe webhook configuration"
git push origin main
```

**OU depuis Vercel Dashboard :**
1. https://vercel.com/paul-2100s-projects/cours-4
2. Onglet "Deployments"
3. Cliquez ⋮ sur le dernier déploiement
4. "Redeploy"

---

## 🧪 TEST APRÈS CONFIGURATION

### Test 1 : Webhook depuis Stripe Dashboard

1. https://dashboard.stripe.com/test/webhooks
2. Cliquez sur votre webhook
3. Onglet **"Send test webhook"**
4. Sélectionnez `checkout.session.completed`
5. Click **"Send test webhook"**
6. Vérifiez que vous voyez un ✅ (succès)

### Test 2 : Vrai paiement

1. Allez sur https://cours-4.vercel.app/dashboard
2. Uploadez une image et entrez un prompt
3. Cliquez **"Générer (2€)"**
4. Carte de test : `4242 4242 4242 4242`
5. Après paiement, retour dashboard
6. ✅ Le projet doit avoir un badge **"✓ Payé"**
7. ✅ Un bouton **"Générer maintenant"** doit apparaître

---

## 🔍 DÉBOGAGE SI ÇA NE MARCHE PAS

### Vérifier les logs Vercel

https://vercel.com/paul-2100s-projects/cours-4/logs

**Logs attendus (succès) :**
```
✅ Webhook verified: checkout.session.completed
💰 Payment successful for session: cs_test_xxx
📦 Metadata: { project_id: 'xxx', user_id: 'yyy' }
✅ Project updated successfully: xxx
```

**Erreurs possibles :**

| Erreur dans les logs | Cause | Solution |
|---------------------|-------|----------|
| `No signatures found matching` | Mauvais webhook secret | Recommencez étape 2 et 3 |
| `STRIPE_WEBHOOK_SECRET not configured` | Variable manquante | Vérifiez étape 3 |
| 404 ou route not found | URL incorrecte | Vérifiez `/api/webhooks/stripe` |
| Aucun log | Webhook pas configuré | Recommencez étape 1 |

---

## ✅ CHECKLIST FINALE

Avant de tester, assurez-vous que :

- [ ] Webhook créé sur Stripe Dashboard
- [ ] URL = `https://cours-4.vercel.app/api/webhooks/stripe` ✅
- [ ] Événement `checkout.session.completed` sélectionné ✅
- [ ] Secret webhook copié (commence par `whsec_...`) ✅
- [ ] Variable `STRIPE_WEBHOOK_SECRET` sur Vercel mise à jour ✅
- [ ] Variable `NEXT_PUBLIC_URL` = `https://cours-4.vercel.app` (sans `/dashboard`) ✅
- [ ] Application redéployée (git push ou manual redeploy) ✅
- [ ] Test webhook Stripe Dashboard → ✅ Success
- [ ] Test paiement réel → Statut = `paid` → Bouton "Générer maintenant" visible ✅

---

## 🎉 RÉSULTAT ATTENDU

Après configuration complète :

1. ✅ Utilisateur paie 2€ sur Stripe
2. ✅ Stripe envoie webhook → Vercel
3. ✅ Vercel reçoit et vérifie la signature
4. ✅ Base de données mise à jour : `payment_status = 'paid'`
5. ✅ Utilisateur voit badge "✓ Payé"
6. ✅ Bouton "Générer maintenant" apparaît
7. ✅ Clic → Génération de l'image IA
8. ✅ Image affichée et téléchargeable

**Le problème du statut bloqué sera résolu ! 🚀**
