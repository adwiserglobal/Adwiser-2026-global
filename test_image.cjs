const { GoogleGenAI } = require("@google/genai");

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts: [{ text: "test" }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    console.log("Success! Generated parts:", res.candidates[0].content.parts.length);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
