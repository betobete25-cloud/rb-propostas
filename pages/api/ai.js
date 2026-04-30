import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Dados não fornecidos' });

  let dados = {};
  try {
    dados = typeof prompt === 'string' ? JSON.parse(prompt) : prompt;
  } catch {
    dados = { detalhes: prompt };
  }

  const contexto = `
    Cliente: ${dados.nome_cliente || 'Não identificado'}
    Empresa: ${dados.empresa || 'Não identificada'}
    Cargo: ${dados.cargo || 'Não informado'}
    E-mail: ${dados.email_contato || 'Não informado'}
    Serviço solicitado: ${dados.servico_solicitado || 'Não especificado'}
    Detalhes: ${dados.detalhes || ''}
    Urgência: ${dados.urgencia || 'Normal'}
    Observações: ${dados.observacoes || ''}
  `;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: `Você é Roberto, um consultor comercial experiente e persuasivo. 
Redija propostas comerciais profissionais, calorosas e objetivas em português brasileiro.
A proposta deve ter:
- Saudação personalizada
- Apresentação da solução alinhada às necessidades do cliente
- Benefícios principais (3 a 5 pontos)
- Próximos passos sugeridos
- Encerramento convidativo
Use um tom profissional mas próximo. Não inclua valores/preços.`,
        },
        {
          role: 'user',
          content: `Escreva uma proposta comercial com base nestas informações:\n${contexto}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const proposta = completion.choices[0].message.content;
    return res.status(200).json({ proposta });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao gerar proposta: ' + e.message });
  }
}
