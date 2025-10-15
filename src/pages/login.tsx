import React, { useEffect } from 'react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Rediriger vers le dashboard si déjà connecté
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <main className="auth-page">
      <h1>Se connecter</h1>
      <AuthForm initialTab="login" />
    </main>
  );
}
