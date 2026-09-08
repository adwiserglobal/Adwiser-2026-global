import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Check, AlertCircle, RefreshCw, ExternalLink, ShieldCheck, Eye, EyeOff, Trash2, Sliders, Bell, Users, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'general' | 'apis' | 'users' | 'notifications';
  initialSubTab?: 'openai' | 'google' | 'meta';
  onConfigSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'apis',
  initialSubTab = 'openai',
  onConfigSaved
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'apis' | 'users' | 'notifications'>(initialTab);
  const [activeSubTab, setActiveSubTab] = useState<'openai' | 'google' | 'meta'>(initialSubTab);

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setActiveSubTab(initialSubTab);
      checkKeyStatus();
    }
  }, [isOpen, initialTab, initialSubTab]);

  const checkKeyStatus = async () => {
    const isLocalConfigured = localStorage.getItem('adwiser_openai_configured') === 'true';
    const localKey = localStorage.getItem('adwiser_openai_api_key');
    if (localKey) {
      setApiKey(localKey);
    }
    
    try {
      const res = await fetch('/api/settings/openai-key');
      const data = await res.json();
      if (res.ok) {
        setIsConfigured(isLocalConfigured || data.configured);
        setMaskedKey(data.maskedKey || (localKey ? `${localKey.slice(0, 7)}...${localKey.slice(-4)}` : null));
      } else {
        setIsConfigured(isLocalConfigured);
      }
    } catch {
      setIsConfigured(isLocalConfigured);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setFeedback({ type: 'error', text: 'Por favor, insira a chave de API da OpenAI Ads.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/settings/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar chave.');
      }

      // Save locally
      localStorage.setItem('adwiser_openai_configured', 'true');
      localStorage.setItem('adwiser_openai_api_key', apiKey.trim());
      setIsConfigured(true);
      setMaskedKey(`${apiKey.trim().slice(0, 7)}...${apiKey.trim().slice(-4)}`);

      setFeedback({ type: 'success', text: 'Chave salva e validada com sucesso na OpenAI Ads!' });
      if (onConfigSaved) onConfigSaved();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao conectar chave.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey.trim()) {
        headers['x-openai-ads-key'] = apiKey.trim();
      }
      const res = await fetch('/api/openai/campaigns', { headers });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ 
          type: 'success', 
          text: `Conexão bem-sucedida! ${Array.isArray(data.data) ? data.data.length : 0} campanhas encontradas na conta.` 
        });
      } else {
        throw new Error(data.error || 'Falha na autenticação da chave.');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: `Teste falhou: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleResetToFirstTime = async () => {
    localStorage.removeItem('adwiser_openai_configured');
    localStorage.removeItem('adwiser_openai_api_key');
    setApiKey('');
    setIsConfigured(false);
    setMaskedKey(null);

    try {
      await fetch('/api/settings/openai-key', { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }

    setFeedback({ type: 'info', text: 'Configuração redefinida! O modo de primeira vez (onboarding) foi ativado.' });
    if (onConfigSaved) onConfigSaved();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full h-[620px] flex overflow-hidden text-gray-900"
      >
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col p-4 flex-shrink-0">
          <div className="px-3 py-3 mb-3 border-b border-gray-200/80">
            <h2 className="text-base font-bold text-gray-900">Configurações</h2>
            <p className="text-xs text-gray-500 mt-0.5">Gerenciamento da Adwiser</p>
          </div>

          <nav className="space-y-1 flex-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              <Sliders className="w-4 h-4 text-gray-500" />
              Geral
            </button>

            <button
              onClick={() => setActiveTab('apis')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === 'apis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-gray-500" />
                <span>APIs & Integrações</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                Ativo
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              <Users className="w-4 h-4 text-gray-500" />
              Usuários & Permissões
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === 'notifications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              <Bell className="w-4 h-4 text-gray-500" />
              Notificações
            </button>
          </nav>

          <div className="p-3 bg-gray-100/80 rounded-xl text-xs text-gray-500 border border-gray-200">
            Ambiente Seguro TLS 1.3 • Chaves criptografadas
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Configurações</span>
              <span className="text-xs text-gray-300">/</span>
              <span className="text-xs text-gray-900 font-semibold">
                {activeTab === 'apis' ? 'APIs & Integrações' : activeTab === 'general' ? 'Geral' : activeTab}
              </span>
              {activeTab === 'apis' && (
                <>
                  <span className="text-xs text-gray-300">/</span>
                  <span className="text-xs text-black font-bold uppercase">{activeSubTab}</span>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Navigation for APIs */}
          {activeTab === 'apis' && (
            <div className="px-6 pt-3 border-b border-gray-100 flex gap-4">
              <button
                onClick={() => setActiveSubTab('openai')}
                className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeSubTab === 'openai' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center p-0.5">
                  <img src="/openai.png" alt="OpenAI" className="w-full h-full object-contain filter invert" />
                </div>
                OpenAI Ads
                <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-mono">NOVO</span>
              </button>

              <button
                onClick={() => setActiveSubTab('google')}
                className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeSubTab === 'google' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">
                  G
                </div>
                Google Ads
                <span className="text-[10px] text-emerald-600 font-medium">Conectado</span>
              </button>

              <button
                onClick={() => setActiveSubTab('meta')}
                className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeSubTab === 'meta' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden p-0.5">
                  <img src="/meta.png" alt="Meta" className="w-full h-full object-contain" />
                </div>
                Meta Ads
                <span className="text-[10px] text-emerald-600 font-medium">Conectado</span>
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6 flex-1">
            {activeTab === 'apis' && activeSubTab === 'openai' && (
              <div className="max-w-xl space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>OpenAI Ads API</span>
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                        isConfigured
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isConfigured ? 'Conectado e Ativo' : 'Não configurado'}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                    Conecte sua conta do OpenAI Ads para criar e publicar campanhas conversacionais com IA diretamente na Adwiser.
                  </p>
                </div>

                {/* Instructions card */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                  <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-gray-700" />
                    Como obter sua chave:
                  </div>
                  <ol className="list-decimal list-inside text-gray-600 space-y-1 pl-1">
                    <li>
                      Acesse{' '}
                      <a
                        href="https://ads.openai.com/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        ads.openai.com/settings <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Navegue até <strong>Settings &gt; API Keys</strong> e gere uma nova chave de serviço.</li>
                    <li>Copie e cole a chave no campo abaixo.</li>
                  </ol>
                </div>

                {/* Feedback banner */}
                {feedback && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : feedback.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                {/* Input form */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">
                    Chave Secreta da OpenAI Ads (API Key)
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-ads-..."
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {maskedKey && (
                    <div className="text-[11px] text-gray-500">
                      Chave ativa registrada: <span className="font-mono text-gray-700">{maskedKey}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      disabled={loading || !apiKey.trim()}
                      className="px-5 py-2 text-xs font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-40 shadow-sm"
                    >
                      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {loading ? 'Salvando...' : 'Salvar Chave'}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {testing ? 'Testando...' : 'Testar Conexão'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToFirstTime}
                    className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Limpa a configuração atual para testar a experiência de primeiro acesso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Redefinir (Modo 1ª Vez)
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'apis' && activeSubTab === 'google' && (
              <div className="max-w-xl space-y-4">
                <h3 className="text-base font-bold text-gray-900">Google Ads API</h3>
                <p className="text-xs text-gray-500">Conta conectada via OAuth 2.0 corporativo Adwiser.</p>
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Sincronização em tempo real ativa com o Google Ads MCC.
                </div>
              </div>
            )}

            {activeTab === 'apis' && activeSubTab === 'meta' && (
              <div className="max-w-xl space-y-4">
                <h3 className="text-base font-bold text-gray-900">Meta Marketing API</h3>
                <p className="text-xs text-gray-500">Pixel e Business Manager sincronizados.</p>
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Sincronização em tempo real ativa com o Meta Business.
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="max-w-xl space-y-4">
                <h3 className="text-base font-bold text-gray-900">Geral</h3>
                <p className="text-xs text-gray-500">Preferências da plataforma Adwiser.</p>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Nome da Empresa</label>
                    <input type="text" defaultValue="Adwiser Inc." className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Moeda Padrão</label>
                    <input type="text" defaultValue="BRL (R$)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="max-w-xl space-y-4">
                <h3 className="text-base font-bold text-gray-900">Usuários & Permissões</h3>
                <p className="text-xs text-gray-500">Membros da equipe com acesso aos relatórios e campanhas.</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between font-semibold text-gray-700">
                    <span>Nome</span>
                    <span>Papel</span>
                  </div>
                  <div className="p-3 flex justify-between items-center border-b border-gray-100">
                    <div>
                      <div className="font-medium text-gray-900">João Silva</div>
                      <div className="text-gray-500 text-[11px]">joao@adwiser.com</div>
                    </div>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">Administrador</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="max-w-xl space-y-4">
                <h3 className="text-base font-bold text-gray-900">Notificações</h3>
                <p className="text-xs text-gray-500">Alertas de gastos de campanhas e conversões anômalas.</p>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-black" />
                    <span>Alertar quando uma campanha atingir 80% do orçamento diário</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-black" />
                    <span>Notificar sobre novos eventos de conversão registrados pelo Pixel</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
