import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface SeriesBook { title: string; url: string }
interface Series { id: string; name: string; books: SeriesBook[] }
interface Library { series: Series[] }

export function BoxSetPanel() {
    const [tab, setTab] = useState<'library' | 'quick'>('library');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
    const [result, setResult] = useState<any>(null);

    // Quick combine (legacy flow)
    const [urlsText, setUrlsText] = useState('');
    const [title, setTitle] = useState('');

    // Series library
    const [library, setLibrary] = useState<Library | null>(null);
    const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
    const [newSeriesName, setNewSeriesName] = useState('');
    const [newBook, setNewBook] = useState<SeriesBook>({ title: '', url: '' });
    const [libLoading, setLibLoading] = useState(true);

    useEffect(() => {
        callGas<Library>('getSeriesLibrary')
            .then(lib => {
                setLibrary(lib);
                if (lib.series.length > 0) setActiveSeriesId(lib.series[0].id);
            })
            .catch(() => setLibrary({ series: [] }))
            .finally(() => setLibLoading(false));
    }, []);

    async function persist(next: Library) {
        setLibrary(next);
        try {
            await callGas('saveSeriesLibrary', next);
        } catch (err) {
            setStatus({ text: `Save failed: ${err instanceof Error ? err.message : String(err)}`, ok: false });
        }
    }

    const activeSeries = library?.series.find(s => s.id === activeSeriesId) || null;

    function addSeries() {
        if (!newSeriesName.trim() || !library) return;
        const s: Series = { id: `s_${Date.now()}`, name: newSeriesName.trim(), books: [] };
        const next = { series: [...library.series, s] };
        setNewSeriesName('');
        setActiveSeriesId(s.id);
        persist(next);
    }

    function deleteSeries(id: string) {
        if (!library) return;
        if (!confirm('Delete this series? (Your Google Docs are not affected.)')) return;
        const next = { series: library.series.filter(s => s.id !== id) };
        if (activeSeriesId === id) setActiveSeriesId(next.series[0]?.id || null);
        persist(next);
    }

    function updateSeries(id: string, fn: (s: Series) => Series) {
        if (!library) return;
        persist({ series: library.series.map(s => s.id === id ? fn(s) : s) });
    }

    function addBook() {
        if (!activeSeries || !newBook.url.trim()) return;
        const book = { title: newBook.title.trim() || `Book ${activeSeries.books.length + 1}`, url: newBook.url.trim() };
        updateSeries(activeSeries.id, s => ({ ...s, books: [...s.books, book] }));
        setNewBook({ title: '', url: '' });
    }

    function moveBook(idx: number, dir: -1 | 1) {
        if (!activeSeries) return;
        const books = [...activeSeries.books];
        const j = idx + dir;
        if (j < 0 || j >= books.length) return;
        [books[idx], books[j]] = [books[j], books[idx]];
        updateSeries(activeSeries.id, s => ({ ...s, books }));
    }

    function removeBook(idx: number) {
        if (!activeSeries) return;
        updateSeries(activeSeries.id, s => ({ ...s, books: s.books.filter((_, i) => i !== idx) }));
    }

    async function runBoxSetExport(urls: string[], boxTitle: string, successMsg: string) {
        setLoading(true);
        setStatus(null);
        setResult(null);
        try {
            const res = await callGas<any>('exportBoxSetEpub', {
                urls,
                includeBookTitles: true,
                metadataOverrides: { title: boxTitle },
            });
            setResult(res);
            setStatus({ text: successMsg, ok: true });
        } catch (err) {
            setStatus({ text: `Failed: ${err instanceof Error ? err.message : String(err)}`, ok: false });
        } finally {
            setLoading(false);
        }
    }

    function exportSeries(series: Series) {
        if (series.books.length === 0) {
            setStatus({ text: 'Add at least one book to this series first.', ok: false });
            return;
        }
        runBoxSetExport(series.books.map(b => b.url), series.name, `"${series.name}" box set generated!`);
    }

    function handleQuickGenerate() {
        const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean);
        if (!urls.length) {
            setStatus({ text: 'Please enter at least one Google Docs URL.', ok: false });
            return;
        }
        runBoxSetExport(urls, title || 'My Box Set', 'Box Set EPUB generated successfully!');
    }

    return (
        <div className="p-3 space-y-4 pb-20 flex flex-col h-full overflow-y-auto animate-fade-in">
            <div>
                <h2 className="section-heading flex items-center gap-2">
                    <span className="text-lg">📦</span> Books &amp; Box Sets
                </h2>
                <p className="section-desc mt-1 leading-relaxed">
                    Organize your series and export complete box sets. Your library is saved to your Google account.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
                {([['library', '📚 Series Library'], ['quick', '⚡ Quick Combine']] as const).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-colors
                            ${tab === id ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {status && (
                <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 animate-slide-down ${status.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    <span>{status.ok ? '✅' : '❌'}</span>
                    <span>{status.text}</span>
                </div>
            )}

            {result && (
                <div className="card-section border-l-[3px] border-l-emerald-400 space-y-3">
                    <p className="text-xs font-bold text-emerald-800 text-center">🎉 Your Box Set is Ready!</p>
                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg text-[11px] text-gray-600 font-mono">
                        <span className="truncate mr-2 text-gray-800">{result.filename}</span>
                        <span className="badge bg-gray-100 text-gray-500">{result.sizeFormatted}</span>
                    </div>
                    <a
                        href={result.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                    >
                        ↓ Download Box Set
                    </a>
                </div>
            )}

            {/* ── Series Library ── */}
            {tab === 'library' && (
                <div className="space-y-3">
                    {libLoading && <p className="text-[11px] text-gray-400 text-center py-4">Loading your library…</p>}

                    {!libLoading && library && (
                        <>
                            <div className="flex flex-wrap gap-1.5">
                                {library.series.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveSeriesId(s.id)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors
                                            ${activeSeriesId === s.id
                                                ? 'bg-bookify-600 text-white border-bookify-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {s.name} <span className="opacity-60">({s.books.length})</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-1.5">
                                <input
                                    type="text" placeholder="New series name (e.g. The Night Sword Saga)"
                                    value={newSeriesName} onChange={e => setNewSeriesName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addSeries()}
                                    className="input-field flex-1"
                                />
                                <button onClick={addSeries} disabled={!newSeriesName.trim()}
                                    className="px-3 bg-bookify-600 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-bookify-700 transition-colors">
                                    + Series
                                </button>
                            </div>

                            {activeSeries && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-xs font-bold text-gray-700">{activeSeries.name}</p>
                                        <button onClick={() => deleteSeries(activeSeries.id)}
                                            className="text-[10px] text-red-400 hover:text-red-600 font-semibold">
                                            Delete series
                                        </button>
                                    </div>

                                    <div className="p-3 space-y-2">
                                        {activeSeries.books.length === 0 && (
                                            <p className="text-[11px] text-gray-400 text-center py-2">No books yet — add the first one below.</p>
                                        )}
                                        {activeSeries.books.map((b, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-lg">
                                                <span className="w-5 h-5 rounded bg-bookify-50 text-bookify-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-semibold text-gray-700 truncate">{b.title}</p>
                                                    <p className="text-[9px] text-gray-400 truncate">{b.url}</p>
                                                </div>
                                                <div className="flex gap-0.5 shrink-0">
                                                    <button onClick={() => moveBook(i, -1)} disabled={i === 0} className="w-5 h-5 text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-20">▲</button>
                                                    <button onClick={() => moveBook(i, 1)} disabled={i === activeSeries.books.length - 1} className="w-5 h-5 text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-20">▼</button>
                                                    <button onClick={() => removeBook(i)} className="w-5 h-5 text-[10px] text-red-300 hover:text-red-500">✕</button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-1 space-y-1.5 border-t border-gray-100">
                                            <input type="text" placeholder="Book title (e.g. Book 1: The Awakening)"
                                                value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                                                className="input-field" />
                                            <div className="flex gap-1.5">
                                                <input type="text" placeholder="Google Docs URL"
                                                    value={newBook.url} onChange={e => setNewBook({ ...newBook, url: e.target.value })}
                                                    onKeyDown={e => e.key === 'Enter' && addBook()}
                                                    className="input-field flex-1 font-mono !text-[10px]" />
                                                <button onClick={addBook} disabled={!newBook.url.trim()}
                                                    className="px-3 bg-gray-800 text-white rounded-lg text-[10px] font-bold disabled:opacity-40 hover:bg-gray-900 transition-colors">
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => exportSeries(activeSeries)}
                                            disabled={loading || activeSeries.books.length === 0}
                                            className="btn-primary !py-2.5 !text-xs !rounded-xl w-full mt-2"
                                        >
                                            {loading ? 'Generating…' : `📦 Export "${activeSeries.name}" Box Set (${activeSeries.books.length} books)`}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {library.series.length === 0 && (
                                <div className="text-center py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-2xl mb-1">📚</p>
                                    <p className="text-xs font-semibold text-gray-600">Build your series library</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Create a series, add your books' Google Docs, and export box sets in one click. Synced to your Google account.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── Quick Combine (paste URLs) ── */}
            {tab === 'quick' && (
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Box Set Title</label>
                        <input
                            type="text"
                            placeholder="e.g. The Lord of The Rings: The Complete Trilogy"
                            className="input-field"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-xs font-semibold text-gray-700 block">Google Docs URLs</label>
                            <span className="badge bg-gray-100 text-gray-500">{urlsText.split('\n').filter(x => x.trim()).length} docs</span>
                        </div>
                        <textarea
                            className="w-full h-40 text-[11px] p-2.5 border border-gray-300 rounded focus:border-bookify-500 focus:ring-1 focus:ring-bookify-500 outline-none font-mono whitespace-nowrap overflow-x-auto leading-loose transition-shadow bg-gray-50 focus:bg-white"
                            placeholder="https://docs.google.com/document/d/...&#10;https://docs.google.com/document/d/...&#10;"
                            value={urlsText}
                            onChange={e => setUrlsText(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 pl-1">Ensure the current Google account has access to these documents.</p>
                    </div>

                    <button
                        onClick={handleQuickGenerate}
                        disabled={loading || !urlsText.trim()}
                        className="btn-primary !py-3 !text-sm !rounded-xl w-full flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Building EPUB Book...
                            </>
                        ) : 'Generate Box Set EPUB'}
                    </button>
                </div>
            )}
        </div>
    );
}
