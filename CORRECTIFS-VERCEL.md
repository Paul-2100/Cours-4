# 🚨 Correctifs pour le déploiement Vercel

## Problèmes résolus

### ✅ 1. Configuration Next.js optimisée
- Ajout de `serverRuntimeConfig` pour protéger les secrets
- Configuration des domaines d'images Supabase
- Support des remote patterns pour Replicate

### ✅ 2. Déconnexion corrigée
- Ajout de la redirection automatique vers `/login` après déconnexion
- Meilleure gestion d'erreurs dans `Header.tsx`

### ✅ 3. Meilleure gestion des projets
- Logs de debug ajoutés dans `fetchProjects()`
- Gestion des erreurs de session
- Redirection automatique si session expirée

### ✅ 4. Configuration Vercel
- Fichier `vercel.json` avec configuration des fonctions
- Timeout augmenté à 30 secondes pour `/api/generate`
- Memory augmentée à 1024 MB

---

## 📋 Checklist de déploiement sur Vercel

### Avant de déployer

- [ ] Pousser le code sur GitHub
- [ ] Vérifier que `.env.local` est dans `.gitignore`
- [ ] S'assurer que tous les buckets Supabase sont publics

### Sur Vercel

1. **Importer le projet depuis GitHub**
2. **Configurer les variables d'environnement** (voir DEPLOIEMENT-VERCEL.md)
3. **Cliquer sur Deploy**
4. **Attendre la fin du build** (~2-3 minutes)
5. **Tester l'application**

### Variables d'environnement à ajouter sur Vercel

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ici
REPLICATE_API_TOKEN=votre-replicate-token-ici
```

### Après le déploiement

- [ ] Tester la connexion
- [ ] Vérifier que les projets s'affichent
- [ ] Tester l'upload d'une image
- [ ] Tester la déconnexion
- [ ] Vérifier les logs Vercel Functions si problème

---

## 🐛 Débogage

### Si les projets ne s'affichent pas

1. **Vérifier les logs Vercel**
   - Aller dans `Functions` → `/api/projects`
   - Regarder les logs d'exécution

2. **Vérifier la console navigateur** (F12)
   - Chercher les messages `📡 Fetching projects`
   - Chercher les erreurs HTTP

3. **Vérifier les variables d'environnement**
   - S'assurer qu'elles sont TOUTES définies
   - Redéployer après ajout

### Si l'upload ne fonctionne pas

**Problème courant** : Timeout sur Vercel Free (10s max)

**Solutions** :
- Upgrader vers Vercel Pro (timeout 60s)
- OU réduire la taille des images avant upload
- OU implémenter un système de webhooks Replicate

---

## 📊 Limites du plan Vercel gratuit

| Limite | Valeur |
|--------|--------|
| Function Timeout | 10 secondes |
| Memory | 1024 MB |
| Body Size | 4.5 MB |
| Invocations | 100 GB-Hrs/mois |

**Note** : La génération d'images avec Replicate prend généralement 5-20 secondes. Sur le plan gratuit, certaines générations peuvent timeout.

---

## ✅ Fichiers modifiés/créés

1. `next.config.js` - Configuration Next.js pour Vercel
2. `vercel.json` - Configuration Vercel
3. `.env.example` - Template des variables d'environnement
4. `DEPLOIEMENT-VERCEL.md` - Guide complet de déploiement
5. `src/components/Header.tsx` - Correction de la déconnexion
6. `src/pages/dashboard.tsx` - Ajout de logs de debug

---

## 🎯 Prochaines étapes suggérées

- [ ] Implémenter des webhooks Replicate pour éviter les timeouts
- [ ] Ajouter un système de pagination pour les projets
- [ ] Implémenter un loader pendant la génération
- [ ] Ajouter la possibilité de partager des projets
- [ ] Implémenter une recherche dans les projets
