import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface Heading {
  text: string;
  level: number;
  index: number;
}

export function StructurePanel() {
  const [activeSection, setActiveSection] = useState<'chapters' | 'matter' | 'versions'>('chapters');

  return (
    <div className="p-3 space-y-3 pb-20 animate-fade-in">
      <div>
        <h2 className="section-heading">Structure & Pages</h2>
        <p className="section-desc">Manage chapters, front/back matter, and versions</p>
      </div>

      {/* Segmented control */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {(['chapters', 'matter', 'versions'] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
              ${activeSection === s ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {s === 'chapters' ? '📑 Chapters' : s === 'matter' ? '📄 Pages' : '⏳ Versions'}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {activeSection === 'chapters' && <ChapterList />}
        {activeSection === 'matter' && <MatterGenerator />}
        {activeSection === 'versions' && <VersionManager />}
      </div>
    </div>
  );
}

/* ─── Chapter List with TOC Generator ─── */
function ChapterList() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [loading, setLoading] = useState(true);
  const [tocStatus, setTocStatus] = useState<string | null>(null);
  const [generatingToc, setGeneratingToc] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => { loadHeadings(); }, []);

  async function loadHeadings() {
    try {
      const content = await callGas<{ headings: Heading[] }>('getDocumentContent');
      setHeadings(content.headings || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleGenerateToc() {
    setGeneratingToc(true);
    setTocStatus(null);
    try {
      const result = await callGas<{ success: boolean; count: number }>('generateTableOfContents');
      setTocStatus(`✅ Table of Contents created with ${result.count} entries!`);
      loadHeadings();
    } catch (e) {
      setTocStatus(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGeneratingToc(false);
    }
  }

  async function handleRenameHeading(heading: Heading) {
    if (!editText.trim() || editText === heading.text) {
      setEditingIndex(null);
      return;
    }
    try {
      await callGas('renameHeading', heading.text, editText.trim());
      setHeadings(prev => prev.map(h => h.index === heading.index ? { ...h, text: editText.trim() } : h));
    } catch { /* silent */ }
    finally { setEditingIndex(null); }
  }

  if (loading) {
    return <div className="space-y-1.5">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}</div>;
  }

  const chapterCount = headings.filter(h => h.level === 1).length;
  const sceneCount = headings.filter(h => h.level === 2).length;
  const subSceneCount = headings.filter(h => h.level === 3).length;

  return (
    <div className="space-y-3">
      {/* TOC Generator */}
      <div className="card-section border-l-[3px] border-l-bookify-400 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-700">Table of Contents</p>
          <p className="text-[10px] text-gray-400">Auto-generate from headings</p>
        </div>
        <button onClick={handleGenerateToc} disabled={generatingToc || headings.length === 0} className="btn-secondary">
          {generatingToc ? 'Generating…' : '+ Generate TOC'}
        </button>
      </div>

      {tocStatus && (
        <p className={`text-[11px] p-2 rounded-lg ${tocStatus.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {tocStatus}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center py-2 bg-bookify-50 rounded-lg">
          <p className="text-lg font-bold text-bookify-600">{chapterCount}</p>
          <p className="text-[9px] text-gray-400 font-medium">Chapters</p>
        </div>
        <div className="text-center py-2 bg-violet-50 rounded-lg">
          <p className="text-lg font-bold text-violet-600">{sceneCount}</p>
          <p className="text-[9px] text-gray-400 font-medium">Scenes</p>
        </div>
        <div className="text-center py-2 bg-amber-50 rounded-lg">
          <p className="text-lg font-bold text-amber-600">{subSceneCount}</p>
          <p className="text-[9px] text-gray-400 font-medium">Sub-scenes</p>
        </div>
        <div className="text-center py-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-600">{headings.length}</p>
          <p className="text-[9px] text-gray-400 font-medium">Total</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1.5">
        <button onClick={() => loadHeadings()} className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-md hover:bg-gray-200 transition-colors">
          ↻ Refresh
        </button>
        <button onClick={handleGenerateToc} disabled={generatingToc || headings.length === 0} className="flex-1 py-1.5 bg-bookify-50 text-bookify-600 text-[10px] font-medium rounded-md hover:bg-bookify-100 transition-colors disabled:opacity-50">
          📋 Generate TOC
        </button>
      </div>

      {/* Heading list */}
      {headings.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-2xl mb-2">📑</p>
          <p className="text-xs font-medium">No headings found</p>
          <p className="text-[10px] mt-1 text-gray-400">Use Heading 1 for chapters, Heading 2 for scenes, Heading 3 for sub-scenes</p>
          <div className="mt-3 space-y-1.5 text-left bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] font-semibold text-gray-500">Tips:</p>
            <p className="text-[10px] text-gray-400">• <strong>H1</strong> – Chapter titles (e.g., "Chapter 1: The Beginning")</p>
            <p className="text-[10px] text-gray-400">• <strong>H2</strong> – Scene breaks / major sections</p>
            <p className="text-[10px] text-gray-400">• <strong>H3</strong> – Sub-sections within scenes</p>
            <p className="text-[10px] text-gray-400">• <strong>H4</strong> – Minor divisions / notes</p>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5">
          {headings.map((h, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group ${h.level === 1 ? 'border-l-2 border-l-bookify-400' : ''}`}
              style={{ paddingLeft: `${(h.level - 1) * 14 + 8}px` }}
              onClick={() => { setEditingIndex(i); setEditText(h.text); }}
            >
              <span className={`text-[9px] font-bold w-5 flex-shrink-0 ${h.level === 1 ? 'text-bookify-500' : h.level === 2 ? 'text-violet-400' : 'text-gray-300'}`}>H{h.level}</span>

              {editingIndex === i ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => handleRenameHeading(h)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameHeading(h); if (e.key === 'Escape') setEditingIndex(null); }}
                  autoFocus
                  className="flex-1 text-[11px] p-0.5 border border-bookify-300 rounded outline-none focus:ring-1 focus:ring-bookify-400 bg-white"
                />
              ) : (
                <span className={`truncate flex-1 ${h.level === 1 ? 'text-xs font-semibold text-gray-800' : h.level === 2 ? 'text-[11px] text-gray-600' : 'text-[11px] text-gray-400'}`}>
                  {h.text || '(empty)'}
                </span>
              )}

              <span className="text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                ✏️
              </span>
            </div>
          ))}

          {/* Summary */}
          <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[10px] text-gray-500 font-medium">
              📊 Structure: {chapterCount} chapters · {sceneCount} scenes · {subSceneCount} sub-scenes · {headings.length} total headings
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Version Manager ─── */
function VersionManager() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVersionName, setNewVersionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { loadVersions(); }, []);

  async function loadVersions() {
    try {
      const result = await callGas<any[]>('listVersions');
      setVersions(result || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleCreateVersion() {
    if (!newVersionName.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await callGas('createNamedVersion', newVersionName);
      setStatus(`Version "${newVersionName}" saved`);
      setNewVersionName('');
      loadVersions();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      {/* Version info */}
      <div className="card-section border-l-[3px] border-l-violet-400">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Save named versions to track your writing progress. Versions are stored with Google Docs' revision history and can be restored at any time.
        </p>
      </div>

      {/* Create version */}
      <div className="flex gap-1.5">
        <input
          type="text" value={newVersionName}
          onChange={e => setNewVersionName(e.target.value)}
          placeholder="Version name (e.g., v2.3 - Post-editor)"
          className="input-field flex-1"
          onKeyDown={e => e.key === 'Enter' && handleCreateVersion()}
        />
        <button onClick={handleCreateVersion} disabled={saving || !newVersionName.trim()} className="btn-primary !w-auto !px-4">
          Save
        </button>
      </div>

      {/* Quick version buttons */}
      <div className="flex gap-1.5">
        {['Draft', 'Review', 'Final', 'Submitted'].map(label => (
          <button key={label} onClick={() => setNewVersionName(`${label} – ${new Date().toLocaleDateString()}`)} className="flex-1 py-1.5 bg-gray-50 text-gray-500 text-[9px] font-medium rounded-md hover:bg-gray-100 transition-colors border border-gray-100">
            {label}
          </button>
        ))}
      </div>

      {status && (
        <p className={`text-[11px] p-2 rounded-lg animate-slide-up ${status.startsWith('Error') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {status}
        </p>
      )}

      {/* Version list */}
      {loading ? (
        <div className="space-y-1.5">{[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p className="text-2xl mb-2">⏳</p>
          <p className="text-xs font-medium">No saved versions</p>
          <p className="text-[10px] mt-1">Save versions to track your progress</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] text-gray-400 font-medium">{versions.length} version{versions.length !== 1 ? 's' : ''} saved</p>
          {versions.slice(0, 20).map((v, i) => (
            <div key={v.revisionId} className={`card-section ${i === 0 ? 'border-l-[3px] border-l-bookify-400' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  {v.name && <p className="text-xs font-semibold text-gray-800">{v.name}</p>}
                  <p className="text-[10px] text-gray-400">
                    {new Date(v.date).toLocaleDateString()} · {v.lastModifyingUser}
                  </p>
                </div>
                <span className="badge bg-gray-100 text-gray-500">{v.fileSize}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Matter Generator ─── */
function MatterGenerator() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const FRONT_MATTERS = [
    {
      id: 'title-page', label: 'Title Page', icon: '📰', position: 'front',
      description: 'The first page of your book. Includes the book title, subtitle, and author name. Sets the tone for the entire book.',
      fields: ['title', 'subtitle', 'author'],
      tips: 'Keep it clean and simple. Use the same font style as your book cover for consistency.'
    },
    {
      id: 'copyright', label: 'Copyright Page', icon: '©', position: 'front',
      description: 'Legal notice protecting your work. Includes copyright year, ISBN, publisher info, and rights statement.',
      fields: ['author', 'year', 'isbn', 'publisher', 'rights'],
      tips: 'Required for all published books. Include ISBN for distribution and Library of Congress info if applicable.'
    },
    {
      id: 'dedication', label: 'Dedication', icon: '♡', position: 'front',
      description: 'A short personal message dedicating the book to someone special. Usually one to three sentences.',
      fields: ['text'],
      tips: 'Keep it brief and heartfelt. Traditionally placed on its own page after the copyright.'
    },
    {
      id: 'foreword', label: 'Foreword', icon: '📝', position: 'front',
      description: 'Written by someone other than the author, typically an expert or notable figure, endorsing or introducing the book.',
      fields: ['author', 'text'],
      tips: 'A foreword adds credibility. It should explain why the book matters and why the author is qualified.'
    },
    {
      id: 'preface', label: 'Preface', icon: '📖', position: 'front',
      description: 'Written by the author explaining the motivation, scope, and background of the book.',
      fields: ['text'],
      tips: "Explain why you wrote this book and what the reader can expect. Keep it personal but professional."
    },
    {
      id: 'epigraph', label: 'Epigraph', icon: '✒️', position: 'front',
      description: 'A quotation or poem at the beginning of the book that sets the mood or theme.',
      fields: ['quote', 'attribution'],
      tips: 'Choose a quote that resonates with your book\'s central theme. Always credit the source.'
    },
  ];

  const BACK_MATTERS = [
    {
      id: 'about-author', label: 'About the Author', icon: '👤', position: 'back',
      description: 'A short biography telling readers who you are, your credentials, other works, and where to find you online.',
      fields: ['text', 'website', 'social'],
      tips: 'Write in third person. Include your writing credentials, where you live, and links to your website/social media.'
    },
    {
      id: 'also-by', label: 'Also By', icon: '📚', position: 'back',
      description: 'A list of your other published works. Drives cross-selling and helps readers discover more of your writing.',
      fields: ['author', 'books'],
      tips: 'List books by series first, then standalone titles. Include links to purchase pages if publishing as an ebook.'
    },
    {
      id: 'acknowledgments', label: 'Acknowledgments', icon: '🙏', position: 'back',
      description: 'Thank the people who helped make the book possible — editors, beta readers, family, mentors, and supporters.',
      fields: ['text'],
      tips: 'Be genuine and specific. Mention editors, agents, beta readers, family, and anyone who supported your journey.'
    },
    {
      id: 'glossary', label: 'Glossary', icon: '📖', position: 'back',
      description: 'An alphabetical list of important terms and their definitions. Useful for genre fiction with unique world-building.',
      fields: ['text'],
      tips: 'Include terms that readers might not know. Organize alphabetically and keep definitions concise.'
    },
    {
      id: 'reading-guide', label: 'Reading Guide', icon: '💡', position: 'back',
      description: 'Discussion questions for book clubs. Encourages deeper engagement and makes your book more appealing to reading groups.',
      fields: ['text'],
      tips: 'Include 10-15 thought-provoking questions. Focus on themes, character motivations, and reader interpretations.'
    },
    {
      id: 'excerpt', label: 'Bonus Excerpt', icon: '📄', position: 'back',
      description: 'A preview of your next book to hook readers. Include the first chapter or a compelling scene.',
      fields: ['bookTitle', 'text'],
      tips: 'Choose a gripping opening that will make readers want to buy your next book immediately.'
    },
  ];

  async function handleInsert(type: string, position: string) {
    setLoading(true);
    setStatus(null);
    try {
      let data: any = {};
      if (type === 'copyright') {
        data.author = prompt('Author Name:', 'Author Name') || 'Author Name';
        data.year = new Date().getFullYear();
      } else if (type === 'title-page') {
        data.title = prompt('Book Title:', 'Book Title') || 'Book Title';
        data.author = prompt('Author Name:', 'Author Name') || 'Author Name';
      } else if (type === 'dedication') {
        data.text = prompt('Dedication text:', 'For...') || 'For...';
      } else if (type === 'also-by') {
        data.author = prompt('Author Name:', 'Author Name') || 'Author Name';
      } else if (type === 'foreword') {
        data.author = prompt('Foreword Author:', 'Guest Author') || 'Guest Author';
        data.text = 'Foreword text here...';
      } else if (type === 'preface') {
        data.text = 'Preface text here...';
      } else if (type === 'epigraph') {
        data.quote = prompt('Quote:', '"The only way out is through."') || '"The only way out is through."';
        data.attribution = prompt('Attribution:', '— Robert Frost') || '— Robert Frost';
      } else if (type === 'glossary') {
        data.text = 'Term 1: Definition...\nTerm 2: Definition...';
      } else if (type === 'reading-guide') {
        data.text = '1. What did you think about...?\n2. How did the main character...?';
      } else if (type === 'excerpt') {
        data.bookTitle = prompt('Next Book Title:', 'Coming Soon') || 'Coming Soon';
        data.text = 'Preview excerpt text here...';
      }

      const res = await callGas<{ success: boolean }>('insertFrontMatter', type, data, position);
      if (res?.success) {
        setStatus(`✅ ${type.replace(/-/g, ' ')} inserted!`);
        setTimeout(() => setStatus(null), 4000);
      }
    } catch (err) {
      setStatus(`❌ ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoading(false); }
  }

  const renderMatterRow = (m: typeof FRONT_MATTERS[0]) => (
    <div key={m.id} className="border border-gray-100 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
        className="w-full text-left px-3 py-2.5 text-xs text-gray-700 flex items-center justify-between group hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{m.icon}</span>
          <span className="font-medium">{m.label}</span>
        </span>
        <span className={`text-gray-400 text-[10px] transition-transform duration-200 ${expandedId === m.id ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {expandedId === m.id && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 bg-gray-50/50 animate-fade-in">
          <p className="text-[10px] text-gray-500 leading-relaxed pt-2">{m.description}</p>
          <div className="flex items-center gap-1.5 p-2 bg-amber-50 rounded border border-amber-100">
            <span className="text-amber-500 text-[10px]">💡</span>
            <p className="text-[9px] text-amber-700 leading-relaxed">{m.tips}</p>
          </div>
          <button
            onClick={() => handleInsert(m.id, m.position)}
            disabled={loading}
            className="w-full py-1.5 bg-bookify-600 text-white rounded-md text-[10px] font-semibold disabled:opacity-50 hover:bg-bookify-700 transition-colors"
          >
            {loading ? 'Inserting…' : `+ Insert ${m.label}`}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="card-section">
        <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
          Generate standard publishing pages. <strong>Front matter</strong> is inserted at the beginning of your book, <strong>back matter</strong> at the end. Click any item to see details and insert.
        </p>

        {status && (
          <div className={`mb-3 px-2.5 py-2 rounded-lg text-[11px] font-medium animate-slide-down ${status.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
            {status}
          </div>
        )}

        <div className="space-y-4">
          {/* Front Matter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="section-title">Front Matter</p>
              <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{FRONT_MATTERS.length} pages</span>
            </div>
            <div className="space-y-1.5">
              {FRONT_MATTERS.map(renderMatterRow)}
            </div>
          </div>

          {/* Back Matter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="section-title">Back Matter</p>
              <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{BACK_MATTERS.length} pages</span>
            </div>
            <div className="space-y-1.5">
              {BACK_MATTERS.map(renderMatterRow)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
