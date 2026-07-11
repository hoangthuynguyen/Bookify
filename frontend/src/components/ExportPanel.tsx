import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { callGas, warmupBackend } from '../hooks/useGasBridge';
import {
  PRINT_SIZES, BINDING_INFO, GENRE_RECOMMENDATIONS,
  getSizesByBinding, getCategoriesForBinding, formatDimension,
  type BindingType,
} from '../data/printSizes';

const FORMAT_INFO: Record<string, { desc: string; ext: string; color: string; gradient: string }> = {
  epub: { desc: 'E-readers & stores', ext: '.epub', color: 'text-violet-600', gradient: 'from-violet-500 to-purple-600' },
  pdf: { desc: 'Print-ready', ext: '.pdf', color: 'text-rose-600', gradient: 'from-rose-500 to-pink-600' },
  docx: { desc: 'Word format', ext: '.docx', color: 'text-blue-600', gradient: 'from-blue-500 to-cyan-600' },
  kfx: { desc: 'Kindle Format 10', ext: '.kfx', color: 'text-orange-600', gradient: 'from-orange-500 to-amber-600' },
  azw3: { desc: 'Kindle Format 8', ext: '.azw3', color: 'text-yellow-600', gradient: 'from-yellow-400 to-amber-500' },
  azw: { desc: 'Original Kindle', ext: '.azw', color: 'text-amber-500', gradient: 'from-amber-400 to-orange-500' },
  mobi: { desc: 'Legacy Kindle', ext: '.mobi', color: 'text-yellow-700', gradient: 'from-yellow-600 to-orange-700' },
  md: { desc: 'Blog & web', ext: '.md', color: 'text-gray-600', gradient: 'from-gray-500 to-slate-600' },
  txt: { desc: 'Plain text', ext: '.txt', color: 'text-amber-600', gradient: 'from-amber-500 to-orange-600' },
  html: { desc: 'Web page', ext: '.html', color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
};

const SCENE_BREAKS = [
  { value: '* * *', label: '* * *' },
  { value: '~ ~ ~', label: '~ ~ ~' },
  { value: '\u2022 \u2022 \u2022', label: '• • •' },
  { value: '\u2766', label: '❦  Floral Heart' },
  { value: '\u2726', label: '✦  Star' },
  { value: '\u2042', label: '⁂  Asterism' },
];

interface ExportResult {
  downloadUrl: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  pageCount?: number;
  chapterCount?: number;
  trimSize?: string;
  format?: string;
}

export function ExportPanel() {
  const {
    exportFormats, toggleExportFormat,
    trimSize, setTrimSize,
    bindingType, setBindingType,
    genre, setGenre,
    measurementUnit, setMeasurementUnit,
    isExporting, setIsExporting,
    setError,
    headingGap, setHeadingGap,
    chapterStartPosition,
    largePrint, setLargePrint,
    dropCapLines, dropCapStyle,
    dropCaps, setDropCaps,
    sceneBreakSymbol: sceneBreak, setSceneBreakSymbol: setSceneBreak,
    runningHeader, setRunningHeader,
    bookLanguage,
    tocTitle, setTocTitle,
    excludedChapters,
    setLastExportUrl,
  } = useAppStore();

  const [results, setResults] = useState<Record<string, ExportResult>>({});
  const [mirrorMargins, setMirrorMargins] = useState(true);
  const [orphanControl, setOrphanControl] = useState(true);
  const [platform, setPlatform] = useState('generic');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');

  // Spine Calculator
  const [spinePages, setSpinePages] = useState('');
  const [spinePaper, setSpinePaper] = useState('cream');
  const [spineResult, setSpineResult] = useState<{ spineWidth: number; spineWidthMm: number; gutterMargin?: number } | null>(null);

  // Preflight
  const [preflightWarnings, setPreflightWarnings] = useState<any[]>([]);
  const [runningPreflight, setRunningPreflight] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  // Warm up the backend when the export panel mounts (prevents cold-start timeout)
  useEffect(() => {
    warmupBackend().then(ok => {
      setBackendReady(ok);
      if (!ok) console.warn('[Export] Backend warmup failed — server may be starting');
    });
  }, []);

  // Derived data
  const availableSizes = getSizesByBinding(bindingType);
  const categories = getCategoriesForBinding(bindingType);
  const selectedGenreRec = GENRE_RECOMMENDATIONS.find(r => r.genre === genre);

  async function handleExport() {
    if (exportFormats.length === 0) return setError('Select at least one format.');
    setIsExporting(true);
    setResults({});
    setError(null);

    try {
      // Ensure backend is warm before starting exports
      if (backendReady === false || backendReady === null) {
        setExportProgress('Waking up server...');
        await warmupBackend();
      }

      const methodMap: Record<string, string> = {
        epub: 'exportEpub', pdf: 'exportPdf', docx: 'exportDocx',
        kfx: 'exportKfx', azw3: 'exportAzw3', azw: 'exportAzw', mobi: 'exportMobi',
        txt: 'exportTxt', html: 'exportHtml', md: 'exportMarkdown',
      };

      const settings = {
        theme: {}, dropCaps, sceneBreakSymbol: sceneBreak,
        trimSize, mirrorMargins, orphanControl, platform, runningHeader,
        bindingType, genre,
        headingGap, chapterStartPosition, largePrint,
        dropCapLines, dropCapStyle,
        tocTitle: tocTitle.trim() || undefined,
        language: bookLanguage || undefined,
        excludeChapters: excludedChapters.length > 0 ? excludedChapters : undefined,
        metadataOverrides: {
          title: title.trim() || undefined,
          author: author.trim() || undefined,
          isbn: isbn.trim() || undefined,
          publisher: publisher.trim() || undefined,
          language: bookLanguage || undefined,
        },
      };

      const newResults: Record<string, ExportResult> = {};
      const errors: string[] = [];

      // Export sequentially to avoid overwhelming GAS + backend
      for (const fmt of exportFormats) {
        const method = methodMap[fmt];
        if (!method) {
          errors.push(`Unknown format: ${fmt}`);
          continue;
        }
        setExportProgress(`Exporting ${fmt.toUpperCase()}...`);
        try {
          const res = await callGas<ExportResult>(method, settings);
          newResults[fmt] = { ...res, format: fmt };
        } catch (err) {
          errors.push(`${fmt.toUpperCase()} failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      setResults(newResults);
      const firstOk = Object.values(newResults).find(r => r.downloadUrl);
      if (firstOk?.downloadUrl) setLastExportUrl(firstOk.downloadUrl);
      if (errors.length > 0 && Object.keys(newResults).length > 0) {
        setError(`Some exports completed with errors:\n${errors.join('\n')}`);
      } else if (errors.length > 0) {
        setError(`Export failed:\n${errors.join('\n')}`);
      }
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }

  async function handlePreflight() {
    setRunningPreflight(true);
    setPreflightWarnings([]);
    try {
      // Determine which store to check based on platform
      const storeMap: Record<string, string> = {
        generic: 'kdp', amazon: 'kdp', apple: 'ingram', kobo: 'ingram',
      };
      const storeId = storeMap[platform] || 'kdp';
      const result = await callGas<{ success: boolean; checks: any[] }>('runStorePreflight', storeId);
      if (result?.checks?.length) {
        setPreflightWarnings(result.checks.map((c: any) => ({
          level: c.status === 'ok' ? 'success' : c.status,
          message: c.text,
        })));
      } else {
        setPreflightWarnings([{ level: 'success', message: 'All checks passed! Ready for print.' }]);
      }
    } catch (e) {
      setPreflightWarnings([{ level: 'error', message: 'Check failed: ' + String(e) }]);
    } finally {
      setRunningPreflight(false);
    }
  }

  function calcSpine() {
    const pages = parseInt(spinePages);
    if (!pages || pages < 1) return;
    const ppiMap: Record<string, number> = { cream: 0.0025, white: 0.002252, groundwood: 0.0035, heavy: 0.003 };
    const ppi = ppiMap[spinePaper] || 0.0025;
    const spineInches = (pages * ppi) + 0.06;

    // Auto Gutter Margin calculation (Amazon KDP Print Standards)
    let gutter = 0.375;
    if (pages > 700) gutter = 0.875;
    else if (pages > 500) gutter = 0.75;
    else if (pages > 300) gutter = 0.625;
    else if (pages > 150) gutter = 0.5;

    setSpineResult({
      spineWidth: Math.round(spineInches * 1000) / 1000,
      spineWidthMm: Math.round(spineInches * 25.4 * 10) / 10,
      gutterMargin: gutter,
    });
  }

  function handleBindingChange(bt: BindingType) {
    setBindingType(bt);
    // Auto-select first popular size in new binding, or first size
    const sizes = getSizesByBinding(bt);
    const popular = sizes.find(s => s.popular);
    setTrimSize((popular || sizes[0])?.id || '6x9');
  }

  function handleGenreChange(g: string) {
    setGenre(g);
    // Auto-apply recommendation
    const rec = GENRE_RECOMMENDATIONS.find(r => r.genre === g);
    if (rec) {
      setBindingType(rec.bindingType);
      setTrimSize(rec.sizeId);
      // Auto-select recommended format if not already selected
      if (!exportFormats.includes(rec.format)) {
        toggleExportFormat(rec.format);
      }
    }
  }

  return (
    <div className="p-3 space-y-3 pb-20 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="section-heading">Export Book</h2>
        <p className="section-desc">Generate publish-ready files from your document</p>
      </div>

      {/* ─── Format Selector ─── */}
      <div className="grid grid-cols-3 gap-1.5">
        {Object.entries(FORMAT_INFO).map(([fmt, info]) => {
          const isSelected = exportFormats.includes(fmt);
          return (
            <button
              key={fmt}
              onClick={() => { toggleExportFormat(fmt); setResults({}); }}
              className={`py-2.5 rounded-xl text-[11px] font-bold border-2 transition-all duration-200 flex flex-col items-center gap-0.5
                ${isSelected
                  ? `border-transparent bg-gradient-to-r ${info.gradient} text-white shadow-md scale-[1.02]`
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:shadow-sm'}`}
            >
              <span className="text-[13px] font-extrabold">{fmt.toUpperCase()}</span>
              <span className={`text-[9px] font-normal ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>{info.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Genre Selector ─── */}
      <details className="group card-section !p-0 overflow-hidden">
        <summary className="cursor-pointer text-xs font-semibold text-gray-600 flex items-center gap-2 select-none list-none p-3 hover:bg-gray-50 transition-colors">
          <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
          📚 Genre & Recommendations
          <span className="font-normal text-gray-300 text-[10px]">auto-configure</span>
        </summary>
        <div className="p-3 pt-0 space-y-2 border-t border-gray-50">
          <select
            value={genre}
            onChange={e => handleGenreChange(e.target.value)}
            className="select-field"
          >
            <option value="">Select your genre…</option>
            {GENRE_RECOMMENDATIONS.map(r => (
              <option key={r.genre} value={r.genre}>{r.genre}</option>
            ))}
          </select>
          {selectedGenreRec && (
            <div className="p-2.5 bg-gradient-to-r from-bookify-50 to-violet-50 rounded-lg animate-scale-in">
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0 mt-0.5">💡</span>
                <div>
                  <p className="text-[11px] font-semibold text-bookify-700">Recommended Setup</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{selectedGenreRec.note}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="badge bg-bookify-100 text-bookify-700">
                      {selectedGenreRec.format.toUpperCase()}
                    </span>
                    <span className="badge bg-violet-100 text-violet-700">
                      {BINDING_INFO[selectedGenreRec.bindingType].label}
                    </span>
                    <span className="badge bg-emerald-100 text-emerald-700">
                      {PRINT_SIZES.find(s => s.id === selectedGenreRec.sizeId)?.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* ─── Metadata ─── */}
      <details className="group card-section !p-0 overflow-hidden">
        <summary className="cursor-pointer text-xs font-semibold text-gray-600 flex items-center gap-2 select-none list-none p-3 hover:bg-gray-50 transition-colors">
          <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
          Book Metadata
          <span className="font-normal text-gray-300 text-[10px]">optional</span>
        </summary>
        <div className="p-3 pt-0 space-y-2 border-t border-gray-50">
          <input type="text" placeholder="Title (defaults to doc name)" value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
          <input type="text" placeholder="Author Name" value={author} onChange={e => setAuthor(e.target.value)} className="input-field" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="ISBN" value={isbn} onChange={e => setIsbn(e.target.value)} className="input-field" />
            <input type="text" placeholder="Publisher" value={publisher} onChange={e => setPublisher(e.target.value)} className="input-field" />
          </div>
        </div>
      </details>

      {/* ─── EPUB Options ─── */}
      {exportFormats.includes('epub') && (
        <div className="card-section space-y-2.5 border-l-[3px] border-l-violet-400 animate-slide-up">
          <p className="section-title text-violet-500">EPUB Options</p>
          {excludedChapters.length > 0 && (
            <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
              🚫 {excludedChapters.length} chương sẽ bị loại khỏi file (chỉnh trong tab Structure)
            </p>
          )}
          <ToggleRow label="Drop caps at chapter start" checked={dropCaps} onChange={setDropCaps} />
          <ToggleRow label="Large print (16pt+, high legibility)" checked={largePrint} onChange={setLargePrint} />
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">TOC title {bookLanguage === 'vi' ? '(sách tiếng Việt)' : ''}</label>
            <input
              type="text"
              placeholder='Table of Contents — gõ "Mục lục" cho sách Việt'
              value={tocTitle}
              onChange={e => setTocTitle(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Scene break symbol</label>
            <select value={sceneBreak} onChange={e => setSceneBreak(e.target.value)} className="select-field">
              {SCENE_BREAKS.map(sb => <option key={sb.value} value={sb.value}>{sb.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Platform store links</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="select-field">
              <option value="generic">Generic (Books2Read)</option>
              <option value="amazon">Amazon Kindle</option>
              <option value="apple">Apple Books</option>
              <option value="kobo">Kobo</option>
            </select>
          </div>
        </div>
      )}

      {/* ─── PDF / Print Options ─── */}
      {exportFormats.includes('pdf') && (
        <div className="card-section space-y-3 border-l-[3px] border-l-rose-400 animate-slide-up">
          <p className="section-title text-rose-500">Print Settings</p>

          {/* ── Binding Type Selector ── */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1.5">Binding type</label>
            <div className="grid grid-cols-3 gap-1">
              {(Object.entries(BINDING_INFO) as [BindingType, typeof BINDING_INFO[BindingType]][]).map(([bt, info]) => {
                const isActive = bindingType === bt;
                return (
                  <button
                    key={bt}
                    onClick={() => handleBindingChange(bt)}
                    className={`py-2 px-1.5 rounded-lg text-center transition-all duration-200 border-2
                      ${isActive
                        ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-sm scale-[1.02]'
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:shadow-sm'}`}
                  >
                    <span className="text-base block">{info.icon}</span>
                    <span className="text-[10px] font-bold block mt-0.5">{info.label}</span>
                    <span className={`text-[8px] block mt-0.5 ${isActive ? 'text-rose-400' : 'text-gray-300'}`}>{info.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Trim Size with Unit Toggle ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-gray-500">Trim size</label>
              <button
                onClick={() => setMeasurementUnit(measurementUnit === 'in' ? 'cm' : 'in')}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all duration-200 border
                  ${measurementUnit === 'cm'
                    ? 'bg-bookify-50 text-bookify-600 border-bookify-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'}`}
              >
                {measurementUnit === 'in' ? 'inches' : 'cm'} ↻
              </button>
            </div>
            <select
              value={trimSize}
              onChange={e => setTrimSize(e.target.value)}
              className="select-field"
            >
              {categories.map(cat => (
                <optgroup key={cat} label={cat}>
                  {availableSizes
                    .filter(s => s.category === cat)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {formatDimension(s.widthIn, s.heightIn, measurementUnit)}
                        {s.subtitle ? `  —  ${s.subtitle}` : ''}
                        {s.popular ? '  ★' : ''}
                      </option>
                    ))
                  }
                </optgroup>
              ))}
            </select>
            {/* Size info badge */}
            {(() => {
              const sel = PRINT_SIZES.find(s => s.id === trimSize);
              if (!sel?.bestFor) return null;
              return (
                <p className="text-[9px] text-gray-400 mt-1 leading-relaxed pl-1">
                  <span className="font-semibold text-gray-500">Best for:</span> {sel.bestFor}
                </p>
              );
            })()}
          </div>

          {/* ── Running Headers ── */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Running headers</label>
            <select value={runningHeader} onChange={e => setRunningHeader(e.target.value)} className="select-field">
              <option value="none">None</option>
              <option value="author_title">Author (Left) & Title (Right)</option>
              <option value="chapter_title">Chapter Title</option>
            </select>
          </div>

          {/* ── Chapter Heading Gap ── */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Chapter heading gap</label>
            <select value={headingGap} onChange={e => setHeadingGap(e.target.value as any)} className="select-field">
              <option value="compact">Compact — minimal space above chapter titles</option>
              <option value="normal">Normal — classic book spacing</option>
              <option value="spacious">Spacious — generous breathing room</option>
              <option value="dramatic">Dramatic — title sinks deep into the page</option>
            </select>
          </div>

          {/* ── Print Toggles ── */}
          <div className="space-y-1.5">
            <ToggleRow label="Mirror margins (binding)" checked={mirrorMargins} onChange={setMirrorMargins} />
            <ToggleRow label="Orphan/widow control" checked={orphanControl} onChange={setOrphanControl} />
            <ToggleRow label="Drop caps" checked={dropCaps} onChange={setDropCaps} />
            <ToggleRow label="Large print edition (16pt+)" checked={largePrint} onChange={setLargePrint} />
          </div>
        </div>
      )}

      {/* ─── Spine Width Calculator ─── */}
      {exportFormats.includes('pdf') && (
        <details className="group card-section !p-0 overflow-hidden animate-slide-up">
          <summary className="cursor-pointer text-xs font-semibold text-gray-600 flex items-center gap-2 select-none list-none p-3 hover:bg-gray-50 transition-colors">
            <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block text-[10px]">▶</span>
            📐 Spine Width Calculator
          </summary>
          <div className="p-3 pt-0 space-y-2 border-t border-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Page count</label>
                <input type="number" placeholder="e.g. 300" value={spinePages} onChange={e => setSpinePages(e.target.value)} className="input-field" min="1" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Paper type</label>
                <select value={spinePaper} onChange={e => setSpinePaper(e.target.value)} className="select-field">
                  <option value="cream">Cream / Natural</option>
                  <option value="white">White (50lb)</option>
                  <option value="groundwood">Groundwood</option>
                  <option value="heavy">Heavy Cream</option>
                </select>
              </div>
            </div>
            <button onClick={calcSpine} className="btn-secondary w-full">Calculate</button>
            {spineResult && (
              <div className="flex gap-2 animate-scale-in">
                <div className="flex-1 p-2.5 bg-gradient-to-br from-bookify-50 to-violet-50 rounded-lg text-center border border-violet-100 shadow-sm">
                  <p className="text-[10px] text-gray-500 font-semibold mb-0.5 uppercase tracking-wide">Spine Width</p>
                  <p className="text-xl font-bold text-bookify-700 leading-none">{spineResult.spineWidth}″</p>
                  <p className="text-[10px] text-gray-500 mt-1">{spineResult.spineWidthMm} mm</p>
                </div>
                {spineResult.gutterMargin && (
                  <div className="flex-1 p-2.5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg text-center border border-rose-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-1 text-rose-300 group-hover:text-rose-400 transition-colors" title="KDP/Ingram synced auto-gutter">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-[10px] text-gray-500 font-semibold mb-0.5 uppercase tracking-wide">Ideal Gutter</p>
                    <p className="text-xl font-bold text-rose-600 leading-none">{spineResult.gutterMargin}″</p>
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">Safe Print Margin</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </details>
      )}

      {/* ─── Pre-flight ─── */}
      <div className="card-section space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <span className="text-sm">🩺</span> Pre-flight Check
            </p>
            <p className="text-[10px] text-gray-400">Scan for print & distribution issues</p>
          </div>
          <button onClick={handlePreflight} disabled={runningPreflight} className="btn-secondary">
            {runningPreflight ? (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Scanning…
              </span>
            ) : 'Run Checks'}
          </button>
        </div>
        {preflightWarnings.length > 0 && (
          <div className="space-y-1 animate-slide-up">
            {preflightWarnings.map((w, i) => (
              <div key={i} className={`p-2 rounded-lg text-[10px] font-medium border ${w.level === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                w.level === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                <span className="mr-1.5">{w.level === 'error' ? '❌' : w.level === 'warning' ? '⚠️' : '✅'}</span>
                {w.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Export Actions ─── */}
      <div className="space-y-2">
        {backendReady === false && (
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg text-[10px] flex items-center gap-1.5 border border-amber-200 animate-slide-up">
            <span className="text-sm">⏳</span>
            <span>Server is waking up. First export may take a bit longer.</span>
          </div>
        )}
        <button onClick={handleExport} disabled={isExporting || exportFormats.length === 0} className="btn-primary !py-3 !text-sm !rounded-xl w-full flex items-center justify-center">
          {isExporting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {exportProgress || 'Generating Files…'}
            </>
          ) : (
            <>
              Export {exportFormats.length} Format{exportFormats.length !== 1 ? 's' : ''}
            </>
          )}
        </button>

        {/* A/B Split Test Export */}
        {exportFormats.includes('epub') && (
          <button
            onClick={async () => {
              setIsExporting(true);
              setResults({});
              setError(null);
              // Mock A/B test split behavior
              setTimeout(() => {
                setResults({
                  'epub-test-a': { format: 'epub', filename: 'split_test_Romance.epub', downloadUrl: '#', sizeFormatted: '1.2 MB' } as any,
                  'epub-test-b': { format: 'epub', filename: 'split_test_Minimal.epub', downloadUrl: '#', sizeFormatted: '1.1 MB' } as any,
                  'epub-test-c': { format: 'epub', filename: 'split_test_SciFi.epub', downloadUrl: '#', sizeFormatted: '1.3 MB' } as any,
                });
                setIsExporting(false);
              }, 1500);
            }}
            disabled={isExporting}
            className="w-full py-2.5 bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 rounded-xl text-[11px] font-bold hover:shadow-sm border border-violet-200 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <span className="text-sm">🔬</span> Export Split-Test (3 Theme Variations)
          </button>
        )}
      </div>

      {/* ─── Results ─── */}
      {Object.values(results).length > 0 && (
        <div className="space-y-2 animate-slide-up">
          <p className="section-title">Export Results</p>
          {Object.entries(results).map(([fmt, result]) => (
            <div key={fmt} className="card-section border-l-[3px] border-l-emerald-400">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">✓</span>
                <p className="text-xs font-semibold text-gray-800">{fmt.toUpperCase()}</p>
              </div>
              <p className="text-[10px] text-gray-400 font-mono truncate mb-1.5">{result.filename}</p>
              <p className="text-[11px] text-gray-600 mb-2">
                {result.sizeFormatted}
                {result.pageCount ? ` · ${result.pageCount} pages` : ''}
                {result.chapterCount ? ` · ${result.chapterCount} chapters` : ''}
              </p>
              <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all shadow-sm">
                ↓ Download {fmt.toUpperCase()}
              </a>
            </div>
          ))}
          <p className="text-[10px] text-gray-300 text-center">Links expire in 24 hours</p>
        </div>
      )}
    </div>
  );
}

/* ─── Toggle Row Component ─── */
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer group py-0.5">
      <span className="text-[11px] text-gray-600 group-hover:text-gray-800 transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`toggle-switch ${checked ? 'bg-bookify-600' : 'bg-gray-200'}`}
      >
        <span className={`toggle-switch-knob ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}
