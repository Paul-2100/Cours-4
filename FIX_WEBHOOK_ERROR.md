# 🔧 Correction de l'erreur "Failed to update project"

## ❌ Erreur identifiée

Le webhook Stripe reçoit bien l'événement `checkout.session.completed` mais ne peut pas mettre à jour le projet dans Supabase.

**Erreur:** 
```json
{
  "error": "Failed to update project"
}
```

**Données reçues correctement:**
- ✅ project_id: `1e550c3c-fd15-4fda-920d-f874b5a4854e`
- ✅ user_id: `c192f380-7817-4eaa-88ce-5a2da105685e`
- ✅ payment_intent: `pi_3SJHHhLhb3S03Urz3N36qNIX`

## 🔍 Causes possibles

### 1. Colonne manquante dans la table `projects`

Le webhook essaie de mettre à jour des colonnes qui n'existent peut-être pas :
- `payment_status`
- `stripe_payment_intent_id`

### 2. Politique RLS (Row Level Security) trop restrictive

Même avec le `service_role_key`, certaines politiques RLS pourraient bloquer l'update.

### 3. Le projet n'existe pas ou le user_id ne correspond pas

Le WHERE clause `eq('id', projectId).eq('user_id', userId)` ne trouve aucune ligne.

---

## ✅ SOLUTION 1 : Vérifier la structure de la table

### Allez sur Supabase SQL Editor:
https://supabase.com/dashboard/project/ceeuuvmoufadrapsgfag/sql

### Exécutez cette requête pour vérifier les colonnes:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

### Colonnes requises:

| Colonne | Type | Requis |
|---------|------|--------|
| `id` | uuid | ✅ |
| `user_id` | uuid | ✅ |
| `payment_status` | text | ✅ |
| `stripe_payment_intent_id` | text | ✅ |
| `stripe_checkout_session_id` | text | ✅ |
| `payment_amount` | numeric | ✅ |
| `status` | text | ✅ |

### Si des colonnes manquent, ajoutez-les:

```sql
-- Ajouter payment_status si manquante
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Ajouter stripe_payment_intent_id si manquante
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Ajouter stripe_checkout_session_id si manquante
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

-- Ajouter payment_amount si manquante
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 2.00;
```

---

## ✅ SOLUTION 2 : Vérifier les politiques RLS

### Désactiver temporairement RLS pour tester:

```sql
-- Voir l'état actuel de RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';

-- Désactiver RLS temporairement pour tester
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
```

### ⚠️ Après le test, réactivez RLS:

```sql
-- Réactiver RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre au service_role de tout faire
CREATE POLICY "Service role bypass" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## ✅ SOLUTION 3 : Vérifier que le projet existe

### Dans Supabase SQL Editor, vérifiez:

```sql
-- Chercher le projet en question
SELECT 
  id,
  user_id,
  status,
  payment_status,
  stripe_checkout_session_id,
  created_at
FROM projects
WHERE id = '1e550c3c-fd15-4fda-920d-f874b5a4854e';
```

**Résultats attendus:**
- ✅ Une ligne doit être retournée
- ✅ `user_id` doit être `c192f380-7817-4eaa-88ce-5a2da105685e`
- ✅ `status` doit être `pending_payment`
- ✅ `payment_status` doit être `pending`

**Si aucune ligne:**
→ Le projet n'a jamais été créé lors de la création de la session Stripe

**Si user_id différent:**
→ Problème dans la création du projet

---

## 🚀 Code mis à jour

Le fichier `src/pages/api/webhooks/stripe.ts` a été mis à jour pour :

1. ✅ Retirer `updated_at` (colonne peut-être inexistante)
2. ✅ Ajouter `.select()` pour voir le projet mis à jour
3. ✅ Vérifier que le projet existe avant de dire "success"
4. ✅ Logs plus détaillés pour le débogage

### Nouveaux logs attendus:

**En cas de succès:**
```
✅ Webhook verified: checkout.session.completed
💰 Payment successful for session: cs_test_...
📦 Metadata: { project_id: '...', user_id: '...' }
🔄 Updating project: 1e550c3c-... for user: c192f380-...
✅ Project updated successfully: 1e550c3c-...
✅ Updated project data: { id: '...', payment_status: 'paid', ... }
🚀 Project ready for generation
```

**En cas d'erreur (colonne manquante):**
```
❌ Error updating project: { ... }
❌ Error details: { "message": "column 'payment_status' does not exist", ... }
```

**En cas de projet non trouvé:**
```
❌ No project found with id: 1e550c3c-... and user_id: c192f380-...
```

---

## 📋 CHECKLIST DE DÉBOGAGE

Pour identifier le problème exact:

1. [ ] Déployez le nouveau code avec les logs améliorés
   ```bash
   git add -A
   git commit -m "Add detailed webhook logs"
   git push origin main
   ```

2. [ ] Testez un nouveau paiement

3. [ ] Regardez les logs Vercel:
   https://vercel.com/paul-2100s-projects/cours-4/logs

4. [ ] Selon l'erreur affichée:
   - **"column ... does not exist"** → Allez à SOLUTION 1
   - **"No project found"** → Allez à SOLUTION 3
   - **Autre erreur RLS** → Allez à SOLUTION 2

5. [ ] Une fois corrigé dans Supabase, testez à nouveau

---

## 🎯 Action immédiate recommandée

### Étape 1 : Vérifier la structure

Exécutez dans Supabase SQL Editor:

```sql
-- Vérifier les colonnes existantes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN (
  'payment_status',
  'stripe_payment_intent_id',
  'stripe_checkout_session_id',
  'payment_amount'
);
```

### Étape 2 : Ajouter les colonnes manquantes

Si elles n'existent pas, exécutez:

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 2.00;
```

### Étape 3 : Redéployer avec les logs améliorés

```bash
git add -A
git commit -m "Improve webhook error logging"
git push origin main
```

### Étape 4 : Tester

Un nouveau paiement devrait maintenant fonctionner et vous verrez dans les logs Vercel exactement ce qui se passe ! 🎉

---

## 💡 Note

Les logs améliorés vous donneront l'erreur exacte de Supabase, ce qui permettra de diagnostiquer précisément le problème. Une fois identifié, il suffira d'appliquer la solution correspondante dans Supabase SQL Editor.
