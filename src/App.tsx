/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight, ChevronLeft, Search, Sparkles, LayoutDashboard, Megaphone, Wrench, Settings, Plus, Upload, Check, Filter, X, Image as ImageIcon, Info, Pencil, Eye, Folder, LayoutGrid, FileText, Compass } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock Data
import { OpenAIAdsView } from './components/OpenAIAdsView';
import { AdOptimizerView } from './components/AdOptimizerView';
import { CampaignBuilderView } from './components/CampaignBuilderView';
import { SettingsModal } from './components/SettingsModal';

const funnelBudgetData = [
  { name: 'Consciência (TOFU)', value: 45000 },
  { name: 'Consideração (MOFU)', value: 35000 },
  { name: 'Conversão (BOFU)', value: 20000 },
];
const FUNNEL_COLORS = ['#404348', '#0044FF', '#93C5FD'];


const channelData = [
  { name: 'Meta Ads', orcamento: 45000 },
  { name: 'Google Ads', orcamento: 32000 },
  { name: 'LinkedIn', orcamento: 15000 },
  { name: 'TikTok Ads', orcamento: 8000 },
];

const googleAdsClicksData = [
  { date: '01/09', cliques: 1200 },
  { date: '02/09', cliques: 1500 },
  { date: '03/09', cliques: 1100 },
  { date: '04/09', cliques: 1800 },
  { date: '05/09', cliques: 2100 },
  { date: '06/09', cliques: 1700 },
  { date: '07/09', cliques: 2400 },
];

const googleAdsDeviceData = [
  { name: 'Mobile', value: 65 },
  { name: 'Desktop', value: 30 },
  { name: 'Tablet', value: 5 },
];
const DEVICE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const performanceData = [
  { time: '08:00', conv: 12 },
  { time: '10:00', conv: 25 },
  { time: '12:00', conv: 45 },
  { time: '14:00', conv: 30 },
  { time: '16:00', conv: 65 },
  { time: '18:00', conv: 80 },
];

const funnelCampaigns = [
  {
    id: 1,
    name: 'Brand Awareness Q3',
    platform: 'Meta Ads',
    stage: 'TOFU (Consciência)',
    spend: 'R$ 12.500',
    cpa: 'R$ 2,50 (CPM)',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Search Generics - Tech',
    platform: 'Google Ads',
    stage: 'MOFU (Consideração)',
    spend: 'R$ 8.200',
    cpa: 'R$ 4,10 (CPC)',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Retargeting Cart Abandoners',
    platform: 'Meta Ads',
    stage: 'BOFU (Conversão)',
    spend: 'R$ 5.400',
    cpa: 'R$ 45,00 (CPA)',
    status: 'Active',
  },
  {
    id: 4,
    name: 'Lead Gen B2B Enterprise',
    platform: 'LinkedIn',
    stage: 'BOFU (Conversão)',
    spend: 'R$ 15.000',
    cpa: 'R$ 120,00 (CPL)',
    status: 'Learning',
  },
];

type TableFilter = {
  id: string;
  field: string;
  operator: string;
  value: string | number;
  label: string;
};

const INITIAL_CAMPAIGNS = [
  { id: 1, name: 'Search - Institucional', status: 'Ativa', gastoStr: 'R$ 4.500', gasto: 4500, cliquesStr: '8.4K', cliques: 8400, cpcStr: 'R$ 1,12', cpc: 1.12, cpaStr: 'R$ 13,04', cpa: 13.04 },
  { id: 2, name: 'Performance Max - Vendas', status: 'Ativa', gastoStr: 'R$ 12.300', gasto: 12300, cliquesStr: '24.5K', cliques: 24500, cpcStr: 'R$ 0,85', cpc: 0.85, cpaStr: 'R$ 9,84', cpa: 9.84 },
  { id: 3, name: 'Display - Remarketing', status: 'Pausada', gastoStr: 'R$ 1.200', gasto: 1200, cliquesStr: '9.2K', cliques: 9200, cpcStr: 'R$ 0,45', cpc: 0.45, cpaStr: 'R$ 26,66', cpa: 26.66 },
];

const INITIAL_AD_GROUPS = [
  { id: 1, campaignName: 'Search - Institucional', name: 'Consultoria Financeira', status: 'Ativo', cliquesStr: '4.2K', cliques: 4200, cpcStr: 'R$ 1,20', cpc: 1.2, conv: 120, url: 'www.calebscleaningcompany.com/', headline: 'Consultoria Financeira - Especialistas em Resultados', description: 'Aumente as vendas da sua empresa com nossas soluções personalizadas.', formats: ['search'] },
  { id: 2, campaignName: 'Search - Institucional', name: 'Gestão de Crise', status: 'Ativo', cliquesStr: '2.1K', cliques: 2100, cpcStr: 'R$ 1,50', cpc: 1.5, conv: 45, url: 'www.calebscleaningcompany.com/crise', headline: 'Gestão de Crise - Proteja Seu Negócio Hoje', description: 'Metodologias comprovadas para proteger o caixa e a reputação da sua empresa em momentos difíceis.', formats: ['search'] },
  { id: 3, campaignName: 'Performance Max - Vendas', name: 'Produtos - Fundo de Funil', status: 'Ativo', cliquesStr: '12.5K', cliques: 12500, cpcStr: 'R$ 0,75', cpc: 0.75, conv: 350, url: 'www.calebscleaningcompany.com/produtos', headline: 'Compre com Desconto Especial', description: 'Oferta por tempo limitado. Aproveite já.', formats: ['search', 'display', 'youtube'] },
];

const TOP_CAMPAIGNS_DATA = [
  { id: 1, name: 'Search - Institucional', channel: 'Google Ads', spend: 'R$ 4.500', cpa: 'R$ 13,04', conv: 345, roas: '4.2x' },
  { id: 2, name: 'Brand Awareness Q3', channel: 'Meta Ads', spend: 'R$ 12.300', cpa: 'R$ 24,10', conv: 510, roas: '2.8x' },
  { id: 3, name: 'Retargeting Produto B', channel: 'Meta Ads', spend: 'R$ 3.200', cpa: 'R$ 9,50', conv: 336, roas: '6.1x' },
  { id: 4, name: 'Performance Max - Vendas', channel: 'Google Ads', spend: 'R$ 8.900', cpa: 'R$ 18,20', conv: 489, roas: '3.5x' },
  { id: 5, name: 'TikTok Creators Promo', channel: 'TikTok Ads', spend: 'R$ 5.400', cpa: 'R$ 15,30', conv: 352, roas: '2.1x' },
];

const INITIAL_ADS = [
  { id: 1, adGroupName: 'Consultoria Financeira', name: 'Responsive Search Ad 1', status: 'Ativo', ctr: '8.4%', cliques: 2100 },
  { id: 2, adGroupName: 'Consultoria Financeira', name: 'Expanded Text Ad - Promo', status: 'Pausado', ctr: '5.2%', cliques: 1100 },
  { id: 3, adGroupName: 'Gestão de Crise', name: 'RSA - Crise 2026', status: 'Ativo', ctr: '12.1%', cliques: 1050 },
];

// Logo Component
const AdwiserLogo = () => (
  <div className="flex items-center select-none cursor-pointer">
    <img src="/logo.png" alt="Adwiser Logo" className="h-8" />
  </div>
);

// Platform Logos SVG
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="rounded-full bg-white shadow-sm border border-gray-100 p-0.5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const MetaLogo = () => (
  <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-0.5">
    <img src="/meta.png" alt="Meta Ads" className="w-full h-full object-contain" />
  </div>
);

const TikTokLogo = () => (
  <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-0.5">
    <img src="/tiktok.jpg" alt="TikTok" className="w-full h-full object-contain" />
  </div>
);

const OpenAILogo = () => (
  <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-0.5">
    <img src="/openai.png" alt="OpenAI" className="w-full h-full object-contain" />
  </div>
);

const GoogleSearchAdPreview = ({ headline, description, url }: { headline: string, description: string, url: string }) => (
  <div className="w-[350px] mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col font-sans">
    {/* Browser/Mobile Header */}
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <span className="text-gray-400 font-medium text-sm ml-2">Google</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-200"></div>
    </div>
    
    {/* Search Bar */}
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="w-full border border-gray-200 rounded-full px-4 py-2.5 flex items-center shadow-sm">
        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <div className="h-2.5 w-32 bg-gray-200 rounded-full"></div>
      </div>
    </div>
    
    {/* Skeletons */}
    <div className="px-4 py-3 flex space-x-2 border-b border-gray-100">
      <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
      <div className="h-7 w-20 bg-gray-200 rounded-md"></div>
      <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
      <div className="h-7 w-24 bg-gray-200 rounded-md"></div>
    </div>
    
    {/* Ad Content */}
    <div className="p-4 bg-white border-b border-gray-100">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-black leading-none">Patrocinado</span>
          <span className="text-[12px] text-gray-700 truncate leading-none mt-0.5">{url}</span>
        </div>
      </div>
      <h3 className="text-xl text-[#1a0dab] mb-1 font-normal leading-tight cursor-pointer hover:underline">
        {headline}
      </h3>
      <p className="text-[14px] text-[#4d5156] leading-snug">
        {description}
      </p>
    </div>
  </div>
);

const GoogleDisplayAdPreview = ({ headline, description, url }: { headline: string, description: string, url: string }) => (
  <div className="w-[350px] mx-auto bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col font-sans">
    <div className="relative w-full h-44 bg-gray-100 flex items-center justify-center">
      <ImageIcon className="w-10 h-10 text-gray-300" />
      <div className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-600 flex items-center shadow-sm">
        <Info className="w-2.5 h-2.5 mr-0.5" /> Ad
      </div>
    </div>
    <div className="p-4 bg-white flex flex-col justify-between flex-1">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1 leading-tight line-clamp-2">
          {headline}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {description}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-gray-400 truncate w-32">{url}</span>
        <button className="px-4 py-1.5 bg-[#1a73e8] text-white text-sm font-medium rounded hover:bg-[#1557b0] transition-colors">
          Abrir
        </button>
      </div>
    </div>
  </div>
);

const GoogleYouTubeAdPreview = ({ headline, url }: { headline: string, url: string }) => (
  <div className="w-[350px] mx-auto bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col font-sans relative pb-2">
    <div className="w-full aspect-video bg-black relative flex items-center justify-center group cursor-pointer">
      <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition-colors">
        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-[6px] border-l-white border-b-4 border-b-transparent ml-0.5"></div>
      </div>
      <div className="absolute bottom-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
        Ad
      </div>
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-medium px-1.5 py-0.5 rounded-sm flex items-center">
        Pular Anúncio <ChevronRight className="w-3 h-3 ml-1" />
      </div>
    </div>
    <div className="p-3 flex flex-col bg-white">
      <div className="flex space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 mt-1"></div>
        <div className="flex flex-col flex-1">
          <h3 className="text-[15px] font-medium text-[#0f0f0f] leading-tight line-clamp-2 mb-1">
            {headline}
          </h3>
          <div className="text-[12px] text-[#606060] flex items-center">
            <span className="font-medium mr-1">Patrocinado</span> • <span className="ml-1 truncate">{url}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-3">
        <button className="w-full max-w-[280px] bg-[#f2f2f2] hover:bg-[#e5e5e5] text-[#0f0f0f] font-medium text-sm py-2 rounded-full transition-colors flex items-center justify-center">
          Acessar site
        </button>
      </div>
    </div>
  </div>
);

const AdPreviewGallery = ({ headline, description, url, formats = ['search'] }: { headline: string, description: string, url: string, formats?: string[] }) => {
  const [format, setFormat] = useState<'search' | 'display' | 'youtube'>(formats[0] as any || 'search');

  // Reset format if the formats array changes and doesn't contain the currently selected format
  useEffect(() => {
    if (!formats.includes(format)) {
      setFormat(formats[0] as any || 'search');
    }
  }, [formats]);

  return (
    <div className="flex flex-col">
      {formats.length > 1 && (
        <div className="flex items-center space-x-1 bg-gray-100/80 p-1 rounded-xl mb-4 self-center shadow-inner">
          {formats.includes('search') && (
            <button 
              onClick={() => setFormat('search')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${format === 'search' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pesquisa
            </button>
          )}
          {formats.includes('display') && (
            <button 
              onClick={() => setFormat('display')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${format === 'display' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Display
            </button>
          )}
          {formats.includes('youtube') && (
            <button 
              onClick={() => setFormat('youtube')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${format === 'youtube' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              YouTube
            </button>
          )}
        </div>
      )}

      <div className="relative">
        {format === 'search' && <GoogleSearchAdPreview headline={headline} description={description} url={url} />}
        {format === 'display' && <GoogleDisplayAdPreview headline={headline} description={description} url={url} />}
        {format === 'youtube' && <GoogleYouTubeAdPreview headline={headline} url={url} />}
      </div>
    </div>
  );
};

// KPI Card Component
const MetricCard = ({
  title,
  value,
  change,
  isPositive,
  children
}: {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  children?: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-premium transition-all duration-300 hover:border-gray-300">
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {title}
    </div>
    <div className="flex items-end justify-between">
      <div className="flex flex-col gap-2">
        <div className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
          {value}
          {children && <div className="flex -space-x-1.5 ml-2">{children}</div>}
        </div>
      </div>
      <div
        className={`text-sm font-medium mb-1 ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isPositive ? '+' : '-'}
        {change}%
      </div>
    </div>
  </div>
);

export default function App() {
  const SHOW_LEGACY_CHANNELS = false; // Hides Meta, TikTok and Google Ads until API availability, keeping code intact
  const [activeView, setActiveView] = useState<'dashboard' | 'campaign-builder' | 'funnel' | 'google-ads' | 'openai-ads' | 'ad-optimizer'>('dashboard');
  const [gAdsViewLevel, setGAdsViewLevel] = useState<'campaigns' | 'details'>('campaigns');
  const [selectedGoogleCampaign, setSelectedGoogleCampaign] = useState<any>(null);
  const [selectedGoogleAdGroup, setSelectedGoogleAdGroup] = useState<any>(null);
  
  const [selectedChannel, setSelectedChannel] = useState<string>('Todos');
  const [isCampanhasOpen, setIsCampanhasOpen] = useState(false);
  const [isFerramentasOpen, setIsFerramentasOpen] = useState(false);
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [isNewCampaignMenuOpen, setIsNewCampaignMenuOpen] = useState(false);
  const [openaiAutoCreate, setOpenaiAutoCreate] = useState(false);
  const newCampaignMenuRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'apis' | 'users' | 'notifications'>('apis');
  const [settingsSubTab, setSettingsSubTab] = useState<'openai' | 'google' | 'meta'>('openai');

  const handleOpenSettings = (tab: 'general' | 'apis' | 'users' | 'notifications' = 'apis', subTab: 'openai' | 'google' | 'meta' = 'openai') => {
    setSettingsTab(tab);
    setSettingsSubTab(subTab);
    setIsSettingsOpen(true);
  };

  // Close new campaign modal on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newCampaignMenuRef.current && !newCampaignMenuRef.current.contains(event.target as Node)) {
        setIsNewCampaignMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNewCampaignMenuOpen(false);
      }
    };
    if (isNewCampaignMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNewCampaignMenuOpen]);

  const handleSelectChannelForNewCampaign = (channelKey: 'google' | 'meta' | 'openai' | 'tiktok') => {
    setIsNewCampaignMenuOpen(false);
    if (channelKey === 'openai') {
      setOpenaiAutoCreate(true);
      setActiveView('openai-ads');
    }
  };

  // Filter State
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilters, setTableFilters] = useState<TableFilter[]>([
    { id: '1', field: 'status', operator: 'equals', value: 'Ativa', label: 'Status: Ativa' },
    { id: '2', field: 'cliques', operator: '>', value: 1000, label: 'Cliques > 1.000' }
  ]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [newFilterField, setNewFilterField] = useState('nome');
  const [newFilterOperator, setNewFilterOperator] = useState('contains');
  const [newFilterValue, setNewFilterValue] = useState('');

  // Clear filters or set defaults when level changes
  useEffect(() => {
    if (gAdsViewLevel === 'campaigns') {
      setTableFilters([{ id: '1', field: 'status', operator: 'equals', value: 'Ativa', label: 'Status: Ativa' }]);
    } else {
      setTableFilters([{ id: '1', field: 'status', operator: 'equals', value: 'Ativo', label: 'Status: Ativo' }]);
    }
    setTableSearch('');
  }, [gAdsViewLevel]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 1.5 seconds loading simulation
    return () => clearTimeout(timer);
  }, [activeView]);
  
  const channels = SHOW_LEGACY_CHANNELS ? ['Todos', 'Meta Ads', 'Google Ads', 'TikTok Ads'] : ['Todos', 'OpenAI Ads'];
  const channelLabels: Record<string, string> = {
    'Todos': 'Todos os canais',
    'OpenAI Ads': 'OpenAI Ads',
    'Meta Ads': 'Meta Ads',
    'Google Ads': 'Google Ads',
    'TikTok Ads': 'TikTok Ads'
  };
  
  const userName = "Edu Alvares";
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getGoogleAdsMetrics = () => {
    if (gAdsViewLevel === 'ads' && selectedGoogleAdGroup) {
      if (selectedGoogleAdGroup.name === 'Gestão de Crise') {
        return { investimento: 'R$ 750', investimentoChange: '1.2', investimentoIsPos: false, cliques: '2.1K', cliquesChange: '5.1', cliquesIsPos: true, cpc: 'R$ 1,50', cpcChange: '0.8', cpcIsPos: false, cpa: 'R$ 16,66', cpaChange: '2.2', cpaIsPos: true };
      }
      return { investimento: 'R$ 800', investimentoChange: '2.1', investimentoIsPos: false, cliques: '4.2K', cliquesChange: '4.5', cliquesIsPos: true, cpc: 'R$ 1,20', cpcChange: '0.5', cpcIsPos: false, cpa: 'R$ 17,50', cpaChange: '1.2', cpaIsPos: true };
    } else if (gAdsViewLevel === 'adGroups' && selectedGoogleCampaign) {
      if (selectedGoogleCampaign.name === 'Search - Institucional') {
        return { investimento: 'R$ 4.500', investimentoChange: '4.2', investimentoIsPos: false, cliques: '8.4K', cliquesChange: '12.1', cliquesIsPos: true, cpc: 'R$ 1,12', cpcChange: '2.4', cpcIsPos: true, cpa: 'R$ 13,04', cpaChange: '8.5', cpaIsPos: true };
      }
      return { investimento: 'R$ 12.300', investimentoChange: '1.5', investimentoIsPos: true, cliques: '24.5K', cliquesChange: '6.4', cliquesIsPos: true, cpc: 'R$ 0,85', cpcChange: '4.1', cpcIsPos: true, cpa: 'R$ 9,84', cpaChange: '15.2', cpaIsPos: true };
    }
    return { investimento: 'R$ 18.000', investimentoChange: '5.2', investimentoIsPos: false, cliques: '42.1K', cliquesChange: '8.2', cliquesIsPos: true, cpc: 'R$ 1,15', cpcChange: '1.5', cpcIsPos: false, cpa: 'R$ 24,50', cpaChange: '12.4', cpaIsPos: true };
  };
  
  const gAdsMetrics = getGoogleAdsMetrics();

  const applyFilters = (data: any[]) => {
    return data.filter(item => {
      if (tableSearch && !item.name.toLowerCase().includes(tableSearch.toLowerCase())) {
        return false;
      }
      for (const filter of tableFilters) {
        let itemValue = item[filter.field];
        if (itemValue === undefined) continue;

        if (filter.field === 'nome' || filter.field === 'status') {
          if (filter.operator === 'contains' && typeof itemValue === 'string') {
            if (!itemValue.toLowerCase().includes(String(filter.value).toLowerCase())) return false;
          } else if (filter.operator === 'equals') {
            if (String(itemValue).toLowerCase() !== String(filter.value).toLowerCase()) return false;
          }
        } else if (filter.field === 'cliques' || filter.field === 'gasto' || filter.field === 'cpc' || filter.field === 'cpa' || filter.field === 'conv') {
          const numItemValue = Number(itemValue);
          const numFilterValue = Number(filter.value);
          if (filter.operator === '>') {
            if (numItemValue <= numFilterValue) return false;
          } else if (filter.operator === '<') {
            if (numItemValue >= numFilterValue) return false;
          } else if (filter.operator === 'equals') {
            if (numItemValue !== numFilterValue) return false;
          }
        }
      }
      return true;
    });
  };

  const filteredCampaigns = applyFilters(INITIAL_CAMPAIGNS);
  const filteredAdGroups = applyFilters(INITIAL_AD_GROUPS.filter(ag => selectedGoogleCampaign ? ag.campaignName === selectedGoogleCampaign.name : true));
  const filteredAds = applyFilters(INITIAL_ADS.filter(ad => selectedGoogleAdGroup ? ad.adGroupName === selectedGoogleAdGroup.name : true));

  const renderFilterBar = () => (
    <div className="flex items-center">
      <div className="flex-1 relative flex items-center border border-gray-300 rounded-lg bg-white overflow-visible focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-brand-blue shadow-sm transition-all">
        <div className="pl-3 pr-2 flex items-center justify-center text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <div className="flex items-center space-x-1.5 px-1 py-1">
          {tableFilters.map(filter => (
            <span key={filter.id} className="inline-flex items-center text-xs font-medium bg-blue-50 text-brand-blue px-2 py-1 rounded-md border border-blue-200 cursor-default">
              {filter.label}
              <button onClick={() => setTableFilters(tableFilters.filter(f => f.id !== filter.id))} className="ml-1 text-blue-400 hover:text-brand-blue"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <input 
          type="text" 
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          placeholder="Buscar por nome..." 
          className="flex-1 min-w-[300px] py-2 px-2 text-sm text-gray-900 outline-none placeholder-gray-400 bg-transparent"
        />
        <div className="pr-2 border-l border-gray-200 pl-2 relative">
            <button 
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="text-gray-500 hover:text-gray-700 p-1.5 rounded transition-colors flex items-center text-xs font-medium"
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filtros
            </button>

            {isFilterMenuOpen && (
               <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Novo Filtro</h4>
                  <div className="space-y-3">
                     <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Campo</label>
                        <select value={newFilterField} onChange={e => { setNewFilterField(e.target.value); setNewFilterValue(''); }} className="w-full text-sm border-gray-300 rounded-md border px-2 py-1.5">
                           <option value="nome">Nome</option>
                           <option value="status">Status</option>
                           <option value="cliques">Cliques</option>
                           <option value="gasto">Gasto (R$)</option>
                        </select>
                     </div>
                     {newFilterField !== 'status' && (
                     <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Operador</label>
                        <select value={newFilterOperator} onChange={e => setNewFilterOperator(e.target.value)} className="w-full text-sm border-gray-300 rounded-md border px-2 py-1.5">
                           {newFilterField === 'nome' ? (
                             <>
                               <option value="contains">Contém</option>
                               <option value="equals">É igual a</option>
                             </>
                           ) : (
                             <>
                               <option value=">">Maior que</option>
                               <option value="<">Menor que</option>
                               <option value="equals">É igual a</option>
                             </>
                           )}
                        </select>
                     </div>
                     )}
                     <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                        {newFilterField === 'status' ? (
                           <select value={newFilterValue} onChange={e => setNewFilterValue(e.target.value)} className="w-full text-sm border-gray-300 rounded-md border px-2 py-1.5">
                              <option value="">Selecione...</option>
                              <option value="Ativa">Ativa/Ativo</option>
                              <option value="Pausada">Pausada/Pausado</option>
                           </select>
                        ) : (
                           <input type={newFilterField === 'nome' ? 'text' : 'number'} value={newFilterValue} onChange={e => setNewFilterValue(e.target.value)} className="w-full text-sm border-gray-300 rounded-md border px-2 py-1.5" />
                        )}
                     </div>
                     <button 
                        onClick={() => {
                           if(!newFilterValue) return;
                           let label = '';
                           if (newFilterField === 'nome') label = `Nome ${newFilterOperator === 'contains' ? 'contém' : 'é'} '${newFilterValue}'`;
                           if (newFilterField === 'status') label = `Status: ${newFilterValue}`;
                           if (newFilterField === 'cliques' || newFilterField === 'gasto') {
                              label = `${newFilterField === 'cliques' ? 'Cliques' : 'Gasto'} ${newFilterOperator} ${newFilterValue}`;
                           }
                           setTableFilters([...tableFilters, {
                              id: Math.random().toString(),
                              field: newFilterField,
                              operator: newFilterField === 'status' ? 'equals' : newFilterOperator,
                              value: newFilterField === 'status' || newFilterField === 'nome' ? newFilterValue : Number(newFilterValue),
                              label
                           }]);
                           setIsFilterMenuOpen(false);
                           setNewFilterValue('');
                        }}
                        className="w-full bg-brand-blue text-white rounded-md py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
                     >
                        Adicionar
                     </button>
                  </div>
               </div>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden text-gray-800">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          >
            <img src="/adwiser_loading.gif" alt="Carregando..." className="w-32 h-32 object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 relative">
        <div className="p-8 flex-shrink-0">
          <AdwiserLogo />
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 min-h-0">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-blue-50 text-brand-blue'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 mr-3 ${activeView === 'dashboard' ? 'text-brand-blue' : 'text-gray-400'}`} />
            <span>Visão geral da conta</span>
          </button>

          {/* Campaign Builder - Planejador Estratégico IA */}
          <button
            onClick={() => setActiveView('campaign-builder')}
            className={`w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeView === 'campaign-builder'
                ? 'bg-blue-50 text-brand-blue font-semibold shadow-xs'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Compass className={`w-4 h-4 mr-3 ${activeView === 'campaign-builder' ? 'text-brand-blue' : 'text-gray-400'}`} />
            <div className="flex items-center justify-between flex-1">
              <span>Campaign Builder</span>
              <span className="text-[10px] bg-blue-100 text-brand-blue font-bold px-1.5 py-0.2 rounded">IA</span>
            </div>
          </button>

          <div>
            <button
              onClick={() => setIsCampanhasOpen(!isCampanhasOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center">
                <Megaphone className="w-4 h-4 mr-3 text-gray-400" />
                <span>Campanhas</span>
              </div>
              {isCampanhasOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            <AnimatePresence>
              {isCampanhasOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-8 pr-4 py-2 space-y-1">
                    {/* Canal Ativo Liberado: OpenAI Ads */}
                    <button 
                      onClick={() => setActiveView('openai-ads')}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        activeView === 'openai-ads' ? 'bg-blue-50 text-brand-blue font-semibold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <OpenAILogo />
                      <span className="ml-2">OpenAI Ads</span>
                      <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.2 rounded border border-emerald-100">
                        Ativo
                      </span>
                    </button>

                    {/* Canais Legados ocultos temporariamente até liberação de API (código preservado) */}
                    {SHOW_LEGACY_CHANNELS && (
                      <>
                        <button 
                          onClick={() => {
                            setActiveView('google-ads');
                            setGAdsViewLevel('campaigns');
                          }}
                          className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeView === 'google-ads' ? 'bg-blue-50 text-brand-blue' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <GoogleLogo />
                          <span className="ml-2">Google Ads</span>
                        </button>
                        <button className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
                          <MetaLogo />
                          <span className="ml-2">Meta Ads</span>
                        </button>
                        <button className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
                          <TikTokLogo />
                          <span className="ml-2">TikTok Ads</span>
                        </button>
                      </>
                    )}
                    
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Utilitários</div>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">Planejador de palavras-chave</button>
                      <button 
                        onClick={() => setActiveView('ad-optimizer')}
                        className={`w-full flex items-center gap-1.5 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeView === 'ad-optimizer' 
                            ? 'bg-gradient-to-r from-purple-100 to-blue-100 shadow-sm' 
                            : 'bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100'
                        } text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-gray-900">Ad Optimizer Studio+</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <button
              onClick={() => setIsFerramentasOpen(!isFerramentasOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center">
                <Wrench className="w-4 h-4 mr-3 text-gray-400" />
                <span>Ferramentas</span>
              </div>
              {isFerramentasOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {isFerramentasOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-8 pr-4 py-2 space-y-1">
                    <button
                      onClick={() => setActiveView('funnel')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeView === 'funnel' ? 'text-brand-blue bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Funnel Campaign
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
                      Públicos
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-8 flex-shrink-0 border-t border-gray-100">
          <button 
            onClick={() => handleOpenSettings('apis', 'openai')}
            className="w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-3 text-gray-400" />
            <span>Configurações</span>
          </button>
          <div className="mt-4 px-4 flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-brand-gray text-white flex items-center justify-center text-xs font-bold">
              JS
            </div>
            <div className="text-sm font-medium">João Silva</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        id="adwiser-main-content"
        className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-500 bg-white"
        style={
          activeView === 'google-ads'
            ? { background: 'linear-gradient(90deg, rgba(66,133,244,0.06) 0%, rgba(234,67,53,0.04) 15%, rgba(251,188,5,0.02) 30%, rgba(52,168,83,0.01) 45%, rgba(255,255,255,1) 70%, rgba(255,255,255,1) 100%)' }
            : activeView === 'openai-ads'
            ? { background: 'linear-gradient(90deg, rgba(16,163,127,0.06) 0%, rgba(16,163,127,0.03) 30%, rgba(255,255,255,1) 70%)' }
            : activeView === 'campaign-builder'
            ? { background: 'linear-gradient(180deg, rgba(0,68,255,0.02) 0%, rgba(255,255,255,1) 220px)' }
            : { backgroundColor: '#ffffff' }
        }
      >
        {/* Header */}
        <header className="bg-white/60 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 px-10 py-6 flex justify-between items-center">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">
              {getGreeting()}, {userName}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
              {activeView === 'dashboard' && 'Visão Geral das Campanhas'}
              {activeView === 'campaign-builder' && (
                <>
                  <div className="mr-3 text-brand-blue"><Compass className="w-6 h-6" /></div>
                  Campaign Builder
                </>
              )}
              {activeView === 'funnel' && 'Análise de Funil de Mídia'}
              {activeView === 'google-ads' && (
                <>
                  <div className="mr-3"><GoogleLogo /></div>
                  Google Ads Insights
                </>
              )}
              {activeView === 'openai-ads' && (
                <>
                  <div className="mr-3"><OpenAILogo /></div>
                  OpenAI Ads (Beta)
                </>
              )}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {activeView !== 'google-ads' && activeView !== 'openai-ads' && activeView !== 'campaign-builder' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">Canais:</span>
                <div className="relative">
                  <button
                    onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}
                    className="flex items-center justify-between w-48 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all shadow-sm"
                  >
                    <span className="truncate">{channelLabels[selectedChannel] || 'Todos os canais'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
                  </button>
                  
                  <AnimatePresence>
                    {isChannelDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                      >
                        {channels.map((channel) => (
                          <button
                            key={channel}
                            onClick={() => {
                              setSelectedChannel(channel);
                              setIsChannelDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-brand-blue transition-colors text-left"
                          >
                            <div className="flex items-center">
                              {channel === 'Meta Ads' && <div className="mr-2"><MetaLogo /></div>}
                              {channel === 'Google Ads' && <div className="mr-2"><GoogleLogo /></div>}
                              {channel === 'TikTok Ads' && <div className="mr-2"><TikTokLogo /></div>}
                              <span className="truncate">{channelLabels[channel]}</span>
                            </div>
                            {selectedChannel === channel && <Check className="w-4 h-4 text-brand-blue" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4 mr-2 text-gray-500" />
              Exportar Dados
            </button>
            {activeView !== 'google-ads' && activeView !== 'openai-ads' && (
              <div className="relative" ref={newCampaignMenuRef}>
                <button 
                  id="btn-header-new-campaign"
                  onClick={() => setIsNewCampaignMenuOpen(!isNewCampaignMenuOpen)}
                  className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm cursor-pointer select-none active:scale-95"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Campanha
                  <ChevronDown className={`w-3.5 h-3.5 ml-1.5 transition-transform duration-200 ${isNewCampaignMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isNewCampaignMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden"
                    >
                      {/* Campaign Builder - Planejador Estratégico IA */}
                      <button
                        onClick={() => {
                          setIsNewCampaignMenuOpen(false);
                          setActiveView('campaign-builder');
                        }}
                        className="w-full flex items-center px-3.5 py-2.5 text-sm text-gray-800 hover:bg-blue-50/70 hover:text-brand-blue transition-colors text-left cursor-pointer border-b border-gray-100"
                      >
                        <div className="mr-2.5 flex-shrink-0 flex items-center justify-center text-brand-blue">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-xs">Campaign Builder</div>
                          <div className="text-[10px] text-gray-500">Planejador investigativo com IA</div>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-brand-blue font-bold px-1.5 py-0.2 rounded border border-blue-100">Novo</span>
                      </button>

                      {/* OpenAI Ads - Funcional */}
                      <button
                        id="select-channel-openai-ads"
                        onClick={() => handleSelectChannelForNewCampaign('openai')}
                        className="w-full flex items-center px-3.5 py-2.5 text-sm text-gray-800 hover:bg-emerald-50/70 hover:text-emerald-900 transition-colors text-left cursor-pointer"
                      >
                        <div className="mr-2.5 flex-shrink-0 flex items-center justify-center">
                          <OpenAILogo />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-xs">OpenAI Ads</div>
                          <div className="text-[10px] text-gray-500">Criar anúncio conversacional</div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.2 rounded border border-emerald-100">Ativo</span>
                      </button>

                      {SHOW_LEGACY_CHANNELS && (
                        <>
                          {/* Google Ads - Em breve */}
                          <div
                            id="select-channel-google-ads"
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed opacity-60 select-none"
                          >
                            <div className="flex items-center">
                              <div className="mr-2.5 flex-shrink-0 flex items-center justify-center grayscale">
                                <GoogleLogo />
                              </div>
                              <span>Google Ads</span>
                            </div>
                            <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded">Em breve</span>
                          </div>

                          {/* Meta Ads - Em breve */}
                          <div
                            id="select-channel-meta-ads"
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed opacity-60 select-none"
                          >
                            <div className="flex items-center">
                              <div className="mr-2.5 flex-shrink-0 flex items-center justify-center grayscale">
                                <MetaLogo />
                              </div>
                              <span>Meta Ads</span>
                            </div>
                            <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded">Em breve</span>
                          </div>

                          {/* TikTok Ads - Em breve */}
                          <div
                            id="select-channel-tiktok-ads"
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-gray-400 cursor-not-allowed opacity-60 select-none"
                          >
                            <div className="flex items-center">
                              <div className="mr-2.5 flex-shrink-0 flex items-center justify-center grayscale">
                                <TikTokLogo />
                              </div>
                              <span>TikTok Ads</span>
                            </div>
                            <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded">Em breve</span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <div className="w-10 h-10 ml-2 rounded-full border border-gray-200 shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-blue transition-all flex-shrink-0">
              <img src="https://ui-avatars.com/api/?name=Edu+Alvares&background=2C3238&color=fff" alt="Edu Alvares" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Views */}
        <div className="p-10 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard 
                    title="Alcance Total" 
                    value={selectedChannel === 'Meta Ads' ? '1.2M' : selectedChannel === 'Google Ads' ? '800K' : selectedChannel === 'TikTok Ads' ? '400K' : '2.4M'} 
                    change="12.5" 
                    isPositive={true}
                  >
                    {(selectedChannel === 'Todos' || selectedChannel === 'Google Ads') && <GoogleLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'Meta Ads') && <MetaLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'TikTok Ads') && <TikTokLogo />}
                  </MetricCard>
                  <MetricCard 
                    title="Cliques" 
                    value={selectedChannel === 'Meta Ads' ? '85.4K' : selectedChannel === 'Google Ads' ? '42.1K' : selectedChannel === 'TikTok Ads' ? '14.8K' : '142.3K'} 
                    change="8.2" 
                    isPositive={true}
                  >
                    {(selectedChannel === 'Todos' || selectedChannel === 'Google Ads') && <GoogleLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'Meta Ads') && <MetaLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'TikTok Ads') && <TikTokLogo />}
                  </MetricCard>
                  <MetricCard 
                    title="Custo por Clique (CPC)" 
                    value={selectedChannel === 'Meta Ads' ? 'R$ 0,72' : selectedChannel === 'Google Ads' ? 'R$ 1,15' : selectedChannel === 'TikTok Ads' ? 'R$ 0,45' : 'R$ 0,84'} 
                    change="3.1" 
                    isPositive={false}
                  >
                    {(selectedChannel === 'Todos' || selectedChannel === 'Google Ads') && <GoogleLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'Meta Ads') && <MetaLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'TikTok Ads') && <TikTokLogo />}
                  </MetricCard>
                  <MetricCard 
                    title="Conversões" 
                    value={selectedChannel === 'Meta Ads' ? '5,120' : selectedChannel === 'Google Ads' ? '2,840' : selectedChannel === 'TikTok Ads' ? '445' : '8,405'} 
                    change="18.4" 
                    isPositive={true}
                  >
                    {(selectedChannel === 'Todos' || selectedChannel === 'Google Ads') && <GoogleLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'Meta Ads') && <MetaLogo />}
                    {(selectedChannel === 'Todos' || selectedChannel === 'TikTok Ads') && <TikTokLogo />}
                  </MetricCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Real-time Conversions */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-premium">
                    <div className="text-sm font-semibold text-gray-900 mb-6">Volume de Conversões (Hoje)</div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} />
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-premium)'}} />
                          <Line type="monotone" dataKey="conv" stroke="var(--color-brand-blue)" strokeWidth={3} dot={{r: 4, fill: 'var(--color-brand-blue)', strokeWidth: 2, stroke: '#FFF'}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Budget by Channel */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-premium">
                    <div className="text-sm font-semibold text-gray-900 mb-6">Verba Alocada por Canal</div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12, fontWeight: 500}} />
                          <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-premium)'}} />
                          <Bar dataKey="orcamento" fill="var(--color-brand-gray)"  barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Funnel Budget Snapshot */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-premium">
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-sm font-semibold text-gray-900">Distribuição de Verba no Funil</div>
                    <button onClick={() => setActiveView('funnel')} className="text-sm font-medium text-brand-blue hover:underline cursor-pointer">
                      Abrir Funnel Campaign
                    </button>
                  </div>
                  
                  <div className="h-64 -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={selectedChannel === 'Todos' ? funnelBudgetData : funnelBudgetData.map(d => ({ ...d, value: Math.round(d.value * (selectedChannel === 'Meta Ads' ? 0.45 : selectedChannel === 'Google Ads' ? 0.35 : 0.2)) }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ value }) => `R$ ${(value/1000).toFixed(0)}k`}
                          labelLine={true}
                        >
                          {funnelBudgetData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-premium)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2 text-xs text-gray-600 font-medium">
                    <div className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-brand-gray mr-2"></div>Consciência</div>
                    <div className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-brand-blue mr-2"></div>Consideração</div>
                    <div className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-blue-300 mr-2"></div>Conversão</div>
                  </div>
                </div>

                {/* Top Campaigns Table */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-premium mt-6">
                  <div className="text-sm font-semibold text-gray-900 mb-6">Top Campanhas (Todas as plataformas)</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4">Campanha</th>
                          <th className="px-6 py-4">Canal</th>
                          <th className="px-6 py-4">Investimento</th>
                          <th className="px-6 py-4">CPA</th>
                          <th className="px-6 py-4">Conversões</th>
                          <th className="px-6 py-4">ROAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {TOP_CAMPAIGNS_DATA.map((camp) => (
                          <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{camp.name}</td>
                            <td className="px-6 py-4 flex items-center">
                              {camp.channel === 'Meta Ads' && <div className="mr-2 flex items-center justify-center"><MetaLogo /></div>}
                              {camp.channel === 'Google Ads' && <div className="mr-2 flex items-center justify-center"><GoogleLogo /></div>}
                              {camp.channel === 'TikTok Ads' && <div className="mr-2 flex items-center justify-center"><TikTokLogo /></div>}
                              <span className="text-gray-500">{camp.channel}</span>
                            </td>
                            <td className="px-6 py-4">{camp.spend}</td>
                            <td className="px-6 py-4 font-medium">{camp.cpa}</td>
                            <td className="px-6 py-4">{camp.conv}</td>
                            <td className="px-6 py-4 text-brand-blue font-bold">{camp.roas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'google-ads' && (
              <motion.div
                key="google-ads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >


                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard title="Investimento" value={gAdsMetrics.investimento} change={gAdsMetrics.investimentoChange} isPositive={gAdsMetrics.investimentoIsPos}>
                    <GoogleLogo />
                  </MetricCard>
                  <MetricCard title="Cliques" value={gAdsMetrics.cliques} change={gAdsMetrics.cliquesChange} isPositive={gAdsMetrics.cliquesIsPos}>
                    <GoogleLogo />
                  </MetricCard>
                  <MetricCard title="Custo por Clique (CPC)" value={gAdsMetrics.cpc} change={gAdsMetrics.cpcChange} isPositive={gAdsMetrics.cpcIsPos}>
                    <GoogleLogo />
                  </MetricCard>
                  <MetricCard title="Custo por Aquisição (CPA)" value={gAdsMetrics.cpa} change={gAdsMetrics.cpaChange} isPositive={gAdsMetrics.cpaIsPos}>
                    <GoogleLogo />
                  </MetricCard>
                </div>
                
                {gAdsViewLevel !== 'campaigns' && (
                  <div className="flex items-center justify-between mt-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => { setGAdsViewLevel('campaigns'); setSelectedGoogleCampaign(null); setSelectedGoogleAdGroup(null); }}
                        className="flex items-center text-gray-500 hover:text-brand-blue font-medium transition-colors cursor-pointer text-sm"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar para Campanhas
                      </button>
                    </div>
                  </div>
                )}

                {gAdsViewLevel === 'campaigns' && (
                  <>
                    {/* Filters & Charts */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2">
                        <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center cursor-pointer">
                          Últimos 30 dias <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                        <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center cursor-pointer">
                          Status: Ativas <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                      <div className="relative bg-white/80 rounded-lg">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Buscar..." 
                          className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue shadow-sm bg-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-premium lg:col-span-2">
                        <h3 className="text-sm font-bold text-gray-900 mb-6">Cliques (Últimos 7 dias)</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={googleAdsClicksData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                              <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-premium)' }} />
                              <Bar dataKey="cliques" fill="#4285F4"  barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-premium">
                        <h3 className="text-sm font-bold text-gray-900 mb-6">Cliques por Dispositivo</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={googleAdsDeviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {googleAdsDeviceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-premium)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-600 font-medium">
                           <div className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-[#3b82f6] mr-2"></div>Mobile</div>
                           <div className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-[#10b981] mr-2"></div>Desktop</div>
                           <div className="flex items-center"><div className="w-2.5 h-2.5 rounded bg-[#f59e0b] mr-2"></div>Tablet</div>
                        </div>
                      </div>
                    </div>

                    {/* Campaigns Table */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-premium overflow-visible mt-2">
                      <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-gray-900">Campanhas</h3>
                          <div className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">Apenas Leitura</div>
                        </div>
                        {renderFilterBar()}
                      </div>
                      <div className="flex flex-col">
                        {filteredCampaigns.map((camp) => (
                          <div 
                            key={camp.id} 
                            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            {/* Left section: Image + Name + Status */}
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex flex-col">
                                <h4 className="text-sm font-bold text-gray-900">{camp.name}</h4>
                                <span className={`inline-flex items-center px-2 py-0.5 mt-1 w-max rounded-full text-[11px] font-medium ${camp.status === 'Ativa' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                  {camp.status === 'Ativa' ? 'Ativa' : 'Em rascunho'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Middle section: Resultados */}
                            <div className="flex items-center space-x-8 flex-1">
                              <div className="flex flex-col items-start w-24">
                                <div className="flex items-center text-[12px] text-gray-500 mb-1">
                                  Resultados <Info className="w-3 h-3 ml-1" />
                                </div>
                                <span className="text-2xl font-light text-gray-900">{camp.cliques === 0 ? '0' : camp.cliquesStr}</span>
                              </div>
                              <div className="text-[12px] text-gray-400 max-w-[160px] leading-snug">
                                {camp.cliques === 0 ? 'Esta campanha não tem resultados para os últimos 7 dias.' : 'Resultados com base em cliques nos últimos 30 dias.'}
                              </div>
                            </div>
                            
                            {/* Right section: Action */}
                            <div className="flex items-center justify-end w-32 space-x-4">
                              <div className="flex items-center space-x-2">
                                {/* Canais */}
                                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                                  <GoogleLogo />
                                </div>
                              </div>
                              <button 
                                onClick={() => { setSelectedGoogleCampaign(camp); setGAdsViewLevel('details'); }}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {gAdsViewLevel === 'details' && selectedGoogleCampaign && (
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar: Tree */}
                    <div className="w-full lg:w-[320px] shrink-0 bg-white border border-gray-200 rounded-xl shadow-premium p-4 flex flex-col h-max">
                      <div className="text-sm font-semibold text-gray-900 mb-4 px-2">Estrutura da Campanha</div>
                      
                      {/* Campaign Node */}
                      <div 
                        onClick={() => { setSelectedGoogleAdGroup(null); }}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer ${!selectedGoogleAdGroup ? 'bg-blue-50 text-brand-blue' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        <Folder className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium truncate">{selectedGoogleCampaign.name}</span>
                      </div>
                      
                      {/* AdGroups Nodes */}
                      <div className="pl-5 mt-1 space-y-1 border-l-2 border-gray-100 ml-4">
                        {INITIAL_AD_GROUPS.filter(ag => ag.campaignName === selectedGoogleCampaign.name).map(ag => (
                          <div key={ag.id}>
                            <div 
                              onClick={() => setSelectedGoogleAdGroup(ag)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer ${selectedGoogleAdGroup?.id === ag.id ? 'bg-blue-50 text-brand-blue' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                              <LayoutGrid className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-sm font-medium truncate">{ag.name}</span>
                            </div>
                            
                            {/* Ads Nodes */}
                            <div className="pl-5 mt-1 space-y-1 border-l-2 border-gray-100 ml-4">
                               {INITIAL_ADS.filter(ad => ad.adGroupName === ag.name).map(ad => (
                                 <div key={ad.id} className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer">
                                   <FileText className="w-4 h-4 text-gray-300 shrink-0" />
                                   <span className="text-[13px] truncate">{ad.name}</span>
                                 </div>
                               ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Right Content */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-premium p-6">
                      {!selectedGoogleAdGroup ? (
                        <>
                          <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedGoogleCampaign.name} - Detalhes da Campanha</h3>
                          <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col justify-center">
                              <div className="text-xs text-gray-500 mb-1 flex items-center"><Check className="w-3 h-3 mr-1 text-green-500" /> Tipo de compra</div>
                              <div className="text-sm font-medium">Leilão</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col justify-center">
                              <div className="text-xs text-gray-500 mb-1 flex items-center"><Check className="w-3 h-3 mr-1 text-green-500" /> Objetivo da campanha</div>
                              <div className="text-sm font-medium text-brand-blue cursor-pointer hover:underline">Vendas</div>
                            </div>
                          </div>
                          
                          <h4 className="text-sm font-bold text-gray-900 mb-4">Desempenho (30d)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <MetricCard title="Investimento" value={selectedGoogleCampaign.gastoStr} change="4.2" isPositive={false} />
                             <MetricCard title="Cliques" value={selectedGoogleCampaign.cliquesStr} change="12.1" isPositive={true} />
                             <MetricCard title="CPC" value={selectedGoogleCampaign.cpcStr} change="2.4" isPositive={true} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedGoogleAdGroup.name} - Conjunto de Anúncios</h3>
                            <div className="grid grid-cols-1 gap-4 mb-6">
                               <MetricCard title="Cliques" value={selectedGoogleAdGroup.cliquesStr} change="5.1" isPositive={true} />
                               <MetricCard title="CPC" value={selectedGoogleAdGroup.cpcStr} change="1.2" isPositive={false} />
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0 w-full lg:w-[350px]">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 px-2">Preview do Anúncio</h3>
                            <AdPreviewGallery 
                              headline={selectedGoogleAdGroup.headline}
                              description={selectedGoogleAdGroup.description}
                              url={selectedGoogleAdGroup.url}
                              formats={selectedGoogleAdGroup.formats}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {activeView === 'campaign-builder' && (
              <CampaignBuilderView 
                onNavigateToOpenAI={() => {
                  setOpenaiAutoCreate(true);
                  setActiveView('openai-ads');
                }}
              />
            )}

            {activeView === 'openai-ads' && (
              <OpenAIAdsView 
                initialCreate={openaiAutoCreate}
                onOpenSettings={(tab, subTab) => handleOpenSettings((tab as any) || 'apis', (subTab as any) || 'openai')} 
              />
            )}

            {activeView === 'ad-optimizer' && (
              <AdOptimizerView />
            )}

            {activeView === 'funnel' && (
              <motion.div
                key="funnel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-gray-500 text-sm mb-8 max-w-3xl leading-relaxed">
                  A visualização <strong>Funnel Campaign</strong> unifica dados de todas as plataformas conectadas (Meta, Google, LinkedIn) e organiza suas campanhas de acordo com o estágio da jornada do consumidor, permitindo identificar gargalos de investimento.
                </div>

                {/* Funnel Layout */}
                <div className="flex flex-col space-y-6">
                  
                  {/* Top of Funnel */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-gray"></div>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Topo de Funil</div>
                        <h3 className="text-xl font-semibold text-gray-900">Consciência (Awareness)</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">R$ 45.000</div>
                        <div className="text-sm text-gray-500">Verba Alocada</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {funnelCampaigns.filter(c => c.stage.includes('TOFU')).map(campaign => (
                        <div key={campaign.id} className="border border-gray-100 bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{campaign.platform}</span>
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{campaign.status}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">{campaign.name}</div>
                          <div className="flex justify-between mt-4 border-t border-gray-200 pt-3">
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Investido</div>
                              <div className="text-sm font-medium text-gray-800">{campaign.spend}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Custo</div>
                              <div className="text-sm font-medium text-gray-800">{campaign.cpa}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Middle of Funnel */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden ml-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-blue"></div>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Meio de Funil</div>
                        <h3 className="text-xl font-semibold text-gray-900">Consideração</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">R$ 35.000</div>
                        <div className="text-sm text-gray-500">Verba Alocada</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {funnelCampaigns.filter(c => c.stage.includes('MOFU')).map(campaign => (
                        <div key={campaign.id} className="border border-gray-100 bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{campaign.platform}</span>
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{campaign.status}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">{campaign.name}</div>
                          <div className="flex justify-between mt-4 border-t border-gray-200 pt-3">
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Investido</div>
                              <div className="text-sm font-medium text-gray-800">{campaign.spend}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Custo</div>
                              <div className="text-sm font-medium text-gray-800">{campaign.cpa}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom of Funnel */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden ml-8">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-300"></div>
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fundo de Funil</div>
                        <h3 className="text-xl font-semibold text-gray-900">Conversão & Retenção</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">R$ 20.000</div>
                        <div className="text-sm text-gray-500">Verba Alocada</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {funnelCampaigns.filter(c => c.stage.includes('BOFU')).map(campaign => (
                        <div key={campaign.id} className="border border-gray-100 bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">{campaign.platform}</span>
                            <span className={campaign.status === 'Learning' ? "text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded" : "text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded"}>{campaign.status}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">{campaign.name}</div>
                          <div className="flex justify-between mt-4 border-t border-gray-200 pt-3">
                            <div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Investido</div>
                              <div className="text-sm font-medium text-gray-800">{campaign.spend}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Custo</div>
                              <div className="text-sm font-medium text-gray-800">{campaign.cpa}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        initialSubTab={settingsSubTab}
      />
    </div>
  );
}
