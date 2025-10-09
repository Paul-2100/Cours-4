# 🔧 Guide de dépannage - Problèmes résolus

## Problèmes identifiés et corrigés

### ❌ Problème 1 : Images non affichées dans la galerie

**Cause :** 
- Le bucket `output-image` n'est pas configuré comme public dans Supabase Storage
- Les URLs publiques ne fonctionnent que si le bucket est public

**Solution appliquée :**
1. ✅ Amélioration de l'affichage des images avec gestion d'erreur
2. ✅ Ajout d'un placeholder si l'image ne charge pas
3. ✅ Message "Aucun projet" quand la galerie est vide

**Actions requises de votre côté :**

Dans Supabase Storage, rendez le bucket `output-image` **public** :

```
1. Aller dans Storage > output-image
2. Cliquer sur "Settings" (⚙️)
3. Cocher "Public bucket"
4. Sauvegarder
```

**Alternative (si vous voulez garder le bucket privé) :**
Modifier le dashboard pour utiliser des URLs signées :

```typescript
// Remplacer getPublicUrl par createSignedUrl
const { data } = await supabase.storage
  .from('output-image')
  .createSignedUrl(p.image_path, 3600); // 1 heure
```

---

### ❌ Problème 2 : Erreur "Could not find the 'description' column"

**Cause :** 
- Le schéma de la table `projects` utilise `description` 
- Mais il serait plus logique d'utiliser `prompt` (le texte de transformation)

**Solution appliquée :**
1. ✅ Renommé `description` → `prompt` dans tous les fichiers
2. ✅ Mis à jour le type TypeScript `Project`
3. ✅ Modifié l'API `/api/generate` pour insérer `prompt` au lieu de `description`
4. ✅ Créé un script de migration SQL

**Actions requises de votre côté :**

**Option A - Si la table existe déjà :**
```sql
-- Exécuter dans Supabase SQL Editor
ALTER TABLE projects 
RENAME COLUMN description TO prompt;
```

**Option B - Si vous devez recréer la table :**
```sql
-- Supprimer l'ancienne table (ATTENTION : perte de données)
DROP TABLE IF EXISTS projects CASCADE;

-- Puis réexécuter supabase-setup.sql
```

---

### ❌ Problème 3 : API /api/projects retourne 401 (Unauthorized)

**Cause :** 
- La fonction `createServerSupabaseClient` est dépréciée
- Le client serveur ne récupère pas correctement la session

**Solution appliquée :**
1. ✅ Remplacé `createServerSupabaseClient` par `createPagesServerClient`
2. ✅ Mis à jour `src/utils/supabaseServer.ts`

**Fichier modifié :**
```typescript
// src/utils/supabaseServer.ts
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export function createServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createPagesServerClient({ req, res });
}
```

---

### ❌ Problème 4 : Pas d'accès direct au dashboard depuis l'accueil

**Status :** ✅ **Déjà résolu !**

Le bouton "Accéder à mon espace" existe déjà sur la landing page quand l'utilisateur est connecté :

```tsx
{user ? (
  <div className="cta">
    <Link href="/dashboard">
      <button className="primary-btn">Accéder à mon espace</button>
    </Link>
  </div>
) : (
  // Boutons Signup/Login
)}
```

**Si le bouton n'apparaît pas :**
- Vérifier que vous êtes bien connecté (regarder le header en haut)
- Rafraîchir la page (F5)
- Vider le cache du navigateur

---

## 📝 Checklist de vérification

### Configuration Supabase

- [ ] **Table `projects` existe** avec colonne `prompt` (pas `description`)
- [ ] **Bucket `output-image` est PUBLIC**
- [ ] **Bucket `input-image` existe** (peut rester privé)
- [ ] **RLS activée** sur la table `projects`
- [ ] **4 policies actives** (SELECT, INSERT, UPDATE, DELETE)

### Test de l'application

- [ ] **Connexion fonctionne** (page /login)
- [ ] **Dashboard accessible** (page /dashboard)
- [ ] **Upload + génération** fonctionne
- [ ] **Projet apparaît dans galerie** avec image visible
- [ ] **Suppression fonctionne**

---

## 🚀 Commandes de test

### 1. Redémarrer le serveur dev

```bash
# Arrêter le serveur (Ctrl+C si lancé)
# Puis relancer :
npm run dev
```

### 2. Vérifier les erreurs

Ouvrir la console du navigateur (F12) et regarder :
- Erreurs réseau (onglet Network)
- Erreurs console (onglet Console)

### 3. Tester l'affichage des images

```bash
# Dans la console du navigateur, taper :
console.log(supabase.storage.from('output-image').getPublicUrl('nom-fichier.jpg'))
```

Vérifier que l'URL retournée est accessible.

---

## 🔍 Vérification des URLs d'images

**Format attendu :**
```
https://votre-projet.supabase.co/storage/v1/object/public/output-image/output-1234567890.jpg
```

**Si vous voyez :**
```
https://votre-projet.supabase.co/storage/v1/object/sign/output-image/...
```
→ Le bucket est privé, vous devez le rendre public.

---

## 📚 Fichiers modifiés

### Corrections appliquées :

1. ✅ `src/utils/supabaseServer.ts` - Mise à jour vers `createPagesServerClient`
2. ✅ `src/pages/dashboard.tsx` - Type `Project` avec `prompt`, affichage amélioré
3. ✅ `src/pages/api/generate.ts` - Insertion de `prompt` au lieu de `description`
4. ✅ `supabase-setup.sql` - Schéma mis à jour avec `prompt`
5. ✅ `migration-prompt.sql` - Script de migration créé

### Nouveaux fichiers :

- ✅ `migration-prompt.sql` - Pour migrer description → prompt
- ✅ `DEPANNAGE.md` - Ce guide

---

## 🎯 Prochaines étapes

1. **Exécuter la migration SQL** (si table existe déjà)
   ```sql
   ALTER TABLE projects RENAME COLUMN description TO prompt;
   ```

2. **Rendre le bucket public**
   - Supabase → Storage → output-image → Settings → Public bucket ✓

3. **Redémarrer le serveur**
   ```bash
   npm run dev
   ```

4. **Tester un upload**
   - Aller sur /dashboard
   - Uploader une image + prompt
   - Vérifier que l'image apparaît dans la galerie

5. **Vérifier dans Supabase**
   - Table Editor → projects → voir les nouvelles lignes
   - Storage → output-image → voir les fichiers uploadés

---

## 💡 Astuces de débogage

### Si les images ne s'affichent toujours pas :

1. **Vérifier le bucket est public :**
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'output-image';
   -- La colonne 'public' doit être 'true'
   ```

2. **Vérifier les policies storage :**
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'output-image';
   ```

3. **Tester l'URL directement dans le navigateur**
   - Copier l'URL de l'image depuis la console
   - Coller dans un nouvel onglet
   - Si 403/404 → problème de configuration bucket

### Si l'API retourne 401 :

1. **Vérifier la session dans la console :**
   ```javascript
   supabase.auth.getSession().then(console.log)
   ```

2. **Vérifier les cookies :**
   - F12 → Application → Cookies
   - Chercher les cookies Supabase

3. **Vérifier le middleware :**
   - Désactiver temporairement `middleware.ts` pour tester

---

**Tout devrait fonctionner après ces corrections !** 🎉
