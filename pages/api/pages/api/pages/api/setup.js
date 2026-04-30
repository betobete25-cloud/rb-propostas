const BASE_URL = "https://api.airtable.com/v0/meta/bases";
const BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const headers = {
    Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
    "Content-Type": "application/json"
  };

  try {
    const response = await fetch(`${BASE_URL}/${BASE_ID}/tables`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Propostas",
        fields: [
          { name: "Cliente", type: "singleLineText" },
          { name: "Contato", type: "singleLineText" },
          { name: "Campanha", type: "singleLineText" },
          { name: "Escopo", type: "multilineText" },
          { name: "Valor Proposto", type: "currency", options: { precision: 2, symbol: "R$" } },
          { name: "Valor Negociado", type: "currency", options: { precision: 2, symbol: "R$" } },
          { name: "Status", type: "singleSelect", options: { choices: [
            { name: "Aguardando resposta", color: "yellowLight2" },
            { name: "Em negociação", color: "blueLight2" },
            { name: "Aprovada", color: "greenLight2" },
            { name: "Recusada", color: "redLight2" },
            { name: "Follow-up enviado", color: "orangeLight2" }
          ]}},
          { name: "Pagamento", type: "singleLineText" },
          { name: "Exclusividade", type: "singleLineText" },
          { name: "Email Recebido", type: "multilineText" },
          { name: "Email Enviado", type: "multilineText" },
          { name: "Data Recebimento", type: "dateTime", options: { dateFormat: { name: "local" }, timeFormat: { name: "12hour" }, timeZone: "America/Sao_Paulo" } },
          { name: "Data Resposta", type: "dateTime", options: { dateFormat: { name: "local" }, timeFormat: { name: "12hour" }, timeZone: "America/Sao_Paulo" } },
          { name: "Observacoes", type: "multilineText" }
        ]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
