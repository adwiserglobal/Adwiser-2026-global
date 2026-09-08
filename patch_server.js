const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const adGroupsCode = `
  // Ad Groups
  app.post("/api/openai/ad_groups", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const payload = req.body;
      const response = await fetch("https://api.ads.openai.com/v1/ad_groups", {
        method: "POST",
        headers: { "Authorization": \`Bearer \${apiKey}\`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Erro", details: data });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Ads
  app.post("/api/openai/ads", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const payload = req.body;
      const response = await fetch("https://api.ads.openai.com/v1/ads", {
        method: "POST",
        headers: { "Authorization": \`Bearer \${apiKey}\`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Erro", details: data });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

if (!code.includes('/api/openai/ad_groups')) {
    code = code.replace('// 3. Location Search', adGroupsCode + '\n  // 3. Location Search');
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts with ad_groups and ads routes.");
} else {
    console.log("Already patched.");
}
