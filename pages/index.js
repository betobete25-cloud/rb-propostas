import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [proposta, setProposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  async function gerarProposta() {
    setLoading(true);
    setProposta('');
    setMensagem('');
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    setProposta(data.proposta || data.error);
    setLoading(false);
  }

  async function salvarProposta() {
    setSalvando(true);
    const res = await fetch('/api/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, proposta }),
    });
    const data = await res.json();
    setMensagem(data.ok ? '✅ Proposta salva no Airtable!' : '❌ Erro ao salvar.');
    setSalvando(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32, fontFamily: 'sans-serif' }}>
      <h1>RB Propostas</h1>
      <textarea
        rows={5}
        style={{ width: '100%', padding: 12, fontSize: 16 }}
        placeholder="Descreva o cliente e o serviço para gerar a proposta..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <br />
      <button onClick={gerarProposta} disabled={loading} style={{ marginTop: 12, padding: '10px 24px', fontSize: 16 }}>
        {loading ? 'Gerando...' : 'Gerar Proposta'}
      </button>

      {proposta && (
        <div style={{ marginTop: 24, background: '#f4f4f4', padding: 20, borderRadius: 8 }}>
          <h2>Proposta Gerada</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{proposta}</pre>
          <button onClick={salvarProposta} disabled={salvando} style={{ marginTop: 12, padding: '10px 24px', fontSize: 16 }}>
            {salvando ? 'Salvando...' : 'Salvar no Airtable'}
          </button>
          {mensagem && <p style={{ marginTop: 12 }}>{mensagem}</p>}
        </div>
      )}
    </div>
  );
}
