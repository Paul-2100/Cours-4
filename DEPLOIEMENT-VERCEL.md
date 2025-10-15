# 🚀 Guide de déploiement sur Vercel

## 📋 Prérequis

✅ Compte Vercel créé  
✅ Projet GitHub connecté  
✅ Variables d'environnement Supabase  
✅ Token Replicate API  

---

## 🔧 Configuration des variables d'environnement sur Vercel

### 1. Aller dans les settings du projet Vercel

```
Votre Projet → Settings → Environment Variables
```

### 2. Ajouter TOUTES ces variables :

#### Variables Supabase (côté client - PUBLIC)
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

#### Variables Supabase (côté serveur - PRIVÉ)
```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ici
```

#### Token Replicate
```
REPLICATE_API_TOKEN=votre-replicate-token-ici
```

### 3. Important : Cocher pour tous les environnements
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🛠️ Problèmes courants et solutions

### ❌ Problème 1 : "Les projets ne s'affichent pas"

**Cause** : Les variables d'environnement ne sont pas configurées  
**Solution** : Vérifier que TOUTES les variables ci-dessus sont dans Vercel

### ❌ Problème 2 : "Impossible de se déconnecter"

**Cause** : Les cookies ne persistent pas correctement  
**Solution** : C'est déjà corrigé dans le code (redirection après signOut)

### ❌ Problème 3 : "Erreur 500 sur /api/projects"

**Cause** : SUPABASE_SERVICE_ROLE_KEY manquante  
**Solution** : Ajouter la variable dans Vercel et redéployer

### ❌ Problème 4 : "Erreur lors de l'upload d'images"

**Cause** : Limite de taille de body sur Vercel (4.5MB par défaut)  
**Solution** : Les images sont traitées par formidable, ça devrait fonctionner

---

## 🔄 Après avoir ajouté les variables

1. **Aller dans Deployments**
2. **Cliquer sur les 3 points** du dernier déploiement
3. **Cliquer sur "Redeploy"**
4. Attendre que le déploiement se termine

---

## ✅ Vérification du déploiement

### Test 1 : Page d'accueil
```
https://votre-app.vercel.app/
```
Doit afficher la landing page avec le logo ✨

### Test 2 : Connexion
```
https://votre-app.vercel.app/login
```
Se connecter avec votre compte Supabase

### Test 3 : Dashboard
```
https://votre-app.vercel.app/dashboard
```
Doit afficher vos projets

### Test 4 : Upload
Tester l'upload d'une image dans le dashboard

---

## 🐛 Debug en production

### Voir les logs Vercel
```
Vercel Dashboard → Votre Projet → Functions → Sélectionner une fonction → Voir les logs
```

### Logs utiles
- `/api/projects` - Devrait afficher "✅ Projects found: X"
- `/api/generate` - Devrait afficher le workflow d'upload
- `/api/delete` - Devrait afficher la suppression

---

## 📊 Limites Vercel (Plan Hobby gratuit)

- ⏱️ **Fonction timeout** : 10 secondes max
- 💾 **Body size** : 4.5 MB max
- 🔄 **Invocations** : 100GB-Hrs/mois
- 📦 **Build time** : 45 minutes/mois

**Note** : Le modèle Replicate peut prendre >10 secondes, ce qui peut causer des timeouts sur Vercel Free. Considérez upgrader vers le plan Pro si nécessaire.

---

## 🎯 Checklist finale

- [ ] Toutes les variables d'environnement ajoutées dans Vercel
- [ ] Projet redéployé après ajout des variables
- [ ] Test de connexion fonctionne
- [ ] Les projets s'affichent dans le dashboard
- [ ] L'upload d'image fonctionne
- [ ] La déconnexion redirige vers /login
- [ ] Les buckets Supabase sont publics

---

## 🆘 Support

Si un problème persiste :
1. Vérifier les logs dans Vercel Functions
2. Vérifier la console du navigateur (F12)
3. Vérifier que les buckets Supabase sont bien publics
4. S'assurer que les variables d'environnement sont bien définies

---

## 🔗 Liens utiles

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Supabase + Vercel](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
