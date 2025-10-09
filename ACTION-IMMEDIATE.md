# 🚨 PROBLÈMES RÉSOLUS - Actions Immédiates

## 🎯 TL;DR - Ce que vous devez faire MAINTENANT

### 1️⃣ Exécuter la migration SQL (2 min)

**Ouvrir Supabase → SQL Editor → Nouvelle requête**

```sql
-- Renommer description → prompt
ALTER TABLE projects 
RENAME COLUMN description TO prompt;
```

**Cliquer sur "Run" ▶️**

---

### 2️⃣ Rendre le bucket public (1 min)

**Supabase → Storage → output-image**

1. Cliquer sur **Settings** ⚙️
2. Cocher **"Public bucket"** ☑️
3. Cliquer sur **"Save"**

---

### 3️⃣ Redémarrer le serveur (30 sec)

```bash
# Dans votre terminal, arrêter le serveur (Ctrl+C)
# Puis relancer :
npm run dev
```

---

## ✅ C'EST TOUT !

Après ces 3 étapes :
- ✅ Les images s'afficheront dans la galerie
- ✅ Plus d'erreur 401 sur `/api/projects`
- ✅ Plus d'erreur "description column not found"
- ✅ Le dashboard fonctionnera parfaitement

---

## 🔍 Vérification rapide

### Test 1 : Diagnostic SQL

**Copier-coller ce script dans Supabase SQL Editor :**

```sql
-- Vérifier la colonne prompt existe
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'prompt';

-- Vérifier le bucket est public
SELECT name, public 
FROM storage.buckets 
WHERE name = 'output-image';
```

**Résultats attendus :**
```
✓ column_name = "prompt"
✓ public = true
```

---

### Test 2 : Upload d'image

1. Aller sur http://localhost:3000/dashboard
2. Uploader une image avec un prompt
3. Attendre la génération
4. **L'image doit apparaître dans "Mes projets"** ✅

---

## 🐛 Si ça ne marche toujours pas

### Problème : Images toujours invisibles

**Ouvrir la console du navigateur (F12) :**

```javascript
// Taper dans la console :
supabase.storage.from('output-image').getPublicUrl('test.jpg')
```

**Si l'URL contient `/public/` :** ✅ Bucket public (OK)
```
https://.../storage/v1/object/public/output-image/test.jpg
```

**Si l'URL contient `/sign/` :** ❌ Bucket privé (refaire l'étape 2)
```
https://.../storage/v1/object/sign/output-image/test.jpg
```

---

### Problème : Erreur 401 sur /api/projects

**Vérifier la session :**

```javascript
// Dans la console du navigateur :
supabase.auth.getSession().then(console.log)
```

**Si `session: null` :**
1. Se déconnecter
2. Se reconnecter
3. Rafraîchir la page

---

## 📚 Documentation complète

| Document | Description |
|----------|-------------|
| `CORRECTIONS.md` | ✅ Résumé des corrections appliquées |
| `DEPANNAGE.md` | 🔧 Guide de dépannage complet |
| `diagnostic.sql` | 🔍 Script de diagnostic Supabase |
| `migration-prompt.sql` | 📝 Migration description → prompt |
| `ACTION-IMMEDIATE.md` | ⚡ Ce fichier (actions rapides) |

---

## 🎉 Après ces corrections

Votre application aura :
- ✅ Images visibles dans la galerie
- ✅ API fonctionnelle sans erreur 401
- ✅ Schéma DB cohérent (prompt au lieu de description)
- ✅ Fonction Supabase à jour (createPagesServerClient)

---

## 💡 Rappel : Modifications automatiques déjà appliquées

Ces corrections ont **déjà été appliquées** dans votre code :

- ✅ `src/utils/supabaseServer.ts` - Fonction mise à jour
- ✅ `src/pages/dashboard.tsx` - Type `Project` avec `prompt`
- ✅ `src/pages/api/generate.ts` - INSERT avec `prompt`
- ✅ `supabase-setup.sql` - Schéma mis à jour

**Il ne reste plus qu'à faire les 3 actions ci-dessus !** 🚀

---

## 🆘 Besoin d'aide ?

1. Exécuter `diagnostic.sql` dans Supabase SQL Editor
2. Partager les résultats
3. Consulter `DEPANNAGE.md` pour plus de détails

**Bon courage !** 💪
