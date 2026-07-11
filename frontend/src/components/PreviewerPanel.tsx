import { useState } from 'react';
import { callGas } from '../hooks/useGasBridge';

import { DEVICES, CATEGORY_LABELS, THEME_PRESETS } from '../data/previewConfig';

// =============================================================================
// PreviewerPanel Component
// =============================================================================

export function PreviewerPanel() {
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
  const [previewFontSize, setPreviewFontSize] = useState(14);
  const [selectedTheme, setSelectedTheme] = useState(THEME_PRESETS[0]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('eink');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showMargins, setShowMargins] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Device dimensions for viewport
  const deviceW = orientation === 'portrait' ? selectedDevice.width : selectedDevice.height;
  const deviceH = orientation === 'portrait' ? selectedDevice.height : selectedDevice.width;

  // Scale to fit in the sidebar (max ~310px wide)
  const maxWidth = isFullscreen ? 550 : 310;
  const maxHeight = isFullscreen ? 600 : 420;
  const scaleW = maxWidth / deviceW;
  const scaleH = maxHeight / deviceH;
  const scale = Math.min(scaleW, scaleH, isFullscreen ? 3.5 : 2.5);

  const margins = showMargins
    ? selectedDevice.category === 'print'
      ? { top: 20, right: 16, bottom: 20, left: 18 }
      : { top: 10, right: 8, bottom: 10, left: 8 }
    : { top: 4, right: 4, bottom: 4, left: 4 };

  // Theme-aware colors – e-ink can optionally apply grayscale filter but still use theme colors
  const bgColor = selectedDevice.eink && selectedTheme.id === 'default'
    ? '#f5f0e8' : selectedTheme.bodyBg;
  const txtColor = selectedDevice.eink && selectedTheme.id === 'default'
    ? '#1a1a1a' : selectedTheme.textColor;
  const hdColor = selectedDevice.eink && selectedTheme.id === 'default'
    ? '#1a1a1a' : selectedTheme.headingColor;

  const previewStyles: React.CSSProperties = {
    width: `${deviceW}mm`,
    height: `${deviceH}mm`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    fontSize: `${previewFontSize}px`,
    ...selectedDevice.css,
    fontFamily: selectedTheme.bodyFont,
    padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`,
    background: bgColor,
    color: txtColor,
    filter: selectedDevice.eink && selectedTheme.id === 'default' ? 'grayscale(100%) contrast(1.05)' : 'none',
    border: selectedDevice.category === 'print' ? '1px solid #ccc' : '1px solid #e2e8f0',
    borderRadius: selectedDevice.category === 'print' ? '2px' : '4px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    boxShadow: selectedDevice.category === 'print'
      ? '2px 2px 8px rgba(0,0,0,0.15)'
      : '0 1px 4px rgba(0,0,0,0.1)',
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

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={() => setIsFullscreen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] max-h-[95vh] overflow-hidden flex" onClick={(e) => e.stopPropagation()}>
          {/* Left Sidebar Controls */}
          <div className="w-56 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">⛶ Full Preview</h2>
                <button onClick={() => setIsFullscreen(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none">×</button>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">Interactive device simulator</p>
            </div>

            <div className="flex-1 p-3 space-y-4">
              {/* Categories */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Platform</label>
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); const first = DEVICES.find((d) => d.category === cat); if (first) setSelectedDevice(first); }}
                      className={`py-1 px-1.5 rounded text-[10px] font-medium transition-all ${activeCategory === cat ? 'bg-bookify-50 text-bookify-700 border border-bookify-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Devices */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Device</label>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {filteredDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className={`py-1.5 px-2 rounded text-[10px] font-medium flex items-center gap-1.5 text-left transition-all ${selectedDevice.id === device.id ? 'bg-bookify-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'}`}
                    >
                      <span>{device.icon}</span>
                      <span className="flex-1 truncate">{device.name}</span>
                      <span className={`text-[9px] ${selectedDevice.id === device.id ? 'text-bookify-200' : 'text-gray-400'}`}>{device.width}×{device.height}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Font Size</label>
                  <span className="text-[10px] text-bookify-600 font-mono bg-bookify-50 px-1 py-0.5 rounded">{previewFontSize}px</span>
                </div>
                <input type="range" min={8} max={28} value={previewFontSize} onChange={(e) => setPreviewFontSize(parseInt(e.target.value))} className="w-full h-1.5 accent-bookify-600" />
              </div>

              {/* Controls */}
              <div className="flex gap-1.5">
                {selectedDevice.category !== 'print' && (
                  <button onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')} className="flex-1 py-1.5 border border-gray-200 rounded text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition-colors" title={orientation === 'portrait' ? 'Switch to landscape' : 'Switch to portrait'}>
                    {orientation === 'portrait' ? '⬍' : '⬌'}
                  </button>
                )}
                <button onClick={() => setShowMargins(!showMargins)} className={`flex-1 py-1.5 border rounded text-[10px] font-medium transition-colors ${showMargins ? 'bg-bookify-50 border-bookify-200 text-bookify-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`} title="Toggle margins">
                  ☐
                </button>
              </div>

              {/* Theme */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Theme</label>
                <div className="grid grid-cols-2 gap-1">
                  {THEME_PRESETS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`py-1 px-1.5 rounded flex flex-col gap-0.5 items-start text-left border ${selectedTheme.id === theme.id ? 'ring-2 ring-bookify-500 ring-offset-1 border-transparent' : 'border-gray-200'}`}
                      style={{ background: theme.bodyBg }}
                      title={theme.description}
                    >
                      <span className="text-[9px] font-bold" style={{ color: theme.headingColor }}>Aa</span>
                      <span className="text-[9px] font-medium" style={{ color: theme.textColor }}>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Refresh */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <button onClick={loadPreviewContent} disabled={loadingContent} className="w-full py-2 bg-bookify-600 hover:bg-bookify-700 text-white rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {loadingContent ? (<><span className="animate-spin text-sm leading-none">↻</span> Syncing...</>) : (<><span className="text-sm leading-none">↻</span> Sync from Doc</>)}
              </button>
            </div>
          </div>

          {/* Right Content — preview area */}
          <div className="flex-1 bg-gray-100 flex flex-col min-w-[400px]">
            <div className="text-center py-2">
              <span className="bg-white/90 px-3 py-1 rounded-full shadow-sm text-[10px] font-medium text-gray-500 border border-gray-200">
                {selectedDevice.icon} {selectedDevice.name} — {Math.round(scale * 100)}% scale
              </span>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
              <div className="transition-all duration-300" style={{ minHeight: deviceH * scale }}>
                <div style={previewStyles} className="preview-container">
                  <style>{`
                    .preview-container h1 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.8}px; font-weight: bold; color: ${hdColor}; text-align: center; margin: 1.5em 0 0.8em; line-height: 1.2; }
                    .preview-container h2 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.4}px; font-weight: bold; color: ${hdColor}; margin: 1.2em 0 0.6em; }
                    .preview-container h3 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.2}px; font-weight: bold; margin: 1em 0 0.5em; }
                    .preview-container p { text-indent: 1.5em; margin: 0 0 0.5em; text-align: ${selectedDevice.css.textAlign || 'left'}; }
                    .preview-container h1 + p, .preview-container h2 + p { text-indent: 0; }
                    .preview-container img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
                    .preview-container::-webkit-scrollbar { width: 4px; }
                    .preview-container::-webkit-scrollbar-track { background: transparent; }
                    .preview-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
                  `}</style>
                  <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  {selectedDevice.category === 'print' && (
                    <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center', fontSize: `${Math.max(previewFontSize - 3, 8)}px`, color: '#999', pointerEvents: 'none' }}>
                      — 1 —
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Device Preview</h2>
          <p className="section-desc">See how your book looks on real devices</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsFullscreen(true)}
            className="btn-secondary px-2"
            title="Open Fullscreen Preview"
          >
            ⛶
          </button>
          <button
            onClick={loadPreviewContent}
            disabled={loadingContent}
            className="btn-secondary"
          >
            {loadingContent ? 'Loading…' : '↻'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg overflow-x-auto hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              const first = DEVICES.find((d) => d.category === cat);
              if (first) setSelectedDevice(first);
            }}
            className={`flex-1 py-1 rounded text-[10px] font-medium transition-colors whitespace-nowrap px-1.5
              ${activeCategory === cat
                ? 'bg-white text-bookify-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Device Selector (within category) - scrollable for many */}
      <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0.5">
        {filteredDevices.map((device) => (
          <button
            key={device.id}
            onClick={() => setSelectedDevice(device)}
            className={`flex-shrink-0 py-1.5 px-2 rounded text-[10px] font-medium flex flex-col items-center gap-0.5
              ${selectedDevice.id === device.id
                ? 'bg-bookify-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <span>{device.icon}</span>
            <span className="whitespace-nowrap">{device.name}</span>
          </button>
        ))}
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Font Size */}
        <div className="flex-1">
          <label className="text-[10px] text-gray-500">Font: {previewFontSize}px</label>
          <input
            type="range"
            min={8}
            max={24}
            value={previewFontSize}
            onChange={(e) => setPreviewFontSize(parseInt(e.target.value))}
            className="w-full h-1.5 accent-bookify-600"
          />
        </div>

        {/* Orientation Toggle */}
        {selectedDevice.category !== 'print' && (
          <button
            onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
            className="px-2 py-1 rounded text-[10px] bg-gray-100 text-gray-600 hover:bg-gray-200"
            title={orientation === 'portrait' ? 'Switch to landscape' : 'Switch to portrait'}
          >
            {orientation === 'portrait' ? '⬍' : '⬌'}
          </button>
        )}

        {/* Margins Toggle */}
        <button
          onClick={() => setShowMargins(!showMargins)}
          className={`px-2 py-1 rounded text-[10px] ${showMargins ? 'bg-bookify-50 text-bookify-600' : 'bg-gray-100 text-gray-500'}`}
          title="Toggle margins"
        >
          ☐
        </button>
      </div>

      {/* Theme Selector */}
      <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-0.5">
        {THEME_PRESETS.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelectedTheme(theme)}
            className={`flex-shrink-0 py-1 px-2.5 rounded text-[10px] font-medium transition-all
              ${selectedTheme.id === theme.id
                ? 'ring-2 ring-bookify-400 ring-offset-1'
                : ''}`}
            style={{
              background: theme.bodyBg,
              color: theme.textColor,
              border: `1px solid ${theme.id === 'dark' ? '#333' : '#e2e8f0'}`,
            }}
            title={theme.description}
          >
            {theme.name}
          </button>
        ))}
      </div>

      {/* Theme info */}
      {selectedTheme.description && (
        <p className="text-[9px] text-gray-400 italic px-0.5">{selectedTheme.description}</p>
      )}

      {/* Device Dimensions Info */}
      <p className="text-[10px] text-gray-400">
        {selectedDevice.icon} {selectedDevice.name} — {selectedDevice.width}×{selectedDevice.height}mm
        {selectedDevice.eink ? ' · E-Ink' : ''}
        {selectedDevice.category === 'print' ? ' · Print trim' : ''}
        {selectedDevice.category === 'desktop' ? ' · Desktop' : ''}
        {' · '}{Math.round(scale * 100)}% zoom
      </p>

      {/* Preview Viewport */}
      <div
        className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-2 flex justify-center"
        style={{ minHeight: Math.min(deviceH * scale, maxHeight) + 16 }}
      >
        <div style={previewStyles} className="preview-container">
          <style>{`
            .preview-container h1 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.8}px; font-weight: bold; color: ${hdColor}; text-align: center; margin: 1.5em 0 0.8em; line-height: 1.2; }
            .preview-container h2 { font-family: ${selectedTheme.headingFont}; font-size: ${previewFontSize * 1.4}px; font-weight: bold; color: ${hdColor}; margin: 1.2em 0 0.6em; }
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
            .preview-container::-webkit-scrollbar { width: 4px; }
            .preview-container::-webkit-scrollbar-track { background: transparent; }
            .preview-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
            .preview-container::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.4); }
          `}</style>

          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />

          {/* Print-specific: page number */}
          {selectedDevice.category === 'print' && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: `${Math.max(previewFontSize - 3, 8)}px`,
                color: '#999',
                pointerEvents: 'none',
              }}
            >
              — 1 —
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center italic">
        Preview approximation. Final export uses full device CSS profiles.
      </p>
    </div>
  );
}
