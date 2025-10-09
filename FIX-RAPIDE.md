# ⚡ FIX RAPIDE - Galerie vide

## 🎯 Actions MAINTENANT (5 minutes)

### 1️⃣ RECRÉER LA TABLE (3 min)

**Supabase → SQL Editor → copier-coller :**

```sql
DROP TABLE IF EXISTS projects CASCADE;

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

CREATE INDEX idx_projects_user_id ON projects(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" 
ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" 
ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
ON projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
ON projects FOR DELETE USING (auth.uid() = user_id);
```

**Cliquer RUN ▶️**

---

### 2️⃣ BUCKET PUBLIC (1 min)

**Supabase → Storage → output-image → Settings ⚙️**

✅ Cocher "Public bucket"  
✅ Cliquer "Save"

---

### 3️⃣ REDÉMARRER (30 sec)

```bash
Ctrl+C
npm run dev
```

---

### 4️⃣ TESTER

1. http://localhost:3000/dashboard
2. Uploader image + prompt
3. Attendre 15 sec
4. ✅ Image apparaît dans galerie

---

## 🐛 Erreurs corrigées

- ✅ API 401 → Fixé (nouvelle méthode auth)
- ✅ image_path not found → Fixé (table recréée)
- ✅ Images invisibles → Fixé (bucket public)

**Fichiers auto-modifiés :**
- `src/pages/api/projects.ts`
- `src/pages/api/delete.ts`

---

## 📚 Plus d'infos

- **Guide complet** : `FIX-GALERIE.md`
- **Diagnostic SQL** : `fix-database.sql`

---

**C'EST TOUT !** 🎉
