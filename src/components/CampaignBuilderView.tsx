import React, { useState, useEffect, useRef } from 'react';
import { Plus, Send, CheckCircle, Loader2, Upload, FileText, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface CampaignBuilderViewProps {
  onNavigateToOpenAI?: () => void;
}

const STEPS = [
  "Coletar informações",
  "Definir objetivo de campanha",
  "Orçamento, público e duração",
  "Definição de canais",
  "Criativos e Copy",
  "Revisão",
  "Exportação"
];

export const CampaignBuilderView: React.FC<CampaignBuilderViewProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Data Collection State
  const [briefing, setBriefing] = useState({
    informacoes: '',
    objetivo: '',
    orcamento: '',
    publico: '',
    duracao: '',
    canais: [] as string[],
    criativos: false
  });

  const [aiPlan, setAiPlan] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  
  const [exportData, setExportData] = useState<{meta_csv?: string, google_csv?: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const planEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when AI plan streams
  useEffect(() => {
    if (isGeneratingPlan) {
      planEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiPlan, isGeneratingPlan]);

  const handleNextStep = async () => {
    if (currentStep === 4) {
      // Transition from Creatives -> Review (Trigger AI Generation)
      setCurrentStep(5);
      generateMediaPlan();
    } else if (currentStep === 5) {
      // Transition from Review -> Export (Trigger AI CSV Generation)
      setCurrentStep(6);
      generateExports();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const generateMediaPlan = async () => {
    setIsGeneratingPlan(true);
    setAiPlan('');

    try {
      const response = await fetch('/api/campaign-builder/stream-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: briefing }),
      });

      if (!response.body) throw new Error("No body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setAiPlan(accumulatedText);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error(error);
      setAiPlan(prev => prev + "\n\nOcorreu um erro ao gerar o plano.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const generateExports = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/campaign-builder/generate-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: aiPlan }),
      });
      const data = await response.json();
      setExportData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleCanal = (canal: string) => {
    setBriefing(prev => ({
      ...prev,
      canais: prev.canais.includes(canal) 
        ? prev.canais.filter(c => c !== canal)
        : [...prev.canais, canal]
    }));
  };

  // UI Renderers for each step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
            <h2 className="text-[28px] font-semibold text-gray-800 mb-2 tracking-tight">O que vamos criar?</h2>
            <p className="text-gray-500 mb-8">Descreva o produto, serviço ou marca que você deseja promover.</p>
            
            <div className="flex-1">
              <textarea
                value={briefing.informacoes}
                onChange={(e) => setBriefing({ ...briefing, informacoes: e.target.value })}
                placeholder="Ex: Quero fazer uma campanha de awareness para a minha marca de cosméticos Wepink..."
                className="w-full h-48 bg-white/60 border border-white/80 focus:border-blue-300 focus:bg-white rounded-2xl p-5 text-gray-700 outline-none resize-none shadow-sm transition-all text-lg"
              />
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={handleNextStep}
                disabled={!briefing.informacoes.trim()}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        );

      case 1:
        const objetivos = [
          { id: 'awareness', title: 'Reconhecimento de Marca (Awareness)', desc: 'Alcançar o máximo de pessoas e fixar a marca' },
          { id: 'leads', title: 'Geração de Contatos (Leads)', desc: 'Capturar e-mails, telefones ou conversas no WhatsApp' },
          { id: 'vendas', title: 'Vendas Diretas (Conversão)', desc: 'Gerar vendas diretas no e-commerce ou site' },
          { id: 'engajamento', title: 'Engajamento e Seguidores', desc: 'Aumentar a base social e interação' },
        ];
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
            <h2 className="text-[28px] font-semibold text-gray-800 mb-2 tracking-tight">Qual o objetivo principal?</h2>
            <p className="text-gray-500 mb-8">Escolha a meta que vai guiar a inteligência da plataforma.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objetivos.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => setBriefing({ ...briefing, objetivo: obj.title })}
                  className={`p-5 rounded-2xl text-left transition-all border-2 ${
                    briefing.objetivo === obj.title 
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                      : 'border-transparent bg-white/60 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-1">{obj.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{obj.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-auto pt-8">
              <button onClick={() => setCurrentStep(0)} className="px-6 py-3 text-gray-500 hover:text-gray-800 font-medium">Voltar</button>
              <button 
                onClick={handleNextStep}
                disabled={!briefing.objetivo}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
            <h2 className="text-[28px] font-semibold text-gray-800 mb-2 tracking-tight">Orçamento, Público e Duração</h2>
            <p className="text-gray-500 mb-8">Defina as restrições financeiras e quem queremos alcançar.</p>
            
            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orçamento Total / Mensal</label>
                <input 
                  type="text" 
                  value={briefing.orcamento}
                  onChange={e => setBriefing({...briefing, orcamento: e.target.value})}
                  placeholder="Ex: R$ 5.000,00 por mês"
                  className="w-full bg-white/80 border border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Público-Alvo (Persona)</label>
                <textarea 
                  value={briefing.publico}
                  onChange={e => setBriefing({...briefing, publico: e.target.value})}
                  placeholder="Ex: Mulheres, 18-35 anos, interesse em skincare e beleza..."
                  className="w-full h-24 bg-white/80 border border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 outline-none resize-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duração da Campanha</label>
                <input 
                  type="text" 
                  value={briefing.duracao}
                  onChange={e => setBriefing({...briefing, duracao: e.target.value})}
                  placeholder="Ex: Contínua, 30 dias, apenas final de semana..."
                  className="w-full bg-white/80 border border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setCurrentStep(1)} className="px-6 py-3 text-gray-500 hover:text-gray-800 font-medium">Voltar</button>
              <button 
                onClick={handleNextStep}
                disabled={!briefing.orcamento || !briefing.publico}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        );

      case 3:
        const canaisDisponiveis = ['Meta Ads (Facebook/Instagram)', 'Google Ads (Search/Youtube)', 'TikTok Ads', 'LinkedIn Ads'];
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
            <h2 className="text-[28px] font-semibold text-gray-800 mb-2 tracking-tight">Definição de Canais</h2>
            <p className="text-gray-500 mb-8">Selecione onde os anúncios serão veiculados.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {canaisDisponiveis.map(canal => (
                <button
                  key={canal}
                  onClick={() => toggleCanal(canal)}
                  className={`p-5 rounded-2xl flex items-center justify-between transition-all border-2 ${
                    briefing.canais.includes(canal)
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                      : 'border-transparent bg-white/60 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <span className="font-semibold text-gray-900">{canal}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    briefing.canais.includes(canal) ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}>
                    {briefing.canais.includes(canal) && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setCurrentStep(2)} className="px-6 py-3 text-gray-500 hover:text-gray-800 font-medium">Voltar</button>
              <button 
                onClick={handleNextStep}
                disabled={briefing.canais.length === 0}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
            <h2 className="text-[28px] font-semibold text-gray-800 mb-2 tracking-tight">Criativos e Copy</h2>
            <p className="text-gray-500 mb-8">Faça o upload dos seus vídeos ou imagens (estáticos) para análise.</p>
            
            <div 
              className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
                briefing.criativos ? 'border-green-500 bg-green-50/30' : 'border-gray-300 bg-white/50 hover:bg-white'
              }`}
            >
              {!briefing.criativos ? (
                <>
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-1">Arraste e solte seus arquivos</h3>
                  <p className="text-gray-500 mb-6 text-sm">Suporta MP4, JPG, PNG (Max 50MB)</p>
                  <button 
                    onClick={() => setBriefing({ ...briefing, criativos: true })}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
                  >
                    Procurar Arquivos
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">Criativos carregados com sucesso!</h3>
                  <p className="text-gray-500 text-sm mt-2">3 arquivos anexados (2 MP4, 1 JPG)</p>
                  <button 
                    onClick={() => setBriefing({ ...briefing, criativos: false })}
                    className="mt-6 text-sm text-red-500 font-medium hover:underline"
                  >
                    Remover arquivos
                  </button>
                </>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setCurrentStep(3)} className="px-6 py-3 text-gray-500 hover:text-gray-800 font-medium">Voltar</button>
              <button 
                onClick={handleNextStep}
                className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                Gerar Plano de Mídia
              </button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100/50">
              <div>
                <h2 className="text-[28px] font-semibold text-gray-800 tracking-tight">Revisão do Plano</h2>
                <p className="text-gray-500 text-sm mt-1">Nossa IA está consolidando sua estratégia.</p>
              </div>
              {isGeneratingPlan && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide pb-20">
              {aiPlan ? (
                <div className="markdown-body text-gray-800 bg-white/80 p-8 rounded-2xl shadow-sm border border-white">
                  <Markdown>{aiPlan}</Markdown>
                  <div ref={planEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-4" />
                  <p>Estruturando campanhas e orçamentos...</p>
                </div>
              )}
            </div>

            {!isGeneratingPlan && aiPlan && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#eff6ff] via-[#eff6ff] to-transparent flex justify-end items-end pt-12">
                 <button 
                  onClick={handleNextStep}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium shadow-md hover:bg-blue-700 transition-all shadow-blue-500/20"
                >
                  Aprovar e Exportar Campanhas
                </button>
              </div>
            )}
          </motion.div>
        );

      case 6:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <h2 className="text-[28px] font-semibold text-gray-800 mb-2 tracking-tight">Exportação</h2>
            <p className="text-gray-500 mb-8">Seus arquivos estão prontos para importação em massa nas plataformas.</p>
            
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {isExporting ? (
                <div className="flex flex-col items-center text-gray-500">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                  <p className="font-medium text-lg">Gerando arquivos estruturados CSV...</p>
                  <p className="text-sm mt-2 text-gray-400">Isso pode levar alguns segundos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Meta Ads</h3>
                    <p className="text-sm text-gray-500 mb-8">CSV formatado para Power Editor (Facebook/Instagram)</p>
                    <button 
                      onClick={() => exportData?.meta_csv && downloadCSV(exportData.meta_csv, 'meta_campaign_import.csv')}
                      disabled={!exportData?.meta_csv}
                      className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" /> Baixar CSV
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Google Ads</h3>
                    <p className="text-sm text-gray-500 mb-8">CSV formatado para o Google Ads Editor</p>
                    <button 
                       onClick={() => exportData?.google_csv && downloadCSV(exportData.google_csv, 'google_campaign_import.csv')}
                       disabled={!exportData?.google_csv}
                      className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" /> Baixar CSV
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center mt-auto pt-8">
               <button onClick={() => {
                 setCurrentStep(0);
                 setBriefing({ informacoes: '', objetivo: '', orcamento: '', publico: '', duracao: '', canais: [], criativos: false });
                 setAiPlan('');
                 setExportData(null);
               }} className="text-gray-500 hover:text-gray-800 font-medium">
                 Criar nova campanha
               </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-100px)] bg-[#f8fafc] flex justify-center py-8 px-4 font-sans">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-start h-[calc(100vh-160px)]">
        
        {/* Left Column: Chat/Content bounded inside the gradient box */}
        <div className="flex-1 w-full bg-gradient-to-br from-[#eff6ff] via-[#faf5ff] to-[#fff1f2] rounded-3xl border border-white shadow-sm p-8 h-full relative overflow-hidden flex flex-col">
          {renderStepContent()}
        </div>

        {/* Right Column: Fixed Sidebar on the solid background */}
        <div className="w-full lg:w-80 shrink-0 sticky top-8 bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100">
          <h3 className="font-semibold text-gray-900 text-lg mb-8">Estratégia e Planejamento</h3>
          
          <div className="space-y-6">
            {STEPS.map((stepName, index) => {
              const isPast = index < currentStep;
              const isCurrent = index === currentStep;
              const isFuture = index > currentStep;
              
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-0.5 shrink-0">
                    {isPast ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : isCurrent ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-200 rounded-full" />
                    )}
                  </div>
                  <span className={`text-[15px] font-medium leading-tight transition-colors duration-300 ${
                    isPast ? 'text-gray-400 line-through' : 
                    isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
