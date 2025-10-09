# AI Image Editor avec Authentification Supabase

Application Next.js permettant de transformer des images avec l'IA (Replicate) et authentification complète email/mot de passe via Supabase.

## ✨ Fonctionnalités

- 🔐 **Authentification complète** : Inscription, connexion, déconnexion avec Supabase Auth
- 🎨 **Transformation d'images IA** : Upload et transformation via Replicate (modèle google/nano-banana)
- 📦 **Stockage cloud** : Images stockées dans Supabase Storage
- 👤 **Espace personnel** : Dashboard protégé avec galerie de projets par utilisateur
- 🔒 **Sécurité** : Row Level Security (RLS), middleware de protection, policies storage
- 🗑️ **Gestion de projets** : Suppression de projets avec nettoyage automatique des images

## 🏗️ Architecture

### Pages
- `/` - Landing page avec CTA vers inscription
- `/login` - Page de connexion
- `/signup` - Page d'inscription
- `/dashboard` - Dashboard protégé (upload + galerie personnelle)

### API Routes
- `POST /api/generate` - Génération d'image + insertion dans la base avec `user_id`
- `GET /api/projects` - Liste des projets de l'utilisateur connecté
- `POST /api/delete` - Suppression d'un projet + nettoyage storage

### Composants
- `AuthContext.tsx` - Context React avec `useAuth()` hook
- `Header.tsx` - Header avec état d'authentification
- `AuthForm.tsx` - Formulaire connexion/inscription avec validation

## 🚀 Installation

### 1. Cloner et installer

```bash
git clone <repository-url>
cd "Cours 4"
npm install
```

### 2. Configuration Supabase

#### Variables d'environnement

Créez `.env.local` à la racine :

```bash
cp .env.local.example .env.local
```

Remplissez avec vos clés Supabase et Replicate :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
REPLICATE_API_TOKEN=votre-token-replicate
```

#### Configuration base de données

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

CREATE INDEX idx_projects_user_id ON projects(user_id);
```

**Row Level Security** :

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);
```

#### Buckets Storage

Créez deux buckets dans Supabase Storage :
- `input-image` - Pour les images uploadées
- `output-image` - Pour les images générées

Policies storage :

```sql
-- input-image : authentifié seulement
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'input-image');

CREATE POLICY "Authenticated users can read input" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'input-image');

-- output-image : public en lecture
CREATE POLICY "Authenticated users can upload output" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'output-image');

CREATE POLICY "Public can read output" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'output-image');
```

### 3. Lancer l'application

**Mode développement** :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

**Build production** :

```bash
npm run build
npm start
```

## 📖 Utilisation

### Première connexion

1. Allez sur [http://localhost:3000](http://localhost:3000)
2. Cliquez sur "Commencer gratuitement"
3. Créez un compte avec email/mot de passe
4. Vous êtes automatiquement redirigé vers `/dashboard`

### Générer une image

1. Sur `/dashboard`, remplissez le formulaire :
   - **Titre** (optionnel) : nom de votre projet
   - **Image** : uploadez une image
   - **Prompt** : décrivez la transformation souhaitée
2. Cliquez sur "Générer"
3. L'image générée apparaît dans votre galerie "Mes projets"

### Gérer vos projets

- **Visualiser** : Tous vos projets s'affichent dans la galerie
- **Supprimer** : Cliquez sur "Supprimer" sur un projet pour le retirer (supprime aussi les images des buckets)

## 🔒 Sécurité

- ✅ **Middleware Next.js** protège `/dashboard` et `/api/*`
- ✅ **RLS Supabase** empêche l'accès inter-utilisateurs
- ✅ **Vérification de propriété** avant suppression
- ✅ **Service role key** côté serveur uniquement
- ✅ **Validation** des entrées (email, mot de passe)

## 📁 Structure du projet

```
/
├── AuthContext.tsx                    # Context d'authentification
├── middleware.ts                      # Protection des routes
├── .env.local.example                 # Template variables d'env
├── IMPLEMENTATION.md                  # Documentation détaillée
├── src/
│   ├── components/
│   │   ├── AuthForm.tsx              # Formulaire auth
│   │   ├── Header.tsx                # Header avec état auth
│   │   ├── Editor.tsx                # (existant)
│   │   ├── ImageUpload.tsx           # (existant)
│   │   └── Toolbar.tsx               # (existant)
│   ├── pages/
│   │   ├── _app.tsx                  # Wrapper AuthProvider
│   │   ├── index.tsx                 # Landing page
│   │   ├── login.tsx                 # Page connexion
│   │   ├── signup.tsx                # Page inscription
│   │   ├── dashboard.tsx             # Dashboard protégé
│   │   └── api/
│   │       ├── generate.ts           # Génération + insertion
│   │       ├── projects.ts           # Liste projets
│   │       └── delete.ts             # Suppression projet
│   ├── utils/
│   │   ├── ai.ts                     # (existant)
│   │   ├── supabaseClient.ts         # Client Supabase
│   │   └── supabaseServer.ts         # Helper serveur
│   └── styles/
│       └── globals.css               # Styles complets
```

## 🧪 Tests

### Tests manuels recommandés

1. **Inscription** : Créez un compte sur `/signup`
2. **Connexion** : Testez la connexion sur `/login`
3. **Protection** : Accédez à `/dashboard` sans auth → redirection `/login`
4. **Génération** : Uploadez une image avec prompt
5. **Isolation** : Créez 2 comptes, vérifiez que chaque utilisateur voit uniquement ses projets
6. **Suppression** : Supprimez un projet, vérifiez disparition de la galerie

## 📚 Documentation

- [Documentation complète](./IMPLEMENTATION.md) - Détails d'implémentation
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Replicate API](https://replicate.com/docs)

## 🛠️ Technologies

- **Next.js** - Framework React
- **TypeScript** - Typage statique
- **Supabase** - Backend (Auth, Database, Storage)
- **Replicate** - API de génération d'images IA
- **@supabase/auth-helpers-nextjs** - Helpers d'authentification

## 📦 Dépendances principales

```json
{
  "@supabase/auth-helpers-nextjs": "^0.10.0",
  "@supabase/auth-helpers-react": "^0.5.0",
  "@supabase/supabase-js": "^2.0.0",
  "replicate": "^1.0.0",
  "next": "latest",
  "react": "latest"
}
```

## 🤝 Contribution

Les contributions sont bienvenues ! Pour des améliorations ou nouvelles fonctionnalités :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrez une Pull Request

## 📝 Licence

MIT License - voir le fichier LICENSE pour plus de détails

---

**Note** : Cette application a été développée avec une authentification complète Supabase, RLS activée et protection des routes. Consultez `IMPLEMENTATION.md` pour tous les détails techniques.
