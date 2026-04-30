import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail não fornecido' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especialista em extrair informações de e-mails comerciais. 
Analise o e-mail e retorne SOMENTE um JSON válido com os seguintes campos:
{
  "nome_cliente": "",
  "empresa": "",
  "cargo": "",
  "email_contato": "",
  "servico_solicitado": "",
  "detalhes": "",
  "urgencia": "",
  "observacoes": ""
}
Não inclua texto fora do JSON. Se um campo não for encontrado, deixe como string vazia.`,
        },
        {
          role: 'user',
          content: `Extraia as informações deste e-mail:\n\n${email}`,
        },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content.trim();
    const json = JSON.parse(raw);
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao extrair dados: ' + e.message });
  }
}
