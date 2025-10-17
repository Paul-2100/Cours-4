import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Download, Trash2, ImageIcon } from 'lucide-react';

type Project = {
  id: string;
  prompt: string;
  input_image_url: string;
  output_image_url: string;
  status: string;
  payment_status: string;
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Rediriger vers /login si non connecté
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  // Gérer le retour de Stripe Checkout
  useEffect(() => {
    const { session_id, canceled } = router.query;
    
    if (canceled) {
      alert('Paiement annulé');
      // Nettoyer l'URL
      router.replace('/dashboard', undefined, { shallow: true });
    }
    
    if (session_id && typeof session_id === 'string') {
      console.log('✅ Retour de Stripe avec session:', session_id);
      alert('Paiement confirmé ! Vous pouvez maintenant générer votre image.');
      // Nettoyer l'URL
      router.replace('/dashboard', undefined, { shallow: true });
      // Rafraîchir les projets
      fetchProjects();
    }
  }, [router.query]);

  async function fetchProjects() {
    try {
      // Récupérer le token d'accès depuis la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }
      
      if (!session) {
        console.error('No session found');
        // Forcer une reconnexion
        router.push('/login');
        return;
      }
      
      console.log('📡 Fetching projects with token:', session.access_token.substring(0, 30) + '...');
      
      const res = await fetch('/api/projects', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        console.error('Failed to fetch projects:', res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error('Error details:', errorData);
        return;
      }
      
      const data = await res.json();
      console.log('✅ Projects loaded:', data.projects?.length || 0);
      setProjects(data.projects ?? []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) return alert('Sélectionne un fichier et entre un prompt');
    setLoading(true);
    
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('prompt', prompt);

      // Récupérer le token d'accès
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée, reconnectez-vous');
        setLoading(false);
        return;
      }

      console.log('📦 Création de la session Stripe...');
      
      // Appeler l'API pour créer la session Stripe Checkout
      const res = await fetch('/api/create-checkout-session', { 
        method: 'POST', 
        body: form,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erreur lors de la création de la session de paiement');
        setLoading(false);
        return;
      }
      
      // Récupérer l'URL de checkout
      const result = await res.json();
      console.log('✅ Session créée:', result.sessionId);
      
      // Rediriger vers Stripe Checkout
      if (result.url) {
        console.log('🔄 Redirection vers Stripe Checkout...');
        window.location.href = result.url;
      } else {
        alert('Erreur: URL de paiement non disponible');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleGenerate = async (projectId: string, inputImageUrl: string, promptText: string) => {
    if (!confirm('Lancer la génération de cette image ?')) return;
    
    setLoading(true);
    
    try {
      // Récupérer le token d'accès
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée, reconnectez-vous');
        setLoading(false);
        return;
      }

      // Télécharger l'image d'entrée
      const imageResponse = await fetch(inputImageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Créer le formulaire avec l'image et le prompt
      const form = new FormData();
      form.append('image', imageBlob, 'input-image.jpg');
      form.append('prompt', promptText);
      form.append('projectId', projectId);

      console.log('🎨 Lancement de la génération pour le projet:', projectId);
      
      // Appeler l'API de génération
      const res = await fetch('/api/generate', { 
        method: 'POST', 
        body: form,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erreur lors de la génération');
        setLoading(false);
        return;
      }
      
      const result = await res.json();
      console.log('✅ Génération terminée:', result);
      
      alert('Image générée avec succès !');
      
      // Rafraîchir les projets
      await fetchProjects();
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleFixUrls = async () => {
    if (!confirm('Réparer les URLs des images expirées pour tous vos projets ?')) return;
    
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expirée, reconnectez-vous');
        setLoading(false);
        return;
      }
      
      console.log('🔧 Réparation des URLs...');
      
      const res = await fetch('/api/fix-project-urls', { 
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erreur lors de la réparation');
        setLoading(false);
        return;
      }
      
      const result = await res.json();
      console.log('✅ Réparation terminée:', result);
      
      alert(`✅ Réparation réussie !\n\n${result.updated} projet(s) mis à jour\n${result.skipped} projet(s) déjà corrects`);
      
      // Rafraîchir les projets
      await fetchProjects();
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return;
    
    // Récupérer le token d'accès
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Session expirée, reconnectez-vous');
      return;
    }
    
    const res = await fetch('/api/delete', { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }, 
      body: JSON.stringify({ id }),
      credentials: 'include'
    });
    if (!res.ok) return alert('Erreur suppression');
    await fetchProjects();
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      // Récupérer l'image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement de l\'image');
    }
  };

  // Afficher un loader pendant la vérification de l'auth
  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-slate-600 text-lg">
                Transformez vos images avec l'IA en quelques secondes
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4 bg-white px-6 py-3 rounded-lg shadow-sm border border-slate-200">
              <div className="text-right">
                <p className="text-xs text-slate-500">Connecté en tant que</p>
                <p className="text-sm font-medium text-slate-900">{user?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center text-white font-semibold">
                {user?.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Section Upload - Design SaaS */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <Card className="lg:col-span-2 shadow-xl border-slate-200/60 bg-white/80 backdrop-blur">
            <CardHeader className="border-b border-slate-100 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      Créer un projet
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Uploadez votre image et décrivez la transformation
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="image" className="text-sm font-semibold text-slate-700">
                    Votre image
                  </Label>
                  <div className="relative">
                    <Input 
                      id="image"
                      type="file" 
                      accept="image/*" 
                      onChange={e => setFile(e.target.files?.[0] ?? null)} 
                      required 
                      className="cursor-pointer h-12 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-red-600 file:text-white hover:file:from-pink-600 hover:file:to-red-700 transition-all"
                    />
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                      <ImageIcon className="h-4 w-4" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="text-sm font-semibold text-slate-700">
                    Description de la transformation
                  </Label>
                  <textarea
                    id="prompt"
                    placeholder="Ex: Transforme cette photo en peinture impressionniste avec des couleurs vibrantes..."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    required
                    rows={4}
                    className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    Soyez précis pour obtenir les meilleurs résultats
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  size="lg"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 shadow-lg shadow-pink-500/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Préparation du paiement...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-5 w-5" />
                      Générer (2€)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-slate-200/60 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  💡 Conseils
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <div className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <p>Décrivez précisément le style souhaité</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <p>Mentionnez les couleurs, l'ambiance</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <p>La génération prend 10-20 secondes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-slate-200/60 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  📊 Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Projets créés</span>
                  <span className="text-2xl font-bold text-slate-900">{projects.length}</span>
                </div>
                <div className="h-px bg-slate-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Statut</span>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    Actif
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section Projets - Modernisée */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Mes projets</h2>
              <p className="text-slate-600 mt-1">
                {projects.length === 0 
                  ? "Aucun projet pour le moment" 
                  : `${projects.length} projet${projects.length > 1 ? 's' : ''} généré${projects.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
            {projects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFixUrls}
                disabled={loading}
                className="border-slate-300 hover:bg-slate-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualisation...
                  </>
                ) : (
                  <>
                    Actualiser
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-16 bg-white shadow-lg border-slate-200/60">
            <CardContent>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                <ImageIcon className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun projet créé</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Commencez par uploader une image et décrire la transformation que vous souhaitez réaliser
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">
                <span>👆</span>
                <span>Utilisez le formulaire ci-dessus pour créer votre premier projet</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => {
              const imageUrl = p.output_image_url || p.input_image_url || '';
              const filename = `projet-${p.id.substring(0, 8)}.jpg`;
              
              return (
                <Card key={p.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-slate-200/60 bg-white">
                  <CardHeader className="p-0 relative overflow-hidden">
                    {p.status === 'processing' && (
                      <Badge className="absolute top-3 right-3 z-10 bg-blue-500 text-white border-0 shadow-lg">
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        Génération...
                      </Badge>
                    )}
                    {p.payment_status === 'paid' && !p.output_image_url && p.status !== 'processing' && (
                      <Badge className="absolute top-3 right-3 z-10 bg-green-500 text-white border-0 shadow-lg">
                        ✓ Payé
                      </Badge>
                    )}
                    {p.payment_status === 'pending' && (
                      <Badge className="absolute top-3 right-3 z-10 bg-yellow-500 text-white border-0 shadow-lg">
                        En attente
                      </Badge>
                    )}
                    <div className="aspect-square relative bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={p.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f1f5f9" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="16"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{p.prompt}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 flex gap-2 bg-slate-50/50">
                    {p.payment_status === 'paid' && !p.output_image_url && p.status !== 'processing' ? (
                      <Button 
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white"
                        onClick={() => handleGenerate(p.id, p.input_image_url, p.prompt)}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Générer maintenant
                          </>
                        )}
                      </Button>
                    ) : p.output_image_url ? (
                      <Button 
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-200 hover:border-slate-300 hover:bg-white"
                        onClick={() => handleDownload(imageUrl, filename)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </Button>
                    ) : null}
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
