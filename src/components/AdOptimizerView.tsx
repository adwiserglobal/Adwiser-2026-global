import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Download, 
  Info, 
  Crop as CropIcon, 
  Sliders, 
  Type, 
  Image as ImageIcon, 
  Upload, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  ZoomIn,
  SlidersHorizontal,
  ChevronRight,
  Plus,
  Instagram,
  Youtube,
  Monitor,
  LayoutGrid
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import html2canvas from 'html2canvas';

const GoogleLogo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="rounded-full bg-white shadow-sm border border-gray-100 p-0.5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MetaLogo = () => (
  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-0.5">
    <img src="/meta.png" alt="Meta" className="w-full h-full object-contain" />
  </div>
);

const TikTokLogo = () => (
  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-0.5">
    <img src="/tiktok.jpg" alt="TikTok" className="w-full h-full object-contain" />
  </div>
);

type ToolType = 'adjust' | 'crop' | 'generation' | null;

type AspectRatio = { 
  label: string; 
  value: number | null; 
  w: string; 
  h: string; 
  desc: string; 
  image: string;
  goodFor: string;
  platforms: ('meta' | 'google' | 'tiktok')[];
};

const ASPECT_RATIOS: AspectRatio[] = [
  { 
    label: 'Personalizado', 
    value: null, 
    w: 'Livre', 
    h: 'Livre', 
    desc: 'Recorte livre e manual', 
    image: '/persona.png',
    goodFor: 'Qualquer posicionamento ou formato personalizado.',
    platforms: []
  },
  { 
    label: 'Feed Estático', 
    value: 1, 
    w: '1080', 
    h: '1080', 
    desc: 'Instagram / Facebook', 
    image: '/feed.png',
    goodFor: 'Feed do Instagram, Feed do Facebook, Audience Network.',
    platforms: ['meta']
  },
  { 
    label: 'Story / Reels', 
    value: 9 / 16, 
    w: '1080', 
    h: '1920', 
    desc: 'Instagram, TikTok, Shorts', 
    image: '/reels.png',
    goodFor: 'Instagram Reels, Stories, TikTok Ads, YouTube Shorts.',
    platforms: ['meta', 'tiktok', 'google']
  },
  { 
    label: 'Retrato (4:5)', 
    value: 4 / 5, 
    w: '1080', 
    h: '1350', 
    desc: 'Feed vertical otimizado', 
    image: '/portrait.png',
    goodFor: 'Feed do Instagram (Otimizado), Feed do Facebook.',
    platforms: ['meta']
  },
  { 
    label: 'Display / Vídeo', 
    value: 16 / 9, 
    w: '1920', 
    h: '1080', 
    desc: 'YouTube e Display', 
    image: '/youtube.png',
    goodFor: 'Vídeos no YouTube, Banners de Display, In-Stream.',
    platforms: ['google']
  },
];

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSrc;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.95);
}

async function getAdjustedImg(
  imageSrc: string,
  brightness: number,
  contrast: number,
  saturation: number
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSrc;

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.95);
}

export const AdOptimizerView: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);

  // Common or shared image state
  const [adjustImage, setAdjustImage] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [genImage, setGenImage] = useState<string | null>(null);

  // --- ADJUST TOOL STATE ---
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isExportingAdjust, setIsExportingAdjust] = useState(false);

  // --- CROP TOOL STATE ---
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isExportingCrop, setIsExportingCrop] = useState(false);

  // --- GENERATION TOOL STATE ---
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [isExportingGen, setIsExportingGen] = useState(false);
  const genPreviewRef = useRef<HTMLDivElement>(null);

  const suggestionTags = [
    'Software B2B',
    'Foco no produto',
    'Cores vibrantes',
    'Modo Escuro',
    'E-commerce',
    'Alta Conversão',
    'Minimalista'
  ];

  // Upload handlers
  const handleUploadForAdjust = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAdjustImage(ev.target?.result as string);
      setBrightness(100);
      setSaturation(100);
      setContrast(100);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadForCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImage(ev.target?.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  // Adjust Handlers
  const applyAutoEnhance = () => {
    setBrightness(106);
    setContrast(112);
    setSaturation(118);
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleDownloadAdjust = async () => {
    if (!adjustImage) return;
    setIsExportingAdjust(true);
    try {
      const dataUrl = await getAdjustedImg(adjustImage, brightness, contrast, saturation);
      const link = document.createElement('a');
      link.download = `criativo-ajustado-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao baixar imagem ajustada:', err);
    } finally {
      setIsExportingAdjust(false);
    }
  };

  // Crop Handlers
  const handleDownloadCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    setIsExportingCrop(true);
    try {
      const dataUrl = await getCroppedImg(cropImage, croppedAreaPixels);
      const link = document.createElement('a');
      link.download = `crop-${activeRatio.label.replace(/[^a-z0-9]/gi, '').toLowerCase()}-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao baixar imagem recortada:', err);
    } finally {
      setIsExportingCrop(false);
    }
  };

  // Generation Handlers
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');
    setGenImage(null);

    try {
      const [imgRes, copyRes] = await Promise.all([
        fetch('/api/ad-optimizer/generate-creatives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        }),
        fetch('/api/ad-optimizer/generate-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        })
      ]);

      const imgData = await imgRes.json();
      const copyData = await copyRes.json();

      if (!imgRes.ok) throw new Error(imgData.error || 'Erro ao gerar imagem');
      if (!copyRes.ok) throw new Error(copyData.error || 'Erro ao gerar copy');

      setGenImage(imgData.creatives[0]);
      setHeadline(copyData.headline || 'Destaque Seu Negócio');
      setSubheadline(copyData.subheadline || 'Aumente suas conversões com criativos de alto impacto.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadGen = async () => {
    if (!genPreviewRef.current) return;
    setIsExportingGen(true);
    try {
      const canvas = await html2canvas(genPreviewRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null
      });
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `geracao-ia-${Date.now()}.jpg`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Erro ao baixar criativo gerado:', err);
    } finally {
      setIsExportingGen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 pb-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Back button when a tool is opened */}
            {selectedTool !== null && selectedTool !== 'generation' && (
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Studio</span>
              </button>
            )}
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Ad Optimizer Studio+
              </h1>
              {selectedTool && selectedTool !== 'generation' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {selectedTool === 'adjust' ? 'Ajuste' : 'Crop'}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Gere novos criativos com IA, calibre filtros e recorte enquadramentos.
        </p>
      </div>

      {/* DEFAULT VIEW: GENERATION ON TOP AND CARDS BELOW */}
      {selectedTool === null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-8 pt-2"
        >
          {/* Generation Tool Always Present in Hub */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1.5">
                <img src="/generation.png" alt="Geração" className="max-h-full max-w-full object-contain filter drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Gerador de Criativos e Copy com Inteligência Artificial
                </h3>
                <p className="text-xs text-gray-500">
                  Descreva o seu produto ou conceito publicitário para a IA criar uma imagem impactante e uma copy persuasiva.
                </p>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Um tênis de corrida futurista com iluminação neon sobre asfalto molhado. Cena limpa, sem textos na imagem, alta resolução."
              className="w-full h-28 resize-none border border-gray-200 rounded-xl bg-gray-50 p-3.5 text-gray-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
            />

            {/* Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Sugestões:</span>
              {suggestionTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPrompt((prev) => (prev ? `${prev} [${tag}]` : `[${tag}]`))}
                  className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                  isGenerating || !prompt.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gerando Imagem e Copy com IA...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Gerar Criativo com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Result Display if exists */}
          {genImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto w-full"
            >
              {/* Preview with Overlay */}
              <div className="lg:col-span-7 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex items-center justify-center">
                <div
                  ref={genPreviewRef}
                  className="relative overflow-hidden bg-black rounded-xl shadow-xl w-full max-w-sm aspect-square flex items-center justify-center"
                >
                  <img
                    src={genImage}
                    alt="Criativo Gerado"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay Headline & Subheadline */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-center">
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md mb-2">
                      {headline}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-200 font-medium drop-shadow-md">
                      {subheadline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Copy & Export Actions */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Textos do Anúncio (Editáveis)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Título (Headline)</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subtítulo (Copy de Apoio)</label>
                  <textarea
                    rows={3}
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadGen}
                    disabled={isExportingGen}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {isExportingGen ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Baixar Criativo Completo</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCropImage(genImage);
                        setSelectedTool('crop');
                      }}
                      className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CropIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Recortar no Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjustImage(genImage);
                        setSelectedTool('adjust');
                      }}
                      className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-600" />
                      <span>Filtros no Ajuste</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tools Grid below Generation */}
          <div className="max-w-4xl mx-auto w-full pt-4">
             <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Todas as ferramentas</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* CARD 1: CROP */}
               <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col items-center text-center justify-between group">
                 <div className="w-full flex flex-col items-center">
                   <div className="w-20 h-20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                     <img
                       src="/crop.png"
                       alt="Crop"
                       className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                     />
                   </div>
                   <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold mb-2">
                     <CropIcon className="w-3 h-3 text-blue-600" />
                     Formatos e Recorte
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-1">Crop</h3>
                   <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-[250px]">
                     Recorte e enquadre criativos nos formatos oficiais de anúncios: Feed 1:1, Story 9:16 e mais.
                   </p>
                 </div>
                 <button
                   type="button"
                   onClick={() => setSelectedTool('crop')}
                   className="w-full max-w-[250px] py-2 px-4 bg-gray-900 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 group-hover:bg-blue-600"
                 >
                   <span>Selecionar</span>
                   <ChevronRight className="w-3.5 h-3.5 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                 </button>
               </div>
               
               {/* CARD 2: AJUSTE */}
               <div className="bg-white rounded-xl border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col items-center text-center justify-between group">
                 <div className="w-full flex flex-col items-center">
                   <div className="w-20 h-20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                     <img
                       src="/adjust.png"
                       alt="Ajuste"
                       className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                     />
                   </div>
                   <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold mb-2">
                     <Sliders className="w-3 h-3 text-purple-600" />
                     Calibração Visual
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-1">Ajuste</h3>
                   <p className="text-xs text-gray-500 leading-relaxed mb-4 max-w-[250px]">
                     Calibre brilho, contraste e saturação com filtros e melhoria inteligente.
                   </p>
                 </div>
                 <button
                   type="button"
                   onClick={() => setSelectedTool('adjust')}
                   className="w-full max-w-[250px] py-2 px-4 bg-gray-900 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 group-hover:bg-purple-600"
                 >
                   <span>Selecionar</span>
                   <ChevronRight className="w-3.5 h-3.5 opacity-75 group-hover:translate-x-0.5 transition-transform" />
                 </button>
               </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* VIEW 2: FERRAMENTA DE AJUSTE (SÓ AJUSTE) */}
      {selectedTool === 'adjust' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {!adjustImage ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 p-2 rounded-2xl bg-purple-50 flex items-center justify-center">
                <img src="/adjust.png" alt="Ajuste" className="max-h-full max-w-full object-contain" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Carregue a imagem para calibrar ajustes
              </h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
                Faça o upload do seu criativo para ajustar brilho, saturação, contraste e aplicar a melhoria automática recomendada.
              </p>

              <label className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Escolher Imagem do Computador</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadForAdjust} />
              </label>
              <div className="text-[11px] text-gray-400 mt-3">Suporta JPG, PNG e WEBP até 10MB</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Canvas: Live Preview of Adjustments */}
              <div className="lg:col-span-8 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[500px] overflow-hidden shadow-inner">
                <div className="relative max-w-full max-h-[550px] overflow-hidden rounded-xl shadow-lg bg-white">
                  <img
                    src={adjustImage}
                    alt="Ajuste preview"
                    className="max-h-[520px] w-auto object-contain transition-all"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                  <span>Filtros aplicados em tempo real</span>
                  <span>•</span>
                  <span>Brilho: {brightness}%</span>
                  <span>•</span>
                  <span>Contraste: {contrast}%</span>
                  <span>•</span>
                  <span>Saturação: {saturation}%</span>
                </div>
              </div>

              {/* Right Controls: Only Adjust Controls */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      Controles de Imagem
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Calibre iluminação e cores</p>
                  </div>

                  <label className="text-xs text-purple-600 hover:text-purple-700 font-semibold cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Trocar</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadForAdjust} />
                  </label>
                </div>

                {/* Auto Enhance Button */}
                <button
                  type="button"
                  onClick={applyAutoEnhance}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-3 text-xs font-semibold hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Melhoria Automática Inteligente</span>
                </button>

                {/* Sliders */}
                <div className="space-y-5 pt-2">
                  {/* Brilho */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-gray-700">Brilho</span>
                      <span className="font-mono text-gray-500">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Contraste */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-gray-700">Contraste</span>
                      <span className="font-mono text-gray-500">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Saturação */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-gray-700">Saturação</span>
                      <span className="font-mono text-gray-500">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={resetAdjustments}
                  className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Redefinir Ajustes para o Padrão</span>
                </button>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadAdjust}
                    disabled={isExportingAdjust}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {isExportingAdjust ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Baixar Imagem Ajustada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCropImage(adjustImage);
                      setSelectedTool('crop');
                    }}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CropIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recortar esta imagem no Crop</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* VIEW 3: FERRAMENTA DE CROP (SÓ CROP) */}
      {selectedTool === 'crop' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {!cropImage ? (
            <div className="max-w-5xl mx-auto py-8">
              <div className="mb-10 text-center">
                 <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Selecione o Formato</h2>
                 <p className="text-sm text-gray-500 mt-2">Escolha um formato otimizado ou recorte livre para começar.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {ASPECT_RATIOS.map((ratio) => (
                    <label 
                      key={ratio.label}
                      className="group flex flex-col bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md rounded-2xl cursor-pointer transition-all overflow-hidden relative"
                    >
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                         setActiveRatio(ratio);
                         handleUploadForCrop(e);
                      }} />
                      {/* Top Preview Image Section */}
                      <div className="w-full h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100 p-4">
                        <img 
                          src={ratio.image} 
                          alt={ratio.label} 
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Content Section */}
                      <div className="p-5 flex flex-col flex-1">
                        {/* Platform Logos Circle Stack */}
                        <div className="flex items-center -space-x-1.5 mb-3">
                          {ratio.platforms.includes('meta') && <div className="z-30 relative ring-2 ring-white rounded-full"><MetaLogo /></div>}
                          {ratio.platforms.includes('google') && <div className="z-20 relative ring-2 ring-white rounded-full"><GoogleLogo /></div>}
                          {ratio.platforms.includes('tiktok') && <div className="z-10 relative ring-2 ring-white rounded-full"><TikTokLogo /></div>}
                          {ratio.platforms.length === 0 && <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-white"><CropIcon className="w-3 h-3 text-blue-600" /></div>}
                        </div>
                        
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900">{ratio.label}</h3>
                          <span className="text-[10px] font-mono font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            {ratio.value === null ? 'Livre' : `${ratio.w}×${ratio.h}`}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-semibold">Bom para:</span> {ratio.goodFor}
                        </p>
                      </div>
                    </label>
                 ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Canvas: Cropper */}
              <div className="lg:col-span-8 bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[540px] relative overflow-hidden shadow-inner">
                <div className="relative w-full h-[480px] rounded-xl overflow-hidden">
                  <Cropper
                    image={cropImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={activeRatio.value !== null ? activeRatio.value : undefined}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                    showGrid={true}
                  />
                </div>
                <p className="mt-3 text-xs text-gray-400">Arraste a imagem para reposicionar e use o zoom para enquadrar</p>
              </div>

              {/* Right Controls: Only Crop Controls */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <CropIcon className="w-4 h-4 text-blue-600" />
                      Formatos de Mídia
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Selecione o canal de anúncio</p>
                  </div>

                  <label className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Trocar Imagem</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadForCrop} />
                  </label>
                </div>

                {/* Aspect Ratio Cards */}
                <div className="space-y-2.5">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.label}
                      type="button"
                      onClick={() => setActiveRatio(ratio)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        activeRatio.value === ratio.value
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600/30'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-0.5 overflow-hidden flex-shrink-0">
                          <img src={ratio.image} alt={ratio.label} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{ratio.label}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{ratio.desc}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400 bg-white/80 px-2 py-0.5 rounded border border-gray-200">
                        {ratio.value === null ? 'Livre' : `${ratio.w} × ${ratio.h}`}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Zoom Controller */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-gray-400" />
                      Zoom
                    </span>
                    <span className="font-mono text-gray-500">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadCrop}
                    disabled={isExportingCrop}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {isExportingCrop ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Baixar Imagem Recortada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustImage(cropImage);
                      setSelectedTool('adjust');
                    }}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    <span>Calibrar cores desta imagem no Ajuste</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* VIEW 4: FERRAMENTA DE GERAÇÃO COM IA (SÓ GERAÇÃO) */}
      {selectedTool === 'generation' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Prompt Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center p-1.5">
                <img src="/generation.png" alt="Geração" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Gerador de Criativos e Copy com Inteligência Artificial
                </h3>
                <p className="text-xs text-gray-500">
                  Descreva o seu produto ou conceito publicitário para a IA criar uma imagem impactante e uma copy persuasiva.
                </p>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Um tênis de corrida futurista com iluminação neon sobre asfalto molhado. Cena limpa, sem textos na imagem, alta resolução."
              className="w-full h-28 resize-none border border-gray-200 rounded-xl bg-gray-50 p-3.5 text-gray-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
            />

            {/* Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Sugestões:</span>
              {suggestionTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPrompt((prev) => (prev ? `${prev} [${tag}]` : `[${tag}]`))}
                  className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-medium text-gray-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                  isGenerating || !prompt.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gerando Imagem e Copy com IA...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Gerar Criativo com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Result Display */}
          {genImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto"
            >
              {/* Preview with Overlay */}
              <div className="lg:col-span-7 bg-gray-50 rounded-2xl border border-gray-200 p-6 flex items-center justify-center">
                <div
                  ref={genPreviewRef}
                  className="relative overflow-hidden bg-black rounded-xl shadow-xl w-full max-w-sm aspect-square flex items-center justify-center"
                >
                  <img
                    src={genImage}
                    alt="Criativo Gerado"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay Headline & Subheadline */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-center">
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md mb-2">
                      {headline}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-200 font-medium drop-shadow-md">
                      {subheadline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Copy & Export Actions */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Textos do Anúncio (Editáveis)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Título (Headline)</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subtítulo (Copy de Apoio)</label>
                  <textarea
                    rows={3}
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadGen}
                    disabled={isExportingGen}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {isExportingGen ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Baixar Criativo Completo</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCropImage(genImage);
                        setSelectedTool('crop');
                      }}
                      className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CropIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Recortar no Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdjustImage(genImage);
                        setSelectedTool('adjust');
                      }}
                      className="py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-600" />
                      <span>Filtros no Ajuste</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};
