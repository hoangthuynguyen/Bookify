import { useState, useEffect } from 'react';
import { callGas } from './hooks/useGasBridge';
import { DEVICES, CATEGORY_LABELS, THEME_PRESETS, DeviceProfile, ThemePreset } from './data/previewConfig';

export function FullscreenPreviewApp() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceProfile>(DEVICES[0]);
  const [previewFontSize, setPreviewFontSize] = useState(14);
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('eink');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showMargins, setShowMargins] = useState(true);

  // Fetch actual document content for preview
  const loadPreviewContent = async () => {
    setLoadingContent(true);
    try {
      const result = await callGas<{ html: string }>('getDocumentContent');
      if (result?.html) {
        setPreviewContent(result.html);
      }
    } catch {
      // Silently fail — use sample text
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    loadPreviewContent();
  }, []);

  // Device dimensions for viewport
  const deviceW = orientation === 'portrait' ? selectedDevice.width : selectedDevice.height;
  const deviceH = orientation === 'portrait' ? selectedDevice.height : selectedDevice.width;

  // Scale to fit the much larger modal area
  const maxWidth = 550;
  const maxHeight = 600;
  const scaleW = maxWidth / deviceW;
  const scaleH = maxHeight / deviceH;
  const scale = Math.min(scaleW, scaleH, 3.5); // cap at 3.5x zoom

  const margins = showMargins
    ? selectedDevice.category === 'print'
      ? { top: 20, right: 16, bottom: 20, left: 18 }
      : { top: 10, right: 8, bottom: 10, left: 8 }
    : { top: 4, right: 4, bottom: 4, left: 4 };

  const previewStyles: React.CSSProperties = {
    width: `${deviceW}mm`,
    height: `${deviceH}mm`,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    fontSize: `${previewFontSize}px`,
    ...selectedDevice.css,
    fontFamily: selectedTheme.bodyFont,
    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
    background: selectedDevice.eink ? '#f5f0e8' : selectedTheme.bodyBg,
    color: selectedDevice.eink ? '#1a1a1a' : selectedTheme.textColor,
    filter: selectedDevice.eink ? 'grayscale(100%) contrast(1.05)' : 'none',
    border: selectedDevice.category === 'print' ? '1px solid #ccc' : '1px solid #e2e8f0',
    borderRadius: selectedDevice.category === 'print' ? '2px' : '4px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    boxShadow: selectedDevice.category === 'print'
      ? '2px 4px 12px rgba(0,0,0,0.15)'
      : '0 4px 12px rgba(0,0,0,0.1)',
    position: 'relative' as const,
  };

  const contentHtml = previewContent || `
    <h1>Chapter One</h1>
    <p>The morning sun cast long shadows across the valley as she made her way down the winding path. Each step brought her closer to the village below, where the smell of fresh bread wafted through narrow cobblestone streets.</p>
    <p>She paused at the old stone bridge, watching the water rush beneath. It had been three years since she had last stood here, three years since everything changed.</p>
    <div style="text-align: center; margin: 1.5em 0; letter-spacing: 0.3em; color: #666;">* * *</div>
    <p>The inn was exactly as she remembered it. The same creaking door, the same worn wooden bar, the same faded paintings on the walls. Mrs. Hendricks stood behind the counter, her silver hair pulled into the same tight bun.</p>
  `;

  const filteredDevices = DEVICES.filter((d) => d.category === activeCategory);
  const categories = [...new Set(DEVICES.map((d) => d.category))];

  return (
    <div className="w-full h-screen bg-gray-50 flex overflow-hidden font-sans">

      {/* ── Left Sidebar (Controls) ── */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 shadow-sm flex flex-col z-10">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-bookify-600 font-bold text-lg leading-none">⛶</span>
            <h1 className="text-sm font-bold text-gray-900 tracking-tight">Full Preview</h1>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">Interactive device simulator</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Platform</label>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    const first = DEVICES.find((d) => d.category === cat);
                    if (first) setSelectedDevice(first);
                  }}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all
                    ${activeCategory === cat
                      ? 'bg-bookify-50 text-bookify-700 border border-bookify-200 shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Devices Dropdown / List */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Device Form Factor</label>
            <div className="flex flex-col gap-1.5">
              {filteredDevices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`py-2 px-3 rounded-md text-sm font-medium flex items-center gap-2 text-left transition-all
                    ${selectedDevice.id === device.id
                      ? 'bg-bookify-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <span className="text-base">{device.icon}</span>
                  <span className="flex-1">{device.name}</span>
                  <span className={`text-[10px] ${selectedDevice.id === device.id ? 'text-bookify-200' : 'text-gray-400'}`}>
                    {device.width}×{device.height}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="pt-2 border-t border-gray-100 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Font Size</label>
                <span className="text-xs text-bookify-600 font-mono bg-bookify-50 px-1.5 py-0.5 rounded">{previewFontSize}px</span>
              </div>
              <input
                type="range"
                min={8}
                max={28}
                value={previewFontSize}
                onChange={(e) => setPreviewFontSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-bookify-600"
              />
            </div>

            <div className="flex gap-2">
              {selectedDevice.category !== 'print' && (
                <button
                  onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
                  className="flex-1 py-1.5 px-2 border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"
                >
                  <span>{orientation === 'portrait' ? '⬍' : '⬌'}</span>
                  {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                </button>
              )}
              <button
                onClick={() => setShowMargins(!showMargins)}
                className={`flex-1 py-1.5 px-2 border rounded-md text-xs font-medium flex items-center justify-center gap-1.5
                  ${showMargins ? 'bg-bookify-50 border-bookify-200 text-bookify-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <span>☐</span>
                Margins
              </button>
            </div>
          </div>

          {/* Themes */}
          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Color Theme</label>
            <div className="grid grid-cols-2 gap-1.5">
              {THEME_PRESETS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`py-1.5 px-2 rounded flex flex-col gap-1 items-start text-left border ${selectedTheme.id === theme.id ? 'ring-2 ring-bookify-500 ring-offset-1 border-transparent' : 'border-gray-200'}`}
                  style={{
                    background: theme.bodyBg,
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: theme.headingColor }}>Aa</span>
                  <span className="text-[10px] font-medium" style={{ color: theme.textColor }}>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={loadPreviewContent}
            disabled={loadingContent}
            className="w-full py-2 bg-bookify-600 hover:bg-bookify-700 text-white rounded-md text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loadingContent ? (
              <><span className="animate-spin text-lg leading-none">↻</span> Syncing...</>
            ) : (
              <><span className="text-lg leading-none">↻</span> Sync from Doc</>
            )}
          </button>
        </div>
      </div>

      {/* ── Right Content (Viewport) ── */}
      <div className="flex-1 flex flex-col relative bg-[#e5e7eb] max-h-screen">
        <div className="absolute top-4 left-0 right-0 z-10 px-8 flex justify-center pointer-events-none">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-[11px] font-medium text-gray-500 border border-black/5 pointer-events-auto">
            {selectedDevice.icon} {selectedDevice.name} — {Math.round(scale * 100)}% scale
          </span>
        </div>

        <div className="flex-1 overflow-auto p-12 flex items-center justify-center min-h-0">
          <div
            className="transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] flex justify-center items-start"
            style={{ minHeight: deviceH * scale }}
          >
            <div style={previewStyles} className="preview-container">
              <style>{`
                .preview-container h1 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.8}px; font-weight: bold; color: ${selectedDevice.eink ? '#1a1a1a' : selectedTheme.headingColor}; text-align: center; margin: 1.5em 0 0.8em; line-height: 1.2; }
                .preview-container h2 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.4}px; font-weight: bold; color: ${selectedDevice.eink ? '#1a1a1a' : selectedTheme.headingColor}; margin: 1.2em 0 0.6em; }
                .preview-container h3 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.2}px; font-weight: bold; margin: 1em 0 0.5em; }
                .preview-container p { text-indent: 1.5em; margin: 0 0 0.5em; text-align: ${selectedDevice.css.textAlign || 'left'}; }
                .preview-container h1 + p, .preview-container h2 + p { text-indent: 0; }
                .preview-container img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
                .preview-container .callout-box { border: 2px solid ${selectedTheme.headingColor}; border-radius: 8px; padding: 1em; margin: 1em 0; background-color: rgba(0,0,0,0.03); }
                .preview-container .text-msg-container { margin: 1em 0; display: flow-root; }
                .preview-container .text-msg { padding: 0.6em 1em; border-radius: 1em; max-width: 80%; }
                .preview-container .text-msg-sent { background: #007AFF; color: white; float: right; border-bottom-right-radius: 0.3em; margin-left: auto; }
                .preview-container .text-msg-received { background: #E9E9EB; color: #1a1a1a; float: left; border-bottom-left-radius: 0.3em; }
                /* Custom scrollbar for simulator */
                .preview-container::-webkit-scrollbar { width: 6px; }
                .preview-container::-webkit-scrollbar-track { background: transparent; }
                .preview-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
                .preview-container::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
              `}</style>

              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />

              {/* Print-specific: page number */}
              {selectedDevice.category === 'print' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontSize: `${Math.max(previewFontSize - 3, 9)}px`,
                    color: '#999',
                    pointerEvents: 'none',
                  }}
                >
                  — 1 —
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
