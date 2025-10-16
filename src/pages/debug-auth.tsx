import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function DebugAuth() {
  const { user, session } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setTestResult({ error: 'Pas de session trouvée' });
        setLoading(false);
        return;
      }

      console.log('🔑 Token:', session.access_token.substring(0, 50) + '...');
      
      const res = await fetch('/api/projects', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await res.json();
      setTestResult({
        status: res.status,
        data: data,
        token: session.access_token.substring(0, 50) + '...'
      });
    } catch (err: any) {
      setTestResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug Authentification</h1>
      
      <section style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Informations utilisateur</h2>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify({ 
            user: user ? { id: user.id, email: user.email } : null,
            hasSession: !!session 
          }, null, 2)}
        </pre>
      </section>

      <section style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Test API /api/projects</h2>
        <button 
          onClick={testAPI} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            background: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Test en cours...' : 'Tester l\'API'}
        </button>
        
        {testResult && (
          <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginTop: '20px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>💡 Instructions</h3>
        <ol>
          <li>Vérifiez que vous êtes connecté (section "Informations utilisateur")</li>
          <li>Cliquez sur "Tester l'API" pour voir ce que /api/projects renvoie</li>
          <li>Ouvrez la console du navigateur (F12) pour voir les logs détaillés</li>
        </ol>
      </section>
    </div>
  );
}
