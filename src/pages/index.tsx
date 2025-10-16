import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../AuthContext';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Cloud, Lock, Wand2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-pink-500 to-red-600 rounded-full mb-6">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 bg-clip-text text-transparent">
            AI Image Editor
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto">
            Transformez vos images avec l'intelligence artificielle en quelques clics
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  <Wand2 className="mr-2 h-5 w-5" />
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Se connecter
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                Accéder à mon espace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Fonctionnalités</h2>
          <p className="text-xl text-slate-600">Tout ce dont vous avez besoin pour créer des images extraordinaires</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="bg-gradient-to-br from-pink-500 to-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Transformation IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Transformez vos images avec des prompts en langage naturel grâce à l'intelligence artificielle avancée
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Stockage cloud</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Tous vos projets sauvegardés automatiquement dans le cloud, accessibles partout
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Sécurisé</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Authentification robuste et données protégées avec les meilleures pratiques de sécurité
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-pink-500 to-red-600 border-0 text-white">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-4xl font-bold mb-4">
                Prêt à commencer ?
              </CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Créez votre compte gratuitement et commencez à transformer vos images dès maintenant
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Créer mon compte gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
