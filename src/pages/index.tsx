import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/router';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Rediriger automatiquement vers le dashboard si connecté
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <main className="landing">
      <section className="hero">
        <h1>AI Image Editor</h1>
        <p>Transformez vos images avec l'intelligence artificielle</p>
        {!user ? (
          <div className="cta">
            <Link href="/signup">
              <button className="primary-btn">Commencer gratuitement</button>
            </Link>
            <Link href="/login">
              <button className="secondary-btn">Se connecter</button>
            </Link>
          </div>
        ) : (
          <div className="cta">
            <Link href="/dashboard">
              <button className="primary-btn">Accéder à mon espace</button>
            </Link>
          </div>
        )}
      </section>
      
      <section className="features">
        <h2>Fonctionnalités</h2>
        <div className="feature-grid">
          <div className="feature">
            <h3>🎨 Transformation IA</h3>
            <p>Transformez vos images avec des prompts en langage naturel</p>
          </div>
          <div className="feature">
            <h3>☁️ Stockage cloud</h3>
            <p>Tous vos projets sauvegardés dans le cloud</p>
          </div>
          <div className="feature">
            <h3>🔒 Sécurisé</h3>
            <p>Authentification et données protégées</p>
          </div>
        </div>
      </section>
    </main>
  );
}
