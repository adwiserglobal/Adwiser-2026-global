const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const regex = /\/\/ Ad Optimizer\+: Generate Creatives via Cloudflare Workers AI[\s\S]*?app\.post\("\/api\/ad-optimizer\/generate-copy", async/m;

const newBlock = `// Ad Optimizer+: Generate Creatives via Gemini Image
  app.post("/api/ad-optimizer/generate-creatives", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required." });
      }

      // Generate Image using Gemini
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: \`High quality advertising photography of: \${prompt}. Clean background, no text.\` }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      let dataUrl = '';
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Str = part.inlineData.data;
            const mime = part.inlineData.mimeType || 'image/png';
            dataUrl = \`data:\${mime};base64,\${base64Str}\`;
            break;
          }
        }
      }

      if (!dataUrl) {
        throw new Error("Failed to generate image.");
      }

      res.json({ creatives: [dataUrl] });
    } catch (e: any) {
      console.error("Ad Optimizer generate error:", e);
      res.status(500).json({ error: e.message || "Erro interno do servidor" });
    }
  });

  app.post("/api/ad-optimizer/generate-copy", async`;

if (content.match(regex)) {
  content = content.replace(regex, newBlock);
  fs.writeFileSync(serverPath, content);
  console.log("Updated generate-creatives successfully");
} else {
  console.log("Could not find block to replace");
}
