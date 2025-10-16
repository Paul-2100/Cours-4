# ✅ Configuration Vercel - Variables d'environnement

## État actuel de vos variables sur Vercel

D'après votre configuration, vous avez **5 variables** configurées sur Vercel (ajoutées le 8 octobre) :

```
✅ NEXT_PUBLIC_SUPABASE_URL        - All Environments
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY   - All Environments  
✅ SUPABASE_URL                     - All Environments (⚠️ vérifier le nom)
✅ SUPABASE_SERVICE_ROLE_KEY       - All Environments
✅ REPLICATE_API_TOKEN              - All Environments
```

---

## ⚠️ Point d'attention : Variable "UPABASE_URL"

Vous avez mentionné "UPABASE_URL" (sans le 'S' au début).

### Si c'est une erreur de copie → OK ✅
Le code utilise maintenant un **fallback intelligent** :
- Cherche d'abord `SUPABASE_URL`
- Si absent, utilise `NEXT_PUBLIC_SUPABASE_URL`
- **Les deux fonctionnent !**

### Si c'est vraiment "UPABASE_URL" sur Vercel → À corriger ⚠️

1. Sur Vercel Dashboard → Settings → Environment Variables
2. Supprimez `UPABASE_URL` (sans S)
3. Ajoutez `SUPABASE_URL` (avec S) avec la même valeur que `NEXT_PUBLIC_SUPABASE_URL`

---

## 🔧 Code adapté pour vos variables

Le code a été mis à jour pour :

### 1. **Gestion centralisée** (`src/lib/env.ts`)
- Toutes les variables d'environnement en un seul endroit
- Validation automatique des variables requises
- Fallback intelligent : `SUPABASE_URL` || `NEXT_PUBLIC_SUPABASE_URL`

### 2. **Utilisation dans les API Routes**

```typescript
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, validateServerEnv } from '@/lib/env';

function getSupabaseAdmin() {
  validateServerEnv(); // Lance une erreur si variables manquantes
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
}
```

### 3. **Messages d'erreur clairs**

Si une variable manque, vous verrez exactement laquelle dans les logs Vercel.

---

## 🎯 Pourquoi ce changement ?

### Avant :
```typescript
// Chaque fichier gérait les variables différemment
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

### Maintenant :
```typescript
// Configuration centralisée avec fallback et validation
import { SUPABASE_URL, validateServerEnv } from '@/lib/env';
validateServerEnv(); // Erreur explicite si problème
```

**Avantages** :
- ✅ Code plus propre et maintenable
- ✅ Fallback automatique (SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL)
- ✅ Validation centralisée
- ✅ Messages d'erreur explicites
- ✅ Fonctionne avec votre config Vercel actuelle

---

## 📋 Checklist de vérification

Sur Vercel Dashboard → Settings → Environment Variables, vérifiez :

- [ ] `NEXT_PUBLIC_SUPABASE_URL` existe et contient votre URL Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` existe et contient la clé anon
- [ ] `SUPABASE_URL` existe (**ou** le code utilisera NEXT_PUBLIC_SUPABASE_URL)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` existe et contient la service_role key
- [ ] `REPLICATE_API_TOKEN` existe et est un token valide/non expiré
- [ ] Chaque variable est cochée pour : Production, Preview, Development

---

## 🚀 Prochaine étape

Puisque vous avez déjà les variables sur Vercel :

1. **Poussez ce nouveau code sur GitHub** (déjà fait après ce commit)
2. **Vercel redéploiera automatiquement**
3. **Attendez 2-3 minutes**
4. **Testez votre site sur l'URL Vercel**

---

## ✅ Test du déploiement

Une fois déployé :

1. Allez sur `votre-projet.vercel.app`
2. **Test connexion** : Créez un compte → devrait fonctionner
3. **Test dashboard** : Devrait charger sans erreur 401
4. **Test upload** : Uploadez une image avec un prompt
5. **Test génération** : L'image devrait apparaître dans "Mes projets"

---

## 🐛 Si ça ne marche toujours pas

### Vérifier les logs Vercel :

1. **Deployments** → Dernier déploiement
2. **Functions** → Cliquez sur une fonction API
3. Regardez les logs
4. Cherchez les erreurs de type :
   ```
   Error: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required
   Error: SUPABASE_SERVICE_ROLE_KEY is required
   ```

Si vous voyez ces erreurs, c'est que les variables ne sont pas correctement configurées sur Vercel.

---

## 📞 Besoin d'aide ?

Le code est maintenant **robuste** et **compatible** avec vos variables Vercel actuelles. Le fallback garantit que ça fonctionnera même si une variable manque (tant que l'alternative existe).

**Note** : Si "UPABASE_URL" est vraiment sans 'S' sur Vercel, pas de problème ! Le code utilise maintenant `NEXT_PUBLIC_SUPABASE_URL` comme fallback.
