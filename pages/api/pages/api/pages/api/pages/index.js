import { useState, useEffect } from "react";

const STATUS_COLORS = {
  "Aguardando resposta": "#f59e0b",
  "Em negociação": "#3b82f6",
  "Aprovada": "#10b981",
  "Recusada": "#ef4444",
  "Follow-up enviado": "#f97316"
};

export default function Home() {
  const [tab, setTab] = useState("nova");
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [extracted, setExtracted] = useState(null);
  const [strategy, setStrategy] = useState("proposta_valor");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [selectedProposta, setSelectedProposta] = useState(null);
  const [setupDone, setSetupDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (tab === "painel") loadPropostas(); }, [tab]);

  async function loadPropostas() {
    const res = await fetch("/api/propostas");
    const data = await res.json();
    setPropostas(data.records || []);
  }

  async function handleSetup() {
    setLoading(true);
    await fetch("/api/setup", { method: "POST" });
    setSetupDone(true);
    setLoading(false);
    alert("Base configurada com sucesso!");
  }

  async function handleExtract() {
    if (!emailInput.trim()) return;
    setLoading(true);
    setExtracted(null);
    setGeneratedEmail("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", emailContent: emailInput })
      });
      const data = await res.json();
      setExtracted(data);
    } catch (e) {
      alert("Erro ao analisar e-mail");
    }
    setLoading(false);
  }

  async function handleGenerate() {
    if (!extracted) return;
    setLoading(true);
    setGeneratedEmail("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", proposalData: extracted, strategy })
      });
      const data = await res.json();
      setGeneratedEmail(data.email);
    } catch (e) {
      alert("Erro ao gerar resposta");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!extracted || !generatedEmail) return;
    setLoading(true);
    await fetch("/api/propostas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Cliente: extracted.cliente || "",
        Contato: extracted.contato || "",
        Campanha: extracted.campanha || "",
        Escopo: Array.isArray(extracted.escopo) ? extracted.escopo.join("\n") : "",
        "Valor Proposto": parseFloat(extracted.valor_proposto?.replace(/[^0-9.]/g, "")) || 0,
        Status: "Aguardando resposta",
        Pagamento: extracted.pagamento || "30 dias após NF",
        Exclusividade: extracted.exclusividade || "Não",
        "Email Recebido": emailInput,
        "Email Enviado": generatedEmail,
        "Data Recebimento": new Date().toISOString()
      })
    });
    alert("Proposta salva no Airtable!");
    setEmailInput("");
    setExtracted(null);
    setGeneratedEmail("");
    setLoading(false);
  }

  async function handleFollowup(proposta) {
    setLoading(true);
    const fields = proposta.fields;
    const diasSemResposta = Math.floor((new Date() - new Date(fields["Data Recebimento"])) / (1000 * 60 * 60 * 24));
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "followup",
        proposalData: {
          cliente: fields.Cliente,
          contato: fields.Contato,
          campanha: fields.Campanha,
          dias_sem_resposta: diasSemResposta
        }
      })
    });
    const data = await res.json();
    setSelectedProposta({ ...proposta, followupEmail: data.email });
    setLoading(false);
  }

  async function handleUpdateStatus(id, status) {
    await fetch("/api/propostas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, Status: status })
    });
    loadPropostas();
  }

  function copyToClipboard(text) {
    const plain = text.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const styles = {
    container: { minHeight: "100vh", background: "#0f0f13", color: "#e8e8e8", fontFamily: "'Inter', sans-serif" },
    header: { background: "#1a1a24", borderBottom: "1px solid #2a2a3a", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 },
    logo: { width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "white" },
    title: { fontSize: 20, fontWeight: 700, color: "#fff" },
    subtitle: { fontSize: 13, color: "#888", marginTop: 2 },
    tabs: { display: "flex", gap: 4, padding: "0 32px", background: "#1a1a24", borderBottom: "1px solid #2a2a3a" },
    tab: (active) => ({ padding: "14px 20px", cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "#a855f7" : "#888", borderBottom: active ? "2px solid #a855f7" : "2px solid transparent", transition: "all 0.2s", background: "none", border: "none", borderBottom: active ? "2px solid #a855f7" : "2px solid transparent" }),
    main: { padding: "32px", maxWidth: 900, margin: "0 auto" },
    card: { background: "#1a1a24", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid #2a2a3a" },
    label: { fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "block" },
    textarea: { width: "100%", background: "#0f0f13", border: "1px solid #2a2a3a", borderRadius: 8, padding: 14, color: "#e8e8e8", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
    input: { width: "100%", background: "#0f0f13", border: "1px solid #2a2a3a", borderRadius: 8, padding: "10px 14px", color: "#e8e8e8", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
    btnPrimary: { background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s" },
    btnSecondary: { background: "#2a2a3a", color: "#e8e8e8", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
    btnSuccess: { background: "#065f46", color: "#6ee7b7", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer" },
    tag: (color) => ({ background: color + "22", color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }),
    propostaCard: { background: "#0f0f13", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid #2a2a3a", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 },
    strategyOption: (active) => ({ background: active ? "#2d1f4e" : "#0f0f13", border: active ? "1px solid #7c3aed" : "1px solid #2a2a3a", borderRadius: 8, padding: "12px 16px", cursor: "pointer", marginBottom: 8, transition: "all 0.2s" }),
    emailPreview: { background: "#0f0f13", border: "1px solid #2a2a3a", borderRadius: 8, padding: 20, fontSize: 14, lineHeight: 1.7, color: "#d1d5db" },
    badge: { background: "#2a2a3a", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#888" },
    flexRow: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
    chip: { background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#a78bfa" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>RB</div>
        <div>
          <div style={styles.title}>RB Propostas</div>
          <div style={styles.subtitle}>Sistema Comercial — Roberto Bete</div>
        </div>
      </div>

      <div style={styles.tabs}>
        {[["nova", "✉️  Nova Proposta"], ["painel", "📊  Painel"], ["config", "⚙️  Configuração"]].map(([key, label]) => (
          <button key={key} style={styles.tab(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div style={styles.main}>

        {/* ===== ABA NOVA PROPOSTA ===== */}
        {tab === "nova" && (
          <>
            <div style={styles.card}>
              <label style={styles.label}>Cole o e-mail da marca aqui</label>
              <textarea
                style={{ ...styles.textarea, minHeight: 180 }}
                placeholder="Cole aqui o e-mail completo recebido da marca ou agência..."
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
              />
              <div style={{ marginTop: 16 }}>
                <button style={styles.btnPrimary} onClick={handleExtract} disabled={loading || !emailInput.trim()}>
                  {loading && !extracted ? "⏳ Analisando..." : "🔍 Analisar E-mail"}
                </button>
              </div>
            </div>

            {extracted && (
              <>
                <div style={styles.card}>
                  <div style={styles.sectionTitle}>📋 Informações Extraídas</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    {[["Cliente", extracted.cliente], ["Contato", extracted.contato], ["Tipo", extracted.tipo], ["Pagamento", extracted.pagamento || "Não informado"]].map(([k, v]) => (
                      <div key={k}>
                        <span style={styles.label}>{k}</span>
                        <div style={{ color: "#e8e8e8", fontSize: 15, fontWeight: 500 }}>{v || "—"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <span style={styles.label}>Campanha</span>
                    <div style={{ color: "#e8e8e8", fontSize: 15 }}>{extracted.campanha}</div>
                  </div>
                  {extracted.escopo && extracted.escopo.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <span style={styles.label}>Escopo</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {extracted.escopo.map((item, i) => <span key={i} style={styles.chip}>{item}</span>)}
                      </div>
                    </div>
                  )}
                  <div style={styles.flexRow}>
                    {extracted.valor_proposto && <span style={styles.tag("#f59e0b")}>💰 {extracted.valor_proposto}</span>}
                    {extracted.pede_endereco && <span style={styles.tag("#10b981")}>📦 Pede endereço</span>}
                    {extracted.inclui_noah && <span style={styles.tag("#a855f7")}>👶 Inclui Noah</span>}
                    {extracted.exclusividade && extracted.exclusividade !== "Não" && extracted.exclusividade !== "não" && <span style={styles.tag("#ef4444")}>🔒 Exclusividade</span>}
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.sectionTitle}>🎯 Estratégia de Resposta</div>
                  {[
                    ["proposta_valor", "💼 Apresentar meu valor", "Enviar orçamento completo com o preço cheio e justificativa de valor"],
                    ["aceitar_valor", "✅ Aceitar proposta da marca", "A marca já enviou um valor e você quer aceitar"],
                    ["contraproposta", "🤝 Fazer contraproposta", "A marca enviou um valor mas você quer negociar para cima"]
                  ].map(([key, title, desc]) => (
                    <div key={key} style={styles.strategyOption(strategy === key)} onClick={() => setStrategy(key)}>
                      <div style={{ fontWeight: 600, color: strategy === key ? "#a855f7" : "#e8e8e8", fontSize: 14 }}>{title}</div>
                      <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>{desc}</div>
                    </div>
                  ))}

                  {strategy === "aceitar_valor" && (
                    <div style={{ marginTop: 12 }}>
                      <label style={styles.label}>Valor proposto pela marca</label>
                      <input style={styles.input} placeholder="Ex: R$ 5.000,00" value={extracted.valor_proposto || ""} onChange={e => setExtracted({ ...extracted, valor_proposto: e.target.value })} />
                    </div>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <button style={styles.btnPrimary} onClick={handleGenerate} disabled={loading}>
                      {loading && generatedEmail === "" ? "⏳ Gerando resposta..." : "✨ Gerar Resposta com IA"}
                    </button>
                  </div>
                </div>

                {generatedEmail && (
                  <div style={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={styles.sectionTitle}>📧 Resposta Gerada</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={styles.btnSecondary} onClick={() => copyToClipboard(generatedEmail)}>
                          {copied ? "✅ Copiado!" : "📋 Copiar"}
                        </button>
                        <button style={styles.btnPrimary} onClick={handleGenerate} disabled={loading}>🔄 Regenerar</button>
                      </div>
                    </div>
                    <div style={styles.emailPreview} dangerouslySetInnerHTML={{ __html: generatedEmail }} />
                    <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                      <button style={styles.btnSuccess} onClick={handleSave} disabled={loading}>
                        {loading ? "Salvando..." : "💾 Salvar no Airtable"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ===== ABA PAINEL ===== */}
        {tab === "painel" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={styles.sectionTitle}>Todas as Propostas</div>
              <button style={styles.btnSecondary} onClick={loadPropostas}>🔄 Atualizar</button>
            </div>

            {propostas.length === 0 ? (
              <div style={{ ...styles.card, textAlign: "center", color: "#888", padding: 48 }}>
                Nenhuma proposta salva ainda. Cole um e-mail na aba "Nova Proposta" para começar.
              </div>
            ) : propostas.map(p => {
              const f = p.fields;
              const diasSemResposta = f["Data Recebimento"] ? Math.floor((new Date() - new Date(f["Data Recebimento"])) / (1000 * 60 * 60 * 24)) : 0;
              const precisaFollowup = diasSemResposta >= 10 && f.Status === "Aguardando resposta";

              return (
                <div key={p.id} style={styles.propostaCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{f.Cliente || "Cliente"}</span>
                      <span style={styles.tag(STATUS_COLORS[f.Status] || "#888")}>{f.Status}</span>
                      {precisaFollowup && <span style={styles.tag("#ef4444")}>⚠️ {diasSemResposta}d sem resposta</span>}
                    </div>
                    <div style={{ color: "#888", fontSize: 13, marginBottom: 6 }}>{f.Campanha}</div>
                    <div style={styles.flexRow}>
                      {f["Valor Negociado"] ? <span style={styles.badge}>R$ {f["Valor Negociado"].toLocaleString("pt-BR")}</span> : f["Valor Proposto"] ? <span style={styles.badge}>R$ {f["Valor Proposto"].toLocaleString("pt-BR")}</span> : null}
                      <span style={styles.badge}>{f.Pagamento || "30d NF"}</span>
                      {f["Data Recebimento"] && <span style={styles.badge}>{new Date(f["Data Recebimento"]).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                    <select
                      style={{ ...styles.input, fontSize: 12 }}
                      value={f.Status}
                      onChange={e => handleUpdateStatus(p.id, e.target.value)}
                    >
                      {["Aguardando resposta", "Em negociação", "Aprovada", "Recusada", "Follow-up enviado"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {precisaFollowup && (
                      <button style={{ ...styles.btnSecondary, fontSize: 12, padding: "8px 12px" }} onClick={() => handleFollowup(p)} disabled={loading}>
                        📨 Gerar Follow-up
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {selectedProposta?.followupEmail && (
              <div style={{ ...styles.card, border: "1px solid #7c3aed" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={styles.sectionTitle}>📨 Follow-up para {selectedProposta.fields.Cliente}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={styles.btnSecondary} onClick={() => copyToClipboard(selectedProposta.followupEmail)}>
                      {copied ? "✅ Copiado!" : "📋 Copiar"}
                    </button>
                    <button style={styles.btnSecondary} onClick={() => setSelectedProposta(null)}>✕ Fechar</button>
                  </div>
                </div>
                <div style={styles.emailPreview} dangerouslySetInnerHTML={{ __html: selectedProposta.followupEmail }} />
              </div>
            )}
          </>
        )}

        {/* ===== ABA CONFIGURAÇÃO ===== */}
        {tab === "config" && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>⚙️ Configuração Inicial</div>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
              Clique no botão abaixo para criar a tabela "Propostas" no seu Airtable com todos os campos necessários. Faça isso apenas uma vez, na primeira vez que usar o sistema.
            </p>
            <button style={styles.btnPrimary} onClick={handleSetup} disabled={loading || setupDone}>
              {loading ? "⏳ Configurando..." : setupDone ? "✅ Configurado!" : "🚀 Configurar Airtable"}
            </button>
            {setupDone && (
              <p style={{ color: "#10b981", fontSize: 14, marginTop: 16 }}>
                ✅ Tabela criada com sucesso! Agora vá para a aba "Nova Proposta" e comece a usar.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
