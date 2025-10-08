import React, { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!file || !prompt) return;
    setLoading(true);
    setResultUrl('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('prompt', prompt);

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => ({}));
        const message = errorPayload?.error || 'Erreur lors de la génération';
        throw new Error(message);
      }

      const data = await res.json();
      setResultUrl(data.output_image_url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1 className="title">AI Image Editor</h1>
      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <textarea
          placeholder="Décris la transformation..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Génération en cours...' : 'Générer'}
        </button>
      </div>
      <div className="result">
        {resultUrl && <img src={resultUrl} alt="Image générée" style={{maxWidth: '100%'}} />}
      </div>
    </main>
  );
}
