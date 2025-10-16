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
      alert(err.error || 'Erreur');
      setLoading(false);
      return;
    }
    
    // Récupérer la réponse avec l'URL de l'image générée
    const result = await res.json();
    console.log('✅ Génération terminée:', result);
    
    setLoading(false);
    setPrompt('');
    setFile(null);
    
    // Rafraîchir la liste des projets
    await fetchProjects();
    
    // Afficher une confirmation
    alert('Image générée avec succès ! Visible dans "Mes projets" ci-dessous.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
            Mon espace
          </h1>
          <p className="text-slate-600">Créez et gérez vos projets de transformation d'images par IA</p>
        </div>

        {/* Section Upload */}
        <Card className="mb-12 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Créer un nouveau projet
            </CardTitle>
            <CardDescription>
              Téléchargez une image et décrivez la transformation souhaitée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <Input 
                  id="image"
                  type="file" 
                  accept="image/*" 
                  onChange={e => setFile(e.target.files?.[0] ?? null)} 
                  required 
                  className="cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prompt">Description de la transformation</Label>
                <textarea
                  id="prompt"
                  placeholder="Ex: Transforme cette image en style cartoon coloré..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  required
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Générer
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Section Projets */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Mes projets</h2>
          <p className="text-slate-600">
            {projects.length === 0 
              ? "Aucun projet pour le moment" 
              : `${projects.length} projet${projects.length > 1 ? 's' : ''}`
            }
          </p>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 mb-2">Aucun projet pour le moment</p>
              <p className="text-sm text-slate-400">Créez votre premier projet ci-dessus !</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => {
              const imageUrl = p.output_image_url || p.input_image_url || '';
              const filename = `projet-${p.id.substring(0, 8)}.jpg`;
              
              return (
                <Card key={p.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <CardHeader className="p-0 relative">
                    {p.status === 'processing' && (
                      <Badge className="absolute top-2 right-2 z-10" variant="secondary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        En cours...
                      </Badge>
                    )}
                    <div className="aspect-square relative bg-slate-100">
                      <img 
                        src={imageUrl} 
                        alt={p.prompt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f1f5f9" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="16"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-700 line-clamp-2">{p.prompt}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(imageUrl, filename)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm"
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
