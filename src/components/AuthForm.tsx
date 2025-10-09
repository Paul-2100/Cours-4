import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../AuthContext';

type Props = {
  initialTab?: 'login' | 'signup';
};

export default function AuthForm({ initialTab = 'login' }: Props) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  const validate = () => {
    if (!email.includes('@')) return 'Email invalide';
    if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      if (tab === 'signup') {
        const { error } = await auth.signUp(email, password);
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await auth.signIn(email, password);
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="tabs">
        <button className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Connexion</button>
        <button className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>Inscription</button>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
  {error && <div className="error">{error}</div>}
  <button type="submit" disabled={loading}>{loading ? 'Chargement...' : (tab === 'signup' ? "S'inscrire" : 'Se connecter')}</button>
      </form>
    </div>
  );
}
