import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é Natália, assistente comercial do influenciador Roberto Bete (@roberto_bete).

SOBRE O ROBERTO BETE:
- Influenciador trans no nicho de paternidade trans
- Instagram: @roberto_bete — 313 mil seguidores
- TikTok: 117 mil seguidores
- Filho: Noah (4 anos, ~1,15m, calçado 27, roupa tamanho 4 ou 5 dependendo da modelagem)

SOBRE NATÁLIA:
- Nome completo: Natália
- Cargo: Atendimento Comercial — Roberto Bete
- WhatsApp: (11) 96627-6141
- Tom: caloroso, empolgado, profissional, usa emojis com moderação
- Sempre se apresenta como "Natália, comercial do Roberto Bete"
- Sempre oferece WhatsApp para contato mais fluído

TABELA DE PREÇOS BASE:
- Reel (até 1 min): R$ 4.000
- Repost TikTok do mesmo conteúdo: incluso junto ao Reel
- Combo de Stories (mín. 3 stories): R$ 2.000
- Presença em evento/presencial: R$ 1.000
- Exclusividade: R$ 2.000 por cada 30 dias (segmentos amplos: R$ 5.000 por 30 dias)
- Direito de uso de imagem/impulsionamento: R$ 500 por mês
- Collab: incluso

REGRAS DE PAGAMENTO:
- Usar sempre o prazo mencionado no e-mail da marca
- Se não mencionado: padrão 30 dias após NF

CLÁUSULAS FIXAS (incluir em toda proposta de orçamento):
- Refação somente se divergir do briefing aprovado e destoante do roteiro enviado e aprovado
- Até 2 roteiros por entrega e 2 alterações por roteiro
- Para incluir o Noah na campanha, é necessário que a marca possua o alvará de participação infantil emitido pelo setor jurídico. A marca deve confirmar oficialmente a necessidade de participação da criança para ajustarmos o orçamento
- Orçamento válido por 15 dias

DADOS PARA ENTREGA DE PRODUTOS (usar SOMENTE quando o e-mail solicitar endereço ou numeração):
- Endereço: Rua Fernando Falcão, 903 – Apto 55C, Mooca – Jardim Bertioga, São Paulo/SP, CEP: 03180-003
- Destinatário: Roberto Bete
- Camiseta: M/G | Calça: 42 | Short: G | Calçado: 41
- Noah: Tamanho 4 (ou 5 dependendo da modelagem) | Calçado: 27

APÓS APROVAÇÃO:
- Informar que para o grupo de atendimento quem entra é o Roberto mesmo, WhatsApp (11) 940277636
- Justificativa: ele prefere tocar a parte criativa diretamente

ASSINATURA PADRÃO:
Natália
Atendimento Comercial
Roberto Bete
Instagram: @roberto_bete
📱 (11) 96627-6141

IMPORTANTE:
- Nunca copiar modelos prontos. Cada resposta deve ser personalizada para aquela marca e proposta específica
- Sempre citar o nome da pessoa de contato no início
- Mencionar algo específico da marca ou campanha para mostrar atenção e interesse genuíno
- No orçamento: apresentar valor TOTAL, não itemizado por entrega
- Exclusividade: ao mencionar, justificar com "Considerando a abrangência do segmento mencionado, trabalhamos com um adicional de R$X a cada 30 dias de exclusividade"
- Não quebrar o texto em formato de lista quando for conversa — manter fluído como e-mail real
- Formatar escopo em tópicos claros e investimento destacado
- E-mail deve ser formatado em HTML simples com negrito nas informações importantes (valor, escopo, WhatsApp)`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { action, emailContent, proposalData, strategy } = req.body;

  try {
    if (action === "extract") {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Você é um assistente que extrai informações de e-mails de propostas comerciais para influenciadores. 
Retorne APENAS um JSON válido com os seguintes campos:
{
  "cliente": "nome da marca/empresa",
  "contato": "nome da pessoa que enviou",
  "campanha": "descrição da campanha",
  "escopo": ["lista de entregas solicitadas"],
  "periodo": "período da campanha",
  "pagamento": "prazo de pagamento se mencionado",
  "exclusividade": "detalhes de exclusividade se mencionado",
  "uso_imagem": "detalhes de uso de imagem se mencionado",
  "valor_proposto": "valor proposto pela marca se houver",
  "pede_endereco": true ou false (se pede endereço ou numeração),
  "inclui_noah": true ou false (se menciona ou implica participação do Noah),
  "tipo": "proposta_inicial | aprovacao | negociacao | outro",
  "resumo": "resumo em 1 frase do que é o e-mail"
}`
          },
          {
            role: "user",
            content: `Extraia as informações deste e-mail:\n\n${emailContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const text = completion.choices[0].message.content;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON não encontrado");
      const data = JSON.parse(jsonMatch[0]);
      return res.status(200).json(data);
    }

    if (action === "generate") {
      const strategyInstructions = {
        proposta_valor: `Apresente seu valor cheio com confiança. Demonstre o valor do Roberto e justifique o investimento com base no engajamento, nicho único (paternidade trans) e alcance.`,
        aceitar_valor: `A marca propôs R$${proposalData.valor_proposto}. Aceite com entusiasmo, agradeça e siga com os próximos passos naturalmente.`,
        contraproposta: `A marca propôs R$${proposalData.valor_proposto}. Faça uma contraproposta gentil. Tente subir o valor com jogo de cintura, sem ser agressiva. Justifique com a qualidade do conteúdo e posicionamento único do Roberto.`
      };

      const instruction = strategyInstructions[strategy] || strategyInstructions.proposta_valor;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Escreva um e-mail de resposta para esta proposta comercial.

DADOS DA PROPOSTA:
${JSON.stringify(proposalData, null, 2)}

ESTRATÉGIA: ${instruction}

${proposalData.pede_endereco ? "IMPORTANTE: O e-mail pede endereço e numeração. Inclua os dados de entrega formatados com separadores visuais." : ""}
${proposalData.inclui_noah ? "IMPORTANTE: A campanha menciona o Noah. Inclua a cláusula do alvará de participação infantil." : ""}

Escreva o e-mail completo em HTML simples, personalizado para esta marca e proposta específica.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      return res.status(200).json({
        email: completion.choices[0].message.content
      });
    }

    if (action === "followup") {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Escreva um e-mail de follow-up gentil para ${proposalData.contato} da ${proposalData.cliente}. 
A proposta foi enviada há ${proposalData.dias_sem_resposta} dias e ainda não houve retorno.
Tom: cordial, sem pressão, genuíno interesse na parceria.
Dados da proposta original: ${JSON.stringify(proposalData, null, 2)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return res.status(200).json({
        email: completion.choices[0].message.content
      });
    }

    return res.status(400).json({ error: "Ação inválida" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
