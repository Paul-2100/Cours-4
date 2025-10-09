import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../utils/supabaseClient';

type Project = {
  id: string;
  title: string;
  prompt: string;
  image_path: string;
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  async function fetchProjects() {
    const res = await fetch('/api/projects');
    if (!res.ok) return;
    const data = await res.json();
    setProjects(data.projects ?? []);
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) return alert('Sélectionne un fichier et entre un prompt');
    setLoading(true);
    const form = new FormData();
    form.append('image', file);
    form.append('title', title || 'Sans titre');
    form.append('prompt', prompt);

    const res = await fetch('/api/generate', { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Erreur');
      setLoading(false);
      return;
    }
    setLoading(false);
    setTitle('');
    setPrompt('');
    setFile(null);
    await fetchProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return;
    const res = await fetch('/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (!res.ok) return alert('Erreur suppression');
    await fetchProjects();
  };

  return (
    <main className="dashboard">
      <h1>Mon espace</h1>
      <section className="upload">
        <h2>Créer un projet</h2>
        <form onSubmit={handleUpload}>
          <input type="text" placeholder="Titre (optionnel)" value={title} onChange={e => setTitle(e.target.value)} />
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
              const { data } = supabase.storage.from('output-image').getPublicUrl(p.image_path);
              const imageUrl = data?.publicUrl || '';
              
              return (
                <div key={p.id} className="card">
                  <img 
                    src={imageUrl} 
                    alt={p.title} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <h3>{p.title}</h3>
                  <p>{p.prompt}</p>
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
