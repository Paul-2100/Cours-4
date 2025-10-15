import React, { useEffect } from 'react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/router';

export default function SignupPage() {
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
      <h1>S'inscrire</h1>
      <AuthForm initialTab="signup" />
    </main>
  );
}
