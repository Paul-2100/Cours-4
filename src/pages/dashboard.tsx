import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../utils/supabaseClient';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  async function fetchProjects() {
    // Récupérer le token d'accès depuis la session Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No session found');
      return;
    }
    
    const res = await fetch('/api/projects', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (!res.ok) {
      console.error('Failed to fetch projects:', res.status);
      return;
    }
    const data = await res.json();
    setProjects(data.projects ?? []);
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

  return (
    <main className="dashboard">
      <h1>Mon espace</h1>
      <section className="upload">
        <h2>Créer un projet</h2>
        <form onSubmit={handleUpload}>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
          <textarea placeholder="Décris la transformation..." value={prompt} onChange={e => setPrompt(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Génération...' : 'Générer'}</button>
        </form>
      </section>

      <section className="projects">
        <h2>Mes projets</h2>
        {projects.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '32px' }}>
            Aucun projet pour le moment. Créez votre premier projet ci-dessus !
          </p>
        ) : (
          <div className="grid">
            {projects.map(p => {
              const imageUrl = p.output_image_url || p.input_image_url || '';
              
              return (
                <div key={p.id} className="card">
                  {p.status === 'processing' && (
                    <div className="processing-badge">⏳ En cours...</div>
                  )}
                  <img 
                    src={imageUrl} 
                    alt={p.prompt} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <p className="prompt">{p.prompt}</p>
                  <button onClick={() => handleDelete(p.id)}>Supprimer</button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
