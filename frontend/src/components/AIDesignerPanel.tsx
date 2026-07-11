import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';
import { useAppStore } from '../store/appStore';
import { applyBookDesign } from '../lib/applyDesign';
import type { HeadingGap, ChapterStartPosition, DropCapStyle } from '../store/appStore';

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || 'https://bookify-ixxa.onrender.com';

type Provider = 'gemini' | 'openrouter' | 'anthropic' | 'openai' | 'custom';

const PROVIDERS: { id: Provider; label: string; keyHint: string; modelPlaceholder: string }[] = [
  { id: 'gemini', label: 'Google Gemini (key miễn phí)', keyHint: 'AIza...', modelPlaceholder: 'gemini-2.0-flash (mặc định)' },
  { id: 'openrouter', label: 'OpenRouter (mọi model)', keyHint: 'sk-or-...', modelPlaceholder: 'openrouter/auto (mặc định)' },
  { id: 'anthropic', label: 'Anthropic (Claude)', keyHint: 'sk-ant-...', modelPlaceholder: 'claude-sonnet-5 (mặc định)' },
  { id: 'openai', label: 'OpenAI (GPT)', keyHint: 'sk-...', modelPlaceholder: 'gpt-4o-mini (mặc định)' },
  { id: 'custom', label: 'Custom / Local (OpenAI-compatible)', keyHint: 'không bắt buộc với local', modelPlaceholder: 'vd: llama3, mistral' },
];

interface ProvCfg { apiKey: string; model: string; baseUrl: string }
type CfgMap = Record<Provider, ProvCfg>;

const EMPTY_CFG: CfgMap = {
  gemini: { apiKey: '', model: '', baseUrl: '' },
  openrouter: { apiKey: '', model: '', baseUrl: '' },
  anthropic: { apiKey: '', model: '', baseUrl: '' },
  openai: { apiKey: '', model: '', baseUrl: '' },
  custom: { apiKey: '', model: '', baseUrl: '' },
};

interface AIDesign {
  themeName: string;
  rationale: string;
  bodyFont: string;
  headingFont: string;
  fontSize: number;
  lineHeight: number;
  colorAccent: string;
  dropCaps: boolean;
  dropCapLines: number;
  dropCapStyle: DropCapStyle;
  sceneBreakSymbol: string;
  headingGap: HeadingGap;
  chapterStartPosition: ChapterStartPosition;
  trimSize: string;
  bindingType: string;
  runningHeader: string;
}

const CFG_KEY_V2 = 'bookify_ai_designer_cfg_v2';
const CFG_KEY_V1 = 'bookify_ai_designer_cfg';

export function AIDesignerPanel() {
  const { genre } = useAppStore();

  const [provider, setProvider] = useState<Provider>('gemini');
  const [cfg, setCfg] = useState<CfgMap>(EMPTY_CFG);
  const [rememberKeys, setRememberKeys] = useState(false);
  const [autoFallback, setAutoFallback] = useState(true);
  const [brief, setBrief] = useState('');

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<AIDesign | null>(null);
  const [designVia, setDesignVia] = useState<string>('');
  const [applied, setApplied] = useState(false);

  // Restore saved config (v2 multi-provider; migrate v1 single-provider)
  useEffect(() => {
    try {
      const v2 = JSON.parse(localStorage.getItem(CFG_KEY_V2) || 'null');
      if (v2 && v2.cfg) {
        setCfg({ ...EMPTY_CFG, ...v2.cfg });
        if (v2.provider) setProvider(v2.provider);
        if (typeof v2.autoFallback === 'boolean') setAutoFallback(v2.autoFallback);
        const anyKey = Object.values(v2.cfg as CfgMap).some((c) => c && (c as ProvCfg).apiKey);
        setRememberKeys(anyKey);
        return;
      }
      const v1 = JSON.parse(localStorage.getItem(CFG_KEY_V1) || 'null');
      if (v1 && v1.provider) {
        const migrated = { ...EMPTY_CFG };
        migrated[v1.provider as Provider] = { apiKey: v1.apiKey || '', model: v1.model || '', baseUrl: v1.baseUrl || '' };
        setCfg(migrated);
        setProvider(v1.provider);
        if (v1.apiKey) setRememberKeys(true);
      }
    } catch { /* ignore corrupt config */ }
  }, []);

  function persistConfig(nextCfg: CfgMap, nextProvider: Provider, nextFallback: boolean, remember: boolean) {
    const toSave: CfgMap = JSON.parse(JSON.stringify(nextCfg));
    if (!remember) {
      (Object.keys(toSave) as Provider[]).forEach(p => { toSave[p].apiKey = ''; });
    }
    localStorage.setItem(CFG_KEY_V2, JSON.stringify({ cfg: toSave, provider: nextProvider, autoFallback: nextFallback }));
  }

  function patchCfg(p: Provider, changes: Partial<ProvCfg>) {
    setCfg(prev => ({ ...prev, [p]: { ...prev[p], ...changes } }));
  }

  const hasCreds = (p: Provider) =>
    p === 'custom' ? !!cfg.custom.baseUrl.trim() : !!cfg[p].apiKey.trim();

  const providerLabel = (p: Provider) => PROVIDERS.find(x => x.id === p)?.label.split(' (')[0] || p;

  async function requestDesign(p: Provider, sample: string, title?: string) {
    const c = cfg[p];
    const res = await fetch(`${API_URL}/ai/suggest-design`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: p,
        apiKey: c.apiKey.trim() || undefined,
        model: c.model.trim() || undefined,
        baseUrl: p === 'custom' ? c.baseUrl.trim() : undefined,
        brief: brief.trim() || undefined,
        metadata: { title, genre },
        sample,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Lỗi HTTP ${res.status}`);
    return data as { design: AIDesign; provider: string; model: string };
  }

  async function handleGenerate() {
    // Build the provider chain: selected first, then any other with a key
    const chain: Provider[] = [
      provider,
      ...PROVIDERS.map(x => x.id).filter(p => p !== provider && autoFallback && hasCreds(p)),
    ].filter(hasCreds);

    if (chain.length === 0) {
      setError('Hãy nhập API key cho ít nhất một provider (Gemini có key miễn phí tại aistudio.google.com/apikey).');
      return;
    }

    setBusy('Đang đọc bản thảo…');
    setError(null);
    setDesign(null);
    setApplied(false);
    persistConfig(cfg, provider, autoFallback, rememberKeys);

    try {
      const content = await callGas<{ html: string; metadata: { title?: string } }>('getDocumentContent');
      const sample = content.html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);

      const errors: string[] = [];
      for (const p of chain) {
        setBusy(`Đang hỏi ${providerLabel(p)}…${errors.length ? ` (thử lại lần ${errors.length + 1})` : ''}`);
        try {
          const data = await requestDesign(p, sample, content.metadata?.title);
          setDesign(data.design);
          setDesignVia(`${providerLabel(p)} · ${data.model}`);
          setBusy(null);
          return;
        } catch (err) {
          errors.push(`${providerLabel(p)}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      setError(`Tất cả provider đều lỗi:\n${errors.join('\n')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleApply() {
    if (!design) return;
    setBusy('Đang áp thiết kế vào tài liệu…');
    setError(null);
    try {
      await applyBookDesign(design);
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const providerInfo = PROVIDERS.find(p => p.id === provider)!;
  const current = cfg[provider];
  const configuredCount = PROVIDERS.filter(p => hasCreds(p.id)).length;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">AI Book Designer</h3>
          <p className="text-xs text-gray-500">Dùng API key của bạn — AI đọc bản thảo và thiết kế cả cuốn sách.</p>
        </div>
      </div>

      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-[10px] text-amber-700 leading-relaxed">
          🔑 Key chỉ được dùng để gọi thẳng đến AI provider trong từng request — không lưu trên server Bookify, không log.
          Nhập nhiều key để bật dự phòng tự động.
        </p>
      </div>

      {/* Provider selector */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-gray-500">AI Provider</label>
          {configuredCount > 0 && (
            <span className="text-[9px] font-bold text-emerald-600">{configuredCount} provider đã có key</span>
          )}
        </div>
        <select value={provider} onChange={e => { setProvider(e.target.value as Provider); setDesign(null); }} className="select-field">
          {PROVIDERS.map(p => (
            <option key={p.id} value={p.id}>
              {hasCreds(p.id) ? '✓ ' : ''}{p.label}
            </option>
          ))}
        </select>
      </div>

      {provider === 'custom' && (
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Base URL (OpenAI-compatible)</label>
          <input type="text" placeholder="http://localhost:11434/v1 (Ollama, LM Studio…)" value={current.baseUrl}
            onChange={e => patchCfg('custom', { baseUrl: e.target.value })} className="input-field" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">API Key — {providerLabel(provider)}</label>
          <input type="password" placeholder={providerInfo.keyHint} value={current.apiKey}
            onChange={e => patchCfg(provider, { apiKey: e.target.value })} className="input-field" autoComplete="off" />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Model (tùy chọn)</label>
          <input type="text" placeholder={providerInfo.modelPlaceholder} value={current.model}
            onChange={e => patchCfg(provider, { model: e.target.value })} className="input-field" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={rememberKeys} onChange={e => setRememberKeys(e.target.checked)} className="rounded" />
          <span className="text-[10px] text-gray-500">Nhớ các key trong trình duyệt này (chỉ lưu trên máy bạn)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoFallback} onChange={e => setAutoFallback(e.target.checked)} className="rounded" />
          <span className="text-[10px] text-gray-500">
            Tự động chuyển provider khác nếu lỗi <span className="text-gray-400">(thứ tự: provider đang chọn → các provider đã có key)</span>
          </span>
        </label>
      </div>

      <div>
        <label className="text-[11px] text-gray-500 block mb-1">Mô tả thiết kế mong muốn (tùy chọn)</label>
        <textarea
          rows={2}
          placeholder='vd: "Sách Phật học nhập môn, ấm áp, thanh tịnh, dễ đọc" hoặc "dark epic fantasy, ornate"'
          value={brief}
          onChange={e => setBrief(e.target.value)}
          className="input-field resize-none"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={!!busy}
        className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {busy || '✨ Tạo Thiết Kế Sách'}
      </button>

      {error && (
        <div className="p-2 rounded text-[11px] border bg-red-50 text-red-700 border-red-200 whitespace-pre-line">{error}</div>
      )}

      {/* Suggestion card */}
      {design && (
        <div className="border border-violet-200 rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-violet-800">{design.themeName}</p>
              <p className="text-[10px] text-violet-500">via {designVia}</p>
            </div>
            <span className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: design.colorAccent }} />
          </div>

          {/* Mini preview */}
          <div className="px-4 py-4 bg-white">
            <p className="text-center mb-2" style={{ fontFamily: design.headingFont, color: design.colorAccent, fontSize: '16px', fontWeight: 700 }}>
              Chương Một
            </p>
            <p className="text-[11px] text-gray-700" style={{ fontFamily: design.bodyFont, lineHeight: design.lineHeight }}>
              {design.dropCaps && (
                <span className="float-left mr-1 font-bold" style={{
                  fontSize: `${design.dropCapLines * 14}px`, lineHeight: 0.8,
                  color: design.dropCapStyle === 'classic' ? '#1a1a1a' : design.colorAccent,
                  fontFamily: design.dropCapStyle === 'ornate' ? design.headingFont : design.bodyFont,
                }}>N</span>
              )}
              gày xửa ngày xưa, ở một vương quốc bên bờ biển, có một người kể chuyện…
            </p>
            <div className="clear-both" />
            <p className="text-center text-xs mt-2" style={{ color: design.colorAccent, letterSpacing: '0.3em' }}>{design.sceneBreakSymbol}</p>
          </div>

          {/* Settings summary */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-1">
            {[
              `${design.bodyFont} ${design.fontSize}pt`,
              `Tiêu đề: ${design.headingFont}`,
              `Giãn dòng ${design.lineHeight}`,
              `Gap: ${design.headingGap}`,
              `Chương: ${design.chapterStartPosition}`,
              design.dropCaps ? `Drop cap ${design.dropCapLines}d/${design.dropCapStyle}` : 'Không drop cap',
              `${design.trimSize} ${design.bindingType}`,
              `Header: ${design.runningHeader.replace('_', '+')}`,
            ].map(chip => (
              <span key={chip} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] text-gray-500">{chip}</span>
            ))}
          </div>

          {design.rationale && (
            <p className="px-4 py-2.5 text-[10px] text-gray-500 leading-relaxed border-t border-gray-100 italic">{design.rationale}</p>
          )}

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleApply}
              disabled={!!busy || applied}
              className="w-full py-2.5 bg-bookify-600 text-white rounded-lg text-xs font-bold disabled:opacity-60 hover:bg-bookify-700 transition-colors"
            >
              {applied ? '✓ Đã áp dụng (doc đã style + thiết lập export sẵn sàng)' : busy || 'Áp Dụng Thiết Kế Này'}
            </button>
            {applied && (
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                Font &amp; màu đã áp vào Google Doc. Khổ sách, drop cap, heading gap, running header đã điền sẵn ở tab Export.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
