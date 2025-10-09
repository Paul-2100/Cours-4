import React from 'react';
import AuthForm from '../components/AuthForm';

export default function SignupPage() {
  return (
    <main className="auth-page">
      <h1>S'inscrire</h1>
      <AuthForm initialTab="signup" />
    </main>
  );
}
