# 🚨 PROBLÈME : Impossible de voir "Mes projets"

## Diagnostic

Vous rencontrez 2 erreurs :
1. ❌ **GET /api/projects → 401 Unauthorized** (session non récupérée)
2. ❌ **"Could not find image_path column"** (table mal configurée)

---

## ✅ SOLUTION EN 4 ÉTAPES

### ÉTAPE 1 : Vérifier votre table Supabase (2 min)

**Aller sur Supabase → SQL Editor → Nouvelle requête**

Coller et exécuter :

```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

**Résultat attendu :**
```
id
user_id
title
prompt          ← IMPORTANT (pas "description")
image_path      ← IMPORTANT
input_image_path
created_at
updated_at
```

**❌ Si vous voyez autre chose OU une erreur :**
→ Passez à l'ÉTAPE 2 (recréer la table)

**✅ Si vous voyez exactement ces colonnes :**
→ Passez à l'ÉTAPE 3 (vérifier le bucket)

---

### ÉTAPE 2 : Créer/Recréer la table (3 min)

**Dans Supabase SQL Editor, exécuter tout ce bloc :**

```sql
-- Supprimer l'ancienne table (si elle existe)
DROP TABLE IF EXISTS projects CASCADE;

-- Créer la nouvelle table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  prompt TEXT,
  image_path TEXT NOT NULL,
  input_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Activer RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own projects" 
ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" 
ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
ON projects FOR DELETE USING (auth.uid() = user_id);
```

**Cliquer sur "Run" ▶️**

---

### ÉTAPE 3 : Rendre le bucket public (1 min)

**Aller sur Supabase → Storage**

1. Cliquer sur **"output-image"**
2. Cliquer sur **"Settings"** (icône ⚙️ en haut à droite)
3. Cocher **"Public bucket"** ☑️
4. Cliquer sur **"Save"**

**Vérification :**

Retour dans SQL Editor, exécuter :

```sql
SELECT name, public FROM storage.buckets WHERE name = 'output-image';
```

Doit retourner : `public = true` ✅

---

### ÉTAPE 4 : Redémarrer le serveur (30 sec)

**Dans votre terminal :**

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer :
npm run dev
```

---

## 🧪 TEST COMPLET

### 1. Se connecter

```
http://localhost:3000/login
```

### 2. Aller sur le dashboard

```
http://localhost:3000/dashboard
```

### 3. Uploader une image

- Titre : "Test galerie"
- Image : n'importe quelle image
- Prompt : "Make it beautiful"
- Cliquer sur **"Générer"**

### 4. Attendre 10-15 secondes

Vous devriez voir :
- ✅ Le projet apparaît dans "Mes projets"
- ✅ L'image est visible
- ✅ Le titre et prompt s'affichent

---

## 🔍 VÉRIFICATION DES ERREURS

**Ouvrir la console du navigateur (F12)**

### Si vous voyez encore 401 :

**Console → taper :**
```javascript
supabase.auth.getSession().then(s => console.log('Session:', s))
```

**Si session = null :**
1. Se déconnecter
2. Vider les cookies (Settings → Privacy → Clear data)
3. Se reconnecter

---

### Si image_path column not found :

**Retourner sur Supabase SQL Editor :**

```sql
-- Vérifier que la colonne existe
SELECT column_name FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'image_path';
```

**Si retourne vide :**
→ Réexécuter l'ÉTAPE 2 complètement

---

### Si l'image ne s'affiche pas :

**Console → taper :**
```javascript
supabase.storage.from('output-image').getPublicUrl('test.jpg')
```

**Si l'URL contient `/sign/` au lieu de `/public/` :**
→ Le bucket n'est pas public, refaire l'ÉTAPE 3

---

## 📊 État attendu après corrections

✅ Table `projects` existe avec 8 colonnes  
✅ Colonne `image_path` existe  
✅ Colonne `prompt` existe (pas `description`)  
✅ RLS activée  
✅ 4 policies actives  
✅ Bucket `output-image` PUBLIC  
✅ API `/api/projects` retourne 200 (pas 401)  
✅ Images visibles dans la galerie  

---

## 🆘 Si ça ne marche TOUJOURS pas

**Exécuter le script complet de diagnostic :**

Ouvrir `fix-database.sql` dans Supabase SQL Editor et exécuter section par section.

**Ou me partager :**
1. Le résultat de cette requête :
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'projects';
   ```

2. Le résultat de celle-ci :
   ```sql
   SELECT name, public FROM storage.buckets;
   ```

3. Les logs du terminal (les erreurs)

---

## 💡 Pourquoi ces erreurs ?

### Erreur 401 (Unauthorized)
- L'ancienne méthode `createServerClient` ne récupérait pas bien la session
- **Corrigé** : Utilisation directe de `createPagesServerClient` + `getSession()`

### Erreur "image_path column not found"
- La table n'existait pas ou avait les mauvaises colonnes
- **Solution** : Recréer la table avec la bonne structure

---

## ✅ Fichiers modifiés automatiquement

Ces corrections ont déjà été appliquées dans votre code :

- ✅ `src/pages/api/projects.ts` - Méthode d'auth corrigée
- ✅ `src/pages/api/delete.ts` - Méthode d'auth corrigée
- ✅ `src/pages/dashboard.tsx` - Type Project avec `prompt`
- ✅ `src/pages/api/generate.ts` - INSERT avec `prompt`

**Il ne reste plus que les 4 étapes Supabase ci-dessus !** 🚀

---

**Bon courage ! Suivez les étapes dans l'ordre et ça devrait fonctionner.** 💪
