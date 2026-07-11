import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

const FONTS = ['Georgia', 'EB Garamond', 'Merriweather', 'Lora', 'PT Serif', 'Crimson Text', 'Roboto', 'Open Sans', 'Lato', 'Cinzel', 'Great Vibes', 'Oswald', 'Montserrat', 'Playfair Display'];
const SIZES = ['10pt', '10.5pt', '11pt', '11.5pt', '12pt', '13pt', '14pt'];

interface ThemePresetI {
  id: string;
  name: string;
  genre: string;
  bodyFont: string;
  headingFont: string;
  fontSize: string;
  lineHeight: number;
  colorAccent: string;
  dropCaps: boolean;
  sceneBreakSymbol: string;
  description?: string;
  bestFor?: string;
}

const API_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL || 'https://bookify-ixxa.onrender.com';

const FALLBACK_THEMES: ThemePresetI[] = [
  {
    id: 't1',
    name: 'Vellum Classic',
    genre: 'Literary Fiction / Memoir',
    bodyFont: 'Georgia',
    headingFont: 'Cinzel',
    fontSize: '11pt',
    lineHeight: 1.6,
    colorAccent: '#333333',
    dropCaps: true,
    sceneBreakSymbol: '* * *',
    description: 'Timeless serif typography inspired by traditional book design. Cinzel headings evoke classical elegance while Georgia body text ensures excellent readability on all devices.',
    bestFor: 'Literary fiction, memoirs, autobiographies, and historical novels.',
  },
  {
    id: 't2',
    name: 'Romance Script',
    genre: 'Romance / Women\'s Fiction',
    bodyFont: 'Lora',
    headingFont: 'Great Vibes',
    fontSize: '11pt',
    lineHeight: 1.6,
    colorAccent: '#be185d',
    dropCaps: true,
    sceneBreakSymbol: '♡ ♡ ♡',
    description: 'Romantic script headings with elegant Lora body text. The pink accent color and heart scene breaks add a soft, romantic feel throughout.',
    bestFor: 'Romance novels, chick-lit, women\'s fiction, and love stories.',
  },
  {
    id: 't3',
    name: 'Sci-Fi Minimal',
    genre: 'Sci-Fi / Thriller / Modern',
    bodyFont: 'Lato',
    headingFont: 'Oswald',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    colorAccent: '#0ea5e9',
    dropCaps: false,
    sceneBreakSymbol: '- - -',
    description: 'Clean, modern sans-serif design with tight line spacing. The blue accent and minimalist dashes create a high-tech, contemporary atmosphere.',
    bestFor: 'Science fiction, thrillers, techno-thrillers, and contemporary fiction.',
  },
  {
    id: 't4',
    name: 'Epic Fantasy',
    genre: 'Fantasy / Historical',
    bodyFont: 'EB Garamond',
    headingFont: 'Merriweather',
    fontSize: '11.5pt',
    lineHeight: 1.5,
    colorAccent: '#6b21a8',
    dropCaps: true,
    sceneBreakSymbol: '✦ ✦ ✦',
    description: 'Rich, ornate typography with EB Garamond body text that evokes medieval manuscripts. Purple accents and star scene breaks add a magical, epic quality.',
    bestFor: 'Epic fantasy, high fantasy, sword & sorcery, and historical fantasy.',
  },
  {
    id: 't5',
    name: 'Clean Non-Fiction',
    genre: 'Business / Self-Help',
    bodyFont: 'PT Serif',
    headingFont: 'Montserrat',
    fontSize: '11pt',
    lineHeight: 1.6,
    colorAccent: '#0f766e',
    dropCaps: false,
    sceneBreakSymbol: '• • •',
    description: 'Professional, authoritative design pairing sans-serif Montserrat headings with PT Serif body text. The teal accent conveys trust and expertise.',
    bestFor: 'Business books, self-help, how-to guides, and professional development.',
  },
  {
    id: 't6',
    name: 'Children\'s Bright',
    genre: 'Children\'s / Middle Grade',
    bodyFont: 'Open Sans',
    headingFont: 'Playfair Display',
    fontSize: '13pt',
    lineHeight: 1.7,
    colorAccent: '#ea580c',
    dropCaps: true,
    sceneBreakSymbol: '✿ ✿ ✿',
    description: 'Larger font size with generous spacing for younger readers. Playful headings and warm orange accents create an inviting, engaging reading experience.',
    bestFor: 'Children\'s chapter books, middle grade fiction, and illustrated stories.',
  },
  {
    id: 't7',
    name: 'Horror Gothic',
    genre: 'Horror / Dark Fiction',
    bodyFont: 'Crimson Text',
    headingFont: 'Cinzel',
    fontSize: '11pt',
    lineHeight: 1.55,
    colorAccent: '#7f1d1d',
    dropCaps: true,
    sceneBreakSymbol: '† † †',
    description: 'Dark, atmospheric typography with deep red accents. Crimson Text body and Cinzel headings evoke gothic horror aesthetics and classic horror novels.',
    bestFor: 'Horror, gothic fiction, dark fantasy, and supernatural thrillers.',
  },
  {
    id: 't8',
    name: 'Academic',
    genre: 'Academic / Textbook',
    bodyFont: 'Roboto',
    headingFont: 'Montserrat',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    colorAccent: '#1e40af',
    dropCaps: false,
    sceneBreakSymbol: '• • •',
    description: 'Clean, structured layout ideal for academic writing. Sans-serif fonts ensure clarity while the blue accent adds a scholarly, professional tone.',
    bestFor: 'Academic texts, textbooks, research papers, and educational materials.',
  },
];

export function ThemePanel() {
  const [themes, setThemes] = useState<ThemePresetI[]>([]);
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [customTheme, setCustomTheme] = useState({
    name: 'Custom Theme',
    bodyFont: 'Georgia',
    headingFont: 'Georgia',
    fontSize: '11pt',
    lineHeight: 1.6,
    colorAccent: '#333333',
    dropCaps: false,
    sceneBreakSymbol: '* * *',
  });

  useEffect(() => { fetchThemes(); }, []);

  async function fetchThemes() {
    setLoading(true);
    let remoteThemes = FALLBACK_THEMES;
    try {
      const res = await fetch(`${API_URL}/themes/presets`);
      if (res.ok) {
        const data = await res.json();
        if (data.themes && data.themes.length > 0) {
          remoteThemes = data.themes;
        }
      }
    } catch {
      // stay with FALLBACK_THEMES
    }

    try {
      const localStr = localStorage.getItem('bookify_custom_themes');
      const localThemes = localStr ? JSON.parse(localStr) : [];
      setThemes([...remoteThemes, ...localThemes]);
    } catch {
      setThemes(remoteThemes);
    }

    setLoading(false);
  }

  async function handleEpubUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setStatus(null);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      await zip.loadAsync(file);

      let fullCss = '';
      for (const [path, zipObj] of Object.entries(zip.files)) {
        if (path.endsWith('.css') && !zipObj.dir) {
          fullCss += await zipObj.async('text') + '\n';
        }
      }

      if (!fullCss) throw new Error('No CSS styles found in this EPUB');

      // Heuristics to find colors and fonts
      const colorMatch = fullCss.match(/color\s*:\s*(#[0-9a-fA-F]{3,6})/);
      const colorAccent = colorMatch ? colorMatch[1] : customTheme.colorAccent;

      const fontsFound = [...fullCss.matchAll(/font-family\s*:\s*([^;\}]+)/g)].map(m => m[1].replace(/['"]/g, '').split(',')[0].trim());

      let bodyFont = customTheme.bodyFont;
      let headingFont = customTheme.headingFont;

      if (fontsFound.length > 0) {
        const uniqueFonts = [...new Set(fontsFound)];
        headingFont = uniqueFonts[0] || headingFont;
        bodyFont = uniqueFonts.length > 1 ? uniqueFonts[1] : (uniqueFonts[0] || bodyFont);
      }

      const safeHeading = FONTS.find(f => f.toLowerCase() === headingFont.toLowerCase()) || 'Georgia';
      const safeBody = FONTS.find(f => f.toLowerCase() === bodyFont.toLowerCase()) || 'Georgia';

      setCustomTheme({
        ...customTheme,
        name: file.name.replace(/\.epub$/i, ' Theme'),
        colorAccent: colorAccent.length === 4 || colorAccent.length === 7 ? colorAccent : '#333333',
        headingFont: safeHeading,
        bodyFont: safeBody,
      });

      setStatus({ text: 'Extracted typography from EPUB!', ok: true });
    } catch (err) {
      setStatus({ text: `Failed to extract: ${err instanceof Error ? err.message : String(err)}`, ok: false });
    } finally {
      setExtracting(false);
      e.target.value = '';
    }
  }

  function handleSavePreset() {
    const isEditing = !!editingId;
    const newId = isEditing ? editingId : 'custom-' + Date.now();
    const newTheme: ThemePresetI = { ...customTheme, id: newId, genre: 'Imported / Custom' } as ThemePresetI;

    // Save to localStorage
    const localStr = localStorage.getItem('bookify_custom_themes');
    let existing = localStr ? JSON.parse(localStr) : [];

    if (isEditing) {
      existing = existing.map((t: ThemePresetI) => t.id === newId ? newTheme : t);
    } else {
      existing = [...existing, newTheme];
    }

    localStorage.setItem('bookify_custom_themes', JSON.stringify(existing));

    // Update State
    if (isEditing) {
      setThemes(themes.map(t => t.id === newId ? newTheme : t));
    } else {
      setThemes([...themes, newTheme]);
    }
    setTab('presets');
    setSelectedId(newId);
    setEditingId(null);
    setStatus({ text: `"${newTheme.name}" saved!`, ok: true });
  }

  function handleDeleteCustom(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom theme?')) return;

    const localStr = localStorage.getItem('bookify_custom_themes');
    const existing = localStr ? JSON.parse(localStr).filter((t: ThemePresetI) => t.id !== id) : [];
    localStorage.setItem('bookify_custom_themes', JSON.stringify(existing));

    setThemes(themes.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handleMoveCustom(id: string, direction: 'up' | 'down', e: React.MouseEvent) {
    e.stopPropagation();
    const localStr = localStorage.getItem('bookify_custom_themes');
    if (!localStr) return;
    let existing: ThemePresetI[] = JSON.parse(localStr);

    const idx = existing.findIndex(t => t.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) {
      [existing[idx - 1], existing[idx]] = [existing[idx], existing[idx - 1]];
    } else if (direction === 'down' && idx < existing.length - 1) {
      [existing[idx], existing[idx + 1]] = [existing[idx + 1], existing[idx]];
    } else {
      return;
    }

    localStorage.setItem('bookify_custom_themes', JSON.stringify(existing));

    const remoteThemes = themes.filter(t => !t.id.startsWith('custom-'));
    setThemes([...remoteThemes, ...existing]);
  }

  async function handleApplyTheme(theme: ThemePresetI) {
    setApplying(true);
    setStatus(null);
    try {
      // Apply typography and font styles to the document
      await callGas<{ success: boolean; appliedTheme: string }>('applyTheme', {
        name: theme.name,
        bodyFont: theme.bodyFont,
        headingFont: theme.headingFont,
        fontSize: theme.fontSize,
        lineHeight: theme.lineHeight,
        colorAccent: theme.colorAccent,
        dropCaps: theme.dropCaps,
        sceneBreakSymbol: theme.sceneBreakSymbol,
      });

      // Also apply scene break style if theme has one
      if (theme.sceneBreakSymbol) {
        try {
          await callGas('applySceneBreakStyle', theme.sceneBreakSymbol);
        } catch {
          // Scene break update is optional — don't fail the whole operation
        }
      }

      setSelectedId(theme.id);
      setStatus({
        text: `✅ Theme "${theme.name}" applied! Font: ${theme.bodyFont}, Headings: ${theme.headingFont}, Size: ${theme.fontSize}`,
        ok: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Google Apps Script not available')) {
        setStatus({
          text: '⚠️ Theme cannot be applied outside Google Docs. Open this sidebar from within Google Docs to apply themes.',
          ok: false,
        });
      } else {
        setStatus({ text: `❌ Error applying theme: ${errorMessage}`, ok: false });
      }
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        <div className="section-heading mb-2">Book Themes</div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-white">
        <h2 className="section-heading mb-0.5">Book Themes</h2>
        <p className="section-desc mb-2">Style your book with professional typography</p>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setTab('presets')}
            className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
              ${tab === 'presets' ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🎨 Presets
          </button>
          <button
            onClick={() => {
              setTab('custom');
              setEditingId(null);
              setCustomTheme({ name: 'Custom Theme', bodyFont: 'Georgia', headingFont: 'Georgia', fontSize: '11pt', lineHeight: 1.6, colorAccent: '#333333', dropCaps: false, sceneBreakSymbol: '* * *' });
            }}
            className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
              ${tab === 'custom' ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ⚙️ Custom
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mx-3 mt-2 px-2.5 py-2 rounded-xl text-[11px] flex items-center gap-2 animate-slide-down
          ${status.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          <span className={`w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold ${status.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>{status.ok ? '✓' : '!'}</span>
          <span className="flex-1">{status.text}</span>
          <button onClick={() => setStatus(null)} className="text-gray-300 hover:text-gray-500 text-sm font-bold">×</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-20">
        {tab === 'presets' && (
          <>
            {themes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500">No themes loaded.</p>
                <p className="text-[11px] text-gray-400 mt-1">Check your API connection.</p>
                <button onClick={fetchThemes} className="mt-3 text-xs text-bookify-600 hover:underline">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-gray-400">{themes.length} preset themes for different genres</p>
                <div className="space-y-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleApplyTheme(theme)}
                      disabled={applying}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all hover:shadow-card-hover disabled:opacity-50 group
                        ${selectedId === theme.id
                          ? 'border-bookify-400 bg-bookify-50/50 ring-1 ring-bookify-200'
                          : 'border-gray-100 bg-white hover:border-bookify-200'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-800 truncate">{theme.name}</p>
                            {selectedId === theme.id && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-bookify-100 text-bookify-700 rounded-full font-medium flex-shrink-0">
                                Applied
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{theme.genre}</p>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ring-1 ring-black/10"
                          style={{ backgroundColor: theme.colorAccent }}
                        />
                      </div>

                      {/* Font info */}
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
                        <span>{theme.bodyFont}</span>
                        <span>{theme.fontSize}</span>
                        <span>{theme.lineHeight}× spacing</span>
                        {theme.dropCaps && <span className="text-bookify-500">Drop caps</span>}
                        <span title="Scene break symbol">Break: {theme.sceneBreakSymbol}</span>
                      </div>

                      {/* Description & Best For */}
                      {theme.description && (
                        <p className="mt-1.5 text-[9px] text-gray-400 leading-relaxed">{theme.description}</p>
                      )}
                      {theme.bestFor && (
                        <p className="mt-1 text-[9px] text-emerald-600 font-medium">✦ Best for: {theme.bestFor}</p>
                      )}

                      {/* Mini preview */}
                      <div
                        className="mt-2 p-2 bg-gray-50 rounded text-[10px] leading-relaxed border border-gray-100"
                        style={{ fontFamily: `"${theme.bodyFont}", serif` }}
                      >
                        <p style={{ color: theme.colorAccent, fontWeight: 700, fontSize: '11px', textAlign: 'center', letterSpacing: '0.05em', fontFamily: `"${theme.headingFont}", serif` }}>
                          Chapter One
                        </p>
                        <p className="mt-1 text-gray-600 line-clamp-2">
                          The morning sun cast long shadows as she walked down the cobblestone path...
                        </p>
                      </div>

                      {/* Custom Theme Actions */}
                      {theme.id.startsWith('custom-') && (
                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100/50">
                          <button onClick={(e) => handleMoveCustom(theme.id, 'up', e)} className="px-2 py-0.5 hover:bg-gray-100 rounded text-[10px] text-gray-500 hover:text-gray-800 transition-colors bg-white border border-gray-200" title="Move Up">↑</button>
                          <button onClick={(e) => handleMoveCustom(theme.id, 'down', e)} className="px-2 py-0.5 hover:bg-gray-100 rounded text-[10px] text-gray-500 hover:text-gray-800 transition-colors bg-white border border-gray-200" title="Move Down">↓</button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(theme.id); setCustomTheme({ name: theme.name, bodyFont: theme.bodyFont, headingFont: theme.headingFont, fontSize: theme.fontSize, lineHeight: theme.lineHeight, colorAccent: theme.colorAccent, dropCaps: theme.dropCaps, sceneBreakSymbol: theme.sceneBreakSymbol }); setTab('custom'); }} className="px-2 py-1 ml-1 hover:bg-blue-50 text-blue-500 rounded text-[10px] font-bold transition-colors">Edit</button>
                          <button onClick={(e) => handleDeleteCustom(theme.id, e)} className="px-2 py-1 hover:bg-red-50 text-red-500 rounded text-[10px] font-bold transition-colors">Delete</button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'custom' && (
          <div className="space-y-3">
            {/* Extract from EPUB */}
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-indigo-500 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-bold text-indigo-800">Extract from EPUB</h4>
                  <p className="text-[10px] text-indigo-600/80 mb-2">Upload a For Dummies, Lonely Planet, or any EPUB file to extract its typography and colors.</p>

                  <label className="relative overflow-hidden cursor-pointer inline-flex items-center justify-center w-full px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition shadow-sm">
                    {extracting ? 'Extracting Theme...' : 'Choose EPUB File'}
                    <input
                      type="file"
                      accept=".epub"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleEpubUpload}
                      disabled={extracting}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div
              className="p-3 rounded-lg border border-gray-200"
              style={{
                fontFamily: `"${customTheme.bodyFont}", serif`,
                lineHeight: customTheme.lineHeight,
              }}
            >
              <p style={{ color: customTheme.colorAccent, fontFamily: `"${customTheme.headingFont}", serif`, fontWeight: 700, textAlign: 'center', fontSize: '13px', marginBottom: '6px' }}>
                Chapter One
              </p>
              <p className="text-gray-600 text-[11px]">
                The quick brown fox jumps over the lazy dog. In the beginning there was darkness and silence across the land.
              </p>
            </div>

            {/* Body Font */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Body Font</label>
              <select
                value={customTheme.bodyFont}
                onChange={e => setCustomTheme({ ...customTheme, bodyFont: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Heading Font */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Heading Font</label>
              <select
                value={customTheme.headingFont}
                onChange={e => setCustomTheme({ ...customTheme, headingFont: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Size + Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Size</label>
                <select
                  value={customTheme.fontSize}
                  onChange={e => setCustomTheme({ ...customTheme, fontSize: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Spacing</label>
                <select
                  value={customTheme.lineHeight}
                  onChange={e => setCustomTheme({ ...customTheme, lineHeight: Number(e.target.value) })}
                  className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
                >
                  <option value={1.2}>1.2×</option>
                  <option value={1.4}>1.4×</option>
                  <option value={1.5}>1.5×</option>
                  <option value={1.6}>1.6×</option>
                  <option value={1.8}>1.8×</option>
                </select>
              </div>
            </div>

            {/* Accent Color & Theme Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Accent Color</label>
                <div className="flex gap-2 mt-1 items-center">
                  <input
                    type="color"
                    value={customTheme.colorAccent}
                    onChange={e => setCustomTheme({ ...customTheme, colorAccent: e.target.value })}
                    className="h-8 w-10 rounded cursor-pointer border border-gray-200 p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={customTheme.colorAccent}
                    onChange={e => setCustomTheme({ ...customTheme, colorAccent: e.target.value })}
                    className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-bookify-400"
                    placeholder="#333333"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Theme Name</label>
                <input
                  type="text"
                  value={customTheme.name}
                  onChange={e => setCustomTheme({ ...customTheme, name: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400"
                  placeholder="My Theme"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => handleApplyTheme(customTheme as ThemePresetI)}
                disabled={applying}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {applying ? 'Applying...' : 'Apply Once'}
              </button>
              <button
                onClick={handleSavePreset}
                disabled={applying || extracting}
                className="flex-1 py-2 bg-bookify-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-bookify-700 transition-colors disabled:opacity-50"
              >
                {editingId ? 'Save Changes' : 'Save as Preset'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
