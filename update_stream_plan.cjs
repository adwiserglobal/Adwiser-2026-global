const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

const oldInstruction = \`const systemInstruction = \\\`Você é um estrategista de mídia sênior e analista de tráfego pago.
O usuário preencheu um briefing passo a passo com suas respostas. Sua tarefa é criar um plano de mídia completo e detalhado (estruturas de campanha, públicos, formatos de criativo, orçamentos sugeridos).

Ao final, apresente o plano de mídia completo de forma profissional usando Markdown.
Não faça mais perguntas, apenas entregue o plano final. Mantenha o tom profissional e direto.\\\`;\`;

const newInstruction = \`const systemInstruction = \\\`Você é um estrategista de mídia sênior. 
Crie um plano de mídia **ALTAMENTE CONCISO E OBJETIVO** baseado no briefing. 
Vá direto ao ponto. Use tópicos curtos. SEM introduções longas ou jargões desnecessários.
Apresente APENAS: 1) Estrutura, 2) Públicos, 3) Orçamentos, 4) Formatos. Use Markdown.\\\`;\`;

if (content.includes('Você é um estrategista de mídia sênior e analista de tráfego pago.')) {
  content = content.replace(/const systemInstruction = \`Você é um estrategista de mídia sênior e analista de tráfego pago\.[\s\S]*?Mantenha o tom profissional e direto\.\`;/m, newInstruction);
  fs.writeFileSync(serverPath, content);
  console.log("Updated system instruction successfully");
} else {
  console.log("Could not find instruction block");
}
