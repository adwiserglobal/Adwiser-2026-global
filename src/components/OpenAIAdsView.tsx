import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, MessageSquare, RefreshCw, AlertCircle, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Layers,
  Search, X, Plus, Calendar, Clock, Sparkles, MoreHorizontal, ChevronDown, Info,
  Users, Upload, Check, ChevronLeft, ExternalLink, Eye, EyeOff, Settings as SettingsIcon, ShieldCheck,
  Wrench, ArrowUp, ArrowDown, DollarSign, Filter, SlidersHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const OpenAILogo = () => (
  <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-0.5">
    <img src="/openai.png" alt="OpenAI" className="w-full h-full object-contain" />
  </div>
);

const performanceData = [
  { date: '1', req: 120 }, { date: '2', req: 250 }, { date: '3', req: 180 },
  { date: '4', req: 300 }, { date: '5', req: 280 }, { date: '6', req: 400 },
  { date: '7', req: 380 }
];

const InputLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[13px] text-gray-700 mb-1.5">{children}</label>
);

const InputHint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{children}</p>
);

const InputField = ({ className = '', ...props }: any) => (
  <input 
    className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px] ${className}`}
    {...props}
  />
);

const SelectField = ({ children, className = '', ...props }: any) => (
  <div className="relative">
    <select 
      className={`w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px] appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
  </div>
);

interface OpenAIAdsViewProps {
  onOpenSettings?: (tab?: string, subTab?: string) => void;
  platformName?: string;
  initialCreate?: boolean;
}

const AVAILABLE_PLATFORMS = [
  { id: 'ios_app', label: 'iOS app' },
  { id: 'android_app', label: 'Android app' },
  { id: 'web', label: 'Web' }
];

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFutureDateStr = (daysAhead: number = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface ActiveValidationError {
  id: string;
  field: string;
  step: number;
  message: string;
  elementId: string;
  isResolved?: boolean;
}

export const OpenAIAdsView: React.FC<OpenAIAdsViewProps> = ({ onOpenSettings, platformName = 'OpenAI Ads', initialCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [wizardMode, setWizardMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingCampId, setEditingCampId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeValidationError, setActiveValidationError] = useState<ActiveValidationError | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [campaignData, setCampaignData] = useState({ 
    name: 'Nova campanha de tráfego', type: 'Padrão', objective: 'Cliques',
    conversionEventId: '', conversionEventName: '',
    includedLocations: [{ id: '1000030', name: 'Brasil' }], excludedLocations: [] as Array<{ id: string, name: string }>, platforms: ['ios_app', 'android_app', 'web'],
    queryParams: '', budgetType: 'daily', budget: '150.00',
    startDate: getTodayDateStr(), startTime: '12:00', hasEndDate: false, endDate: getFutureDateStr(30), endTime: '12:00',
    textPersonalization: true
  });

  const [conversionEvents, setConversionEvents] = useState<any[]>([]);
  const [loadingConversionEvents, setLoadingConversionEvents] = useState(false);
  const [conversionDropdownOpen, setConversionDropdownOpen] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [conversionError, setConversionError] = useState('');
  const [conversionModalForm, setConversionModalForm] = useState({
    name: '',
    event_type: 'order_created',
    attribution_window_days: 30
  });
  const [isSavingConversionEvent, setIsSavingConversionEvent] = useState(false);

  const [locSearch, setLocSearch] = useState('');
  const [locResults, setLocResults] = useState<any[]>([]);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);

  const [exLocSearch, setExLocSearch] = useState('');
  const [exLocResults, setExLocResults] = useState<any[]>([]);
  const [isSearchingExLoc, setIsSearchingExLoc] = useState(false);

  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);

  const [adGroupData, setAdGroupData] = useState({
    name: 'Novo grupo de anúncios', 
    bidStrategy: 'manual', 
    maxBid: '13.50',
    cpmBid: '340.00', 
    queryParams: 'campaign_id={campaign_id}&ad_id={ad_id}',
    defaultUrl: 'https://ternus.vercel.app/', 
    contextHints: ''
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [audienceForm, setAudienceForm] = useState({
    name: '',
    description: '',
    sourceType: 'customer_list',
    identifiers: '',
    fileName: ''
  });
  const [isSavingAudience, setIsSavingAudience] = useState(false);
  const [selectedAudienceAdjustments, setSelectedAudienceAdjustments] = useState<Record<string, { enabled: boolean; multiplier: string }>>({});

  const [adData, setAdData] = useState({
    name: 'Novo anúncio', url: 'https://ternus.vercel.app/', queryParams: '',
    title: 'Ternus Studios', description: 'Studio de apps mobile.', image: true
  });
  const [adsList, setAdsList] = useState<any[]>([]);

  // Snapshot para controle de alterações (dirty checking)
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  const hasEdits = useMemo(() => {
    if (wizardMode !== 'edit' || !initialSnapshot) return false;
    const current = JSON.stringify({
      campaign: campaignData,
      audiences: selectedAudienceAdjustments,
      adGroup: adGroupData,
      ad: adData,
      ads: adsList
    });
    return current !== initialSnapshot;
  }, [wizardMode, initialSnapshot, campaignData, selectedAudienceAdjustments, adGroupData, adData, adsList]);

  const [accountError, setAccountError] = useState('');
  const [showAccountErrorModal, setShowAccountErrorModal] = useState(false);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStage, setPublishStage] = useState<'loading' | 'success'>('loading');
  const [publishCountdown, setPublishCountdown] = useState(10);
  const [gifKey, setGifKey] = useState(0);

  // Preload do GIF de conclusao para garantir exibicao instantanea
  useEffect(() => {
    const img = new Image();
    img.src = '/icone-concluido.gif';
  }, []);

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
    setIsCreating(false);
    setStep(1);
    setMessage({ type: '', text: '' });
    fetchCampaigns();
  };

  useEffect(() => {
    let timer: any;
    if (showPublishModal && publishStage === 'success') {
      if (publishCountdown > 0) {
        timer = setTimeout(() => {
          setPublishCountdown(prev => prev - 1);
        }, 1000);
      } else {
        handleClosePublishModal();
      }
    }
    return () => clearTimeout(timer);
  }, [showPublishModal, publishStage, publishCountdown]);

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState('');
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);

  // Comparative Badge with green up arrow for increase and red down arrow for decrease
  const ComparativeBadge = ({ 
    change, 
    comparison = 'vs mês ant.' 
  }: { 
    change: number; 
    comparison?: string;
  }) => {
    const isPositive = change >= 0;
    const formattedChange = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;

    return (
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
          isPositive ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {isPositive ? (
            <ArrowUp className="w-3 h-3 stroke-[2.5]" />
          ) : (
            <ArrowDown className="w-3 h-3 stroke-[2.5]" />
          )}
          {formattedChange}
        </span>
        <span className="text-gray-400 text-xs font-normal">{comparison}</span>
      </div>
    );
  };

  // Filters state
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | '7d' | '14d' | '30d' | 'this_month' | 'last_month' | 'custom'>('30d');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [objectiveFilter, setObjectiveFilter] = useState<'all' | 'reach' | 'clicks' | 'conversions'>('all');
  const [objectiveDropdownOpen, setObjectiveDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom date picker state
  const [customStartDate, setCustomStartDate] = useState('2026-08-08');
  const [customEndDate, setCustomEndDate] = useState('2026-09-06');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  // Chart Metric selector
  const [chartMetric, setChartMetric] = useState<'cliques' | 'impressoes' | 'gasto'>('cliques');

  // Click outside ref handles
  const periodRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const objectiveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (objectiveRef.current && !objectiveRef.current.contains(e.target as Node)) {
        setObjectiveDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      case '7d': return 'Últimos 7 dias';
      case '14d': return 'Últimos 14 dias';
      case '30d': return 'Últimos 30 dias';
      case 'this_month': return 'Este mês';
      case 'last_month': return 'Mês anterior';
      case 'custom': {
        if (customStartDate && customEndDate) {
          const s = customStartDate.split('-').reverse().slice(0, 2).join('/');
          const e = customEndDate.split('-').reverse().slice(0, 2).join('/');
          return `${s} - ${e}`;
        }
        return 'Personalizado';
      }
      default: return 'Últimos 30 dias';
    }
  };

  const metricsData = useMemo(() => {
    switch (selectedPeriod) {
      case 'today':
        return {
          impressoes: '1.620',
          impressoesChange: 5.3,
          cliques: '310',
          cliquesChange: 4.2,
          cpa: '$ 16.90',
          cpaChange: -2.8,
          gasto: '$ 139.50',
          gastoChange: 3.1
        };
      case 'yesterday':
        return {
          impressoes: '1.840',
          impressoesChange: -2.1,
          cliques: '345',
          cliquesChange: -1.5,
          cpa: '$ 17.40',
          cpaChange: 1.2,
          gasto: '$ 155.20',
          gastoChange: -1.8
        };
      case '7d':
        return {
          impressoes: '11.450',
          impressoesChange: 14.8,
          cliques: '2.180',
          cliquesChange: 9.4,
          cpa: '$ 17.80',
          cpaChange: -6.5,
          gasto: '$ 980.40',
          gastoChange: 8.9
        };
      case '14d':
        return {
          impressoes: '21.200',
          impressoesChange: 10.2,
          cliques: '4.050',
          cliquesChange: 6.7,
          cpa: '$ 18.10',
          cpaChange: -4.1,
          gasto: '$ 1.820.50',
          gastoChange: 11.8
        };
      case 'this_month':
        return {
          impressoes: '36.800',
          impressoesChange: 11.5,
          cliques: '7.020',
          cliquesChange: 7.9,
          cpa: '$ 18.30',
          cpaChange: -4.8,
          gasto: '$ 3.160.00',
          gastoChange: 13.5
        };
      case 'last_month':
        return {
          impressoes: '37.800',
          impressoesChange: 18.2,
          cliques: '7.490',
          cliquesChange: 12.1,
          cpa: '$ 19.50',
          cpaChange: -3.0,
          gasto: '$ 3.370.50',
          gastoChange: 16.0
        };
      default: // '30d' and custom
        return {
          impressoes: '42.500',
          impressoesChange: 12.4,
          cliques: '8.102',
          cliquesChange: 8.1,
          cpa: '$ 18.50',
          cpaChange: -5.2,
          gasto: '$ 3.645.90',
          gastoChange: 15.3
        };
    }
  }, [selectedPeriod]);

  const chartData = useMemo(() => {
    if (selectedPeriod === 'today' || selectedPeriod === 'yesterday') {
      return [
        { date: '08:00', cliques: 28, impressoes: 140, gasto: 12.4 },
        { date: '10:00', cliques: 45, impressoes: 235, gasto: 19.8 },
        { date: '12:00', cliques: 62, impressoes: 320, gasto: 27.5 },
        { date: '14:00', cliques: 70, impressoes: 360, gasto: 30.2 },
        { date: '16:00', cliques: 54, impressoes: 290, gasto: 24.1 },
        { date: '18:00', cliques: 44, impressoes: 220, gasto: 19.0 },
        { date: '20:00', cliques: 32, impressoes: 155, gasto: 14.5 },
      ];
    }
    if (selectedPeriod === '7d') {
      return [
        { date: '31/08', cliques: 280, impressoes: 1420, gasto: 126 },
        { date: '01/09', cliques: 310, impressoes: 1610, gasto: 139 },
        { date: '02/09', cliques: 295, impressoes: 1540, gasto: 132 },
        { date: '03/09', cliques: 340, impressoes: 1780, gasto: 153 },
        { date: '04/09', cliques: 320, impressoes: 1690, gasto: 144 },
        { date: '05/09', cliques: 260, impressoes: 1390, gasto: 117 },
        { date: '06/09', cliques: 375, impressoes: 2020, gasto: 169 },
      ];
    }
    if (selectedPeriod === '14d') {
      return [
        { date: '24/08', cliques: 250, impressoes: 1300, gasto: 112 },
        { date: '26/08', cliques: 290, impressoes: 1520, gasto: 130 },
        { date: '28/08', cliques: 310, impressoes: 1640, gasto: 139 },
        { date: '30/08', cliques: 280, impressoes: 1450, gasto: 125 },
        { date: '01/09', cliques: 320, impressoes: 1680, gasto: 144 },
        { date: '03/09', cliques: 340, impressoes: 1790, gasto: 153 },
        { date: '06/09', cliques: 390, impressoes: 2050, gasto: 175 },
      ];
    }
    // 30d, this_month, last_month, custom
    return [
      { date: '08/08', cliques: 240, impressoes: 1250, gasto: 108 },
      { date: '12/08', cliques: 270, impressoes: 1410, gasto: 121 },
      { date: '16/08', cliques: 310, impressoes: 1600, gasto: 139 },
      { date: '20/08', cliques: 290, impressoes: 1510, gasto: 130 },
      { date: '24/08', cliques: 350, impressoes: 1820, gasto: 157 },
      { date: '28/08', cliques: 380, impressoes: 1980, gasto: 171 },
      { date: '01/09', cliques: 320, impressoes: 1670, gasto: 144 },
      { date: '06/09', cliques: 410, impressoes: 2150, gasto: 184 },
    ];
  }, [selectedPeriod]);

  const platformShareData = useMemo(() => [
    { name: 'iOS app', value: 52, color: '#10a37f' },
    { name: 'Android app', value: 34, color: '#3b82f6' },
    { name: 'Web', value: 14, color: '#8b5cf6' },
  ], []);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((camp: any) => {
      const isAct = (camp.status || '').toLowerCase() === 'active';
      const isDraft = camp._isDraft === true;

      // Status Filter
      if (statusFilter === 'active' && (!isAct || isDraft)) return false;
      if (statusFilter === 'paused' && (isAct || isDraft)) return false;
      if (statusFilter === 'draft' && !isDraft) return false;

      // Objective Filter
      if (objectiveFilter !== 'all') {
        const campObj = (camp.objective || '').toLowerCase();
        if (objectiveFilter === 'reach' && !campObj.includes('reach') && !campObj.includes('alcance')) return false;
        if (objectiveFilter === 'clicks' && !campObj.includes('click') && !campObj.includes('clique')) return false;
        if (objectiveFilter === 'conversions' && !campObj.includes('conv')) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (camp.name || '').toLowerCase();
        const id = String(camp.id || '').toLowerCase();
        if (!name.includes(q) && !id.includes(q)) return false;
      }

      return true;
    });
  }, [campaigns, statusFilter, objectiveFilter, searchQuery]);

  const handleApiError = (errorMsg: string) => {
    const lowerError = errorMsg.toLowerCase();
    if (lowerError.includes('payment') || lowerError.includes('billing') || lowerError.includes('credit card') || lowerError.includes('forma de pagamento') || lowerError.includes('faturamento') || lowerError.includes('saldo')) {
      setAccountError(errorMsg);
      setShowAccountErrorModal(true);
      return true;
    }
    return false;
  };

  const [needsOnboarding, setNeedsOnboarding] = useState(() => {
    return localStorage.getItem('adwiser_openai_configured') !== 'true';
  });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isInitialCheck, setIsInitialCheck] = useState(false);
  const [wizardApiKey, setWizardApiKey] = useState('');
  const [showWizardKey, setShowWizardKey] = useState(false);
  const [isSavingWizardKey, setIsSavingWizardKey] = useState(false);
  const [wizardKeyError, setWizardKeyError] = useState('');
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);

  const handleSaveKeyFromWizard = async () => {
    if (!wizardApiKey.trim()) {
      setWizardKeyError('Por favor, insira a chave de API da OpenAI Ads.');
      return;
    }
    setIsSavingWizardKey(true);
    setWizardKeyError('');
    try {
      const res = await fetch('/api/settings/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: wizardApiKey.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao validar chave de API.');
      }
      setShowLoadingAnimation(true);
      localStorage.setItem('adwiser_openai_configured', 'true');
      localStorage.setItem('adwiser_openai_api_key', wizardApiKey.trim());
      await new Promise(resolve => setTimeout(resolve, 2000));
      setNeedsOnboarding(false);
      await fetchCampaigns();
    } catch (err: any) {
      setWizardKeyError(err.message || 'Falha ao conectar chave.');
    } finally {
      setIsSavingWizardKey(false);
      setShowLoadingAnimation(false);
    }
  };

  const triggerValidationError = (err: ActiveValidationError) => {
    setActiveValidationError({ ...err, isResolved: false });
    // Scroll smoothly to the top of window and content container
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContent = document.getElementById('adwiser-main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const main = document.getElementById('adwiser-main-content');
      if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    }, 40);
  };

  const validateCampaignDates = () => {
    const today = getTodayDateStr();
    if (campaignData.startDate < today) {
      return {
        valid: false,
        field: 'startDate',
        elementId: 'field-campaign-start-date',
        message: 'A data de início não pode ser anterior à data de hoje.'
      };
    }
    if (campaignData.hasEndDate) {
      if (campaignData.endDate < today) {
        return {
          valid: false,
          field: 'endDate',
          elementId: 'field-campaign-end-date',
          message: 'A data de término não pode ser anterior à data de hoje.'
        };
      }
      if (campaignData.endDate < campaignData.startDate) {
        return {
          valid: false,
          field: 'endDate',
          elementId: 'field-campaign-end-date',
          message: 'A data de término não pode ser anterior à data de início.'
        };
      }
      const startMs = new Date(`${campaignData.startDate}T${campaignData.startTime || '00:00'}:00`).getTime();
      const endMs = new Date(`${campaignData.endDate}T${campaignData.endTime || '00:00'}:00`).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs <= startMs) {
        return {
          valid: false,
          field: 'endDate',
          elementId: 'field-campaign-end-date',
          message: 'A data e horário de término devem ser posteriores ao início.'
        };
      }
    }
    return { valid: true, field: '', elementId: '', message: '' };
  };

  const handleSolveError = (err: ActiveValidationError) => {
    if (step !== err.step) {
      setStep(err.step);
    }

    setTimeout(() => {
      const el = document.getElementById(err.elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'rounded-lg', 'transition-all');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 2500);
      }

      if (err.field === 'platforms') {
        setPlatformDropdownOpen(true);
      } else if (err.field === 'conversion') {
        setConversionDropdownOpen(true);
      } else if (err.field === 'name') {
        const input = document.getElementById('field-campaign-name-input');
        input?.focus();
      } else if (err.field === 'startDate') {
        const input = document.getElementById('field-campaign-start-date-input');
        input?.focus();
      } else if (err.field === 'endDate') {
        const input = document.getElementById('field-campaign-end-date-input');
        input?.focus();
      }
    }, 120);
  };

  // Ensure screen scrolls to the very top when wizard opens
  useEffect(() => {
    if (isCreating) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
      const mainContent = document.getElementById('adwiser-main-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const main = document.getElementById('adwiser-main-content');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  }, [isCreating]);

  // Real-time automatic error resolution detection
  useEffect(() => {
    if (!activeValidationError || activeValidationError.isResolved) return;

    let isNowResolved = false;
    if (activeValidationError.field === 'platforms' && campaignData.platforms.length > 0) {
      isNowResolved = true;
    } else if (activeValidationError.field === 'name' && campaignData.name.trim().length >= 3) {
      isNowResolved = true;
    } else if (activeValidationError.field === 'conversion' && campaignData.conversionEventId) {
      isNowResolved = true;
    } else if (activeValidationError.field === 'budget' && !isNaN(parseFloat(campaignData.budget)) && parseFloat(campaignData.budget) >= 1) {
      isNowResolved = true;
    } else if (activeValidationError.field === 'startDate' || activeValidationError.field === 'endDate') {
      const dateCheck = validateCampaignDates();
      if (dateCheck.valid) {
        isNowResolved = true;
      }
    }

    if (isNowResolved) {
      setActiveValidationError(prev => prev ? { ...prev, isResolved: true } : null);
      setMessage({ type: '', text: '' });
    }
  }, [campaignData.platforms, campaignData.name, campaignData.conversionEventId, campaignData.budget, campaignData.startDate, campaignData.endDate, campaignData.startTime, campaignData.endTime, campaignData.hasEndDate, activeValidationError?.field, activeValidationError?.isResolved]);

  // When error is resolved, automatically dismiss the card after exactly 3 seconds
  useEffect(() => {
    if (activeValidationError?.isResolved) {
      const timer = setTimeout(() => {
        setActiveValidationError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeValidationError?.isResolved]);

  const getAuthHeaders = () => {
    const localKey = localStorage.getItem('adwiser_openai_api_key');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (localKey && localKey.trim()) {
      headers['x-openai-ads-key'] = localKey.trim();
    }
    return headers;
  };

  const handleCancel = () => {
    if (wizardMode === 'create' && step >= 1) {
      const isDuplicating = editingCampId === null && campaignData.name.includes('(Cópia)');
      // Use existing ID if it's already a draft we're editing, otherwise generate new
      const draftId = (editingCampId && String(editingCampId).startsWith('draft_')) ? editingCampId : 'draft_' + Date.now();
      
      const draftCampaign = {
        id: draftId,
        name: campaignData.name || 'Nova Campanha (Rascunho)',
        status: 'draft',
        objective: campaignData.objective,
        type: campaignData.type,
        budget: {
          daily_spend_limit_micros: campaignData.budgetType === 'daily' ? parseFloat(campaignData.budget) * 1000000 : undefined,
          lifetime_spend_limit_micros: campaignData.budgetType === 'lifetime' ? parseFloat(campaignData.budget) * 1000000 : undefined
        },
        _isDraft: true,
        _campaignData: campaignData,
        _adGroupData: adGroupData,
        _adData: adData
      };
      
      try {
        const draftsStr = localStorage.getItem('adwiser_draft_campaigns');
        let drafts = draftsStr ? JSON.parse(draftsStr) : [];
        drafts = drafts.filter((d: any) => d.id !== draftId);
        drafts.push(draftCampaign);
        localStorage.setItem('adwiser_draft_campaigns', JSON.stringify(drafts));
        fetchCampaigns();
      } catch (err) {}
    }
    setIsCreating(false);
  };

  const handleOpenWizard = async (mode: 'create' | 'edit' | 'view', camp?: any) => {
    setWizardMode(mode);
    setStep(1);
    setMessage({ type: '', text: '' });
    setActiveValidationError(null);
    if (camp) {
      if (camp._isDraft) {
        setEditingCampId(camp.id);
        setCampaignData(camp._campaignData);
        setAdGroupData(camp._adGroupData);
        setAdData(camp._adData);
        setWizardMode('create'); // Drafts are always "created"
        setIsCreating(true);
        return;
      }
      
      setEditingCampId(mode === 'create' ? null : camp.id);
      
      // Parse targeting
      let includedLocs = [{ id: '1000030', name: 'Brasil' }];
      let excludedLocs: any[] = [];
      let platforms = ['ios_app', 'android_app', 'web'];
      let activeAudiences: Record<string, { enabled: boolean; multiplier: string }> = {};

      // 1. Check local storage cache as authoritative backup for platforms
      try {
        const cache = JSON.parse(localStorage.getItem('adwiser_campaign_platforms') || '{}');
        if (cache[camp.id] && Array.isArray(cache[camp.id]) && cache[camp.id].length > 0) {
          platforms = cache[camp.id];
        }
      } catch (e) {}
      
      if (camp.targeting) {
        const incLocs = camp.targeting.locations?.include || camp.targeting.locations?.included;
        const excLocs = camp.targeting.locations?.exclude || camp.targeting.locations?.excluded;
        if (Array.isArray(incLocs)) {
           includedLocs = incLocs.map((l: any) => ({ id: String(l.id || l), name: String(l.name || l.id || l) }));
        }
        if (Array.isArray(excLocs)) {
           excludedLocs = excLocs.map((l: any) => ({ id: String(l.id || l), name: String(l.name || l.id || l) }));
        }

        // Support ALL platform representations from OpenAI API:
        // Direct array, { included: [...] }, { include: [...] }, { platforms: [...] }, or top-level camp.platforms
        const rawPlats = Array.isArray(camp.targeting.platforms)
          ? camp.targeting.platforms
          : (camp.targeting.platforms?.included || camp.targeting.platforms?.include || camp.targeting.platforms?.platforms || camp.platforms);

        if (Array.isArray(rawPlats) && rawPlats.length > 0) {
           platforms = rawPlats.map((p: any) => {
             const raw = typeof p === 'object' && p !== null ? (p.id || p.name || p.platform || p.value || '') : p;
             const s = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
             if (s === 'ios_app' || s === 'ios') return 'ios_app';
             if (s === 'android_app' || s === 'android') return 'android_app';
             if (s === 'web') return 'web';
             if (s === 'desktop_web' || s === 'desktop') return 'desktop_web';
             if (s === 'ios_web') return 'ios_web';
             if (s === 'android_web') return 'android_web';
             return s;
           }).filter(Boolean);
        }
        if (camp.targeting.audiences && Array.isArray(camp.targeting.audiences)) {
           camp.targeting.audiences.forEach((a: any) => {
              activeAudiences[a.id] = { enabled: true, multiplier: a.bid_multiplier || '+0%' };
           });
        }
      }

      const today = getTodayDateStr();
      const rawStart = camp.start_time ? new Date(camp.start_time * 1000).toISOString().split('T')[0] : today;
      const startDateStr = rawStart < today ? today : rawStart;
      const startTimeStr = camp.start_time ? new Date(camp.start_time * 1000).toTimeString().substring(0, 5) : '12:00';
      const hasEndDate = !!camp.end_time;
      const rawEnd = camp.end_time ? new Date(camp.end_time * 1000).toISOString().split('T')[0] : getFutureDateStr(30);
      const endDateStr = rawEnd < startDateStr ? getFutureDateStr(30) : rawEnd;
      const endTimeStr = camp.end_time ? new Date(camp.end_time * 1000).toTimeString().substring(0, 5) : '12:00';

      const loadedCamp = {
        name: mode === 'create' ? (camp.name ? `${camp.name} (Cópia)` : 'Nova campanha de tráfego') : (camp.name || ''),
        type: camp.type || 'Padrão',
        objective: camp.objective === 'reach' ? 'Alcance' : camp.objective === 'conversions' ? 'Conversões' : 'Cliques',
        conversionEventId: (camp.conversion_event_setting_ids && camp.conversion_event_setting_ids[0]) || '',
        conversionEventName: '',
        budgetType: (camp.budget?.daily_spend_limit_micros ? 'daily' : 'lifetime') as 'daily' | 'lifetime',
        budget: ((camp.budget?.daily_spend_limit_micros || camp.budget?.lifetime_spend_limit_micros || 150000000) / 1000000).toString(),
        includedLocations: includedLocs,
        excludedLocations: excludedLocs,
        platforms: platforms,
        queryParams: camp.query_params || '',
        startDate: startDateStr,
        startTime: startTimeStr,
        hasEndDate: hasEndDate,
        endDate: endDateStr,
        endTime: endTimeStr,
        textPersonalization: camp.description === 'Personalização de texto ativa'
      };

      setCampaignData(loadedCamp);
      setSelectedAudienceAdjustments(activeAudiences);

      // Async fetch to ensure deep campaign targeting from OpenAI is completely loaded
      if (camp.id) {
        fetch(`/api/openai/campaigns/${camp.id}`, { headers: getAuthHeaders() })
          .then(r => r.json())
          .then(fresh => {
            if (fresh && fresh.id && fresh.targeting) {
              const rawP = Array.isArray(fresh.targeting.platforms)
                ? fresh.targeting.platforms
                : (fresh.targeting.platforms?.included || fresh.targeting.platforms?.include || fresh.targeting.platforms?.platforms || fresh.platforms);
              if (Array.isArray(rawP) && rawP.length > 0) {
                const mapped = rawP.map((p: any) => {
                  const raw = typeof p === 'object' && p !== null ? (p.id || p.name || p.platform || p.value || '') : p;
                  const s = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
                  if (s === 'ios_app' || s === 'ios') return 'ios_app';
                  if (s === 'android_app' || s === 'android') return 'android_app';
                  if (s === 'web') return 'web';
                  if (s === 'desktop_web' || s === 'desktop') return 'desktop_web';
                  if (s === 'ios_web') return 'ios_web';
                  if (s === 'android_web') return 'android_web';
                  return s;
                }).filter(Boolean);
                if (mapped.length > 0) {
                  setCampaignData(prev => ({ ...prev, platforms: mapped }));
                  try {
                    const cache = JSON.parse(localStorage.getItem('adwiser_campaign_platforms') || '{}');
                    cache[fresh.id] = mapped;
                    localStorage.setItem('adwiser_campaign_platforms', JSON.stringify(cache));
                  } catch (e) {}
                }
              }
            }
          })
          .catch(() => {});
      }

      let loadedAgData = {
        name: 'Novo grupo de anúncios',
        bidStrategy: 'manual',
        maxBid: '13.50',
        cpmBid: '340.00',
        queryParams: 'campaign_id={campaign_id}&ad_id={ad_id}',
        defaultUrl: 'https://ternus.vercel.app/',
        contextHints: ''
      };
      let loadedAdData = {
        name: 'Novo anúncio',
        url: 'https://ternus.vercel.app/',
        queryParams: '',
        title: 'Ternus Studios',
        description: 'Studio de apps mobile.',
        image: true
      };
      let loadedAdsList: any[] = [];

      // Fetch Ad Groups
      try {
        const agRes = await fetch(`/api/openai/ad_groups?campaign_id=${camp.id}`, { headers: getAuthHeaders() });
        const agData = await agRes.json().catch(() => null);
        if (agRes.ok && agData?.data && agData.data.length > 0) {
          const group = agData.data[0];
          const bidMicros = group.bidding_config?.max_bid_micros || group.max_bid || group.cpm_bid;
          const isImpression = group.bidding_config?.billing_event_type === 'impression' || group.bid_strategy === 'cpm';
          
          loadedAgData = {
            name: group.name || '',
            bidStrategy: isImpression ? 'cpm' : (group.bid_strategy || 'manual'),
            maxBid: bidMicros ? (bidMicros / 1000000).toString() : '13.50',
            cpmBid: bidMicros ? (bidMicros / 1000000).toString() : '340.00',
            queryParams: group.query_params || '',
            defaultUrl: group.default_url || '',
            contextHints: Array.isArray(group.context_hints) ? group.context_hints.join(', ') : (group.context_hints || '')
          };
          setAdGroupData(loadedAgData);

          // Fetch Ads for this group
          const adsRes = await fetch(`/api/openai/ads?ad_group_id=${group.id}`, { headers: getAuthHeaders() });
          const adsData = await adsRes.json().catch(() => null);
          if (adsRes.ok && adsData?.data && adsData.data.length > 0) {
            const fetchedAds = adsData.data.map((a: any) => ({
               id: a.id,
               name: a.name || '',
               title: a.creative?.title || a.title || '',
               description: a.creative?.body || a.creative?.description || a.description || '',
               url: a.creative?.target_url || a.creative?.url || a.url || '',
               queryParams: a.query_params || '',
               image: a.image !== false
            }));
            
            if (fetchedAds.length > 0) {
              loadedAdData = fetchedAds[0];
              setAdData(fetchedAds[0]);
            }
            if (fetchedAds.length > 1) {
              loadedAdsList = fetchedAds.slice(1);
              setAdsList(fetchedAds.slice(1));
            } else {
              loadedAdsList = [];
              setAdsList([]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching ad groups and ads", err);
      }

      // Salva o snapshot inicial para dirty checking
      setInitialSnapshot(JSON.stringify({
        campaign: loadedCamp,
        audiences: activeAudiences,
        adGroup: loadedAgData,
        ad: loadedAdData,
        ads: loadedAdsList
      }));
    } else {
      setEditingCampId(null);
      setCampaignData({ 
        name: 'Nova campanha de tráfego', type: 'Padrão', objective: 'Cliques',
        conversionEventId: '', conversionEventName: '',
        includedLocations: [{ id: '1000030', name: 'Brasil' }], excludedLocations: [], platforms: ['ios_app', 'android_app', 'web'],
        queryParams: '', budgetType: 'daily', budget: '150.00',
        startDate: getTodayDateStr(), startTime: '12:00', hasEndDate: false, endDate: getFutureDateStr(30), endTime: '12:00',
        textPersonalization: true
      });
      setSelectedAudienceAdjustments({});
      setInitialSnapshot('');
    }
    setIsCreating(true);
    // Instant and smooth scroll to the very top of window and main content
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContent = document.getElementById('adwiser-main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const main = document.getElementById('adwiser-main-content');
      if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    }, 40);
  };

  const fetchCampaigns = async () => {
    // If not marked as configured in Adwiser, user is in first-time mode
    if (localStorage.getItem('adwiser_openai_configured') !== 'true') {
      setNeedsOnboarding(true);
      setLoadingCampaigns(false);
      setIsInitialCheck(false);
      return;
    }

    setLoadingCampaigns(true);
    try {
      const res = await fetch('/api/openai/campaigns', { headers: getAuthHeaders() });
      const data = await res.json();
      
      let fetchedCampaigns = [];
      if (res.ok && Array.isArray(data.data)) {
        fetchedCampaigns = data.data;
        setNeedsOnboarding(false);
      } else if (!res.ok) {
        if (res.status === 401) {
          setNeedsOnboarding(true);
        } else {
          handleApiError(data.error || '');
        }
      }
      
      // Load local drafts
      try {
        const draftsStr = localStorage.getItem('adwiser_draft_campaigns');
        if (draftsStr) {
          const drafts = JSON.parse(draftsStr);
          fetchedCampaigns = [...drafts, ...fetchedCampaigns];
        }
      } catch (err) {}
      
      setCampaigns(fetchedCampaigns);
      
    } catch (err) {
      console.error("Erro ao listar campanhas do OpenAI Ads:", err);
    } finally {
      setLoadingCampaigns(false);
      setIsInitialCheck(false);
    }
  };

  const handleUpdateCampaign = async (id: string, updates: { status?: string, name?: string }) => {
    setUpdatingCampaignId(id);
    try {
      const res = await fetch(`/api/openai/campaigns/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        if (!handleApiError(data.error || '')) {
          alert(`Erro ao atualizar campanha: ${data.error}`);
        }
      } else {
        // Update local state directly instead of refetching everything
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        setEditingCampaignId(null);
      }
    } catch (err: any) {
      alert(`Erro de rede: ${err.message}`);
    } finally {
      setUpdatingCampaignId(null);
    }
  };

  const fetchAudiences = async () => {
    setLoadingAudiences(true);
    try {
      const res = await fetch('/api/openai/custom_audiences', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setAudiences(data.data);
      }
    } catch (err) {
      console.error("Erro ao buscar públicos do OpenAI Ads:", err);
    } finally {
      setLoadingAudiences(false);
    }
  };

  const handleCreateAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audienceForm.name.trim()) return;
    setIsSavingAudience(true);
    try {
      const res = await fetch('/api/openai/custom_audiences', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: audienceForm.name.trim(),
          description: audienceForm.description.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao criar público personalizado.");
      } else {
        await fetchAudiences();
        setShowAudienceModal(false);
        setAudienceForm({
          name: '',
          description: '',
          sourceType: 'customer_list',
          identifiers: '',
          fileName: ''
        });
        if (data.id) {
          setSelectedAudienceAdjustments(prev => ({
            ...prev,
            [data.id]: { enabled: true, multiplier: '+20%' }
          }));
        }
      }
    } catch (err: any) {
      alert(err.message || "Erro de conexão ao criar público.");
    } finally {
      setIsSavingAudience(false);
    }
  };

  const fetchConversionEvents = async () => {
    setLoadingConversionEvents(true);
    try {
      const res = await fetch('/api/openai/conversions/event_settings', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && Array.isArray(data.data)) {
        setConversionEvents(data.data);
      }
    } catch (err) {
      console.error("Erro ao buscar eventos de conversão do OpenAI Ads:", err);
    } finally {
      setLoadingConversionEvents(false);
    }
  };

  const handleCreateConversionEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversionModalForm.name.trim()) return;
    setIsSavingConversionEvent(true);
    try {
      const res = await fetch('/api/openai/conversions/event_settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: conversionModalForm.name.trim(),
          event_type: conversionModalForm.event_type || 'order_created',
          attribution_window_days: Number(conversionModalForm.attribution_window_days) || 30
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao criar evento de conversão.");
      } else {
        await fetchConversionEvents();
        setShowConversionModal(false);
        setConversionModalForm({
          name: '',
          event_type: 'order_created',
          attribution_window_days: 30
        });
        if (data.id) {
          setCampaignData(prev => ({
            ...prev,
            conversionEventId: data.id,
            conversionEventName: data.name
          }));
          setConversionError('');
        }
      }
    } catch (err: any) {
      alert(err.message || "Erro de conexão ao criar evento de conversão.");
    } finally {
      setIsSavingConversionEvent(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchAudiences();
    fetchConversionEvents();
    if (initialCreate) {
      handleOpenWizard('create');
    }
  }, [initialCreate]);

  useEffect(() => {
    if (locSearch.trim().length < 2) {
      setLocResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearchingLoc(true);
      try {
        const res = await fetch(`/api/openai/locations?q=${encodeURIComponent(locSearch.trim())}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setLocResults(list);
      } catch (err) {
        console.error("Erro ao buscar locais:", err);
      } finally {
        setIsSearchingLoc(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [locSearch]);

  useEffect(() => {
    if (exLocSearch.trim().length < 2) {
      setExLocResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearchingExLoc(true);
      try {
        const res = await fetch(`/api/openai/locations?q=${encodeURIComponent(exLocSearch.trim())}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setExLocResults(list);
      } catch (err) {
        console.error("Erro ao buscar locais para exclusão:", err);
      } finally {
        setIsSearchingExLoc(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [exLocSearch]);

  const handleNext = () => {
    setMessage({ type: '', text: '' });
    if (step === 1) {
      if (campaignData.name.trim().length < 3) {
        triggerValidationError({
          id: 'name',
          field: 'name',
          step: 1,
          message: 'O nome da campanha deve conter no mínimo 3 caracteres.',
          elementId: 'field-campaign-name'
        });
        return;
      }
      if (campaignData.objective === 'Conversões' && !campaignData.conversionEventId) {
        setConversionError('É obrigatório selecionar um evento de conversão para campanhas com objetivo de Conversões.');
        triggerValidationError({
          id: 'conversion',
          field: 'conversion',
          step: 1,
          message: 'É obrigatório selecionar um evento de conversão para o objetivo de Conversões.',
          elementId: 'field-conversion-event'
        });
        return;
      }
      if (campaignData.platforms.length === 0) {
        triggerValidationError({
          id: 'platforms',
          field: 'platforms',
          step: 1,
          message: 'Você deve selecionar pelo menos uma plataforma.',
          elementId: 'field-campaign-platforms'
        });
        return;
      }
      const numericBudget = parseFloat(campaignData.budget);
      if (isNaN(numericBudget) || numericBudget < 1) {
        triggerValidationError({
          id: 'budget',
          field: 'budget',
          step: 1,
          message: 'O orçamento deve ser um valor válido (mínimo R$ 1,00).',
          elementId: 'field-campaign-budget'
        });
        return;
      }
      const dateCheck = validateCampaignDates();
      if (!dateCheck.valid) {
        triggerValidationError({
          id: dateCheck.field || 'dates',
          field: dateCheck.field || 'dates',
          step: 1,
          message: dateCheck.message,
          elementId: dateCheck.elementId
        });
        return;
      }
      setConversionError('');
    }
    setStep(s => Math.min(s + 1, 4));
  };
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSaveEdit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const trimmedName = campaignData.name.trim();
      if (trimmedName.length < 3) {
        triggerValidationError({
          id: 'name',
          field: 'name',
          step: 1,
          message: 'O nome da campanha deve conter no mínimo 3 caracteres.',
          elementId: 'field-campaign-name'
        });
        throw new Error('O nome da campanha deve conter no mínimo 3 caracteres.');
      }
      if (campaignData.platforms.length === 0) {
        triggerValidationError({
          id: 'platforms',
          field: 'platforms',
          step: 1,
          message: 'Você deve selecionar pelo menos uma plataforma.',
          elementId: 'field-campaign-platforms'
        });
        throw new Error('Você deve selecionar pelo menos uma plataforma.');
      }
      if (campaignData.objective === 'Conversões' && !campaignData.conversionEventId) {
        triggerValidationError({
          id: 'conversion',
          field: 'conversion',
          step: 1,
          message: 'É obrigatório selecionar um evento de conversão para o objetivo de Conversões.',
          elementId: 'field-conversion-event'
        });
        throw new Error('É obrigatório selecionar um evento de conversão para o objetivo de Conversões.');
      }
      const numericBudget = parseFloat(campaignData.budget);
      if (isNaN(numericBudget) || numericBudget < 1) {
        triggerValidationError({
          id: 'budget',
          field: 'budget',
          step: 1,
          message: 'O orçamento deve ser um valor válido (mínimo R$ 1,00).',
          elementId: 'field-campaign-budget'
        });
        throw new Error('O orçamento deve ser um valor válido.');
      }
      const dateCheck = validateCampaignDates();
      if (!dateCheck.valid) {
        triggerValidationError({
          id: dateCheck.field || 'dates',
          field: dateCheck.field || 'dates',
          step: 1,
          message: dateCheck.message,
          elementId: dateCheck.elementId
        });
        throw new Error(dateCheck.message);
      }

      const startTimeUnix = Math.floor(new Date(`${campaignData.startDate}T${campaignData.startTime}:00`).getTime() / 1000);
      const endTimeUnix = campaignData.hasEndDate
        ? Math.floor(new Date(`${campaignData.endDate}T${campaignData.endTime}:00`).getTime() / 1000)
        : null;

      const payload: any = {
        name: trimmedName,
        budgetType: campaignData.budgetType,
        budget: numericBudget,
        start_time: isNaN(startTimeUnix) ? undefined : startTimeUnix,
        end_time: endTimeUnix,
        description: campaignData.textPersonalization ? 'Personalização de texto ativa' : '',
        targeting: {
          locations: {
            include: campaignData.includedLocations.map(l => ({ id: l.id }))
          },
          platforms: { included: campaignData.platforms.map(p => p.toLowerCase().trim().replace(/[\s-]+/g, '_')) }
        }
      };

      const res = await fetch(`/api/openai/campaigns/${editingCampId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar campanha no OpenAI Ads');

      // Update local storage cache so platforms persist reliably
      try {
        const cache = JSON.parse(localStorage.getItem('adwiser_campaign_platforms') || '{}');
        cache[editingCampId] = campaignData.platforms;
        localStorage.setItem('adwiser_campaign_platforms', JSON.stringify(cache));
      } catch (e) {}

      // Update campaigns state immediately in-place
      setCampaigns(prev => prev.map(c => c.id === editingCampId ? {
        ...c,
        ...(data || {}),
        targeting: {
          ...(c.targeting || {}),
          ...(data?.targeting || {}),
          platforms: { included: campaignData.platforms }
        }
      } : c));

      // Update or Create Ad Group
      const agRes = await fetch(`/api/openai/ad_groups?campaign_id=${editingCampId}`, { headers: getAuthHeaders() });
      const agData = await agRes.json().catch(() => null);
      let groupId = agData?.data?.[0]?.id;

      const adGroupPayload = {
        campaign_id: editingCampId,
        name: adGroupData.name.trim() || 'Grupo de anúncios',
        status: 'active',
        bid_strategy: adGroupData.bidStrategy,
        max_bid: adGroupData.maxBid,
        cpm_bid: adGroupData.cpmBid,
        query_params: adGroupData.queryParams,
        default_url: adGroupData.defaultUrl,
        context_hints: adGroupData.contextHints
      };

      if (groupId) {
        const updateAgRes = await fetch(`/api/openai/ad_groups/${groupId}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(adGroupPayload)
        });
        const updateAgData = await updateAgRes.json().catch(() => null);
        if (!updateAgRes.ok) {
          console.warn("Aviso ao atualizar grupo de anúncios:", updateAgData);
        }
      } else {
        const createAgRes = await fetch('/api/openai/ad_groups', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(adGroupPayload)
        });
        const createAgData = await createAgRes.json().catch(() => null);
        if (createAgRes.ok && createAgData?.id) {
          groupId = createAgData.id;
        }
      }

      // Update or Create Ads
      if (groupId) {
        const adsRes = await fetch(`/api/openai/ads?ad_group_id=${groupId}`, { headers: getAuthHeaders() });
        const adsData = await adsRes.json().catch(() => null);
        const existingAds = adsData?.data || [];

        const currentAds = [adData, ...adsList].filter(a => a && (a.title || a.name || a.description));

        for (let i = 0; i < currentAds.length; i++) {
          const ad = currentAds[i];
          const existing = existingAds[i];

          const adPayload = {
            ad_group_id: groupId,
            name: ad.name || `Anúncio ${i + 1}`,
            status: 'active',
            title: ad.title || 'Ternus',
            description: ad.description || '',
            url: ad.url || 'https://ternus.vercel.app/',
            query_params: ad.queryParams || '',
            image: ad.image !== false
          };

          if (existing && existing.id) {
            await fetch(`/api/openai/ads/${existing.id}`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(adPayload)
            });
          } else {
            await fetch('/api/openai/ads', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(adPayload)
            });
          }
        }
      }

      // Atualiza o snapshot para resetar o dirty checking
      setInitialSnapshot(JSON.stringify({
        campaign: campaignData,
        audiences: selectedAudienceAdjustments,
        adGroup: adGroupData,
        ad: adData,
        ads: adsList
      }));

      setMessage({ type: 'success', text: 'Campanha, grupo e anúncios atualizados com sucesso!' });
      fetchCampaigns();
      
      setTimeout(() => {
        setIsCreating(false);
      }, 1200);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const trimmedName = campaignData.name.trim();
      if (trimmedName.length < 3) {
        throw new Error('O nome da campanha deve conter no mínimo 3 caracteres.');
      }

      if (campaignData.platforms.length === 0) {
        throw new Error('Você deve selecionar pelo menos uma plataforma.');
      }

      if (campaignData.objective === 'Conversões' && !campaignData.conversionEventId) {
        throw new Error('É obrigatório selecionar um evento de conversão para o objetivo de Conversões.');
      }

      const numericBudget = parseFloat(campaignData.budget);
      if (isNaN(numericBudget) || numericBudget < 1) {
        throw new Error('O orçamento deve ser um valor válido.');
      }

      const dateCheck = validateCampaignDates();
      if (!dateCheck.valid) {
        triggerValidationError({
          id: dateCheck.field || 'dates',
          field: dateCheck.field || 'dates',
          step: 1,
          message: dateCheck.message,
          elementId: dateCheck.elementId
        });
        throw new Error(dateCheck.message);
      }

      // Start time formatting to unix
      let startTimeUnix = undefined;
      if (campaignData.startDate) {
        const d = new Date(`${campaignData.startDate}T${campaignData.startTime || '00:00'}:00`);
        if (!isNaN(d.getTime())) startTimeUnix = Math.floor(d.getTime() / 1000);
      }

      // End time formatting to unix
      let endTimeUnix = undefined;
      if (campaignData.hasEndDate && campaignData.endDate) {
        const d = new Date(`${campaignData.endDate}T${campaignData.endTime || '23:59'}:00`);
        if (!isNaN(d.getTime())) endTimeUnix = Math.floor(d.getTime() / 1000);
      }

      const payload: any = {
        name: trimmedName,
        status: 'active',
        budgetType: campaignData.budgetType,
        budget: numericBudget,
        objective: campaignData.objective,
        start_time: startTimeUnix,
        end_time: endTimeUnix,
        description: campaignData.textPersonalization ? 'Personalização de texto ativa' : undefined,
        targeting: {
          locations: {
            include: campaignData.includedLocations.map(l => ({ id: l.id }))
          },
          platforms: { included: campaignData.platforms.map(p => p.toLowerCase().trim().replace(/[\s-]+/g, '_')) }
        }
      };

      if (campaignData.objective === 'Conversões' && campaignData.conversionEventId) {
        payload.conversion_event_setting_ids = [campaignData.conversionEventId];
      }

      // 1. Criar Campanha
      const res = await fetch('/api/openai/campaigns', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (handleApiError(data.error || 'Erro ao criar campanha no OpenAI Ads')) {
          throw new Error('Verifique o status da sua conta de anúncios.');
        } else {
          throw new Error(data.error || 'Erro ao criar campanha no OpenAI Ads');
        }
      }

      // Remove from drafts if applicable
      if (editingCampId && String(editingCampId).startsWith('draft_')) {
        try {
          const draftsStr = localStorage.getItem('adwiser_draft_campaigns');
          if (draftsStr) {
            let drafts = JSON.parse(draftsStr);
            drafts = drafts.filter((d: any) => d.id !== editingCampId);
            localStorage.setItem('adwiser_draft_campaigns', JSON.stringify(drafts));
          }
        } catch(e) {}
      }

      // 2. Criar Grupo de Anúncios (se a campanha foi criada com sucesso)
      if (data && data.id) {
        try {
          const cache = JSON.parse(localStorage.getItem('adwiser_campaign_platforms') || '{}');
          cache[data.id] = campaignData.platforms;
          localStorage.setItem('adwiser_campaign_platforms', JSON.stringify(cache));
        } catch (e) {}

        const adGroupPayload = {
          campaign_id: data.id,
          name: adGroupData.name,
          status: 'active',
          bid_strategy: adGroupData.bidStrategy,
          max_bid: adGroupData.maxBid,
          cpm_bid: adGroupData.cpmBid,
          query_params: adGroupData.queryParams,
          default_url: adGroupData.defaultUrl,
          context_hints: adGroupData.contextHints
        };
        const resGroup = await fetch('/api/openai/ad_groups', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(adGroupPayload)
        });
        const groupData = await resGroup.json().catch(() => null);

        // 3. Criar Anúncios (se o grupo de anúncios foi criado com sucesso)
        if (resGroup.ok && groupData && groupData.id) {
           const finalAds = [...adsList];
           if (adData.title || adData.description) {
             finalAds.push(adData);
           }
           
           for (const ad of finalAds) {
             const adPayload = {
               ad_group_id: groupData.id,
               name: ad.name,
               status: 'active',
               title: ad.title,
               description: ad.description,
               url: ad.url,
               query_params: ad.queryParams,
               image: ad.image
             };
             await fetch('/api/openai/ads', {
               method: 'POST',
               headers: getAuthHeaders(),
               body: JSON.stringify(adPayload)
             });
           }
        }
      }

      setMessage({ type: 'success', text: 'Campanha, Grupo e Anúncio criados e registrados com sucesso no OpenAI Ads!' });
      
      if (data && data.id) {
        setCampaigns(prev => [data, ...prev]);
      } else {
        fetchCampaigns();
      }

      // Abre o modal de carregamento que vira o "certinho"
      setPublishStage('loading');
      setPublishCountdown(10);
      setShowPublishModal(true);

      // Transição suave para o certinho após breve processamento visual (1.2s)
      setTimeout(() => {
        setGifKey(Date.now());
        setPublishStage('success');
      }, 1200);
    } catch (err: any) {
      if (campaignData.name.trim().length < 3) {
        triggerValidationError({
          id: 'name',
          field: 'name',
          step: 1,
          message: 'O nome da campanha deve conter no mínimo 3 caracteres.',
          elementId: 'field-campaign-name'
        });
      } else if (campaignData.platforms.length === 0) {
        triggerValidationError({
          id: 'platforms',
          field: 'platforms',
          step: 1,
          message: 'Você deve selecionar pelo menos uma plataforma.',
          elementId: 'field-campaign-platforms'
        });
      } else if (campaignData.objective === 'Conversões' && !campaignData.conversionEventId) {
        triggerValidationError({
          id: 'conversion',
          field: 'conversion',
          step: 1,
          message: 'É obrigatório selecionar um evento de conversão para o objetivo de Conversões.',
          elementId: 'field-conversion-event'
        });
      } else if (isNaN(parseFloat(campaignData.budget)) || parseFloat(campaignData.budget) < 1) {
        triggerValidationError({
          id: 'budget',
          field: 'budget',
          step: 1,
          message: 'O orçamento deve ser um valor válido (mínimo R$ 1,00).',
          elementId: 'field-campaign-budget'
        });
      } else {
        triggerValidationError({
          id: 'general',
          field: 'general',
          step: step,
          message: err.message || 'Erro ao processar criação da campanha.',
          elementId: 'field-campaign-name'
        });
      }
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div id="field-campaign-name" className="transition-all duration-300 p-1 rounded-md">
        <InputLabel>Nome da campanha</InputLabel>
        <InputField 
          id="field-campaign-name-input"
          value={campaignData.name} 
          onChange={(e: any) => setCampaignData({...campaignData, name: e.target.value})} 
          className={campaignData.name.length < 3 ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-500' : ''}
        />
        {campaignData.name.length < 3 && <p className="text-[11px] text-red-500 mt-1">Digite um nome de campanha com pelo menos 3 caracteres.</p>}
      </div>

      <div>
        <InputLabel>Tipo de campanha</InputLabel>
        <SelectField value={campaignData.type} onChange={(e: any) => setCampaignData({...campaignData, type: e.target.value})}>
          <option value="Padrão">Padrão</option>
          <option value="Feed de produtos" disabled className="text-gray-400 bg-gray-50">
            Feed de produtos (Disponível em breve)
          </option>
        </SelectField>
        <InputHint>Escolha como esta campanha criará anúncios e para onde as pessoas irão.</InputHint>
      </div>

      <div id="field-campaign-objective">
        <InputLabel>Objetivo</InputLabel>
        <SelectField 
          disabled={wizardMode === 'edit' || wizardMode === 'view'} 
          value={campaignData.objective} 
          onChange={(e: any) => setCampaignData({...campaignData, objective: e.target.value})}
          className={wizardMode === 'edit' || wizardMode === 'view' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
        >
          <option value="Alcance">Alcance</option>
          <option value="Cliques">Cliques</option>
          <option value="Conversões">Conversões</option>
        </SelectField>
        <InputHint>O objetivo da campanha determina como você dará lances no leilão de anúncios e quais formatos estarão disponíveis para promoção.</InputHint>
      </div>

      {campaignData.objective === 'Conversões' && (
        <div id="field-conversion-event" className="space-y-2 transition-all duration-300 p-1 rounded-md">
          <div className="flex items-center justify-between">
            <InputLabel>Evento de conversão</InputLabel>
            <span className="text-[11px] text-red-500 font-medium">* Obrigatório</span>
          </div>

          {/* Banner matching Image 2 */}
          <div className="border border-gray-200 rounded-md p-4 flex items-start justify-between gap-4 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-gray-800 font-bold text-[11px]">
                i
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-gray-900 leading-snug">Configure conversões para acompanhar ações valiosas</h4>
                <p className="text-[12px] text-gray-600 mt-0.5 leading-relaxed">
                  Acompanhe compras, cadastros e outras ações importantes para entender o desempenho da campanha e investir no que funciona.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowConversionModal(true)}
              className="text-[13px] font-medium text-gray-900 flex items-center hover:underline whitespace-nowrap pt-0.5"
            >
              Configurar conversões 
              <svg className="w-3.5 h-3.5 ml-1 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>

          {/* Dropdown Input matching Image 2 */}
          <div className="relative mt-2">
            <div 
              onClick={() => setConversionDropdownOpen(!conversionDropdownOpen)}
              className={`w-full bg-white border rounded-md px-3.5 py-2 text-[13px] flex items-center justify-between cursor-pointer transition-all ${
                conversionError 
                  ? 'border-red-500 ring-1 ring-red-500' 
                  : 'border-gray-300 hover:border-gray-400 focus:border-black'
              }`}
            >
              <span className={campaignData.conversionEventName ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                {campaignData.conversionEventName || 'Nenhum evento de conversão disponível'}
              </span>
              <div className="flex items-center gap-2">
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${conversionDropdownOpen ? 'rotate-180' : ''}`} />
                {campaignData.conversionEventId ? (
                  <X 
                    className="w-4 h-4 text-gray-500 hover:text-gray-800 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCampaignData(prev => ({ ...prev, conversionEventId: '', conversionEventName: '' }));
                    }} 
                  />
                ) : (
                  <X className="w-4 h-4 text-gray-300 pointer-events-none" />
                )}
              </div>
            </div>

            {conversionError && (
              <p className="text-[12px] text-red-600 mt-1 font-normal">
                {conversionError}
              </p>
            )}

            {/* Popover matching Image 2 */}
            {conversionDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 overflow-hidden divide-y divide-gray-100">
                {conversionEvents.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[13px] text-gray-500">No results found.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto py-1">
                    {conversionEvents.map((evt) => {
                      const isSelected = campaignData.conversionEventId === evt.id;
                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            setCampaignData(prev => ({
                              ...prev,
                              conversionEventId: evt.id,
                              conversionEventName: evt.name
                            }));
                            setConversionDropdownOpen(false);
                            setConversionError('');
                          }}
                          className={`px-4 py-2.5 text-[13px] flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-gray-50 font-medium text-black' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{evt.name}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5 capitalize">
                              {String(evt.event_type || '').replace(/_/g, ' ')} {evt.attribution_window_days ? `• ${evt.attribution_window_days}d` : ''}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-black" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Action matching Image 2 */}
                <div className="p-3 bg-gray-50/70">
                  <button
                    type="button"
                    onClick={() => {
                      setConversionDropdownOpen(false);
                      setShowConversionModal(true);
                    }}
                    className="text-[13px] text-gray-900 hover:text-black font-medium flex items-center gap-1.5 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Configurar conversões
                  </button>
                </div>
              </div>
            )}
          </div>
          <InputHint>Selecione a ação que as pessoas devem realizar ao ver seu anúncio</InputHint>
        </div>
      )}

      <div>
        <InputLabel>Locais desta campanha</InputLabel>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Digite um local para incluir (ex: Estados Unidos, Brasil, São Paulo)" 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px]" 
            value={locSearch}
            onChange={e => setLocSearch(e.target.value)}
          />
          {locSearch.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-56 overflow-y-auto">
              {isSearchingLoc ? (
                <div className="p-3 text-xs text-gray-500 text-center">Buscando locais na API do OpenAI Ads...</div>
              ) : locResults.length > 0 ? (
                locResults.map(loc => {
                  const locId = String(loc.id || loc.location_id);
                  const isAlreadyAdded = campaignData.includedLocations.some(l => l.id === locId);
                  return (
                    <div 
                      key={locId}
                      className={`px-3 py-2.5 text-[13px] flex items-center justify-between cursor-pointer border-b border-gray-100 last:border-0 ${isAlreadyAdded ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-800 hover:bg-gray-50'}`}
                      onClick={() => {
                        if (!isAlreadyAdded) {
                          setCampaignData({
                            ...campaignData,
                            includedLocations: [...campaignData.includedLocations, { id: locId, name: loc.name || loc.canonical_name }]
                          });
                          setLocSearch('');
                          setLocResults([]);
                        }
                      }}
                    >
                      <span className="font-medium">{loc.name || loc.canonical_name}</span>
                      {loc.type && (
                        <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-2">
                          {loc.type === 'country' ? 'País' : loc.type === 'region' ? 'Região' : loc.type === 'city' ? 'Cidade' : loc.type}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-xs text-gray-500 text-center">Nenhum local encontrado para "{locSearch}"</div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {campaignData.includedLocations.map(loc => (
            <div key={loc.id} className="inline-flex items-center px-3 py-1 border border-gray-800 rounded-full text-xs font-medium bg-white text-gray-900">
              {loc.name} 
              <X 
                className="w-3 h-3 ml-1.5 cursor-pointer text-gray-500 hover:text-gray-900" 
                onClick={() => setCampaignData({...campaignData, includedLocations: campaignData.includedLocations.filter(l => l.id !== loc.id)})}
              />
            </div>
          ))}
        </div>
        <InputHint>A campanha só será exibida nos locais selecionados.</InputHint>
      </div>

      <div>
        <InputLabel>Locais a serem excluídos desta campanha</InputLabel>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Insira uma localização para excluir" 
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px]" 
            value={exLocSearch}
            onChange={e => setExLocSearch(e.target.value)}
          />
          {exLocSearch.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-56 overflow-y-auto">
              {isSearchingExLoc ? (
                <div className="p-3 text-xs text-gray-500 text-center">Buscando locais na API do OpenAI Ads...</div>
              ) : exLocResults.length > 0 ? (
                exLocResults.map(loc => {
                  const locId = String(loc.id || loc.location_id);
                  const isAlreadyExcluded = campaignData.excludedLocations.some(l => l.id === locId);
                  return (
                    <div 
                      key={locId}
                      className={`px-3 py-2.5 text-[13px] flex items-center justify-between cursor-pointer border-b border-gray-100 last:border-0 ${isAlreadyExcluded ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'text-gray-800 hover:bg-gray-50'}`}
                      onClick={() => {
                        if (!isAlreadyExcluded) {
                          setCampaignData({
                            ...campaignData,
                            excludedLocations: [...campaignData.excludedLocations, { id: locId, name: loc.name || loc.canonical_name }]
                          });
                          setExLocSearch('');
                          setExLocResults([]);
                        }
                      }}
                    >
                      <span className="font-medium">{loc.name || loc.canonical_name}</span>
                      {loc.type && (
                        <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-2">
                          {loc.type === 'country' ? 'País' : loc.type === 'region' ? 'Região' : loc.type === 'city' ? 'Cidade' : loc.type}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-xs text-gray-500 text-center">Nenhum local encontrado para "{exLocSearch}"</div>
              )}
            </div>
          )}
        </div>
        {campaignData.excludedLocations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {campaignData.excludedLocations.map(loc => (
              <div key={loc.id} className="inline-flex items-center px-3 py-1 border border-red-300 rounded-full text-xs font-medium bg-red-50 text-red-700">
                {loc.name} 
                <X 
                  className="w-3 h-3 ml-1.5 cursor-pointer text-red-400 hover:text-red-700" 
                  onClick={() => setCampaignData({...campaignData, excludedLocations: campaignData.excludedLocations.filter(l => l.id !== loc.id)})}
                />
              </div>
            ))}
          </div>
        )}
        <InputHint>Usuários em uma localização excluída não verão esta campanha, mesmo que também se enquadrem em uma localização incluída.</InputHint>
      </div>

      <div id="field-campaign-platforms" className="transition-all duration-300 p-1 rounded-md">
        <InputLabel>Plataformas elegíveis</InputLabel>
        <div className="relative">
          <div 
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-[13px] flex items-center justify-between cursor-pointer focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
            onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
          >
            <span className="text-gray-900">
              {campaignData.platforms.length === AVAILABLE_PLATFORMS.length
                ? 'Todas as plataformas (All platforms)'
                : campaignData.platforms.length === 0
                ? 'Nenhuma plataforma selecionada'
                : campaignData.platforms.map(p => AVAILABLE_PLATFORMS.find(ap => ap.id === p)?.label || p.replace(/_/g, ' ')).join(', ')}
            </span>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${platformDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {platformDropdownOpen && (
            <div className="mt-1 bg-white border border-gray-200 rounded-md shadow-sm py-1">
              {AVAILABLE_PLATFORMS.map(platform => {
                const isSelected = campaignData.platforms.includes(platform.id);
                return (
                  <div 
                    key={platform.id}
                    className="px-3 py-2 text-[13px] text-gray-900 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      let newPlatforms = [...campaignData.platforms];
                      if (isSelected) {
                        newPlatforms = newPlatforms.filter(p => p !== platform.id);
                      } else {
                        newPlatforms.push(platform.id);
                      }
                      setCampaignData({...campaignData, platforms: newPlatforms});
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-4 flex-shrink-0">
                        {isSelected && <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span>{platform.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div>
        <InputLabel>Parâmetros de consulta da página de destino</InputLabel>
        <InputField 
          placeholder="" 
          value={campaignData.queryParams}
          onChange={(e: any) => setCampaignData({...campaignData, queryParams: e.target.value})}
        />
        <InputHint>Opcional. Adiciona parâmetros de consulta ausentes. Valores de modelo compatíveis: {'{campaign_id}, {ad_group_id}, {ad_id}, {ad_account_id}, {oppref}'}.</InputHint>
      </div>

      <div>
        <InputLabel>Públicos personalizados</InputLabel>
        <div className="flex flex-col gap-4">
          <div>
            <a href="https://ads.openai.com/settings/audiences" target="_blank" rel="noopener noreferrer" className="flex items-center text-[13px] border border-gray-300 rounded bg-white px-3 py-1.5 w-max hover:bg-gray-50 text-gray-700">
              <Plus className="w-4 h-4 mr-1.5 text-gray-500" /> Criar incluir público
            </a>
            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">Os anúncios desta campanha são exibidos apenas para usuários dos públicos selecionados.</p>
          </div>
          <div>
            <a href="https://ads.openai.com/settings/audiences" target="_blank" rel="noopener noreferrer" className="flex items-center text-[13px] border border-gray-300 rounded bg-white px-3 py-1.5 w-max hover:bg-gray-50 text-gray-700">
              <Plus className="w-4 h-4 mr-1.5 text-gray-500" /> Criar excluir público
            </a>
            <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">Os anúncios desta campanha não são exibidos para usuários dos públicos selecionados.</p>
          </div>
        </div>
      </div>

      <div id="field-campaign-budget" className="transition-all duration-300 p-1 rounded-md">
        <InputLabel>Orçamento</InputLabel>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="w-full md:w-1/3">
            <SelectField value={campaignData.budgetType} onChange={(e: any) => setCampaignData({...campaignData, budgetType: e.target.value})}>
              <option value="daily">Orçamento diário</option>
              <option value="lifetime">Orçamento total</option>
            </SelectField>
          </div>
          <div className="flex-1 relative flex items-center border border-gray-300 rounded-md bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <span className="pl-3 pr-2 text-[13px] text-gray-500 font-medium">R$</span>
            <input 
              type="text" 
              className="flex-1 py-2 outline-none text-[13px] text-gray-900 bg-transparent"
              value={campaignData.budget}
              onChange={(e) => setCampaignData({...campaignData, budget: e.target.value})}
            />
            <span className="pr-3 pl-2 text-[13px] text-gray-500 font-medium">BRL</span>
          </div>
        </div>
        <InputHint>Este é o valor médio que você aceita gastar por dia. Seu gasto diário máximo é R$300.00, e seu gasto máximo em sete dias é R$1,050.00.</InputHint>
      </div>

      <div id="field-campaign-start-date" className="transition-all duration-300 p-1 rounded-md">
        <InputLabel>Data de início</InputLabel>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
            <input 
              id="field-campaign-start-date-input"
              type="date" 
              min={getTodayDateStr()}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px]" 
              value={campaignData.startDate}
              onChange={e => setCampaignData({...campaignData, startDate: e.target.value})}
            />
          </div>
          <div className="relative flex-1">
            <Clock className="w-4 h-4 absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
            <input 
              type="time" 
              className="w-full pl-9 pr-14 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px]" 
              value={campaignData.startTime}
              onChange={e => setCampaignData({...campaignData, startTime: e.target.value})}
            />
            <span className="absolute right-3 top-2.5 text-[13px] text-gray-500 pointer-events-none">GMT-3</span>
          </div>
        </div>
      </div>

      <div id="field-campaign-end-date" className="transition-all duration-300 p-1 rounded-md">
        <InputLabel>Data de término</InputLabel>
        <label className="flex items-center text-[13px] text-gray-700 cursor-pointer">
          <input 
            type="checkbox" 
            className="mr-2.5 w-3.5 h-3.5 text-black border-gray-300 rounded focus:ring-black" 
            checked={campaignData.hasEndDate} 
            onChange={e => setCampaignData({...campaignData, hasEndDate: e.target.checked})} 
          />
          Definir data de término
        </label>
        {campaignData.hasEndDate && (
          <div className="flex gap-3 mt-2.5">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
              <input 
                id="field-campaign-end-date-input"
                type="date" 
                min={campaignData.startDate || getTodayDateStr()}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px]" 
                value={campaignData.endDate}
                onChange={e => setCampaignData({...campaignData, endDate: e.target.value})}
              />
            </div>
            <div className="relative flex-1">
              <Clock className="w-4 h-4 absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
              <input 
                type="time" 
                className="w-full pl-9 pr-14 py-2 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px]" 
                value={campaignData.endTime}
                onChange={e => setCampaignData({...campaignData, endTime: e.target.value})}
              />
              <span className="absolute right-3 top-2.5 text-[13px] text-gray-500 pointer-events-none">GMT-3</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-1.5 mb-2">
          <InputLabel>Personalização de texto</InputLabel>
          <Sparkles className="w-3.5 h-3.5 text-gray-700 mb-1.5" />
        </div>
        <label className="flex items-center cursor-pointer mb-2 w-max">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={campaignData.textPersonalization} onChange={e => setCampaignData({...campaignData, textPersonalization: e.target.checked})} />
            <div className={`block w-9 h-5 rounded-full transition-colors ${campaignData.textPersonalization ? 'bg-[#101010]' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${campaignData.textPersonalization ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <div className="ml-3 text-[13px] text-gray-900 font-medium">Ativado</div>
        </label>
        <InputHint>A IA gera automaticamente versões personalizadas e traduzidas dos títulos e descrições do seu anúncio, que podem ser exibidas sem sua análise ou aprovação individual.</InputHint>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const isReach = campaignData.objective === 'Alcance';
    const isConversions = campaignData.objective === 'Conversões';
    
    // CPM validation check for Reach objective
    const cleanCpm = adGroupData.cpmBid.replace(',', '.').trim();
    const numCpm = parseFloat(cleanCpm);
    const isCpmError = isReach && cleanCpm !== '' && (isNaN(numCpm) || numCpm < 0.01 || numCpm > 26000.00);

    // CPC delivery indicator for Clicks objective
    const cleanCpc = adGroupData.maxBid.replace(',', '.').trim();
    const numCpc = parseFloat(cleanCpc);
    const isLowCpc = isNaN(numCpc) || numCpc < 20;

    return (
      <div className="space-y-6">
        <div>
          <InputLabel>Nome do grupo de anúncios</InputLabel>
          <InputField 
            value={adGroupData.name} 
            onChange={(e: any) => setAdGroupData({...adGroupData, name: e.target.value})} 
          />
        </div>

        {isReach ? (
          /* OBJETIVO DE ALCANCE: Lance máximo de CPM apenas */
          <div>
            <InputLabel>Lance máximo de CPM</InputLabel>
            <div className="text-[12px] text-gray-500 mb-2">
              Defina o valor máximo que você pagará por 1.000 impressões. Um lance maior pode vencer mais leilões.
            </div>
            <div className={`relative flex items-center border rounded-md bg-white transition-all ${
              isCpmError 
                ? 'border-red-500 ring-1 ring-red-500' 
                : 'border-gray-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black'
            }`}>
              <span className={`pl-3 pr-2 text-[13px] font-medium ${isCpmError ? 'text-red-600' : 'text-gray-500'}`}>R$</span>
              <input 
                type="text" 
                className="flex-1 py-2 outline-none text-[13px] text-gray-900 bg-transparent"
                value={adGroupData.cpmBid}
                onChange={(e) => setAdGroupData({...adGroupData, cpmBid: e.target.value})}
                placeholder="340.00"
              />
              <span className={`pr-3 pl-2 text-[13px] font-medium ${isCpmError ? 'text-red-600' : 'text-gray-500'}`}>BRL</span>
            </div>
            {isCpmError && (
              <p className="text-[12px] text-red-600 mt-1.5 font-normal">
                Digite um lance de CPM entre 0.01 e 26000.00.
              </p>
            )}
          </div>
        ) : isConversions ? (
          /* OBJETIVO DE CONVERSÕES - Imagem 1 */
          <div className="space-y-5">
            <div>
              <InputLabel>Estratégia de lances</InputLabel>
              <div className="space-y-3 mt-3">
                <label className="flex items-start cursor-pointer">
                  <div className="relative flex items-center justify-center mt-0.5 mr-3 w-4 h-4 flex-shrink-0">
                    <input 
                      type="radio" 
                      name="bid_strategy_conv" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer" 
                      checked={adGroupData.bidStrategy === 'maximize'} 
                      onChange={() => setAdGroupData({...adGroupData, bidStrategy: 'maximize'})} 
                    />
                    <div className="w-full h-full rounded-full border-2 border-gray-300 peer-checked:border-black flex items-center justify-center">
                      {adGroupData.bidStrategy === 'maximize' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-gray-900 font-medium">Maximizar resultados</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">Ajustaremos automaticamente seu lance para obter o máximo de resultados com seu orçamento.</div>
                  </div>
                </label>

                <label className="flex items-start cursor-pointer">
                  <div className="relative flex items-center justify-center mt-0.5 mr-3 w-4 h-4 flex-shrink-0">
                    <input 
                      type="radio" 
                      name="bid_strategy_conv" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer" 
                      checked={adGroupData.bidStrategy === 'manual'} 
                      onChange={() => setAdGroupData({...adGroupData, bidStrategy: 'manual'})} 
                    />
                    <div className="w-full h-full rounded-full border-2 border-gray-300 peer-checked:border-black flex items-center justify-center">
                      {adGroupData.bidStrategy === 'manual' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                  <div className="text-[13px] text-gray-900 mt-0.5 font-medium">Manual: lance máximo</div>
                </label>
              </div>
            </div>

            {adGroupData.bidStrategy === 'manual' && (
              <div>
                <InputLabel>Limite de lance otimizado para conversões</InputLabel>
                <div className="text-[12px] text-gray-500 mb-2 leading-relaxed">
                  Defina o valor máximo que você aceita dar de lance por uma conversão. Usaremos a taxa de conversão prevista para transformar isso em um lance por clique no leilão. A cobrança é por clique.
                </div>
                <div className="relative flex items-center border border-gray-300 rounded-md bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                  <span className="pl-3 pr-2 text-[13px] text-gray-500 font-medium">R$</span>
                  <input 
                    type="text" 
                    placeholder="13.50"
                    className="flex-1 py-2 outline-none text-[13px] text-gray-900 bg-transparent"
                    value={adGroupData.maxBid}
                    onChange={(e) => setAdGroupData({...adGroupData, maxBid: e.target.value})}
                  />
                  <span className="pr-3 pl-2 text-[13px] text-gray-500 font-medium">BRL</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* OBJETIVO DE CLIQUES */
          <div className="space-y-5">
            <div>
              <InputLabel>Estratégia de lances</InputLabel>
              <div className="space-y-3 mt-3">
                <label className="flex items-start cursor-pointer">
                  <div className="relative flex items-center justify-center mt-0.5 mr-3 w-4 h-4 flex-shrink-0">
                    <input 
                      type="radio" 
                      name="bid" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer" 
                      checked={adGroupData.bidStrategy === 'maximize'} 
                      onChange={() => setAdGroupData({...adGroupData, bidStrategy: 'maximize'})} 
                    />
                    <div className="w-full h-full rounded-full border-2 border-gray-300 peer-checked:border-black flex items-center justify-center">
                      {adGroupData.bidStrategy === 'maximize' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] text-gray-900 font-medium">Maximizar resultados</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">Ajustaremos automaticamente seu lance para obter o máximo de resultados com seu orçamento.</div>
                  </div>
                </label>

                <label className="flex items-start cursor-pointer">
                  <div className="relative flex items-center justify-center mt-0.5 mr-3 w-4 h-4 flex-shrink-0">
                    <input 
                      type="radio" 
                      name="bid" 
                      className="peer absolute opacity-0 w-full h-full cursor-pointer" 
                      checked={adGroupData.bidStrategy === 'manual'} 
                      onChange={() => setAdGroupData({...adGroupData, bidStrategy: 'manual'})} 
                    />
                    <div className="w-full h-full rounded-full border-2 border-gray-300 peer-checked:border-black flex items-center justify-center">
                      {adGroupData.bidStrategy === 'manual' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                  <div className="text-[13px] text-gray-900 mt-0.5 font-medium">Manual: CPC máx.</div>
                </label>
              </div>
            </div>

            {adGroupData.bidStrategy === 'manual' && (
              <div>
                <InputLabel>Lance máximo de CPC</InputLabel>
                <div className="text-[12px] text-gray-500 mb-2">
                  Defina o valor máximo que você pagará por cada clique. Um lance mais alto vencerá mais leilões.
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-full sm:w-64">
                    <div className="relative flex items-center border border-gray-300 rounded-md bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                      <span className="pl-3 pr-2 text-[13px] text-gray-500 font-medium">R$</span>
                      <input 
                        type="text" 
                        placeholder="13.50"
                        className="flex-1 py-2 outline-none text-[13px] text-gray-900 bg-transparent"
                        value={adGroupData.maxBid}
                        onChange={(e) => setAdGroupData({...adGroupData, maxBid: e.target.value})}
                      />
                      <span className="pr-3 pl-2 text-[13px] text-gray-500 font-medium">BRL</span>
                    </div>
                  </div>

                  <div className="hidden sm:block h-10 w-px bg-gray-200 mx-1"></div>

                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`h-1.5 w-4 rounded-full ${isLowCpc ? 'bg-red-600' : 'bg-emerald-500'}`}></div>
                        <div className={`h-1.5 w-4 rounded-full ${!isLowCpc ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        <div className={`h-1.5 w-4 rounded-full ${!isLowCpc && numCpc >= 40 ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      </div>
                      <span className={`text-[12px] font-semibold ${isLowCpc ? 'text-red-700' : 'text-emerald-700'}`}>
                        {isLowCpc ? 'Pode não entregar' : 'Entrega competitiva'}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {isLowCpc 
                        ? 'Seu lance pode estar baixo demais para ter entrega confiável.' 
                        : 'Seu lance é competitivo para a maioria dos leilões.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Avançado Collapsible Box */}
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden mt-6">
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50/70 transition-colors"
          >
            <div>
              <div className="text-[14px] font-medium text-gray-900">Avançado</div>
              <div className="text-[12px] text-gray-500 mt-0.5">Defina configurações adicionais para este grupo de anúncios.</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {advancedOpen && (
            <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-4">
              <div>
                <div className="text-[13px] font-medium text-gray-900">Ajustes de lance por público</div>
                <div className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                  Aplique um multiplicador para aumentar ou diminuir seu lance quando um espectador fizer parte de um público selecionado.
                </div>
              </div>

              {audiences.length === 0 ? (
                <div className="border border-gray-200/80 rounded-lg p-4 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium text-gray-900">Nenhum público personalizado disponível</div>
                    <div className="text-[12px] text-gray-500 mt-0.5">Crie e publique um público antes de adicionar multiplicadores de lance.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAudienceModal(true)}
                    className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap self-start sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                    Criar público
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg bg-white overflow-hidden divide-y divide-gray-100">
                    <div className="p-3 bg-gray-50/80 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-gray-600">Públicos personalizados ({audiences.length})</span>
                      <button
                        type="button"
                        onClick={() => setShowAudienceModal(true)}
                        className="text-[12px] text-black hover:underline font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Criar público
                      </button>
                    </div>
                    {audiences.map((aud) => {
                      const adj = selectedAudienceAdjustments[aud.id] || { enabled: false, multiplier: '+20%' };
                      return (
                        <div key={aud.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={adj.enabled}
                              onChange={(e) => {
                                setSelectedAudienceAdjustments(prev => ({
                                  ...prev,
                                  [aud.id]: { enabled: e.target.checked, multiplier: adj.multiplier || '+20%' }
                                }));
                              }}
                              className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black cursor-pointer"
                            />
                            <div>
                              <div className="text-[13px] font-medium text-gray-900">{aud.name}</div>
                              <div className="text-[11px] text-gray-500 font-mono">
                                ID: {aud.id} {aud.status ? `• ${aud.status}` : ''}
                              </div>
                            </div>
                          </div>

                          {adj.enabled && (
                            <div className="flex items-center gap-2 pl-7 sm:pl-0">
                              <span className="text-[12px] text-gray-500">Multiplicador:</span>
                              <input
                                type="text"
                                value={adj.multiplier}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedAudienceAdjustments(prev => ({
                                    ...prev,
                                    [aud.id]: { ...adj, multiplier: val }
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-center text-[12px] border border-gray-300 rounded bg-white font-mono focus:outline-none focus:border-black"
                                placeholder="+20%"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Parâmetros de consulta da página de destino - FORA de Avançado */}
        <div>
          <InputLabel>Parâmetros de consulta da página de destino</InputLabel>
          <InputField 
            value={adGroupData.queryParams}
            onChange={(e: any) => setAdGroupData({...adGroupData, queryParams: e.target.value})}
            placeholder=""
          />
          <InputHint>Opcional. Adiciona parâmetros de consulta ausentes. Valores de modelo compatíveis: {'{campaign_id}, {ad_group_id}, {ad_id}, {ad_account_id}, {oppref}'}.</InputHint>
        </div>

        {/* URL de destino padrão do anúncio - FORA de Avançado */}
        <div>
          <InputLabel>URL de destino padrão do anúncio</InputLabel>
          <InputHint>Insira uma URL de destino padrão para novos anúncios neste grupo de anúncios.</InputHint>
          <div className="relative mt-2">
            <InputField 
              value={adGroupData.defaultUrl}
              onChange={(e: any) => setAdGroupData({...adGroupData, defaultUrl: e.target.value})}
              className="pr-10"
            />
            <svg className="w-4 h-4 absolute right-3 top-2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </div>
        </div>

        {/* Dicas de contexto (opcional) - FORA de Avançado */}
        <div>
          <InputLabel>Dicas de contexto (opcional)</InputLabel>
          <InputHint>Descreva as conversas, temas ou palavras-chave em que seus produtos ou serviços possam ser relevantes; essas dicas orientam a correspondência, mas não são regras de segmentação por correspondência exata.</InputHint>
          <textarea 
            rows={4}
            className="w-full px-3 py-2 mt-3 bg-white border border-gray-300 rounded-md focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[13px] resize-none"
            placeholder="Digite algumas dicas de contexto"
            value={adGroupData.contextHints}
            onChange={(e) => setAdGroupData({...adGroupData, contextHints: e.target.value})}
          ></textarea>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className={`flex flex-col lg:flex-row gap-8 ${wizardMode === 'view' ? 'pointer-events-none opacity-90' : ''}`}>
      <div className="flex-1 space-y-6">
        {adsList.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Anúncios Adicionados ({adsList.length})</h4>
            <div className="space-y-2">
              {adsList.map((ad, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-blue-100 text-xs text-gray-700">
                  <span><strong>{ad.name}</strong> - {ad.title}</span>
                  <button onClick={() => setAdsList(adsList.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <InputLabel>Nome do anúncio</InputLabel>
          <InputField 
            value={adData.name} 
            onChange={(e: any) => setAdData({...adData, name: e.target.value})} 
          />
        </div>

        <div>
          <InputLabel>Conteúdo do anúncio</InputLabel>
          <div className="border border-gray-200 rounded-xl p-5 space-y-6 bg-white shadow-sm mt-2">
            <div>
              <InputLabel>URL de destino do anúncio</InputLabel>
              <InputHint>Digite a URL de destino do anúncio que você quer que as pessoas acessem.</InputHint>
              <div className="relative mt-2">
                <InputField 
                  value={adData.url}
                  onChange={(e: any) => setAdData({...adData, url: e.target.value})}
                  className="pr-10"
                />
                <svg className="w-4 h-4 absolute right-3 top-2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </div>
            </div>

            <div>
              <InputLabel>Parâmetros de consulta da página de destino</InputLabel>
              <InputField 
                value={adData.queryParams}
                onChange={(e: any) => setAdData({...adData, queryParams: e.target.value})}
              />
              <InputHint>Opcional. Adiciona parâmetros de consulta ausentes. Valores de modelo compatíveis: {'{campaign_id}, {ad_group_id}, {ad_id}, {ad_account_id}, {oppref}'}.</InputHint>
            </div>

            <div>
              <InputLabel>Título</InputLabel>
              <div className="relative mt-1">
                <InputField 
                  value={adData.title}
                  onChange={(e: any) => setAdData({...adData, title: e.target.value})}
                  maxLength={50}
                  className="pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400">{adData.title.length}/50</span>
              </div>
            </div>

            <div>
              <InputLabel>Descrição</InputLabel>
              <div className="relative mt-1">
                <InputField 
                  value={adData.description}
                  onChange={(e: any) => setAdData({...adData, description: e.target.value})}
                  maxLength={100}
                  className="pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400">{adData.description.length}/100</span>
              </div>
            </div>

            <div>
              <InputLabel>Imagens do anúncio</InputLabel>
              <InputHint>Envie um PNG ou JPG. Para melhor qualidade, use uma imagem quadrada (pelo menos 256 × 256 px).</InputHint>
              <div className="mt-3 flex gap-3">
                {adData.image && (
                  <div className="relative w-16 h-16 rounded-xl bg-gray-900 flex-shrink-0 border border-gray-200">
                    <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=256&h=256&fit=crop" className="w-full h-full object-cover rounded-xl" alt="Earth" />
                    <button className="absolute -top-1.5 -right-1.5 bg-white text-gray-700 rounded-full border border-gray-200 p-0.5 shadow-sm hover:bg-gray-50">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-96 flex-shrink-0">
        <InputLabel>Prévia do criativo</InputLabel>
        <InputHint>Veja como seu anúncio pode aparecer para os usuários.</InputHint>
        
        <div className="mt-3 border border-gray-200 rounded-xl p-3 bg-white shadow-sm flex gap-3 items-center">
          <div className="w-[72px] h-[72px] bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=256&h=256&fit=crop" className="w-full h-full object-cover" alt="Ad preview" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-black text-white text-[8px] flex items-center justify-center rounded-sm font-bold">T</div>
                <span className="text-[11px] font-semibold text-gray-900 truncate">Ternus Inc</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium ml-1">Anúncio</span>
              </div>
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="text-[13px] font-semibold text-gray-900 truncate leading-tight mt-1">{adData.title}</div>
            <div className="text-[12px] text-gray-500 mt-0.5 line-clamp-1 leading-snug">{adData.description}</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInitialCheck) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="relative w-full h-full flex flex-col">
        <AnimatePresence>
          {showLoadingAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white"
            >
              <img src="/adwiser_loading.gif" alt="Carregando..." className="w-32 h-32 object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          key="onboarding"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="w-full min-h-[620px] flex items-center justify-center bg-white p-4"
        >
          <div className="max-w-2xl w-full bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col">
          {onboardingStep === 0 ? (
            <>
              <div className="w-full h-52 md:h-64 bg-gray-900 relative overflow-hidden">
                <img 
                  src="/openai-ads-banner.png" 
                  alt="Apresentamos o OpenAI Ads" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-8 md:p-10 text-center flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                  Apresentamos o OpenAI Ads
                </h2>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed text-[15px]">
                  Crie campanhas inteligentes, altamente contextuais e otimizadas para conversões reais. Conecte sua conta em instantes e alcance milhões de usuários no ecossistema OpenAI.
                </p>
                
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md text-sm"
                >
                  Começar
                </button>
                
                <p className="mt-6 text-[12px] text-gray-500 max-w-md mx-auto leading-relaxed">
                  Ao clicar em &apos;Começar&apos;, você concorda com os{' '}
                  <a 
                    href="https://openai.com/policies/ad-tools-terms/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-800 underline underline-offset-2 font-medium hover:text-blue-600 transition-colors"
                  >
                    termos de uso e de publicidade da OpenAI
                  </a>
                </p>
              </div>
            </>
          ) : (
            <div className="p-8 md:p-10">
              <div className="mb-8 border-b border-gray-100 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setOnboardingStep(0)} 
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Configuração do OpenAI Ads</h2>
                    <p className="text-[13px] text-gray-500 mt-0.5">Siga o passo a passo para conectar sua conta à Adwiser.</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  Passo 1 de 2
                </span>
              </div>

              <div className="space-y-6">
                {/* Passo 1 */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200/80 bg-gray-50/50">
                  <div className="w-7 h-7 rounded-full bg-black text-white font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-[15px]">Criar uma chave de API</h3>
                    <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">
                      Acesse as configurações do OpenAI Ads e gere uma nova chave de serviço para seu aplicativo.
                    </p>
                    <div className="mt-3">
                      <a 
                        href="https://ads.openai.com/settings" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
                      >
                        <span>Acessar ads.openai.com/settings</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-200/80 bg-gray-50/50">
                  <div className="w-7 h-7 rounded-full bg-black text-white font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-[15px]">Configurar na Adwiser</h3>
                    <p className="text-[13px] text-gray-600 mt-1 leading-relaxed mb-3">
                      Cole sua chave de API neste modal e clique em "Salvar e Conectar" para prosseguir.
                    </p>

                    {/* Inline Quick Paste Option */}
                    <div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showWizardKey ? 'text' : 'password'}
                            value={wizardApiKey}
                            onChange={(e) => setWizardApiKey(e.target.value)}
                            placeholder="sk-ads-..."
                            className="w-full px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowWizardKey(!showWizardKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showWizardKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveKeyFromWizard}
                          disabled={isSavingWizardKey || !wizardApiKey.trim()}
                          className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                        >
                          {isSavingWizardKey && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          {isSavingWizardKey ? 'Salvando...' : 'Salvar e Conectar'}
                        </button>
                      </div>
                      {wizardKeyError && (
                        <p className="text-xs text-red-600 font-medium mt-1.5">{wizardKeyError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setOnboardingStep(0)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>

                <button
                  onClick={async () => {
                    localStorage.setItem('adwiser_openai_configured', 'true');
                    setNeedsOnboarding(false);
                    await fetchCampaigns();
                  }}
                  disabled={loadingCampaigns}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingCampaigns && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Já configurei
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      key="openai-ads"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {!isCreating && (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Period Dropdown */}
            <div className="relative" ref={periodRef}>
              <button
                type="button"
                onClick={() => {
                  setPeriodDropdownOpen(!periodDropdownOpen);
                  setStatusDropdownOpen(false);
                  setObjectiveDropdownOpen(false);
                }}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-semibold text-gray-900">{getPeriodLabel()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <AnimatePresence>
                {periodDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-40 py-1.5 text-xs overflow-hidden"
                  >
                    {[
                      { id: 'today', label: 'Hoje' },
                      { id: 'yesterday', label: 'Ontem' },
                      { id: '7d', label: 'Últimos 7 dias' },
                      { id: '14d', label: 'Últimos 14 dias' },
                      { id: '30d', label: 'Últimos 30 dias (Padrão)' },
                      { id: 'this_month', label: 'Este mês' },
                      { id: 'last_month', label: 'Mês anterior' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(item.id as any);
                          setPeriodDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedPeriod === item.id ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                        {selectedPeriod === item.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodDropdownOpen(false);
                        setShowCustomDateModal(true);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedPeriod === 'custom' ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <SlidersHorizontal className="w-3 h-3 text-gray-500" />
                        Personalizado...
                      </span>
                      {selectedPeriod === 'custom' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Filter */}
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setPeriodDropdownOpen(false);
                  setObjectiveDropdownOpen(false);
                }}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span>
                  Status: <strong className="text-gray-900">{
                    statusFilter === 'all' ? 'Todos' :
                    statusFilter === 'active' ? 'Ativas' :
                    statusFilter === 'paused' ? 'Pausadas' : 'Rascunhos'
                  }</strong>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <AnimatePresence>
                {statusDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-40 py-1.5 text-xs overflow-hidden"
                  >
                    {[
                      { id: 'all', label: 'Todos os status' },
                      { id: 'active', label: 'Ativas' },
                      { id: 'paused', label: 'Pausadas' },
                      { id: 'draft', label: 'Rascunhos' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(item.id as any);
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          statusFilter === item.id ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                        {statusFilter === item.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Objective Filter */}
            <div className="relative" ref={objectiveRef}>
              <button
                type="button"
                onClick={() => {
                  setObjectiveDropdownOpen(!objectiveDropdownOpen);
                  setPeriodDropdownOpen(false);
                  setStatusDropdownOpen(false);
                }}
                className="px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-gray-500" />
                <span>
                  Objetivo: <strong className="text-gray-900">{
                    objectiveFilter === 'all' ? 'Todos' :
                    objectiveFilter === 'reach' ? 'Alcance' :
                    objectiveFilter === 'clicks' ? 'Cliques' : 'Conversões'
                  }</strong>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <AnimatePresence>
                {objectiveDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-40 py-1.5 text-xs overflow-hidden"
                  >
                    {[
                      { id: 'all', label: 'Todos os objetivos' },
                      { id: 'reach', label: 'Alcance (Reach)' },
                      { id: 'clicks', label: 'Cliques no link' },
                      { id: 'conversions', label: 'Conversões' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setObjectiveFilter(item.id as any);
                          setObjectiveDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                          objectiveFilter === item.id ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                        {objectiveFilter === item.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[180px] max-w-xs flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar campanhas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-lg text-xs outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Clear Filters */}
            {(selectedPeriod !== '30d' || statusFilter !== 'all' || objectiveFilter !== 'all' || searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPeriod('30d');
                  setStatusFilter('all');
                  setObjectiveFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors cursor-pointer whitespace-nowrap"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={fetchCampaigns}
              disabled={loadingCampaigns}
              title="Atualizar lista"
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCampaigns ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => handleOpenWizard('create')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Campanha
            </button>
          </div>
        </div>
      )}

      {isCreating ? (
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full max-w-6xl mx-auto transition-all duration-300">
          {/* Main Campaign Creation Container (compresses smoothly when error modal is active) */}
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
            activeValidationError ? 'w-full lg:flex-1 min-w-0' : 'w-full max-w-5xl mx-auto'
          }`}>
            {message.text && !activeValidationError && (
              <div className={`p-4 text-sm font-medium flex items-center justify-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border-b border-red-200' : 'bg-green-50 text-green-700 border-b border-green-200'}`}>
                {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </div>

            <div className="p-4 md:p-5 border-t border-gray-100 flex items-center justify-between bg-white px-6 md:px-8">
              <div>
                {step > 1 ? (
                  <button 
                    onClick={handleBack}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                ) : (
                  <button 
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {wizardMode === 'create' && step === 3 && (
                  <button 
                    onClick={() => {
                      setAdsList([...adsList, adData]);
                      setAdData({
                        name: `Novo anúncio ${adsList.length + 2}`, url: 'https://ternus.vercel.app/', queryParams: '',
                        title: '', description: '', image: true
                      });
                    }}
                    className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2 transition-all cursor-pointer">
                    Adicionar outro anúncio <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                
                {wizardMode === 'view' ? (
                  <button 
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-[13px] font-medium hover:bg-black transition-all shadow-sm cursor-pointer"
                  >
                    Fechar
                  </button>
                ) : wizardMode === 'edit' ? (
                  <button 
                    onClick={handleSaveEdit}
                    disabled={loading || !hasEdits || campaignData.name.trim().length < 3}
                    title={!hasEdits ? "Faça alterações para habilitar o salvamento" : "Salvar alterações da campanha"}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-[13px] font-medium hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Salvar Alterações
                  </button>
                ) : (
                  <button 
                    onClick={step === 3 ? handleSubmit : handleNext}
                    disabled={loading || (step === 1 && campaignData.name.length < 3)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-[13px] font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {step === 1 ? 'Próximo: Grupo de anúncios' : step === 2 ? 'Próximo: Configurar anúncios' : 'Publicar Campanha'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Side Error Modal Panel */}
          <AnimatePresence>
            {activeValidationError && (
              <motion.div
                key="active-error-modal"
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 140, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full lg:w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-lg p-5 flex flex-col relative overflow-hidden transition-all"
              >
                {/* Status bar */}
                <div 
                  className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300 ${
                    activeValidationError.isResolved ? 'bg-emerald-500' : 'bg-red-500'
                  }`} 
                />

                <div className="flex items-start gap-3 mt-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    activeValidationError.isResolved ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {activeValidationError.isResolved ? (
                      <Check className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 stroke-[2.5]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {activeValidationError.isResolved ? 'Todos os problemas foram resolvidos!' : 'Atenção necessária'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {activeValidationError.isResolved 
                        ? 'A pendência foi corrigida com sucesso.' 
                        : activeValidationError.message}
                    </p>
                  </div>
                </div>

                {!activeValidationError.isResolved && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleSolveError(activeValidationError)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center cursor-pointer"
                    >
                      Solucionar
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 Metric Cards with Directional Trend Indicators (Green up arrow / Red down arrow) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* Card 1: Respostas com Ad (Impressões) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="text-gray-500 text-xs font-medium mb-1.5">
                  Respostas com Ad (Impressões)
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  {metricsData.impressoes}
                </div>
              </div>
              <ComparativeBadge 
                change={metricsData.impressoesChange} 
                comparison="vs período ant." 
              />
            </div>

            {/* Card 2: Interações (Cliques) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="text-gray-500 text-xs font-medium mb-1.5">
                  Interações (Cliques)
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  {metricsData.cliques}
                </div>
              </div>
              <ComparativeBadge 
                change={metricsData.cliquesChange} 
                comparison="vs período ant." 
              />
            </div>

            {/* Card 3: Custo por Aquisição (CPA) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="text-gray-500 text-xs font-medium mb-1.5">
                  Custo por Aquisição (CPA)
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  {metricsData.cpa}
                </div>
              </div>
              <ComparativeBadge 
                change={metricsData.cpaChange} 
                comparison="vs período ant." 
              />
            </div>

            {/* Card 4: Investimento Total (Gasto) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors">
              <div>
                <div className="text-gray-500 text-xs font-medium mb-1.5">
                  Investimento Total (Gasto)
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  {metricsData.gasto}
                </div>
              </div>
              <ComparativeBadge 
                change={metricsData.gastoChange} 
                comparison="vs período ant." 
              />
            </div>
          </div>

          {/* Charts Section - Google Ads Pattern */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1 (lg:col-span-2): BarChart Interações e Métricas ao longo do tempo */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Interações no ChatGPT ({getPeriodLabel()})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Métricas de entrega e engajamento da IA conversacional</p>
                </div>

                {/* Metric Selector Tabs */}
                <div className="flex items-center p-0.5 bg-gray-100 rounded-lg text-xs font-medium self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartMetric('cliques')}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      chartMetric === 'cliques'
                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Cliques
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('impressoes')}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      chartMetric === 'impressoes'
                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Impressões
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('gasto')}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      chartMetric === 'gasto'
                        ? 'bg-white text-gray-900 shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Gasto ($)
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      dy={8} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }} 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        border: '1px solid #E5E7EB', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }} 
                      formatter={(value: any) => [
                        chartMetric === 'gasto' ? `$ ${Number(value).toFixed(2)}` : Number(value).toLocaleString('pt-BR'),
                        chartMetric === 'cliques' ? 'Cliques' : chartMetric === 'impressoes' ? 'Impressões' : 'Gasto'
                      ]}
                    />
                    <Bar 
                      dataKey={chartMetric} 
                      fill="#3b82f6" 
                      barSize={32} 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 (lg:col-span-1): PieChart Donut por Plataforma */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Interações por Plataforma</h3>
                <p className="text-xs text-gray-500 mt-0.5">Distribuição no ChatGPT</p>
              </div>

              <div className="h-56 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={platformShareData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={58} 
                      outerRadius={78} 
                      paddingAngle={4} 
                      dataKey="value"
                    >
                      {platformShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        border: '1px solid #E5E7EB', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px'
                      }} 
                      formatter={(val: any) => [`${val}% das interações`, 'Participação']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend matching Google Ads design */}
              <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-600 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10a37f]"></div>
                  <span>iOS ({platformShareData[0].value}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div>
                  <span>Android ({platformShareData[1].value}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div>
                  <span>Web ({platformShareData[2].value}%)</span>
                </div>
              </div>
            </div>

            {/* Chart 3 (Full Width): Tendência Temporal de Desempenho */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Tendência de Impressões no ChatGPT</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Respostas com anúncios geradas ao longo do período selecionado</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {getPeriodLabel()}
                </span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReqOpenAI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10a37f" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10a37f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                      dy={8}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6B7280', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '10px', 
                        border: '1px solid #E5E7EB', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }} 
                      formatter={(val: any) => [Number(val).toLocaleString('pt-BR'), 'Respostas com Ad']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="impressoes" 
                      stroke="#10a37f" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorReqOpenAI)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-700" />
                Campanhas Ativas no OpenAI Ads
              </h3>
              <span className="text-xs font-medium text-gray-500">
                {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campanha' : 'campanhas'} {
                  filteredCampaigns.length !== campaigns.length ? `(filtradas de ${campaigns.length})` : 'sincronizadas'
                }
              </span>
            </div>

            {filteredCampaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-3">Campanha</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Orçamento</th>
                      <th className="px-6 py-3">Resultados</th>
                      <th className="px-6 py-3">Alcance</th>
                      <th className="px-6 py-3">Gasto</th>
                      <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredCampaigns.map((camp: any, idx: number) => {
                      const spendMicros = camp.budget?.lifetime_spend_limit_micros || camp.budget?.daily_spend_limit_micros;
                      const formattedBudget = spendMicros 
                        ? `$ ${(spendMicros / 1000000).toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                        : '-';
                      const isAct = (camp.status || '').toLowerCase() === 'active'; 
                      const isDraft = camp._isDraft === true;
                      const seed = camp.id ? camp.id.charCodeAt(0) + camp.id.charCodeAt(camp.id.length-1) : idx; 
                      const results = isDraft ? 0 : (seed * 14) % 1500; 
                      const reach = isDraft ? 0 : results * (8 + (seed % 5)); 
                      const spend = isDraft ? '0.00' : (results * 0.45).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      return (
                        <tr key={camp.id || idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <OpenAILogo />
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleOpenWizard(isDraft ? 'create' : 'view', camp)}>
                                  <span>{camp.name || 'Sem nome'}</span>
                                  {isDraft && <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-md text-[10px] font-bold tracking-wide uppercase">Rascunho</span>}
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {isDraft ? (
                                <span className="text-[11px] font-medium text-gray-500">Incompleta</span>
                              ) : (
                              <label className="relative inline-flex items-center cursor-pointer w-max">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={isAct}
                                  disabled={updatingCampaignId === camp.id}
                                  onChange={(e) => handleUpdateCampaign(camp.id, { status: e.target.checked ? 'active' : 'paused' })}
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                                <span className="ml-2 text-[11px] font-medium text-gray-500">{isAct ? 'Ativa' : 'Pausada'}</span>
                              </label>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700 text-xs">
                            {formattedBudget}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-900 font-medium">
                            {results}
                            <span className="block text-[10px] font-normal text-gray-500">Cliques</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-900 font-medium">
                            {reach.toLocaleString('pt-BR')}
                            <span className="block text-[10px] font-normal text-gray-500">Impr.</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-900 font-medium">
                            $ {spend}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {isDraft ? (
                                <>
                                  <button onClick={() => handleOpenWizard('create', camp)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Continuar Edição">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => {
                                    try {
                                      const draftsStr = localStorage.getItem('adwiser_draft_campaigns');
                                      if (draftsStr) {
                                        let drafts = JSON.parse(draftsStr);
                                        drafts = drafts.filter((d: any) => d.id !== camp.id);
                                        localStorage.setItem('adwiser_draft_campaigns', JSON.stringify(drafts));
                                        fetchCampaigns();
                                      }
                                    } catch (err) {}
                                  }} className="text-gray-400 hover:text-red-600 transition-colors" title="Descartar Rascunho">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleOpenWizard('view', camp)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Visualizar Campanha">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleOpenWizard('edit', camp)} className="text-gray-400 hover:text-emerald-600 transition-colors" title="Editar Campanha">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => handleOpenWizard('create', camp)} className="text-gray-400 hover:text-purple-600 transition-colors" title="Duplicar Campanha">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500 text-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <p className="font-semibold text-gray-800">Nenhuma campanha encontrada</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all' || objectiveFilter !== 'all'
                    ? 'Não foram encontradas campanhas para os filtros atuais.'
                    : 'Nenhuma campanha criada ainda. Clique em "Nova Campanha" para criar sua primeira.'}
                </p>
                {(searchQuery || statusFilter !== 'all' || objectiveFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setObjectiveFilter('all');
                    }}
                    className="mt-4 px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Período Personalizado */}
      <AnimatePresence>
        {showCustomDateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full overflow-hidden p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">Período Personalizado</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCustomDateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPeriod('custom');
                    setShowCustomDateModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Aplicar período
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Criação de Público Personalizado */}
      <AnimatePresence>
        {showAudienceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Criar público personalizado</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Defina e conecte um público para segmentação e multiplicadores de lances.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAudienceModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateAudience} className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
                    Nome do público <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={audienceForm.name}
                    onChange={(e) => setAudienceForm({ ...audienceForm, name: e.target.value })}
                    placeholder="Ex: Visitantes Recentes - 30 dias"
                    className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
                    Descrição <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={audienceForm.description}
                    onChange={(e) => setAudienceForm({ ...audienceForm, description: e.target.value })}
                    placeholder="Ex: Usuários com engajamento recente na plataforma"
                    className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-900 mb-2">
                    Origem dos dados do público
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'customer_list', title: 'Lista de clientes', desc: 'CSV ou e-mails com hash' },
                      { id: 'website_traffic', title: 'Tráfego do site', desc: 'Visitantes via Pixel' },
                      { id: 'engagement', title: 'Engajamento', desc: 'Interações no ChatGPT' }
                    ].map((src) => (
                      <div
                        key={src.id}
                        onClick={() => setAudienceForm({ ...audienceForm, sourceType: src.id })}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          audienceForm.sourceType === src.id
                            ? 'border-black bg-gray-50/70 ring-1 ring-black'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="text-[12px] font-medium text-gray-900">{src.title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{src.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {audienceForm.sourceType === 'customer_list' && (
                  <div className="space-y-3">
                    <label className="block text-[13px] font-medium text-gray-900">
                      Upload de identificadores (CSV ou TXT)
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-gray-400 transition-colors bg-gray-50/30">
                      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                      <div className="text-[12px] text-gray-700 font-medium">
                        Arraste seu arquivo de clientes ou <span className="text-black underline cursor-pointer">procure no dispositivo</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Compatível com listas de e-mails ou telefones com hash SHA-256 (até 100MB)</p>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        id="audience-file-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAudienceForm({ ...audienceForm, fileName: file.name });
                          }
                        }}
                      />
                      <label
                        htmlFor="audience-file-input"
                        className="inline-block mt-3 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-[12px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm"
                      >
                        Selecionar arquivo
                      </label>
                      {audienceForm.fileName && (
                        <div className="mt-2 text-[12px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Arquivo selecionado: {audienceForm.fileName}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAudienceModal(false)}
                    className="px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAudience || !audienceForm.name.trim()}
                    className="px-4 py-2 text-[13px] font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {isSavingAudience && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {isSavingAudience ? 'Publicando...' : 'Criar público'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Configuração de Eventos de Conversão */}
      <AnimatePresence>
        {showConversionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Configurar conversões</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Acompanhe compras, cadastros e ações importantes no seu app ou site.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConversionModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateConversionEvent} className="p-6 space-y-5 overflow-y-auto">
                <div>
                  <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
                    Nome do evento de conversão <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={conversionModalForm.name}
                    onChange={(e) => setConversionModalForm({ ...conversionModalForm, name: e.target.value })}
                    placeholder="Ex: Compra no Site, Cadastro de Conta, Lead"
                    className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
                    Tipo de evento padrão
                  </label>
                  <select
                    value={conversionModalForm.event_type}
                    onChange={(e) => setConversionModalForm({ ...conversionModalForm, event_type: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
                  >
                    <option value="order_created">Compra / Pedido</option>
                    <option value="lead_created">Lead / Contato</option>
                    <option value="registration_completed">Cadastro completo</option>
                    <option value="checkout_started">Início de checkout</option>
                    <option value="subscription_created">Assinatura criada</option>
                    <option value="page_viewed">Visualização de página</option>
                    <option value="items_added">Adicionar ao carrinho</option>
                    <option value="custom">Evento personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
                    Janela de atribuição
                  </label>
                  <select
                    value={conversionModalForm.attribution_window_days}
                    onChange={(e) => setConversionModalForm({ ...conversionModalForm, attribution_window_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
                  >
                    <option value={30}>30 dias pós-clique (Recomendado)</option>
                    <option value={7}>7 dias pós-clique</option>
                    <option value={1}>1 dia pós-clique</option>
                  </select>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 text-[12px] text-gray-600 leading-relaxed">
                  <div className="font-semibold text-gray-900 mb-0.5">Pixel e rastreamento oficial OpenAI</div>
                  Ao salvar, o evento é registrado na API da OpenAI e vinculado ao seu Pixel Web para mensurar o retorno de investimento (ROAS).
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowConversionModal(false)}
                    className="px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConversionEvent || !conversionModalForm.name.trim()}
                    className="px-4 py-2 text-[13px] font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {isSavingConversionEvent && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {isSavingConversionEvent ? 'Salvando...' : 'Salvar evento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Erro de Conta */}
      <AnimatePresence>
        {showAccountErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-sm w-full overflow-hidden flex flex-col p-6 text-center"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Revise sua conta</h3>
              <p className="text-[13px] text-gray-600 mb-6">
                Sua conta possui pendências de faturamento ou forma de pagamento inválida.
                Você precisa corrigir isso no painel da OpenAI Ads antes de continuar.
              </p>
              
              <div className="flex flex-col gap-2">
                <a 
                  href="https://ads.openai.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-black text-white text-[13px] font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Acessar ads.openai.com
                </a>
                <button 
                  onClick={() => setShowAccountErrorModal(false)}
                  className="w-full py-2.5 bg-white text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Publicação e Sucesso da Campanha */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-sm w-full overflow-hidden flex flex-col p-8 text-center relative"
            >
              <div className="flex flex-col items-center w-full">
                <AnimatePresence mode="wait">
                  {publishStage === 'loading' ? (
                    <motion.div
                      key="loading-stage"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="relative w-20 h-20 flex items-center justify-center mb-5">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Publicando campanha...
                      </h3>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mt-1.5">
                        Sincronizando anúncio, segmentações e orçamento com a {platformName}.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success-stage"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center w-full"
                    >
                      {/* GIF de conclusão animado carregado simultaneamente com o texto */}
                      <div className="w-32 h-32 flex items-center justify-center mb-3 select-none pointer-events-none">
                        <img
                          key={gifKey}
                          src={`/icone-concluido.gif?v=${gifKey}`}
                          alt="Concluído"
                          className="w-32 h-32 object-contain"
                          loading="eager"
                        />
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                        Campanha publicada com sucesso!
                      </h3>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mt-1.5">
                        Sua campanha foi configurada e publicada na {platformName} com sucesso.
                      </p>

                      {/* Barra de progresso dos 10 segundos */}
                      <div className="pt-4 pb-1 w-full">
                        <div className="w-full bg-blue-50 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full transition-all duration-1000 ease-linear rounded-full"
                            style={{ width: `${(publishCountdown / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">
                          Voltando automaticamente em <span className="font-semibold text-gray-700">{publishCountdown}s</span>
                        </p>
                      </div>

                      {/* Botão azul para voltar às campanhas */}
                      <div className="w-full mt-5">
                        <button
                          type="button"
                          onClick={handleClosePublishModal}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md hover:shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                        >
                          Voltar às campanhas
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
