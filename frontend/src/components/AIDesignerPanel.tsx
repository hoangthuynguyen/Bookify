import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';
import { useAppStore } from '../store/appStore';
import type { HeadingGap, ChapterStartPosition, DropCapStyle } from '../store/appStore';

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || 'https://bookify-ixxa.onrender.com';

type Provider = 'anthropic' | 'openai' | 'gemini' | 'custom';

const PROVIDERS: { id: Provider; label: string; keyHint: string; modelPlaceholder: string }[] = [
  { id: 'anthropic', label: 'Anthropic (Claude)', keyHint: 'sk-ant-...', modelPlaceholder: 'claude-sonnet-5 (default)' },
  { id: 'openai', label: 'OpenAI (GPT)', keyHint: 'sk-...', modelPlaceholder: 'gpt-4o-mini (default)' },
  { id: 'gemini', label: 'Google (Gemini)', keyHint: 'AIza...', modelPlaceholder: 'gemini-2.0-flash (default)' },
  { id: 'custom', label: 'Custom / Local (OpenAI-compatible)', keyHint: 'optional for local models', modelPlaceholder: 'e.g. llama3, mistral' },
];

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

const CFG_KEY = 'bookify_ai_designer_cfg';

export function AIDesignerPanel() {
  const {
    genre,
    setHeadingGap, setChapterStartPosition,
    setDropCapLines, setDropCapStyle, setDropCaps,
    setSceneBreakSymbol, setRunningHeader,
    setTrimSize, setBindingType,
  } = useAppStore();

  const [provider, setProvider] = useState<Provider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [brief, setBrief] = useState('');

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [design, setDesign] = useState<AIDesign | null>(null);
  const [applied, setApplied] = useState(false);

  // Restore saved config (key only restored if user opted in earlier)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
      if (saved) {
        if (saved.provider) setProvider(saved.provider);
        if (saved.model) setModel(saved.model);
        if (saved.baseUrl) setBaseUrl(saved.baseUrl);
        if (saved.apiKey) { setApiKey(saved.apiKey); setRememberKey(true); }
      }
    } catch { /* ignore corrupt config */ }
  }, []);

  function persistConfig() {
    const cfg: Record<string, string> = { provider, model, baseUrl };
    if (rememberKey && apiKey) cfg.apiKey = apiKey;
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  }

  async function handleGenerate() {
    if (!apiKey && provider !== 'custom') {
      setError('Please enter your API key.');
      return;
    }
    setBusy('Reading your document…');
    setError(null);
    setDesign(null);
    setApplied(false);
    persistConfig();

    try {
      const content = await callGas<{ html: string; metadata: { title?: string } }>('getDocumentContent');
      // Plain-text sample for the model (strip tags, collapse whitespace)
      const sample = content.html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);

      setBusy('Asking the AI designer…');
      const res = await fetch(`${API_URL}/ai/suggest-design`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          model: model.trim() || undefined,
          baseUrl: provider === 'custom' ? baseUrl.trim() : undefined,
          brief: brief.trim() || undefined,
          metadata: { title: content.metadata?.title, genre },
          sample,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (HTTP ${res.status})`);
      setDesign(data.design);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleApply() {
    if (!design) return;
    setBusy('Applying design to your document…');
    setError(null);
    try {
      // 1. Document-level theme via Apps Script
      await callGas('applyTheme', {
        bodyFont: design.bodyFont,
        headingFont: design.headingFont,
        fontSize: `${design.fontSize}pt`,
        lineHeight: design.lineHeight,
        colorAccent: design.colorAccent,
      });
      await callGas('applySceneBreakStyle', design.sceneBreakSymbol).catch(() => { /* no scene breaks yet is fine */ });

      // 2. Export/design settings into the shared store
      setHeadingGap(design.headingGap);
      setChapterStartPosition(design.chapterStartPosition);
      setDropCaps(design.dropCaps);
      setDropCapLines(design.dropCapLines);
      setDropCapStyle(design.dropCapStyle);
      setSceneBreakSymbol(design.sceneBreakSymbol);
      setRunningHeader(design.runningHeader);
      setTrimSize(design.trimSize);
      setBindingType(design.bindingType as 'paperback' | 'hardcover' | 'spiral');

      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const providerInfo = PROVIDERS.find(p => p.id === provider)!;

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
          <p className="text-xs text-gray-500">Bring your own LLM API key — the AI reads your manuscript and designs the whole book.</p>
        </div>
      </div>

      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-[10px] text-amber-700 leading-relaxed">
          🔑 Your key is sent only with this request to call your chosen AI provider. It is never stored on Bookify servers or logged.
        </p>
      </div>

      {/* Provider + model */}
      <div>
        <label className="text-[11px] text-gray-500 block mb-1">AI Provider</label>
        <select value={provider} onChange={e => { setProvider(e.target.value as Provider); setDesign(null); }} className="select-field">
          {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {provider === 'custom' && (
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Base URL (OpenAI-compatible)</label>
          <input type="text" placeholder="https://openrouter.ai/api/v1  or  http://localhost:11434/v1" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="input-field" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">API Key</label>
          <input type="password" placeholder={providerInfo.keyHint} value={apiKey} onChange={e => setApiKey(e.target.value)} className="input-field" autoComplete="off" />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 block mb-1">Model (optional)</label>
          <input type="text" placeholder={providerInfo.modelPlaceholder} value={model} onChange={e => setModel(e.target.value)} className="input-field" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={rememberKey} onChange={e => setRememberKey(e.target.checked)} className="rounded" />
        <span className="text-[10px] text-gray-500">Remember key in this browser (stored locally, only on this device)</span>
      </label>

      <div>
        <label className="text-[11px] text-gray-500 block mb-1">Design brief (optional)</label>
        <textarea
          rows={2}
          placeholder='e.g. "dark epic fantasy, ornate and dramatic" or "sách thiếu nhi, vui tươi, chữ to dễ đọc"'
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
        {busy || '✨ Generate Book Design'}
      </button>

      {error && (
        <div className="p-2 rounded text-[11px] border bg-red-50 text-red-700 border-red-200">{error}</div>
      )}

      {/* Suggestion card */}
      {design && (
        <div className="border border-violet-200 rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-violet-800">{design.themeName}</p>
              <p className="text-[10px] text-violet-500">AI-suggested interior design</p>
            </div>
            <span className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: design.colorAccent }} />
          </div>

          {/* Mini preview */}
          <div className="px-4 py-4 bg-white">
            <p className="text-center mb-2" style={{ fontFamily: design.headingFont, color: design.colorAccent, fontSize: '16px', fontWeight: 700 }}>
              Chapter One
            </p>
            <p className="text-[11px] text-gray-700" style={{ fontFamily: design.bodyFont, lineHeight: design.lineHeight }}>
              {design.dropCaps && (
                <span className="float-left mr-1 font-bold" style={{
                  fontSize: `${design.dropCapLines * 14}px`, lineHeight: 0.8,
                  color: design.dropCapStyle === 'classic' ? '#1a1a1a' : design.colorAccent,
                  fontFamily: design.dropCapStyle === 'ornate' ? design.headingFont : design.bodyFont,
                }}>T</span>
              )}
              he morning sun cast long shadows across the valley as she made her way down the winding path.
            </p>
            <div className="clear-both" />
            <p className="text-center text-xs mt-2" style={{ color: design.colorAccent, letterSpacing: '0.3em' }}>{design.sceneBreakSymbol}</p>
          </div>

          {/* Settings summary */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-1">
            {[
              `${design.bodyFont} ${design.fontSize}pt`,
              `Headings: ${design.headingFont}`,
              `Line ${design.lineHeight}`,
              `Gap: ${design.headingGap}`,
              `Chapter: ${design.chapterStartPosition}`,
              design.dropCaps ? `Drop cap ${design.dropCapLines}L/${design.dropCapStyle}` : 'No drop caps',
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
              {applied ? '✓ Design Applied (doc styled + export settings set)' : busy || 'Apply This Design'}
            </button>
            {applied && (
              <p className="text-[10px] text-gray-400 mt-1.5 text-center">
                Fonts &amp; colors applied to your Google Doc. Trim size, drop caps, heading gap and running header are pre-filled in the Export tab.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
