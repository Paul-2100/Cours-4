# AI Image Editor avec Authentification Supabase

Application Next.js permettant de transformer des images avec l'IA (Replicate) et authentification email/mot de passe via Supabase.

## 🚀 Fonctionnalités implémentées

### ✅ Authentification
- **AuthContext** (`AuthContext.tsx`) : Context React avec hook `useAuth()` qui écoute `auth.onAuthStateChange()`
- **Composant AuthForm** (`src/components/AuthForm.tsx`) : Formulaire avec onglets connexion/inscription + validation email/mot de passe
- **Header** (`src/components/Header.tsx`) : Affiche l'email de l'utilisateur et bouton de déconnexion si connecté
- **Pages d'authentification** :
  - `/login` - Page de connexion
  - `/signup` - Page d'inscription
  
### 🔒 Protection des routes
- **Middleware** (`middleware.ts`) : Protège `/dashboard` et `/api/*` avec redirection vers `/login` si non authentifié
- Utilise `@supabase/auth-helpers-nextjs` pour gérer les sessions côté serveur

### 🎨 Interface utilisateur
- **Landing page** (`/`) : Page d'accueil avec CTA vers `/signup` et présentation des fonctionnalités
- **Dashboard** (`/dashboard`) : Page protégée avec :
  - Formulaire d'upload d'image + prompt de transformation
  - Galerie "Mes projets" affichant uniquement les projets de l'utilisateur connecté
  - Bouton de suppression par projet

### 🗄️ API Routes

#### `/api/generate` (POST)
- Vérifie l'authentification via le token ou session
- Upload l'image d'entrée vers bucket Supabase `input-image`
- Appelle Replicate (modèle `google/nano-banana`)
- Stocke l'image générée dans bucket `output-image`
- **Insère automatiquement** une ligne dans la table `projects` avec :
  - `user_id` (UUID de l'utilisateur authentifié)
  - `title` (depuis le formulaire)
  - `description` (le prompt)
  - `image_path` (chemin de l'image de sortie)
  - `input_image_path` (chemin de l'image d'entrée)

#### `/api/projects` (GET)
- Retourne la liste des projets de l'utilisateur connecté
- Filtre avec `WHERE user_id = auth.uid()`

#### `/api/delete` (POST)
- Supprime un projet et ses images des buckets
- Vérifie que l'utilisateur est propriétaire du projet
- Supprime les fichiers des buckets `input-image` et `output-image`
- Supprime la ligne de la table `projects`

## 📦 Installation

### 1. Installer les dépendances

Les packages suivants sont déjà dans `package.json` :

```json
{
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/auth-helpers-react": "^0.5.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

Installez-les avec :

```bash
npm install
```

### 2. Configuration Supabase

#### Variables d'environnement

Créez un fichier `.env.local` à la racine :

```bash
cp .env.local.example .env.local
```

Puis remplissez :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
REPLICATE_API_TOKEN=votre-token-replicate
```

#### Configuration de la base de données

**Table `projects`** :

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  image_path TEXT NOT NULL,
  input_image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_projects_user_id ON projects(user_id);
```

**Row Level Security (RLS)** activée :

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy SELECT : un utilisateur peut voir ses propres projets
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Policy INSERT : un utilisateur peut créer ses propres projets
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy DELETE : un utilisateur peut supprimer ses propres projets
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);
```

#### Buckets Supabase Storage

Créez deux buckets :

1. **`input-image`** : pour les images uploadées
2. **`output-image`** : pour les images générées

Configurez les policies de storage :

```sql
-- Bucket input-image : lecture/écriture pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'input-image');

CREATE POLICY "Authenticated users can read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'input-image');

-- Bucket output-image : idem
CREATE POLICY "Authenticated users can upload output" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'output-image');

CREATE POLICY "Public can read output" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'output-image');
```

## 🏗️ Architecture

### Structure des fichiers créés

```
/
├── AuthContext.tsx                    # Context d'authentification
├── middleware.ts                      # Protection des routes
├── .env.local.example                 # Template des variables d'env
├── src/
│   ├── components/
│   │   ├── AuthForm.tsx              # Formulaire connexion/inscription
│   │   └── Header.tsx                # Header avec auth state
│   ├── pages/
│   │   ├── _app.tsx                  # Wrapper avec AuthProvider + Header
│   │   ├── index.tsx                 # Landing page avec CTA
│   │   ├── login.tsx                 # Page de connexion
│   │   ├── signup.tsx                # Page d'inscription
│   │   ├── dashboard.tsx             # Dashboard protégé
│   │   └── api/
│   │       ├── generate.ts           # Génération + insertion projet
│   │       ├── projects.ts           # Liste des projets utilisateur
│   │       └── delete.ts             # Suppression projet + images
│   ├── utils/
│   │   ├── supabaseClient.ts         # Client Supabase côté client
│   │   └── supabaseServer.ts         # Client Supabase côté serveur
│   └── styles/
│       └── globals.css               # Styles pour toutes les pages
```

### Flux d'authentification

1. **Inscription** : L'utilisateur remplit le formulaire sur `/signup`
2. **AuthContext** appelle `supabase.auth.signUp()` 
3. Supabase envoie un email de confirmation (optionnel selon config)
4. **onAuthStateChange** met à jour le state React
5. L'utilisateur est redirigé vers `/dashboard`

### Flux de génération d'image

1. L'utilisateur upload une image + prompt sur `/dashboard`
2. Le formulaire envoie une requête POST à `/api/generate`
3. **API generate** :
   - Vérifie l'authentification
   - Upload l'image vers `input-image`
   - Appelle Replicate pour transformation
   - Stocke le résultat dans `output-image`
   - Insère une ligne dans `projects` avec `user_id`
4. Le dashboard recharge la liste des projets via `/api/projects`

## 🚀 Lancement

### Mode développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

### Build de production

```bash
npm run build
npm start
```

## 🧪 Tests manuels

1. **Inscription** : Allez sur `/signup`, créez un compte
2. **Connexion** : Testez la connexion sur `/login`
3. **Dashboard protégé** : Tentez d'accéder à `/dashboard` sans être connecté → redirection
4. **Upload + génération** : Sur `/dashboard`, uploadez une image avec un prompt
5. **Galerie** : Vérifiez que seuls vos projets s'affichent
6. **Suppression** : Supprimez un projet et vérifiez la disparition

## 📝 Changements appliqués

### Fichiers créés
- ✅ `AuthContext.tsx` - Context d'authentification
- ✅ `middleware.ts` - Protection des routes
- ✅ `src/components/AuthForm.tsx` - Formulaire d'authentification
- ✅ `src/components/Header.tsx` - Header avec état auth
- ✅ `src/pages/login.tsx` - Page de connexion
- ✅ `src/pages/signup.tsx` - Page d'inscription
- ✅ `src/pages/dashboard.tsx` - Dashboard avec upload et galerie
- ✅ `src/pages/api/projects.ts` - API liste projets
- ✅ `src/pages/api/delete.ts` - API suppression projet
- ✅ `src/utils/supabaseClient.ts` - Client Supabase
- ✅ `src/utils/supabaseServer.ts` - Helper serveur
- ✅ `.env.local.example` - Template variables d'environnement

### Fichiers modifiés
- ✅ `src/pages/_app.tsx` - Ajout AuthProvider et Header
- ✅ `src/pages/index.tsx` - Transformation en landing page avec CTA
- ✅ `src/pages/api/generate.ts` - Ajout authentification et insertion dans `projects`
- ✅ `src/styles/globals.css` - Styles pour toutes les pages

## 🔐 Sécurité

- ✅ Middleware protège `/dashboard` et `/api/*`
- ✅ RLS activée sur la table `projects`
- ✅ Vérification de propriété avant suppression
- ✅ Policies storage limitant l'accès
- ✅ Service role key côté serveur uniquement

## 📚 Documentation Supabase

- [Auth Helpers Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

---

**Auteur** : Implémentation complète de l'authentification email/mot de passe avec Supabase pour Next.js
