import React from 'react';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
  return (
    <main className="auth-page">
      <h1>Se connecter</h1>
      <AuthForm initialTab="login" />
    </main>
  );
}
