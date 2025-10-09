import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../utils/supabaseClient';

type Project = {
  id: string;
  title: string;
  description: string;
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
    form.append('description', prompt);

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
        <div className="grid">
          {projects.map(p => (
            <div key={p.id} className="card">
              {(() => {
                try {
                  const { data } = supabase.storage.from('output-image').getPublicUrl(p.image_path);
                  return <img src={data?.publicUrl ?? ''} alt={p.title} />;
                } catch (e) {
                  return <img src="" alt={p.title} />;
                }
              })()}
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <button onClick={() => handleDelete(p.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
