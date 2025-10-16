# 🔐 Guide : Configurer les variables d'environnement sur Vercel

## ⚠️ Erreur commune : "Secret does not exist"

Si vous voyez cette erreur lors du déploiement :
```
Environment Variable "NEXT_PUBLIC_SUPABASE_URL" references Secret "next_public_supabase_url", which does not exist.
```

**Cause** : Vercel cherche des Secrets qui n'ont pas été créés, alors qu'il faut utiliser des variables d'environnement simples.

---

## ✅ Solution : Ajouter les variables d'environnement directement

### Étape 1 : Accéder aux paramètres

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Cliquez sur **Settings** (onglet en haut)
4. Dans le menu de gauche, cliquez sur **Environment Variables**

### Étape 2 : Ajouter chaque variable

Pour **CHAQUE** variable ci-dessous :

#### 📝 Variables à ajouter (5 au total)

| Nom de la variable | Type | Description |
|-------------------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Plain Text | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain Text | Clé anonyme Supabase (publique) |
| `SUPABASE_URL` | Plain Text | URL de votre projet Supabase (serveur) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sensitive | Clé de service Supabase (privée) ⚠️ |
| `REPLICATE_API_TOKEN` | Sensitive | Token API Replicate |

### Étape 3 : Procédure pour ajouter UNE variable

1. Cliquez sur **Add New**
2. **Name** : Entrez le nom exact (ex: `NEXT_PUBLIC_SUPABASE_URL`)
3. **Value** : Collez la valeur de votre `.env.local`
4. **Environments** : Cochez **TOUS** les environnements
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Cliquez sur **Save**
6. Répétez pour les 4 autres variables

---

## 📋 Où trouver les valeurs ?

### Supabase (4 variables)

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Cliquez sur **Settings** (⚙️ en bas à gauche)
4. Cliquez sur **API** dans le menu

Vous y trouverez :
- **Project URL** → utilisez pour `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_URL`
- **anon public** → utilisez pour `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** (⚠️ secret) → utilisez pour `SUPABASE_SERVICE_ROLE_KEY`

### Replicate (1 variable)

1. Allez sur [Replicate](https://replicate.com/account/api-tokens)
2. Si vous n'avez pas de token ou que l'ancien a été exposé : **Create a new token**
3. Copiez le token → utilisez pour `REPLICATE_API_TOKEN`

---

## 🔄 Après avoir ajouté les variables

### Option 1 : Redéployer automatiquement
Vercel redéploie automatiquement après l'ajout de variables. Attendez 2-3 minutes.

### Option 2 : Forcer un redéploiement
1. Allez dans **Deployments**
2. Sur le dernier déploiement, cliquez sur **⋯** (trois points)
3. Cliquez sur **Redeploy**
4. Confirmez

---

## ✅ Vérification

Une fois déployé, testez votre site :

1. Allez sur l'URL de production (ex: `votre-projet.vercel.app`)
2. Créez un compte ou connectez-vous
3. Essayez d'accéder au dashboard
4. Vérifiez que vos projets s'affichent

### Si ça ne marche toujours pas :

1. Vérifiez dans **Deployments → Latest → Function Logs**
2. Cherchez les erreurs liées aux variables d'environnement
3. Assurez-vous que TOUTES les 5 variables sont bien configurées
4. Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs

---

## 🚨 Sécurité importante

⚠️ **NE JAMAIS** commit les vraies valeurs dans Git :
- ❌ Pas dans `.env.local`
- ❌ Pas dans la documentation
- ❌ Pas dans les commits

✅ Utilisez uniquement :
- `.env.example` avec des valeurs d'exemple
- Variables d'environnement Vercel (sécurisées)

---

## 📞 Besoin d'aide ?

Si vous avez encore des problèmes :

1. Vérifiez les **Function Logs** dans Vercel
2. Testez en local avec `npm run build && npm start`
3. Assurez-vous que votre base de données Supabase est accessible
4. Vérifiez les **Row Level Security (RLS)** policies sur Supabase
