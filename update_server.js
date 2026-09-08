const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const analyzeBlock = `  app.post("/api/campaign-builder/analyze", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: \`Você é um estrategista de mídia e tráfego pago especialista.
O usuário está dizendo que tipo de campanha ele quer criar: "\${prompt}"

Aja como um parceiro consultivo. Reconheça o que ele deseja, faça 1 a 2 perguntas estratégicas diretas para descobrir informações ausentes importantes (como meta de CPA, orçamento, público específico ou detalhes da oferta) e pareça profissional, porém acessível. Mantenha a resposta concisa, conversacional e fale diretamente com o usuário em português do Brasil. Não seja excessivamente prolixo.\`,
      });

      res.json({ reply: response.text });
    } catch (e: any) {
      console.error("Campaign Builder analyze error:", e);
      res.status(500).json({ error: e.message || "Erro interno do servidor" });
    }
  });`;

const streamBlock = `  app.post("/api/campaign-builder/stream", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const systemInstruction = \`Você é um estrategista de mídia sênior ajudando a montar uma campanha.
REGRAS OBRIGATÓRIAS DE RESPOSTA:
1. Sempre que você for iniciar uma etapa de planejamento ou processar uma informação importante, informe a interface usando a tag [[TASK:Nome da Tarefa]].
2. Logo após finalizar o pensamento ou etapa da tarefa, use [[DONE:Nome da Tarefa]].
   - Exemplo: [[TASK:Analisando público-alvo]] ...texto de resposta... [[DONE:Analisando público-alvo]]
3. Se quiser dar opções de múltipla escolha para o usuário clicar e acelerar o processo (ALTAMENTE RECOMENDADO para fazer escolhas rápidas de orçamento, objetivo, etc), use a tag [[OPTIONS:Opção 1|Opção 2|Opção 3]]. Coloque essa tag SEMPRE no final da sua resposta.
4. Mantenha o texto conversacional, curto e persuasivo. Fale em português do Brasil.\`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: formattedContents,
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
  });`;

if (content.includes('app.post("/api/campaign-builder/analyze"')) {
  content = content.replace(analyzeBlock, streamBlock);
  fs.writeFileSync(serverPath, content);
  console.log("Updated server.ts successfully");
} else {
  console.log("Could not find analyze block");
}
