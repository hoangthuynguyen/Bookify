import { useAppStore } from './store/appStore';
import { ExportPanel } from './components/ExportPanel';
import { FormattingPanel } from './components/FormattingPanel';
import { ThemePanel } from './components/ThemePanel';
import { WritingToolsPanel } from './components/WritingToolsPanel';
import { StructurePanel } from './components/StructurePanel';
import { PreviewerPanel } from './components/PreviewerPanel';
import { VersionManagerPanel } from './components/VersionManagerPanel';
import { BoxSetPanel } from './components/BoxSetPanel';
import { StoryBiblePanel } from './components/StoryBiblePanel';
import { AutomationPanel } from './components/AutomationPanel';
import { DesignPanel } from './components/DesignPanel';
import { PublishingPanel } from './components/PublishingPanel';
/* ─── SVG Icon Components ─── */
const IconExport = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M13.75 7h-3V1.798c0-.45-.379-.798-.844-.798h-.812c-.466 0-.844.348-.844.798V7h-3c-.635 0-.955.737-.504 1.166l4.25 4.036c.283.27.725.27 1.008 0l4.25-4.036c.451-.43.131-1.166-.504-1.166z" />
    <path d="M3 15v1.5A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V15h-2v1H5v-1H3z" />
  </svg>
);
const IconFormat = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M5.5 3A1.5 1.5 0 004 4.5v11A1.5 1.5 0 005.5 17h5.757a4.505 4.505 0 01-.007-3H7V13h3.604a4.49 4.49 0 011.146-2.147L7 10.853V10h6v.25a4.49 4.49 0 012-1.235V4.5A1.5 1.5 0 0013.5 3h-8z" />
    <path d="M10 7H7V6h3v1z" />
  </svg>
);
const IconTheme = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 2a8 8 0 100 16 1 1 0 001-1V3a1 1 0 00-1-1zM8 13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM5 9a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm3.5-3a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
  </svg>
);
const IconTools = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
  </svg>
);
const IconStructure = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm2 4A.75.75 0 014.75 8h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 8.75zm2 4a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);
const IconPreview = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm0 1.5h8a.5.5 0 01.5.5v12a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z" />
  </svg>
);
const IconBoxSet = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M3.5 6A1.5 1.5 0 015 4.5h2A1.5 1.5 0 018.5 6v2A1.5 1.5 0 017 9.5H5A1.5 1.5 0 013.5 8V6zm8 0A1.5 1.5 0 0113 4.5h2a1.5 1.5 0 011.5 1.5v2A1.5 1.5 0 0115 9.5h-2A1.5 1.5 0 0111.5 8V6zm-8 8A1.5 1.5 0 015 12.5h2A1.5 1.5 0 018.5 14v2A1.5 1.5 0 017 17.5H5A1.5 1.5 0 013.5 16v-2zm8 0A1.5 1.5 0 0113 12.5h2a1.5 1.5 0 011.5 1.5v2a1.5 1.5 0 01-1.5 1.5h-2a1.5 1.5 0 01-1.5-1.5v-2z" />
  </svg>
);
const IconVersions = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
  </svg>
);
const IconBible = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
  </svg>
);
const IconAutomation = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);
const IconDesign = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 10.586v3.657zM14.9 8.643l-4.9 4.9v2.828H10z" clipRule="evenodd" />
  </svg>
);
const IconPublishing = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const TABS = [
  { id: 'export' as const, label: 'Export', Icon: IconExport },
  { id: 'formatting' as const, label: 'Format', Icon: IconFormat },
  { id: 'themes' as const, label: 'Themes', Icon: IconTheme },
  { id: 'tools' as const, label: 'Tools', Icon: IconTools },
  { id: 'structure' as const, label: 'Structure', Icon: IconStructure },
  { id: 'previewer' as const, label: 'Preview', Icon: IconPreview },
  { id: 'boxset' as const, label: 'Box Set', Icon: IconBoxSet },
  { id: 'versions' as const, label: 'Versions', Icon: IconVersions },
  { id: 'bible' as const, label: 'Story Bible', Icon: IconBible },
  { id: 'automation' as const, label: 'Auto', Icon: IconAutomation },
  { id: 'design' as const, label: 'Design', Icon: IconDesign },
  { id: 'publishing' as const, label: 'Publish', Icon: IconPublishing },
];

export default function App() {
  const { activeTab, setActiveTab, error, setError } = useAppStore();

  return (
    <div className="flex flex-col h-screen max-w-sidebar bg-surface-50">
      {/* ── Header ── */}
      <header className="relative px-4 py-3 bg-gradient-to-r from-bookify-600 via-bookify-500 to-indigo-500">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-white/30">
            <span className="text-white text-sm font-extrabold tracking-tight">B</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-white tracking-tight leading-tight">Bookify</span>
            <span className="text-[10px] text-white/60 font-medium">Professional Book Formatter</span>
          </div>
        </div>
        {/* Decorative gradient bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-bookify-300/0 via-white/30 to-bookify-300/0" />
      </header>

      {/* ── Tab Navigation ── */}
      <nav className="flex overflow-x-auto hide-scrollbar bg-white border-b border-gray-100 shadow-sm relative">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`relative flex-1 min-w-[42px] py-2 flex flex-col items-center gap-0.5 transition-all duration-200
                ${isActive
                  ? 'text-bookify-600'
                  : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <tab.Icon />
              <span className="text-[9px] font-semibold whitespace-nowrap leading-none">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-bookify-600 animate-scale-in" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mx-3 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-start gap-2 animate-slide-down shadow-sm">
          <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">!</span>
          <span className="flex-1 leading-relaxed">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-300 hover:text-rose-500 text-sm font-bold leading-none flex-shrink-0 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Tab Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">
          {activeTab === 'export' && <ExportPanel />}
          {activeTab === 'formatting' && <FormattingPanel />}
          {activeTab === 'themes' && <ThemePanel />}
          {activeTab === 'tools' && <WritingToolsPanel />}
          {activeTab === 'structure' && <StructurePanel />}
          {activeTab === 'previewer' && <PreviewerPanel />}
          {activeTab === 'boxset' && <BoxSetPanel />}
          {activeTab === 'versions' && <VersionManagerPanel />}
          {activeTab === 'bible' && <StoryBiblePanel />}
          {activeTab === 'automation' && <AutomationPanel />}
          {activeTab === 'design' && <DesignPanel />}
          {activeTab === 'publishing' && <PublishingPanel />}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="px-3 py-1.5 border-t border-gray-100 bg-white">
        <p className="text-[9px] text-gray-300 text-center font-semibold tracking-widest uppercase">Bookify v1.0</p>
      </footer>
    </div>
  );
}
