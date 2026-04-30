const BASE_URL = "https://api.airtable.com/v0";
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE = "Propostas";

const headers = {
  Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
  "Content-Type": "application/json"
};

export default async function handler(req, res) {
  const url = `${BASE_URL}/${BASE_ID}/${TABLE}`;

  if (req.method === "GET") {
    const response = await fetch(`${url}?sort[0][field]=Data%20Recebimento&sort[0][direction]=desc`, { headers });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ fields: req.body })
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === "PATCH") {
    const { id, ...fields } = req.body;
    const response = await fetch(`${url}/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields })
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    const response = await fetch(`${url}/${id}`, { method: "DELETE", headers });
    const data = await response.json();
    return res.status(200).json(data);
  }
}
