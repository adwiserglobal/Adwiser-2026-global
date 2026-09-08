const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const startIdx = content.indexOf('app.post("/api/campaign-builder/generate-wizard"');
const endIdx = content.indexOf('// Vite middleware for development');

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find blocks");
  process.exit(1);
}

const newEndpoints = `  app.post("/api/campaign-builder/stream-plan", async (req, res) => {
    try {
      const { brief } = req.body;
      if (!brief) {
        return res.status(400).json({ error: "Brief is required." });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const systemInstruction = \`Você é um estrategista de mídia sênior e analista de tráfego pago.
O usuário preencheu um briefing passo a passo com suas respostas. Sua tarefa é criar um plano de mídia completo e detalhado (estruturas de campanha, públicos, formatos de criativo, orçamentos sugeridos).

Ao final, apresente o plano de mídia completo de forma profissional usando Markdown.
Não faça mais perguntas, apenas entregue o plano final. Mantenha o tom profissional e direto.\`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: \`Aqui está o briefing completo do projeto:\\n\\n\${JSON.stringify(brief, null, 2)}\\n\\nCrie o plano de mídia agora.\`,
        config: {
          systemInstruction: systemInstruction
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(\`data: \${JSON.stringify({ text: chunk.text })}\\n\\n\`);
        }
      }
      res.write('data: [DONE]\\n\\n');
      res.end();
    } catch (e: any) {
      console.error("Campaign Builder stream error:", e);
      res.write(\`data: \${JSON.stringify({ error: e.message || "Erro interno" })}\\n\\n\`);
      res.end();
    }
  });

  app.post("/api/campaign-builder/generate-export", async (req, res) => {
    try {
      const { plan } = req.body;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: \`Você é um especialista em operações de Ad Ops. Com base no plano de mídia abaixo, gere os arquivos CSV para importação em massa nas plataformas Meta Ads e Google Ads.

Plano de mídia:
\${plan}

REGRAS:
- Retorne EXATAMENTE um JSON válido com duas chaves: "meta_csv" e "google_csv".
- Os valores devem ser strings contendo o conteúdo do CSV estruturado.
- Não inclua formatação markdown (como \`\`\`json) em torno do resultado. Apenas o JSON puro.
- Para o Meta Ads, use colunas padrão como: Campaign Name, Ad Set Name, Ad Name, Objective, Budget.
- Para o Google Ads, use colunas padrão como: Campaign, Ad Group, Headline 1, Headline 2, Description, Final URL, Max CPC.\`
      });

      let jsonStr = response.text || "{}";
      jsonStr = jsonStr.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e: any) {
      console.error("Campaign Builder export error:", e);
      res.status(500).json({ error: e.message || "Erro interno do servidor" });
    }
  });

`;

content = content.substring(0, startIdx) + newEndpoints + content.substring(endIdx);
fs.writeFileSync(serverPath, content);
console.log("Updated server.ts successfully");
