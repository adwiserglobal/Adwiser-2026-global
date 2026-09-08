const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const regex = /app\.post\("\/api\/campaign-builder\/generate-export", async \(req, res\) => \{[\s\S]*?\}\);/m;

const newEndpoint = `app.post("/api/campaign-builder/generate-export", async (req, res) => {
    try {
      const { plan } = req.body;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: \`Você é um especialista em Ad Ops focado em implementação massiva. Baseado no plano de mídia abaixo, gere os arquivos CSV ESTABELECIDOS para importação direta no Meta Ads Manager e Google Ads Editor.

Plano de mídia:
\${plan}

REGRAS DE FORMATAÇÃO E ESTRUTURA MÁXIMA (CRÍTICO PARA NÃO DAR ERRO NA IMPORTAÇÃO):
1. Retorne EXATAMENTE um JSON válido com duas chaves: "meta_csv" e "google_csv". NADA MAIS. Sem blocos markdown de resposta (como \`\`\`json).
2. O formato CSV DEVE usar vírgula (,) como separador de colunas.
3. Não use quebras de linha dentro do texto das células.

COLUNAS OBRIGATÓRIAS PARA META ADS (Use exatamente estes cabeçalhos na primeira linha):
Campaign Name,Campaign Objective,Ad Set Name,Daily Budget,Optimization Goal,Ad Name,Headline,Body,Link Object

COLUNAS OBRIGATÓRIAS PARA GOOGLE ADS (Use exatamente estes cabeçalhos na primeira linha):
Campaign,Campaign Type,Ad Group,Max CPC,Headline 1,Headline 2,Description 1,Description 2,Final URL

Certifique-se de preencher pelo menos 2 a 3 linhas de exemplo prático baseadas no plano para cada plataforma.\`
      });

      let jsonStr = response.text || "{}";
      jsonStr = jsonStr.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e: any) {
      console.error("Campaign Builder export error:", e);
      res.status(500).json({ error: e.message || "Erro interno do servidor" });
    }
  });`;

if (content.match(regex)) {
  content = content.replace(regex, newEndpoint);
  fs.writeFileSync(serverPath, content);
  console.log("Updated generate-export successfully");
} else {
  console.log("Could not find generate-export block");
}
