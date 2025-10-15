import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/router';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      alert('Erreur lors de la déconnexion');
    }
  };

  return (
    <header className="site-header">
      <div className="left">
        <Link href="/" className="logo-link">
          <span className="logo-icon">✨</span>
          <span className="logo-text">AI Image Editor</span>
        </Link>
      </div>
      <div className="right">
        {user ? (
          <>
            <span className="email">{user.email}</span>
            <button onClick={handleSignOut}>Se déconnecter</button>
          </>
        ) : (
          <>
            <Link href="/login">Se connecter</Link>
            <Link href="/signup">S'inscrire</Link>
          </>
        )}
      </div>
    </header>
  );
}
