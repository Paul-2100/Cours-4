import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../AuthContext';

export default function Header() {
  const { user, signOut } = useAuth();

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
            <button onClick={() => signOut()}>Se déconnecter</button>
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
