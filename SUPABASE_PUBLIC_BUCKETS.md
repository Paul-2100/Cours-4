# Configuration des buckets Supabase pour URLs publiques

## ⚠️ Problème: Les images des anciens projets ne s'affichent plus

**Cause**: Les anciennes URLs étaient des "signed URLs" qui expirent après un certain temps (10 minutes pour input, 60 minutes pour output).

**Solution**: Utiliser des URLs publiques permanentes en configurant les buckets comme publics.

---

## 🔧 Étapes pour rendre les buckets publics

### 1. Accéder à Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet : **ceeuuvmoufadrapsgfag**
3. Dans le menu de gauche, cliquez sur **Storage**

### 2. Configurer le bucket `input-image`

1. Cliquez sur le bucket **`input-image`**
2. Cliquez sur les **3 points** (⋮) en haut à droite
3. Sélectionnez **"Make public"** ou **"Edit bucket"**
4. Cochez **"Public bucket"**
5. Sauvegardez

### 3. Configurer le bucket `output-image`

1. Cliquez sur le bucket **`output-image`**
2. Cliquez sur les **3 points** (⋮) en haut à droite
3. Sélectionnez **"Make public"** ou **"Edit bucket"**
4. Cochez **"Public bucket"**
5. Sauvegardez

---

## 🔐 Politiques de sécurité (RLS)

Même si les buckets sont publics, vous devez configurer les politiques RLS pour sécuriser l'accès:

### Pour `input-image`:

```sql
-- Politique: Tout le monde peut lire (SELECT)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'input-image');

-- Politique: Seuls les utilisateurs authentifiés peuvent uploader (INSERT)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'input-image' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique: Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'input-image'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Pour `output-image`:

```sql
-- Politique: Tout le monde peut lire (SELECT)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'output-image');

-- Politique: Seuls les utilisateurs authentifiés peuvent uploader (INSERT)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'output-image' 
  AND auth.role() = 'authenticated'
);

-- Politique: Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'output-image'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🔄 Réparer les anciens projets

Une fois les buckets publics, les anciennes URLs signées peuvent être converties en URLs publiques.

### Option 1: Script SQL (Supabase SQL Editor)

```sql
-- Mettre à jour les URLs des projets existants
-- Remplacez les signed URLs par des URLs publiques

UPDATE projects
SET 
  input_image_url = replace(
    input_image_url,
    regexp_replace(input_image_url, '^(https://[^/]+/storage/v1/object/sign/[^?]+).*$', '\\1'),
    regexp_replace(input_image_url, '^(https://[^/]+)/storage/v1/object/sign/([^/]+)/(.+)\\?.*$', '\\1/storage/v1/object/public/\\2/\\3')
  )
WHERE input_image_url LIKE '%/sign/%';

UPDATE projects
SET 
  output_image_url = replace(
    output_image_url,
    regexp_replace(output_image_url, '^(https://[^/]+/storage/v1/object/sign/[^?]+).*$', '\\1'),
    regexp_replace(output_image_url, '^(https://[^/]+)/storage/v1/object/sign/([^/]+)/(.+)\\?.*$', '\\1/storage/v1/object/public/\\2/\\3')
  )
WHERE output_image_url LIKE '%/sign/%';
```

### Option 2: Reconstruire les URLs depuis les chemins

Si les chemins des fichiers sont stockés quelque part, vous pouvez reconstruire les URLs:

```sql
-- Exemple si vous avez les chemins
UPDATE projects
SET 
  input_image_url = 'https://ceeuuvmoufadrapsgfag.supabase.co/storage/v1/object/public/input-image/' || input_image_path,
  output_image_url = 'https://ceeuuvmoufadrapsgfag.supabase.co/storage/v1/object/public/output-image/' || output_image_path
WHERE input_image_path IS NOT NULL;
```

---

## ✅ Vérification

Après avoir rendu les buckets publics:

1. Testez une URL publique dans le navigateur:
   ```
   https://ceeuuvmoufadrapsgfag.supabase.co/storage/v1/object/public/input-image/NOM_DU_FICHIER
   ```

2. Si l'image s'affiche → ✅ Buckets correctement configurés

3. Si erreur 403 → ❌ Le bucket n'est pas public ou les politiques RLS bloquent l'accès

---

## 📝 Changements dans le code

Les fichiers suivants ont été mis à jour pour utiliser des URLs publiques permanentes:

### ✅ Déjà corrigés:
- `src/pages/api/generate.ts` - Utilise maintenant `getPublicUrl()` au lieu de `createSignedUrl()`
- `src/pages/api/create-checkout-session.ts` - Utilisait déjà `getPublicUrl()`

### Format des URLs:

**Avant (signed URL - expire):**
```
https://ceeuuvmoufadrapsgfag.supabase.co/storage/v1/object/sign/input-image/file.jpg?token=...&expires=...
```

**Après (public URL - permanente):**
```
https://ceeuuvmoufadrapsgfag.supabase.co/storage/v1/object/public/input-image/file.jpg
```

---

## 🚀 Avantages des URLs publiques

1. ✅ **Permanentes** - Ne expirent jamais
2. ✅ **Plus simples** - Pas de gestion de token
3. ✅ **Meilleures performances** - Pas de vérification de signature
4. ✅ **Cache-friendly** - Peuvent être mises en cache par les CDN
5. ✅ **Compatibles avec les anciens projets** - Les anciennes images restent accessibles

## ⚠️ Sécurité

Les URLs publiques signifient que **n'importe qui avec l'URL peut voir l'image**. C'est approprié pour:

- ✅ Images générées destinées à être partagées
- ✅ Portfolios publics
- ✅ Galeries d'images

Si vous avez besoin de confidentialité:
- Ajoutez des UUID aléatoires dans les noms de fichiers (déjà fait avec `Date.now()`)
- Gardez les URLs privées dans votre base de données
- N'exposez pas les URLs directement dans l'HTML pour les crawlers
