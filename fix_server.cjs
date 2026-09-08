const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const startIdx = content.indexOf('app.post("/api/campaign-builder/generate-wizard"');
const endIdx = content.indexOf('// Vite middleware for development');

const newEndpoints = `  app.post("/api/campaign-builder/generate-wizard", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: \`O usuário quer criar uma campanha de marketing: "\${prompt}"
Crie exatamente 4 perguntas de múltipla escolha para entender melhor as necessidades dele (ex: objetivo principal, público-alvo, orçamento estimado, plataformas preferidas).
A primeira pergunta deve SEMPRE ser sobre o Objetivo Principal, com opções como "Fazer minha marca ser conhecida", "Gerar mais contatos", "Fazer mais vendas".
Retorne APENAS um JSON válido no seguinte formato, sem formatação markdown:
{
  "questions": [
    {
      "id": "q1",
      "title": "Texto da pergunta",
      "options": ["Opção 1", "Opção 2", "Opção 3"],
      "allowOther": true
    }
  ]
}\`,
      });

      let jsonStr = response.text || "{}";
      jsonStr = jsonStr.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e: any) {
      console.error("Campaign Builder wizard error:", e);
      res.status(500).json({ error: e.message || "Erro interno do servidor" });
    }
  });

  app.post("/api/campaign-builder/stream", async (req, res) => {
    try {
      const { brief } = req.body;
      if (!brief) {
        return res.status(400).json({ error: "Brief is required." });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const systemInstruction = \`Você é um estrategista de mídia sênior e analista de tráfego pago.
O usuário preencheu um briefing com suas respostas. Sua tarefa é criar um plano de mídia completo e detalhado (estruturas de campanha, públicos, formatos de criativo, orçamentos sugeridos) preparado para exportação para Meta Ads e Google Ads.

REGRAS DE FORMATAÇÃO:
1. Durante o seu processamento, mostre à interface as etapas que você está executando usando as tags [[TASK:Nome da Tarefa]] e [[DONE:Nome da Tarefa]].
   EXEMPLOS OBRIGATÓRIOS de tarefas:
   [[TASK:Análise Inicial e Briefing]] ... (texto) ... [[DONE:Análise Inicial e Briefing]]
   [[TASK:Definição de Público e Canais]] ... (texto) ... [[DONE:Definição de Público e Canais]]
   [[TASK:Estruturação das Campanhas e Orçamento]] ... (texto) ... [[DONE:Estruturação das Campanhas e Orçamento]]
   [[TASK:Criação de Copy e Criativos]] ... (texto) ... [[DONE:Criação de Copy e Criativos]]
2. Ao final, apresente o plano de mídia completo de forma profissional usando Markdown, separando por plataformas (Meta Ads, Google Ads).
3. Não faça mais perguntas ao usuário, entregue o plano final com base no briefing recebido.\`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: \`Aqui está o briefing do usuário:\\n\\n\${brief}\\n\\nCrie o plano de mídia agora.\`,
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

`;

content = content.substring(0, startIdx) + newEndpoints + content.substring(endIdx);
fs.writeFileSync(serverPath, content);
console.log("Fixed server.ts successfully");
