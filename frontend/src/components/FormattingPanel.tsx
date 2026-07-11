import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';
import { useAppStore } from '../store/appStore';

const RICH_FONTS = [
  'Georgia', 'Garamond', 'Palatino', 'Baskerville', 'Book Antiqua',
  'Times New Roman', 'Crimson Text', 'Lora', 'Merriweather', 'PT Serif',
  'Arial', 'Helvetica', 'Verdana', 'Trebuchet MS', 'Courier New',
  'Caveat', 'Dancing Script', 'Special Elite',
];

const SCENE_BREAK_SYMBOLS = [
  '* * *', '~ ~ ~', '- - -',
  '\u2022 \u2022 \u2022', '\u2014', '\u2766',
  '\u2726', '\u2605', '\u2042',
  '\u273B', '\u25C6', '\u2620',
  '\u2756', '\u2767', '\u2619',
  '\u2740', '\u2741', '\u2743',
  '\u2744', '\u2745', '\u2746',
  '\u274B', '\u2736', '\u2737',
  '\u2738', '\u2739', '\u273A',
  '\u273C', '\u273D', '\u2747',
  '\u2748', '\u274A', '\u2749',
  '\u25CA', '\u25CB', '\u25CF',
];

const FRONT_MATTER_TYPES = [
  { id: 'title-page', label: 'Title Page', emoji: '📰', type: 'front' },
  { id: 'copyright', label: 'Copyright Page', emoji: '©', type: 'front' },
  { id: 'dedication', label: 'Dedication', emoji: '♡', type: 'front' },
  { id: 'about-author', label: 'About the Author', emoji: '👤', type: 'back' },
  { id: 'also-by', label: 'Also By', emoji: '📚', type: 'back' },
  { id: 'acknowledgments', label: 'Acknowledgments', emoji: '🙏', type: 'back' },
];

const CALLOUT_STYLES = [
  { label: 'Info', bg: '#EFF6FF', border: '#1E40AF', text: '#1E3A8A', icon: 'ℹ' },
  { label: 'Warning', bg: '#FFFBEB', border: '#D97706', text: '#92400E', icon: '⚠' },
  { label: 'Success', bg: '#F0FDF4', border: '#16A34A', text: '#14532D', icon: '✓' },
  { label: 'Quote', bg: '#F8FAFC', border: '#64748B', text: '#334155', icon: '"' },
];

type Section = 'scene-breaks' | 'callout' | 'text-message' | 'chapter-titles' | 'toc' | 'front-matter' | 'drop-caps' | 'image' | 'fonts';

const SECTIONS: { id: Section; label: string; emoji: string }[] = [
  { id: 'scene-breaks', label: 'Scene Breaks', emoji: '✦' },
  { id: 'callout', label: 'Call-Out', emoji: '▣' },
  { id: 'text-message', label: 'Text Msgs', emoji: '💬' },
  { id: 'chapter-titles', label: 'Chapters', emoji: '🔖' },
  { id: 'toc', label: 'ToC Stylist', emoji: '📑' },
  { id: 'front-matter', label: 'Front Matter', emoji: '📄' },
  { id: 'drop-caps', label: 'Drop Caps', emoji: 'D' },
  { id: 'image', label: 'Image', emoji: '🖼' },
  { id: 'fonts', label: 'Rich Fonts', emoji: '🔤' },
];

export function FormattingPanel() {
  const [activeSection, setActiveSection] = useState<Section>('scene-breaks');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  // Front Matter Form State
  const [activeFmType, setActiveFmType] = useState<string | null>(null);
  const [fmData, setFmData] = useState<any>({});

  // Chapter Titles State
  const [chapterData, setChapterData] = useState({ title: 'Chapter 1', subtitle: '', align: 'center' });

  // Rich Fonts (multiple fonts in a single chapter)
  const [selFont, setSelFont] = useState('Georgia');
  const [selFontSize, setSelFontSize] = useState<number | ''>('');

  // Drop cap design (shared with export settings via store)
  const { dropCapLines, setDropCapLines, dropCapStyle, setDropCapStyle } = useAppStore();

  // ToC Stylist
  const [tocLeader, setTocLeader] = useState<'dots' | 'space' | 'line'>('dots');
  const [tocLevels, setTocLevels] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: false, 4: false });

  async function withStatus<T>(fn: () => Promise<T>, successMsg: string) {
    setLoading(true);
    setStatus(null);
    try {
      await fn();
      setStatus({ text: successMsg, ok: true });
    } catch (err) {
      setStatus({ text: `Error: ${err instanceof Error ? err.message : String(err)}`, ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Section tabs */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-white">
        <h2 className="section-heading mb-0.5">Formatting</h2>
        <p className="section-desc mb-2">Insert and style book elements</p>
        <div className="flex flex-wrap gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all duration-200
                ${activeSection === s.id
                  ? 'bg-bookify-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <span className="text-[10px]">{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mx-3 mt-2 px-2.5 py-2 rounded-xl text-[11px] flex items-center gap-2 animate-slide-down
          ${status.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          <span className={`w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center flex-shrink-0 font-bold ${status.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>{status.ok ? '✓' : '!'}</span>
          <span className="flex-1">{status.text}</span>
          <button onClick={() => setStatus(null)} className="text-gray-300 hover:text-gray-500 text-sm font-bold leading-none">×</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 pb-20">
        <div className="animate-fade-in">

          {/* Scene Breaks */}
          {activeSection === 'scene-breaks' && (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-500">Click a symbol to insert at cursor position:</p>
              <div className="grid grid-cols-6 gap-1.5">
                {SCENE_BREAK_SYMBOLS.map((symbol, i) => (
                  <button
                    key={i}
                    onClick={() => withStatus(() => callGas('insertSceneBreak', symbol), `Scene break inserted`)}
                    disabled={loading}
                    className="aspect-square flex items-center justify-center text-lg bg-white
                    rounded-xl hover:bg-bookify-50 hover:text-bookify-700 hover:shadow-card-hover
                    active:scale-95 transition-all disabled:opacity-40 shadow-card border border-gray-50"
                    title={`Insert: ${symbol}`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Call-Out Box */}
          {activeSection === 'callout' && (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-500">Insert a styled callout box at cursor position:</p>
              <div className="grid grid-cols-2 gap-2">
                {CALLOUT_STYLES.map((style) => (
                  <button
                    key={style.label}
                    onClick={() => withStatus(
                      () => callGas('insertCalloutBox', {
                        title: style.label,
                        text: 'Type your content here...',
                        bgColor: style.bg,
                        borderColor: style.border,
                        icon: style.icon,
                      }),
                      `${style.label} callout inserted`
                    )}
                    disabled={loading}
                    className="p-3 rounded-lg border-2 text-left hover:shadow-sm disabled:opacity-50 transition-all active:scale-95"
                    style={{ borderColor: style.border, backgroundColor: style.bg }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm" style={{ color: style.text }}>{style.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: style.text }}>{style.label}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: style.border }}>
                      {style.label === 'Info' ? 'For informational notes' :
                        style.label === 'Warning' ? 'For cautions & alerts' :
                          style.label === 'Success' ? 'For positive highlights' :
                            'For block quotations'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Messages */}
          {activeSection === 'text-message' && (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-500">
                Insert an SMS/chat bubble layout at cursor. Styled as iOS-like bubbles when exported to EPUB/PDF.
              </p>
              {/* Preview */}
              <div className="bg-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex">
                  <div className="bg-gray-300 text-gray-800 text-xs px-3 py-1.5 rounded-2xl rounded-bl-sm max-w-[70%]">
                    Hey, are you coming?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-2xl rounded-br-sm max-w-[70%]">
                    On my way!
                  </div>
                </div>
              </div>
              <button
                onClick={() => withStatus(
                  () => callGas('insertTextMessages', [
                    { sender: 'Alice', text: 'Hey, are you coming?', isSent: false },
                    { sender: 'Me', text: 'On my way!', isSent: true },
                  ]),
                  'Text messages inserted'
                )}
                disabled={loading}
                className="w-full py-2.5 bg-bookify-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-bookify-700 transition-colors"
              >
                {loading ? 'Inserting…' : 'Insert Example Conversation'}
              </button>
            </div>
          )}

          {/* Chapter Titles */}
          {activeSection === 'chapter-titles' && (
            <div className="space-y-3 p-1">
              <p className="text-[11px] text-gray-500 mb-2">Insert a styled Chapter Title and Subtitle at cursor.</p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-1">Chapter Heading</label>
                  <input type="text" placeholder="e.g. Chapter 1" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={chapterData.title} onChange={e => setChapterData({ ...chapterData, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-1">Subtitle (Optional)</label>
                  <input type="text" placeholder="e.g. The Boy Who Lived" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={chapterData.subtitle} onChange={e => setChapterData({ ...chapterData, subtitle: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 block mb-1">Alignment</label>
                  <select className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none bg-white" value={chapterData.align} onChange={e => setChapterData({ ...chapterData, align: e.target.value })}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => withStatus(
                    () => callGas('insertChapterHeading', chapterData),
                    `Chapter heading inserted!`
                  )}
                  disabled={loading}
                  className="w-full py-2 bg-bookify-600 text-white rounded-md text-xs font-bold disabled:opacity-50 hover:bg-bookify-700 transition-colors shadow-sm"
                >
                  {loading ? 'Inserting...' : 'Insert Chapter'}
                </button>
              </div>
            </div>
          )}

          {/* Table of Contents */}
          {activeSection === 'toc' && (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-500 mb-2">Design your Table of Contents layout for EPUB & PDF exports.</p>

              <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Alignment & Leader</label>
                  <select
                    value={tocLeader}
                    onChange={e => setTocLeader(e.target.value as 'dots' | 'space' | 'line')}
                    className="w-full text-sm p-2 bg-white border border-gray-300 rounded outline-none focus:border-bookify-500 focus:ring-1"
                  >
                    <option value="dots">Dotted Leader (.....)</option>
                    <option value="space">Blank Space</option>
                    <option value="line">Solid Line (____)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Heading Levels to Include</label>
                  <div className="flex gap-3 text-xs font-medium text-gray-700 py-1 flex-wrap">
                    {[1, 2, 3, 4].map(lv => (
                      <label key={lv} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!tocLevels[lv]}
                          onChange={e => setTocLevels(prev => ({ ...prev, [lv]: e.target.checked }))}
                          className="w-3.5 h-3.5 text-bookify-600"
                        /> H{lv}
                      </label>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">Hide sub-headings for a cleaner, professional look. H4 is useful for detailed non-fiction.</p>
                </div>
              </div>

              <button
                onClick={() => withStatus(() => callGas('insertStyledToC', {
                  leader: tocLeader,
                  levels: [1, 2, 3, 4].filter(lv => tocLevels[lv]),
                }), 'Custom Table of Contents inserted!')}
                disabled={loading}
                className="w-full py-2 bg-bookify-600 text-white rounded-md text-xs font-bold disabled:opacity-50 hover:bg-bookify-700 transition-colors shadow-sm mt-2"
              >
                {loading ? 'Processing...' : 'Generate Styled ToC'}
              </button>
            </div>
          )}

          {/* Front/Back Matter */}
          {activeSection === 'front-matter' && (
            <div className="space-y-3">
              {!activeFmType ? (
                <>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-600 mb-1.5">Front Matter</p>
                    <div className="space-y-1">
                      {FRONT_MATTER_TYPES.filter(m => m.type === 'front').map((fm) => (
                        <button
                          key={fm.id}
                          onClick={() => { setActiveFmType(fm.id); setFmData({}); }}
                          className="w-full p-2 text-left bg-white border border-gray-200 rounded-md text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors hover:border-gray-300"
                        >
                          <span>{fm.emoji}</span>
                          <span className="text-gray-700">{fm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-600 mb-1.5">Back Matter</p>
                    <div className="space-y-1">
                      {FRONT_MATTER_TYPES.filter(m => m.type === 'back').map((fm) => (
                        <button
                          key={fm.id}
                          onClick={() => { setActiveFmType(fm.id); setFmData({}); }}
                          className="w-full p-2 text-left bg-white border border-gray-200 rounded-md text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors hover:border-gray-300"
                        >
                          <span>{fm.emoji}</span>
                          <span className="text-gray-700">{fm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setActiveFmType(null)}
                      className="p-1 rounded-md hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                      title="Back"
                    >
                      ←
                    </button>
                    <span className="text-xs font-semibold text-gray-800">
                      {FRONT_MATTER_TYPES.find(m => m.id === activeFmType)?.label} Setup
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeFmType === 'title-page' && (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Smart Auto-fill</span>
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                // document auto-fetch logic placeholder
                                await new Promise(r => setTimeout(r, 400));
                                setFmData({ title: 'Untitled Document', subtitle: '', author: 'Current User' });
                              } finally { setLoading(false); }
                            }}
                            className="text-[9px] bg-bookify-100 text-bookify-700 font-bold px-2 py-1 rounded hover:bg-bookify-200 transition-colors"
                          >
                            Auto Fetch Data
                          </button>
                        </div>
                        <input type="text" placeholder="Book Title" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.title || ''} onChange={e => setFmData({ ...fmData, title: e.target.value })} />
                        <input type="text" placeholder="Subtitle (Optional)" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.subtitle || ''} onChange={e => setFmData({ ...fmData, subtitle: e.target.value })} />
                        <input type="text" placeholder="Author Name" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.author || ''} onChange={e => setFmData({ ...fmData, author: e.target.value })} />
                      </>
                    )}
                    {activeFmType === 'copyright' && (
                      <>
                        <div className="mb-2">
                          <label className="text-[10px] font-semibold text-gray-600 mb-1 block">Copyright Template</label>
                          <select
                            className="w-full text-sm p-2 bg-white border border-gray-200 rounded text-xs mb-1 outline-none focus:border-bookify-500 focus:ring-1"
                            onChange={(e) => {
                              if (e.target.value === 'Standard') setFmData({ ...fmData, copyrightText: 'All Rights Reserved.' });
                              if (e.target.value === 'CC') setFmData({ ...fmData, copyrightText: 'Creative Commons Attribution-NonCommercial (CC BY-NC) 4.0 Intl. License.' });
                              if (e.target.value === 'PD') setFmData({ ...fmData, copyrightText: 'Public Domain.' });
                            }}
                          >
                            <option value="">-- Choose Template --</option>
                            <option value="Standard">All Rights Reserved (Standard KDP)</option>
                            <option value="CC">Creative Commons (CC BY-NC)</option>
                            <option value="PD">Public Domain</option>
                          </select>
                        </div>
                        <input type="text" placeholder="Author Name" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.author || ''} onChange={e => setFmData({ ...fmData, author: e.target.value })} />
                        <input type="text" placeholder="Year (e.g. 2026)" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.year || ''} onChange={e => setFmData({ ...fmData, year: e.target.value })} />
                        <input type="text" placeholder="ISBN (Optional)" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.isbn || ''} onChange={e => setFmData({ ...fmData, isbn: e.target.value })} />
                        <input type="text" placeholder="Publisher (Optional)" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.publisher || ''} onChange={e => setFmData({ ...fmData, publisher: e.target.value })} />
                        <input type="text" placeholder="Edition (Optional)" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.edition || ''} onChange={e => setFmData({ ...fmData, edition: e.target.value })} />
                        {fmData.copyrightText && (
                          <textarea placeholder="Additional copyright text..." className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none h-16 resize-none" value={fmData.copyrightText || ''} onChange={e => setFmData({ ...fmData, copyrightText: e.target.value })} />
                        )}
                      </>
                    )}
                    {activeFmType === 'dedication' && (
                      <textarea placeholder="For Mom and Dad, who always believed in me..." className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none h-24 resize-none" value={fmData.text || ''} onChange={e => setFmData({ ...fmData, text: e.target.value })} />
                    )}
                    {activeFmType === 'about-author' && (
                      <textarea placeholder="Write a short biography about yourself..." className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none h-32 resize-none" value={fmData.text || ''} onChange={e => setFmData({ ...fmData, text: e.target.value })} />
                    )}
                    {activeFmType === 'also-by' && (
                      <>
                        <input type="text" placeholder="Author Name" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none" value={fmData.author || ''} onChange={e => setFmData({ ...fmData, author: e.target.value })} />
                        <textarea placeholder="Book 1\nBook 2\nBook 3" className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none h-24 resize-none" value={fmData.books || ''} onChange={e => setFmData({ ...fmData, books: e.target.value })} />
                        <p className="text-[10px] text-gray-500 mt-1 pl-1">Put each book title on a new line</p>
                      </>
                    )}
                    {activeFmType === 'acknowledgments' && (
                      <textarea placeholder="I would like to thank..." className="w-full text-sm p-2 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none h-32 resize-none" value={fmData.text || ''} onChange={e => setFmData({ ...fmData, text: e.target.value })} />
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const fm = FRONT_MATTER_TYPES.find(m => m.id === activeFmType);
                        if (fm) {
                          withStatus(
                            () => callGas('insertFrontMatter', fm.id, fmData, fm.type),
                            `${fm.label} inserted at the ${fm.type}!`
                          ).then(() => {
                            if (!loading && status?.ok !== false) {
                              setActiveFmType(null);
                            }
                          });
                        }
                      }}
                      disabled={loading}
                      className="w-full py-2 bg-bookify-600 text-white rounded-md text-xs font-bold disabled:opacity-50 hover:bg-bookify-700 transition-colors shadow-sm"
                    >
                      {loading ? 'Inserting...' : 'Insert Page'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Drop Caps */}
          {activeSection === 'drop-caps' && (
            <div className="space-y-3">
              {/* Visual demo */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="float-left text-5xl font-bold text-bookify-600 mr-1 leading-[0.8] mt-1">T</span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  he morning sun cast long shadows across the valley as she made her way down the winding path to the village below.
                </p>
                <div className="clear-both" />
              </div>
              <p className="text-[11px] text-gray-500">
                Apply a drop cap to the first paragraph at the cursor position. Fully rendered in EPUB/PDF exports.
              </p>

              {/* Drop cap height (lines spanned) */}
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Height (lines spanned)</label>
                <div className="grid grid-cols-3 gap-1">
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => setDropCapLines(n)}
                      className={`py-1.5 rounded-md text-[11px] font-semibold border transition-colors
                        ${dropCapLines === n
                          ? 'bg-bookify-600 text-white border-bookify-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                      {n} lines
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop cap design style */}
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Design style</label>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    { id: 'classic', label: 'Classic', desc: 'Body font, ink black' },
                    { id: 'accent', label: 'Accent', desc: 'Theme accent color' },
                    { id: 'ornate', label: 'Ornate', desc: 'Heading font, colored' },
                  ] as const).map(s => (
                    <button
                      key={s.id}
                      onClick={() => setDropCapStyle(s.id)}
                      title={s.desc}
                      className={`py-1.5 rounded-md text-[10px] font-semibold border transition-colors
                        ${dropCapStyle === s.id
                          ? 'bg-bookify-600 text-white border-bookify-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Your choice is also applied to EPUB/PDF exports automatically.</p>
              </div>

              <button
                onClick={() => withStatus(
                  () => callGas('applyDropCapStyle', {
                    fontSize: 24 + dropCapLines * 6,
                    color: dropCapStyle === 'classic' ? '#1a1a1a' : '#7c3aed',
                    lines: dropCapLines,
                    style: dropCapStyle,
                  }),
                  'Drop cap applied'
                )}
                disabled={loading}
                className="w-full py-2.5 bg-bookify-600 text-white rounded-lg text-xs font-semibold
                disabled:opacity-50 hover:bg-bookify-700 transition-colors"
              >
                {loading ? 'Applying…' : 'Apply Drop Cap'}
              </button>
            </div>
          )}

          {/* Image Organizer */}
          {activeSection === 'image' && <ImageOrganizer />}

          {/* Rich Fonts — multiple fonts in a single chapter */}
          {activeSection === 'fonts' && (
            <div className="space-y-3 p-1">
              <p className="text-[11px] text-gray-500">
                Apply a different font to any selected text — mix serif, sans and script fonts within the same
                chapter without needing sub-headings. Carried through to EPUB &amp; PDF exports.
              </p>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Font family</label>
                <select value={selFont} onChange={e => setSelFont(e.target.value)} className="select-field" style={{ fontFamily: selFont }}>
                  {RICH_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Font size (optional, pt)</label>
                <input
                  type="number" min={6} max={72} placeholder="Keep current size"
                  value={selFontSize}
                  onChange={e => setSelFontSize(e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field"
                />
              </div>
              {/* Live preview */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600" style={{ fontFamily: selFont, fontSize: selFontSize ? `${Math.min(selFontSize, 24)}px` : undefined }}>
                  The quick brown fox jumps over the lazy dog — 1234567890
                </p>
              </div>
              <button
                onClick={() => withStatus(
                  () => callGas('applyFontToSelection', selFont, selFontSize === '' ? null : selFontSize),
                  `Font "${selFont}" applied to selection`
                )}
                disabled={loading}
                className="w-full py-2.5 bg-bookify-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-bookify-700 transition-colors"
              >
                {loading ? 'Applying…' : 'Apply Font to Selection'}
              </button>
              <p className="text-[10px] text-gray-400 text-center">Select text in your document first, then click apply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Image Organizer — every image in the doc: DPI check, ALT text, layout tag
// =============================================================================

interface ImageInfo {
  index: number;
  width: number;
  height: number;
  sizeKB: number;
  dpiEst: number;
  alt: string;
  tag: 'none' | 'full-bleed' | 'spread' | 'chapter-header';
  context: string;
}

const IMAGE_TAG_OPTIONS = [
  { id: 'none', label: 'Normal' },
  { id: 'full-bleed', label: 'Full Bleed' },
  { id: 'spread', label: '2-Page Spread' },
  { id: 'chapter-header', label: 'Chapter Header' },
] as const;

function ImageOrganizer() {
  const [images, setImages] = useState<ImageInfo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await callGas<{ total: number; images: ImageInfo[] }>('getImageInventory');
      setImages(res.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  function patch(idx: number, changes: Partial<ImageInfo>) {
    setImages(prev => prev ? prev.map(im => im.index === idx ? { ...im, ...changes } : im) : prev);
  }

  async function save(im: ImageInfo) {
    setSavingIdx(im.index);
    setError(null);
    try {
      await callGas('updateImageMeta', im.index, im.alt, im.tag);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingIdx(null);
    }
  }

  const missingAlt = images?.filter(im => !im.alt.trim()).length ?? 0;
  const lowDpi = images?.filter(im => im.dpiEst < 300).length ?? 0;

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          All images in your document — fix resolution, accessibility and layout in one place.
        </p>
        <button onClick={load} disabled={busy} className="text-[10px] text-bookify-600 font-semibold hover:underline disabled:opacity-50 shrink-0 ml-2">
          {busy ? 'Scanning…' : '↻ Rescan'}
        </button>
      </div>

      {/* Health summary */}
      {images && images.length > 0 && (
        <div className="flex gap-1.5">
          <span className="px-2 py-1 rounded-md bg-gray-100 text-[10px] font-semibold text-gray-600">{images.length} images</span>
          <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${lowDpi ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
            {lowDpi ? `${lowDpi} low-DPI` : 'DPI OK'}
          </span>
          <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${missingAlt ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {missingAlt ? `${missingAlt} missing ALT` : 'ALT OK'}
          </span>
        </div>
      )}

      {error && <div className="p-2 rounded text-[11px] border bg-red-50 text-red-700 border-red-200">{error}</div>}

      {images && images.length === 0 && (
        <p className="text-[11px] text-gray-400 text-center py-6">No images found in this document.</p>
      )}

      {images?.map(im => (
        <div key={im.index} className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-6 h-6 rounded bg-bookify-50 text-bookify-600 text-[10px] font-bold flex items-center justify-center shrink-0">#{im.index + 1}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-600 truncate">
                  {im.context ? `After "${im.context}"` : 'Image'}
                </p>
                <p className="text-[9px] text-gray-400">{im.width}×{im.height}pt · {im.sizeKB > 1024 ? (im.sizeKB / 1024).toFixed(1) + ' MB' : im.sizeKB + ' KB'}</p>
              </div>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${im.dpiEst >= 300 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
              ~{im.dpiEst} DPI
            </span>
          </div>

          <input
            type="text"
            placeholder="ALT text for accessibility (describe the image)"
            value={im.alt}
            onChange={e => patch(im.index, { alt: e.target.value })}
            className={`input-field !text-[11px] ${!im.alt.trim() ? '!border-red-200' : ''}`}
          />

          <div className="flex gap-1">
            {IMAGE_TAG_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => patch(im.index, { tag: opt.id })}
                className={`flex-1 py-1 rounded text-[9px] font-semibold border transition-colors
                  ${im.tag === opt.id
                    ? 'bg-bookify-600 text-white border-bookify-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => save(im)}
            disabled={savingIdx === im.index}
            className="w-full py-1.5 bg-gray-800 text-white rounded text-[10px] font-bold disabled:opacity-50 hover:bg-gray-900 transition-colors"
          >
            {savingIdx === im.index ? 'Saving…' : 'Save Image Settings'}
          </button>
        </div>
      ))}

      <p className="text-[9px] text-gray-400 leading-relaxed">
        <b>Full Bleed</b>: edge-to-edge page (PDF). <b>2-Page Spread</b>: splits across two facing pages (PDF).
        <b> Chapter Header</b>: banner above the chapter title (PDF + EPUB). ALT text ships in EPUB for screen readers.
      </p>
    </div>
  );
}
