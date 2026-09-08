// Helper to normalize platform strings to exact supported lowercase OpenAI values:
// 'ios_app', 'android_app', 'web', 'desktop_web', 'ios_web', 'android_web'
const normalizePlatform = (val: any): string => {
  if (!val) return '';
  const raw = typeof val === 'object' && val !== null ? (val.id || val.name || val.platform || val.value || '') : val;
  const s = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (s === 'ios_app' || s === 'ios') return 'ios_app';
  if (s === 'android_app' || s === 'android') return 'android_app';
  if (s === 'web') return 'web';
  if (s === 'desktop_web' || s === 'desktop') return 'desktop_web';
  if (s === 'ios_web') return 'ios_web';
  if (s === 'android_web') return 'android_web';
  return s;
};

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const KEY_STORE_FILE = path.join(process.cwd(), ".adwiser_openai_key.json");
  let customOpenAIKey: string | null = null;

  try {
    if (fs.existsSync(KEY_STORE_FILE)) {
      const raw = fs.readFileSync(KEY_STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.key === "string" && parsed.key.trim()) {
        customOpenAIKey = parsed.key.trim();
      }
    }
  } catch (err) {
    console.error("Erro ao carregar chave persistida do OpenAI Ads:", err);
  }

  const getOpenAIKey = (req: express.Request): string | undefined => {
    const headerKey = req.headers["x-openai-ads-key"] as string | undefined;
    if (headerKey && headerKey.trim()) {
      const cleanHeaderKey = headerKey.trim();
      if (!customOpenAIKey) {
        customOpenAIKey = cleanHeaderKey;
        try {
          fs.writeFileSync(KEY_STORE_FILE, JSON.stringify({ key: cleanHeaderKey }), "utf-8");
        } catch {}
      }
      return cleanHeaderKey;
    }
    if (customOpenAIKey && customOpenAIKey.trim()) return customOpenAIKey.trim();
    try {
      if (fs.existsSync(KEY_STORE_FILE)) {
        const raw = fs.readFileSync(KEY_STORE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.key === "string" && parsed.key.trim()) {
          customOpenAIKey = parsed.key.trim();
          return customOpenAIKey;
        }
      }
    } catch {}
    return undefined; // Must be explicitly provided via UI or saved file
  };

  // Settings Endpoints
  app.get("/api/settings/openai-key", (req, res) => {
    const key = customOpenAIKey;
    res.json({
      configured: Boolean(key),
      hasCustomKey: Boolean(customOpenAIKey),
      maskedKey: key ? `${key.slice(0, 7)}...${key.slice(-4)}` : null
    });
  });

  app.post("/api/settings/openai-key", async (req, res) => {
    try {
      const { key } = req.body;
      if (!key || typeof key !== 'string' || key.trim().length < 8) {
        return res.status(400).json({ error: "Chave de API inválida. Forneça uma chave válida." });
      }

      const trimmed = key.trim();
      // Test key against OpenAI Ads
      const testRes = await fetch("https://api.ads.openai.com/v1/campaigns?limit=1", {
        headers: {
          "Authorization": `Bearer ${trimmed}`,
          "Content-Type": "application/json"
        }
      });

      if (!testRes.ok && testRes.status === 401) {
        return res.status(401).json({ error: "A chave de API fornecida está incorreta ou foi rejeitada pelo provedor. Verifique as informações e tente novamente. #36985A" });
      }

      customOpenAIKey = trimmed;
      try {
        fs.writeFileSync(KEY_STORE_FILE, JSON.stringify({ key: trimmed }), "utf-8");
      } catch (err) {
        console.error("Falha ao salvar chave no arquivo local:", err);
      }
      res.json({ success: true, message: "Chave da OpenAI Ads configurada com sucesso!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Erro ao validar chave de API." });
    }
  });

  app.delete("/api/settings/openai-key", (req, res) => {
    customOpenAIKey = null;
    try {
      if (fs.existsSync(KEY_STORE_FILE)) {
        fs.unlinkSync(KEY_STORE_FILE);
      }
    } catch (err) {
      console.error("Falha ao remover arquivo de chave persistida:", err);
    }
    res.json({ success: true, message: "Chave redefinida com sucesso." });
  });

  // OpenAI Ads API Routes
  // 1. List Campaigns
  app.get("/api/openai/campaigns", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ 
          error: "API Key for OpenAI Ads is missing. Configure sua chave em Configurações > APIs > OpenAI.",
          data: [] 
        });
      }

      const response = await fetch("https://api.ads.openai.com/v1/campaigns?limit=50&order=desc", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const responseData: any = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = responseData?.error?.message || responseData?.message || "Failed to fetch campaigns from OpenAI Ads";
        return res.status(response.status).json({ error: errorMsg, data: [] });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads GET Campaigns Error:", error);
      res.status(500).json({ error: error.message || "Internal server error", data: [] });
    }
  });

  // 1.5 Get Campaign by ID
  app.get("/api/openai/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing." });
      }

      const response = await fetch(`https://api.ads.openai.com/v1/campaigns/${id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const responseData: any = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData?.error?.message || "Failed to fetch campaign", details: responseData });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads GET Campaign by ID Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // 2. Create Campaign
  app.post("/api/openai/campaigns", async (req, res) => {
    try {
      const { name, budget, targeting, status, description } = req.body;
      const apiKey = getOpenAIKey(req);

      if (!apiKey) {
        return res.status(401).json({ error: "Chave de API do OpenAI Ads ausente ou não configurada. Conecte sua chave nas configurações ou na tela inicial." });
      }

      // Validations according to OpenAI Ads API Specification
      // Name: 3 to 1000 characters
      const trimmedName = (typeof name === 'string' ? name.trim() : '') || 'Nova Campanha';
      if (trimmedName.length < 3) {
        return res.status(400).json({ error: "O nome da campanha deve ter pelo menos 3 caracteres." });
      }

      // Status: 'active' or 'paused' (must be lowercase)
      const validStatus = (status && typeof status === 'string' && status.toLowerCase() === 'paused') ? 'paused' : 'active';

      // Budget: Must be an object with lifetime_spend_limit_micros or daily_spend_limit_micros (in micros, 1 USD = 1,000,000 micros)
      let budgetObj: Record<string, number> = {};
      const micros = typeof budget === 'object' && budget !== null && budget.amount ? 
        Math.max(1000000, Math.round(Number(budget.amount) * 1000000)) :
        typeof budget === 'number' ? Math.max(1000000, Math.round(budget * 1000000)) :
        parseFloat(budget as string) ? Math.max(1000000, Math.round(parseFloat(budget as string) * 1000000)) :
        1000000;

      const isDaily = req.body.budgetType === 'daily';
      if (isDaily) {
        budgetObj.daily_spend_limit_micros = micros;
      } else {
        budgetObj.lifetime_spend_limit_micros = micros;
      }

      let objectiveVal = 'clicks';
      let billingEventType = 'click';
      let biddingType = 'clicks';

      if (req.body.objective === 'Alcance' || req.body.objective === 'reach') {
        objectiveVal = 'reach';
        billingEventType = 'impression';
        biddingType = 'impressions';
      } else if (req.body.objective === 'Conversões' || req.body.objective === 'conversions') {
        objectiveVal = 'conversions';
        billingEventType = 'click';
        biddingType = 'conversions';
      } else {
        objectiveVal = 'clicks';
        billingEventType = 'click';
        biddingType = 'clicks';
      }

      // Description: OpenAI accepts optional description
      // If targeting was sent as text string, store it in description so it's not lost
      const finalDescription = (typeof description === 'string' && description.trim()) 
        ? description.trim() 
        : (typeof targeting === 'string' && targeting.trim()) 
          ? `Público-alvo: ${targeting.trim()}` 
          : undefined;

      const payload: Record<string, any> = {
        name: trimmedName,
        status: validStatus,
        budget: budgetObj,
        objective: objectiveVal,
        billing_event_type: billingEventType,
        bidding_type: biddingType
      };

      if (Array.isArray(req.body.conversion_event_setting_ids) && req.body.conversion_event_setting_ids.length > 0) {
        payload.conversion_event_setting_ids = req.body.conversion_event_setting_ids;
      } else if (req.body.conversion_event_setting_id) {
        payload.conversion_event_setting_ids = [req.body.conversion_event_setting_id];
      }

      if (req.body.start_time) {
        payload.start_time = req.body.start_time;
      }
      if (req.body.end_time) {
        payload.end_time = req.body.end_time;
      }

      if (finalDescription) {
        payload.description = finalDescription;
      }

      // Format targeting: locations -> include/exclude, platforms -> included/excluded
      const formatTargeting = (tgt: any) => {
        if (!tgt || typeof tgt !== 'object') return undefined;
        const clean: Record<string, any> = {};
        
        // Locations: OpenAI Ads API strictly supports 'include'. 'exclude' is not a valid parameter.
        if (tgt.locations && typeof tgt.locations === 'object') {
          const incLocs = tgt.locations.include || tgt.locations.included;
          if (Array.isArray(incLocs) && incLocs.length > 0) {
            clean.locations = {
              include: incLocs.map((loc: any) => ({
                id: String(loc.id || loc)
              }))
            };
          }
        }

        // Note: OpenAI Ads API campaign targeting does not support 'audiences' (audiences are managed at /v1/custom_audiences).
        // Passing targeting.audiences causes: Unknown parameter: 'targeting.audiences'

        // Platforms: OpenAI Ads API campaign targeting
        if (tgt.platforms) {
          const incPlats = Array.isArray(tgt.platforms) ? tgt.platforms : (tgt.platforms.included || tgt.platforms.include);
          if (Array.isArray(incPlats) && incPlats.length > 0) {
            clean.platforms = {
              included: incPlats.map(normalizePlatform).filter(Boolean)
            };
          }
        }

        return Object.keys(clean).length > 0 ? clean : undefined;
      };

      const formattedTargeting = formatTargeting(targeting);
      if (formattedTargeting) {
        payload.targeting = formattedTargeting;
      }

      console.log("Enviando requisição para OpenAI Ads:", JSON.stringify(payload, null, 2));

      const response = await fetch("https://api.ads.openai.com/v1/campaigns", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseData: any = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("OpenAI Ads API Rejected:", response.status, responseData);
        const errorMessage = responseData?.error?.message || responseData?.message || JSON.stringify(responseData) || "Failed to create campaign in OpenAI Ads";
        return res.status(response.status).json({ error: errorMessage, details: responseData });
      }

      console.log("Campanha criada com sucesso no OpenAI Ads:", responseData);
      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads API Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // 2.5 Update Campaign
  app.post("/api/openai/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing." });
      }

      // Allow updating multiple fields
      const payload: Record<string, any> = {};
      
      if (req.body.status) payload.status = req.body.status;
      if (req.body.name) payload.name = req.body.name.trim();
      if (req.body.description !== undefined) payload.description = req.body.description;
      if (req.body.start_time !== undefined) payload.start_time = req.body.start_time;
      if (req.body.end_time !== undefined) payload.end_time = req.body.end_time;
      
      if (req.body.budget) {
        let budgetObj: Record<string, number> = {};
        const micros = typeof req.body.budget === 'object' && req.body.budget !== null && req.body.budget.amount ? 
          Math.max(1000000, Math.round(Number(req.body.budget.amount) * 1000000)) :
          typeof req.body.budget === 'number' ? Math.max(1000000, Math.round(req.body.budget * 1000000)) :
          parseFloat(req.body.budget as string) ? Math.max(1000000, Math.round(parseFloat(req.body.budget as string) * 1000000)) :
          1000000;

        if (req.body.budgetType === 'daily') {
          budgetObj.daily_spend_limit_micros = micros;
        } else {
          budgetObj.lifetime_spend_limit_micros = micros;
        }
        payload.budget = budgetObj;
      }
      
      if (req.body.targeting) {
        const cleanTgt: Record<string, any> = {};
        const tgt = req.body.targeting;
        if (tgt.locations && typeof tgt.locations === 'object') {
          const incLocs = tgt.locations.include || tgt.locations.included;
          if (Array.isArray(incLocs) && incLocs.length > 0) {
            cleanTgt.locations = {
              include: incLocs.map((loc: any) => ({ id: String(loc.id || loc) }))
            };
          }
        }
        // Note: OpenAI Ads API campaign targeting does not support 'audiences'.
        // Passing targeting.audiences causes: Unknown parameter: 'targeting.audiences'
        if (tgt.platforms) {
          const incPlats = Array.isArray(tgt.platforms) ? tgt.platforms : (tgt.platforms.included || tgt.platforms.include);
          if (Array.isArray(incPlats) && incPlats.length > 0) {
            cleanTgt.platforms = {
              included: incPlats.map(normalizePlatform).filter(Boolean)
            };
          }
        }
        if (Object.keys(cleanTgt).length > 0) {
          payload.targeting = cleanTgt;
        }
      }

      console.log(`Updating campaign ${id}:`, JSON.stringify(payload, null, 2));

      const response = await fetch(`https://api.ads.openai.com/v1/campaigns/${id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseData: any = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("OpenAI Ads API Update Rejected:", response.status, responseData);
        return res.status(response.status).json({ error: responseData?.error?.message || "Failed to update campaign", details: responseData });
      }

      console.log(`Campaign ${id} updated successfully:`, responseData);
      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads API Update Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Helpers to normalize Ad Group & Ad payloads to OpenAI Ads API expectations
  const formatAdGroupForOpenAI = (body: any, isUpdate = false) => {
    const payload: Record<string, any> = {};
    if (!isUpdate && body.campaign_id) payload.campaign_id = body.campaign_id;
    if (body.name) payload.name = String(body.name).trim();
    if (body.status) payload.status = body.status;
    if (body.description !== undefined) payload.description = body.description;
    if (body.query_params !== undefined) payload.query_params = body.query_params;
    if (body.default_url !== undefined) payload.default_url = body.default_url;

    if (body.context_hints !== undefined) {
      if (Array.isArray(body.context_hints)) {
        payload.context_hints = body.context_hints.filter(Boolean);
      } else if (typeof body.context_hints === 'string' && body.context_hints.trim()) {
        payload.context_hints = body.context_hints.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean);
      }
    }

    if (body.bidding_config && typeof body.bidding_config === 'object') {
      payload.bidding_config = body.bidding_config;
    } else if (body.max_bid || body.cpm_bid || body.bid_strategy) {
      const isImpression = body.bid_strategy === 'cpm' || (body.cpm_bid && !body.max_bid);
      const rawVal = isImpression ? (body.cpm_bid || body.max_bid) : (body.max_bid || body.cpm_bid);
      const num = parseFloat(String(rawVal).replace(',', '.'));
      const micros = isNaN(num) || num <= 0 ? 13500000 : Math.max(1, Math.round(num * 1000000));
      payload.bidding_config = {
        billing_event_type: isImpression ? 'impression' : 'click',
        max_bid_micros: micros
      };
    }
    return payload;
  };

  const formatAdForOpenAI = (body: any, isUpdate = false) => {
    const payload: Record<string, any> = {};
    if (!isUpdate && body.ad_group_id) payload.ad_group_id = body.ad_group_id;
    if (body.name) payload.name = String(body.name).trim();
    if (body.status) payload.status = body.status;
    if (body.query_params !== undefined) payload.query_params = body.query_params;

    if (body.creative && typeof body.creative === 'object') {
      payload.creative = body.creative;
    } else if (body.title || body.description || body.url) {
      payload.creative = {
        type: "chat_card",
        title: (body.title || "Ternus").slice(0, 50),
        body: (body.description || "").slice(0, 100),
        target_url: body.url || "https://ternus.vercel.app/"
      };
      if (body.image !== undefined) payload.creative.image = body.image;
      
      payload.title = body.title;
      payload.description = body.description;
      payload.url = body.url;
    }
    return payload;
  };

  // Ad Groups
  app.post("/api/openai/ad_groups", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const payload = formatAdGroupForOpenAI(req.body, false);
      console.log("Creating ad group with payload:", JSON.stringify(payload, null, 2));
      const response = await fetch("https://api.ads.openai.com/v1/ad_groups", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("OpenAI Ad Group Create Error:", response.status, data);
        return res.status(response.status).json({ error: data?.error?.message || "Erro ao criar grupo de anúncios", details: data });
      }
      res.json(data);
    } catch (e: any) {
      console.error("Ad group create exception:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Ads
  app.post("/api/openai/ads", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const payload = formatAdForOpenAI(req.body, false);
      console.log("Creating ad with payload:", JSON.stringify(payload, null, 2));
      const response = await fetch("https://api.ads.openai.com/v1/ads", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("OpenAI Ad Create Error:", response.status, data);
        return res.status(response.status).json({ error: data?.error?.message || "Erro ao criar anúncio", details: data });
      }
      res.json(data);
    } catch (e: any) {
      console.error("Ad create exception:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // GET Ad Groups
  app.get("/api/openai/ad_groups", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const campaignId = req.query.campaign_id;
      let url = "https://api.ads.openai.com/v1/ad_groups";
      if (campaignId) url += `?campaign_id=${campaignId}`;
      
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${apiKey}` } });
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Erro", details: data });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET Ads
  app.get("/api/openai/ads", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const adGroupId = req.query.ad_group_id;
      let url = "https://api.ads.openai.com/v1/ads";
      if (adGroupId) url += `?ad_group_id=${adGroupId}`;
      
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${apiKey}` } });
      const data = await response.json().catch(() => null);
      if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Erro", details: data });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update Ad Group
  app.post("/api/openai/ad_groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const payload = formatAdGroupForOpenAI(req.body, true);
      console.log(`Updating ad group ${id} with payload:`, JSON.stringify(payload, null, 2));
      const response = await fetch(`https://api.ads.openai.com/v1/ad_groups/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error(`OpenAI Ad Group Update Error for ${id}:`, response.status, data);
        return res.status(response.status).json({ error: data?.error?.message || "Erro ao atualizar grupo de anúncios", details: data });
      }
      res.json(data);
    } catch (e: any) {
      console.error(`Ad group update exception for ${req.params.id}:`, e);
      res.status(500).json({ error: e.message });
    }
  });

  // Update Ad
  app.post("/api/openai/ads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const apiKey = getOpenAIKey(req);
      if (!apiKey) return res.status(401).json({ error: "Chave de API ausente." });
      
      const payload = formatAdForOpenAI(req.body, true);
      console.log(`Updating ad ${id} with payload:`, JSON.stringify(payload, null, 2));
      const response = await fetch(`https://api.ads.openai.com/v1/ads/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error(`OpenAI Ad Update Error for ${id}:`, response.status, data);
        return res.status(response.status).json({ error: data?.error?.message || "Erro ao atualizar anúncio", details: data });
      }
      res.json(data);
    } catch (e: any) {
      console.error(`Ad update exception for ${req.params.id}:`, e);
      res.status(500).json({ error: e.message });
    }
  });

  // 3. Location Search (OpenAI Ads Geo Lookup)
  const PT_GEO_MAP: Record<string, string> = {
    "estados unidos": "United States",
    "eua": "United States",
    "brasil": "Brazil",
    "reino unido": "United Kingdom",
    "inglaterra": "United Kingdom",
    "alemanha": "Germany",
    "espanha": "Spain",
    "frança": "France",
    "franca": "France",
    "itália": "Italy",
    "italia": "Italy",
    "japão": "Japan",
    "japao": "Japan",
    "china": "China",
    "méxico": "Mexico",
    "mexico": "Mexico",
    "canadá": "Canada",
    "canada": "Canada",
    "argentina": "Argentina",
    "colômbia": "Colombia",
    "colombia": "Colombia",
    "chile": "Chile",
    "peru": "Peru",
    "portugal": "Portugal",
    "uruguai": "Uruguay",
    "paraguai": "Paraguay",
    "rússia": "Russia",
    "russia": "Russia",
    "índia": "India",
    "india": "India",
    "austrália": "Australia",
    "australia": "Australia",
    "áfrica do sul": "South Africa",
    "africa do sul": "South Africa",
    "suíça": "Switzerland",
    "suica": "Switzerland",
    "suécia": "Sweden",
    "suecia": "Sweden",
    "noruega": "Norway",
    "holanda": "Netherlands",
    "países baixos": "Netherlands",
    "paises baixos": "Netherlands",
    "dinamarca": "Denmark",
    "finlândia": "Finland",
    "finlandia": "Finland",
    "irlanda": "Ireland",
    "bélgica": "Belgium",
    "belgica": "Belgium",
    "áustria": "Austria",
    "austria": "Austria",
    "nova zelândia": "New Zealand",
    "nova zelandia": "New Zealand",
    "coreia do sul": "South Korea",
    "turquia": "Turkey"
  };

  app.get("/api/openai/locations", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing.", data: [], results: [] });
      }

      if (!query || query.length < 2) {
        return res.json({ data: [], results: [] });
      }

      const qLower = query.toLowerCase();
      const searchTerms = [query];
      if (PT_GEO_MAP[qLower] && !searchTerms.includes(PT_GEO_MAP[qLower])) {
        searchTerms.unshift(PT_GEO_MAP[qLower]);
      }

      const combined: any[] = [];
      const seen = new Set<string>();

      for (const term of searchTerms) {
        try {
          const response = await fetch(`https://api.ads.openai.com/v1/geo_lookup/search?q=${encodeURIComponent(term)}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          });

          const responseData: any = await response.json().catch(() => null);

          if (response.ok && responseData && Array.isArray(responseData.results)) {
            for (const item of responseData.results) {
              if (item && item.id && !seen.has(item.id)) {
                seen.add(item.id);
                combined.push(item);
              }
            }
          }
        } catch (fetchErr) {
          console.error("Fetch error searching location term:", term, fetchErr);
        }

        if (combined.length >= 5) break;
      }

      // Sort priority: country -> region -> city -> postal_code
      const typeWeight: Record<string, number> = { country: 1, region: 2, city: 3, metro: 4, county: 5, postal_code: 6 };
      combined.sort((a, b) => (typeWeight[a.type] || 99) - (typeWeight[b.type] || 99));

      const formatted = combined.map(item => ({
        id: item.id,
        location_id: item.id,
        name: item.canonical_name || item.name,
        canonical_name: item.canonical_name,
        country_code: item.country_code,
        type: item.type
      }));

      res.json({ results: formatted, data: formatted, count: formatted.length });
    } catch (error: any) {
      console.error("OpenAI Ads Location Search Error:", error);
      res.status(500).json({ error: error.message || "Internal server error", data: [], results: [] });
    }
  });

  // 4. Custom Audiences (List & Create)
  app.get("/api/openai/custom_audiences", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing.", data: [] });
      }

      const response = await fetch("https://api.ads.openai.com/v1/custom_audiences?limit=50", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const responseData: any = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData?.error?.message || "Erro ao buscar públicos", data: [] });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads Custom Audiences GET Error:", error);
      res.status(500).json({ error: error.message || "Internal server error", data: [] });
    }
  });

  app.post("/api/openai/custom_audiences", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing." });
      }

      const { name, description } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: "O nome do público é obrigatório e deve ter no mínimo 2 caracteres." });
      }

      const payload: any = { name: name.trim() };
      if (description && typeof description === 'string' && description.trim()) {
        payload.description = description.trim();
      }

      const response = await fetch("https://api.ads.openai.com/v1/custom_audiences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseData: any = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData?.error?.message || "Erro ao criar público", details: responseData });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads Custom Audiences POST Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // 5. Conversion Event Settings (List & Create)
  app.get("/api/openai/conversions/event_settings", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing.", data: [] });
      }

      const response = await fetch("https://api.ads.openai.com/v1/conversions/event_settings", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const responseData: any = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData?.error?.message || "Erro ao buscar eventos de conversão", data: [] });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads Conversion Events GET Error:", error);
      res.status(500).json({ error: error.message || "Internal server error", data: [] });
    }
  });

  app.post("/api/openai/conversions/event_settings", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing." });
      }

      const { name, event_type, attribution_window_days, source_ids } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: "O nome do evento de conversão é obrigatório." });
      }

      let validSourceIds = Array.isArray(source_ids) && source_ids.length > 0 ? source_ids : [];

      // If no source_ids provided, look up or create a web pixel
      if (validSourceIds.length === 0) {
        try {
          const pixelRes = await fetch("https://api.ads.openai.com/v1/conversions/pixels", {
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
          });
          const pixelData: any = await pixelRes.json().catch(() => null);
          if (pixelRes.ok && Array.isArray(pixelData?.data) && pixelData.data.length > 0) {
            validSourceIds = [pixelData.data[0].id];
          } else {
            // Create a default pixel
            const createPixelRes = await fetch("https://api.ads.openai.com/v1/conversions/pixels", {
              method: "POST",
              headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ name: "Ternus Pixel Web", client_type: "web" })
            });
            const createdPixel: any = await createPixelRes.json().catch(() => null);
            if (createPixelRes.ok && createdPixel?.id) {
              validSourceIds = [createdPixel.id];
            }
          }
        } catch (pErr) {
          console.error("Error auto-configuring pixel:", pErr);
        }
      }

      const payload = {
        name: name.trim(),
        event_type: event_type || "order_created",
        attribution_window_days: attribution_window_days ? Number(attribution_window_days) : 30,
        source_ids: validSourceIds
      };

      const response = await fetch("https://api.ads.openai.com/v1/conversions/event_settings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseData: any = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData?.error?.message || "Erro ao criar evento de conversão", details: responseData });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads Conversion Event Settings POST Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // 6. Pixels (List & Create)
  app.get("/api/openai/conversions/pixels", async (req, res) => {
    try {
      const apiKey = getOpenAIKey(req);
      if (!apiKey) {
        return res.status(401).json({ error: "API Key for OpenAI Ads is missing.", data: [] });
      }

      const response = await fetch("https://api.ads.openai.com/v1/conversions/pixels", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const responseData: any = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData?.error?.message || "Erro ao buscar pixels", data: [] });
      }

      res.json(responseData);
    } catch (error: any) {
      console.error("OpenAI Ads Pixels GET Error:", error);
      res.status(500).json({ error: error.message || "Internal server error", data: [] });
    }
  });

  // Ad Optimizer+: Generate Creatives via Gemini Image
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
          parts: [{ text: `High quality advertising photography of: ${prompt}. Clean background, no text.` }]
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
            dataUrl = `data:${mime};base64,${base64Str}`;
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

  app.post("/api/ad-optimizer/generate-copy", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert copywriter for advertising. 
The user wants an ad based on this request: "${prompt}"

Generate a short, punchy headline (max 6 words) and a short subheadline (max 12 words) for this ad.
Respond in JSON format with two keys: "headline" and "subheadline".
Write the copy in the language of the user's prompt (if it's Portuguese, reply in Portuguese).
Do NOT include markdown formatting or backticks around the JSON. Just output the raw JSON.`,
      });

      const text = response.text?.trim() || "{}";
      
      // Clean up potential markdown blocks if the model still includes them
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let result = { headline: "Sem Título", subheadline: "" };
      try {
        result = JSON.parse(cleanJson);
      } catch (err) {
        console.error("Failed to parse copy JSON:", err, text);
      }

      res.json(result);
    } catch (e: any) {
      console.error("Ad Optimizer copy error:", e);
      res.status(500).json({ error: e.message || "Erro interno do servidor" });
    }
  });

        app.post("/api/campaign-builder/stream-plan", async (req, res) => {
    try {
      const { brief } = req.body;
      if (!brief) {
        return res.status(400).json({ error: "Brief is required." });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const systemInstruction = `Você é um estrategista de mídia. Crie um plano de mídia ALTAMENTE CONCISO E OBJETIVO baseado no briefing. Vá direto ao ponto com tópicos curtos. SEM introduções. Apresente APENAS: 1) Estrutura 2) Públicos 3) Orçamentos 4) Formatos. Use Markdown.`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `Aqui está o briefing completo do projeto:\n\n${JSON.stringify(brief, null, 2)}\n\nCrie o plano de mídia agora.`,
        config: {
          systemInstruction: systemInstruction
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e: any) {
      console.error("Campaign Builder stream error:", e);
      res.write(`data: ${JSON.stringify({ error: e.message || "Erro interno" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/campaign-builder/generate-export", async (req, res) => {
    try {
      const { plan } = req.body;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Você é um especialista em Ad Ops focado em implementação massiva. Baseado no plano de mídia abaixo, gere os arquivos CSV ESTABELECIDOS para importação direta no Meta Ads Manager e Google Ads Editor.

Plano de mídia:
${plan}

REGRAS DE FORMATAÇÃO E ESTRUTURA MÁXIMA (CRÍTICO PARA NÃO DAR ERRO NA IMPORTAÇÃO):
1. Retorne EXATAMENTE um JSON válido com duas chaves: "meta_csv" e "google_csv". NADA MAIS. Sem blocos markdown de resposta (como bloco de código).
2. O formato CSV DEVE usar vírgula (,) como separador de colunas.
3. Não use quebras de linha dentro do texto das células.

COLUNAS OBRIGATÓRIAS PARA META ADS (Use exatamente estes cabeçalhos na primeira linha):
Campaign Name,Campaign Objective,Ad Set Name,Daily Budget,Optimization Goal,Ad Name,Headline,Body,Link Object

COLUNAS OBRIGATÓRIAS PARA GOOGLE ADS (Use exatamente estes cabeçalhos na primeira linha):
Campaign,Campaign Type,Ad Group,Max CPC,Headline 1,Headline 2,Description 1,Description 2,Final URL

Certifique-se de preencher pelo menos 2 a 3 linhas de exemplo prático baseadas no plano para cada plataforma.`
      });

      let jsonStr = response.text || "{}";
      jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e: any) {
      console.error("Campaign Builder export error:", e);
      res.status(500).json({ error: e.message || "Erro interno do servidor" });
    }
  });


// Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // In express 5 we should use app.get('*all', ...) but wait, vite middlewares is an array of handlers, so we just use app.use(vite.middlewares)
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // In express 5 use *all instead of *
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
