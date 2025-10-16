# 🚨 Résolution des problèmes de déploiement Vercel

## Erreur: "All checks have failed"

Si vous voyez cette erreur lors du déploiement sur Vercel, suivez ces étapes :

---

## ✅ Solution étape par étape

### 1. Vérifier les variables d'environnement

Le build échoue généralement parce que les **variables d'environnement ne sont pas configurées**.

#### Sur Vercel Dashboard :
1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. **Settings** → **Environment Variables**
4. Vérifiez que vous avez **LES 5 VARIABLES** suivantes :

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ REPLICATE_API_TOKEN
```

#### Si des variables manquent :

Consultez le fichier `GUIDE-VERCEL-VARIABLES.md` pour les instructions détaillées.

**Valeurs à utiliser** (depuis votre `.env.local` local) :

| Variable | Où la trouver |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_URL` | Même valeur que `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role ⚠️ |
| `REPLICATE_API_TOKEN` | https://replicate.com/account/api-tokens |

**Important** : Pour chaque variable, cochez **les 3 environnements** (Production, Preview, Development)

---

### 2. Vérifier les logs de build

1. Allez dans **Deployments**
2. Cliquez sur le déploiement échoué
3. Regardez les **Build Logs**

#### Erreurs courantes :

**a) "Cannot find module '@supabase/supabase-js'"**
```bash
# Solution : Vérifier que package.json contient toutes les dépendances
```

**b) "NEXT_PUBLIC_SUPABASE_URL is not defined"**
```bash
# Solution : Ajouter la variable d'environnement sur Vercel
```

**c) "Build exceeded maximum duration"**
```bash
# Solution : Déjà configuré dans vercel.json (timeout 30s)
```

---

### 3. Forcer un nouveau déploiement

Après avoir ajouté/modifié les variables d'environnement :

1. Allez dans **Deployments**
2. Sur le dernier déploiement, cliquez sur **⋯** (trois points)
3. Sélectionnez **Redeploy**
4. Cochez **Use existing Build Cache** (optionnel)
5. Cliquez **Redeploy**

---

### 4. Tester le build localement

Avant de pousser sur Vercel, testez toujours en local :

```bash
# Build de production
npm run build

# Démarrer en mode production
npm start
```

Si le build local réussit mais échoue sur Vercel, c'est **toujours** un problème de variables d'environnement.

---

## 📋 Checklist de débogage

Cochez au fur et à mesure :

- [ ] Les 5 variables d'environnement sont ajoutées sur Vercel
- [ ] Chaque variable est cochée pour Production, Preview, Development
- [ ] Pas d'espaces avant/après les valeurs des variables
- [ ] Le token Replicate est valide (pas expiré)
- [ ] Les clés Supabase sont correctes
- [ ] Le build local fonctionne (`npm run build`)
- [ ] Le projet GitHub est à jour (`git push`)
- [ ] Redéploiement effectué après ajout des variables

---

## 🔍 Vérification des variables ajoutées

Pour vérifier que les variables sont bien prises en compte :

1. Allez dans **Deployments** → Dernier déploiement
2. Cliquez sur **Environment Variables** dans le menu
3. Vous devriez voir les 5 variables listées

---

## 🆘 Si ça ne marche toujours pas

### Vérifier les Function Logs

1. **Deployments** → Dernier déploiement réussi
2. **Functions** → Cliquez sur une fonction API
3. Regardez les logs d'exécution
4. Cherchez les erreurs liées à Supabase ou Replicate

### Common issues :

**Supabase RLS (Row Level Security)**
- Les policies doivent autoriser `service_role`
- Ou bien vous utilisez `SUPABASE_SERVICE_ROLE_KEY` côté serveur (déjà fait dans ce projet)

**Replicate API**
- Le token doit être valide
- Vérifiez que vous avez des crédits Replicate

**Timeouts**
- Les fonctions API ont 30 secondes max (déjà configuré)
- La génération d'image Replicate peut prendre 10-20s

---

## 📞 Ressources

- 📖 [Guide complet des variables](./GUIDE-VERCEL-VARIABLES.md)
- 📖 [Documentation Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- 📖 [Documentation Supabase](https://supabase.com/docs)
- 📖 [Documentation Replicate](https://replicate.com/docs)

---

## ✅ Test final

Une fois déployé avec succès :

1. Visitez votre URL Vercel (ex: `votre-projet.vercel.app`)
2. Créez un compte → devrait fonctionner
3. Connectez-vous → devrait rediriger vers `/dashboard`
4. Téléchargez une image → devrait uploader
5. Attendez la génération → devrait s'afficher dans "Mes projets"

Si TOUT fonctionne : 🎉 **Déploiement réussi !**
