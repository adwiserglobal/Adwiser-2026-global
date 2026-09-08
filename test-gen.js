import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: "A cool cat",
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          numberOfImages: 4
        }
      }
    });
    console.log(res.candidates.length, "candidates");
    for (const c of res.candidates) {
      const parts = c.content.parts;
      console.log(parts.map(p => p.inlineData ? "image" : "text"));
    }
  } catch (e) {
    console.error(e);
  }
}
run();
