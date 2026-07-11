import { useState } from 'react';
import { callGas } from '../hooks/useGasBridge';

export function AutomationPanel() {
    const [activeSection, setActiveSection] = useState<'batch' | 'replace' | 'lowcontent' | 'metadata'>('batch');

    // Find & Replace state
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [replaceScope, setReplaceScope] = useState<'current' | 'boxset'>('boxset');

    // Low-Content state
    const [pageType, setPageType] = useState('lines');
    const [pageCount, setPageCount] = useState(120);

    // Metadata State
    const [books, setBooks] = useState([
        { id: '1', title: 'Book 1', author: 'Author Name', isbn: '', asin: '' }
    ]);

    const [applying, setApplying] = useState(false);
    const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

    const handleAddBook = () => {
        setBooks([...books, { id: Date.now().toString(), title: `Book ${books.length + 1}`, author: 'Author Name', isbn: '', asin: '' }]);
    };

    const handleUpdateBook = (id: string, field: string, value: string) => {
        setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleReplace = async () => {
        setApplying(true);
        setStatus(null);
        try {
            const res: any = await callGas('globalReplaceText', findText, replaceText);
            if (res && res.success) {
                setStatus({ text: res.message, ok: true });
            }
        } catch (err: any) {
            setStatus({ text: err.message || 'Replace failed', ok: false });
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface-50">
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-bookify-500">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Automation
                </h2>
            </div>

            <div className="px-4 py-2 border-b border-gray-100 bg-white">
                <select
                    value={activeSection}
                    onChange={(e) => setActiveSection(e.target.value as any)}
                    className="w-full text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-bookify-500 transition-colors"
                >
                    <option value="batch">Batch Exporting (Series)</option>
                    <option value="replace">Global Find & Replace</option>
                    <option value="lowcontent">No/Low-Content Automator</option>
                    <option value="metadata">Bulk Metadata Manager</option>
                </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Batch Exporting */}
                {activeSection === 'batch' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                                Select multiple Google Docs from a folder to apply a single theme and export them individually into EPUB/PDF formats.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
                                    <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm2 4A.75.75 0 014.75 8h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 8.75zm2 4a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                </svg>
                                Select Source Folder
                            </label>
                            <button className="w-full py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-[11px] font-semibold text-gray-600 hover:border-bookify-400 hover:text-bookify-600 transition-all flex items-center justify-center gap-2">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                </svg>
                                Browse Google Drive
                            </button>
                        </div>

                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                            <p className="text-[11px] text-gray-400 font-medium">No folder selected.</p>
                        </div>

                        <button className="w-full py-3 bg-gradient-to-r from-bookify-600 to-indigo-600 hover:from-bookify-500 hover:to-indigo-500 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-bookify-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Batch Export
                        </button>
                    </div>
                )}

                {/* Global Find & Replace */}
                {activeSection === 'replace' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                            <p className="text-[11px] text-purple-800 leading-relaxed font-medium">
                                Replace character names, locations, or terms across your entire Box Set or Series simultaneously.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[11px] font-bold text-gray-700 block mb-1">Find</label>
                                <input
                                    type="text"
                                    value={findText}
                                    onChange={(e) => setFindText(e.target.value)}
                                    placeholder="e.g., John Smith"
                                    className="w-full text-[12px] bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-700 block mb-1">Replace with</label>
                                <input
                                    type="text"
                                    value={replaceText}
                                    onChange={(e) => setReplaceText(e.target.value)}
                                    placeholder="e.g., Jane Doe"
                                    className="w-full text-[12px] bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-gray-700 block mb-2">Scope</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setReplaceScope('current')}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-semibold border transition-all ${replaceScope === 'current'
                                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        Current Doc
                                    </button>
                                    <button
                                        onClick={() => setReplaceScope('boxset')}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-semibold border transition-all ${replaceScope === 'boxset'
                                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        Entire Box Set
                                    </button>
                                </div>
                            </div>

                            {status && (
                                <div className={`p-2 rounded text-[11px] border ${status.ok ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {status.text}
                                </div>
                            )}

                            <button onClick={handleReplace} disabled={applying} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[12px] font-bold shadow-sm transition-all active:scale-[0.98] mt-2 disabled:opacity-50">
                                {applying ? 'Replacing...' : `Replace All (${replaceScope === 'boxset' ? 'Multiple Docs' : '1 Doc'})`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Low-Content Automator */}
                {activeSection === 'lowcontent' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="p-3 bg-green-50/50 rounded-xl border border-green-100">
                            <p className="text-[11px] text-green-800 leading-relaxed font-medium">
                                Instantly generate print-ready interior PDFs for planners, journals, and notebooks.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[11px] font-bold text-gray-700 block mb-1">Interior Type</label>
                                <select
                                    value={pageType}
                                    onChange={(e) => setPageType(e.target.value)}
                                    className="w-full text-[12px] bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-500 transition-colors"
                                >
                                    <option value="lines">Lined Journal (College Ruled)</option>
                                    <option value="lines-wide">Lined Journal (Wide Ruled)</option>
                                    <option value="grids">Graph Paper (5x5)</option>
                                    <option value="dots">Dot Grid</option>
                                    <option value="blank">Blank Sketchbook</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-gray-700 block mb-1">Page Count</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="24"
                                        max="800"
                                        value={pageCount}
                                        onChange={(e) => setPageCount(parseInt(e.target.value) || 120)}
                                        className="w-24 text-[12px] bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-500 transition-colors"
                                    />
                                    <span className="text-[11px] text-gray-500 font-medium">pages</span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[140px]">
                                {/* Visual preview mock */}
                                <div className="w-20 h-28 bg-white shadow-sm border border-gray-300 rounded overflow-hidden p-2 flex flex-col gap-1.5 opacity-60">
                                    {pageType.includes('lines') && Array(8).fill(0).map((_, i) => <div key={i} className="w-full h-px bg-gray-300" />)}
                                    {pageType === 'dots' && (
                                        <div className="grid grid-cols-4 gap-1.5 p-1 h-full">
                                            {Array(16).fill(0).map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />)}
                                        </div>
                                    )}
                                    {pageType === 'grids' && (
                                        <div className="w-full h-full border border-gray-200 grid grid-cols-4 grid-rows-6">
                                            {Array(24).fill(0).map((_, i) => <div key={i} className="border-r border-b border-gray-200" />)}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium mt-3">Preview</p>
                            </div>

                            <button className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[12px] font-bold shadow-sm transition-all active:scale-[0.98]">
                                Generate PDF
                            </button>
                        </div>
                    </div>
                )}

                {/* Bulk Metadata Manager */}
                {activeSection === 'metadata' && (
                    <div className="space-y-4 animate-fade-in flex flex-col h-[calc(100vh-160px)]">
                        <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 flex-shrink-0">
                            <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                                Manage ISBNs, titles, and authors for multiple books in a spreadsheet view.
                            </p>
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-sm hide-scrollbar">
                            <table className="w-full min-w-[500px]">
                                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Title</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Author</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">ISBN</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">ASIN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {books.map((book) => (
                                        <tr key={book.id} className="hover:bg-gray-50/50">
                                            <td className="p-1">
                                                <input
                                                    type="text"
                                                    value={book.title}
                                                    onChange={(e) => handleUpdateBook(book.id, 'title', e.target.value)}
                                                    className="w-full text-[11px] px-2 py-1.5 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-orange-200 rounded"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="text"
                                                    value={book.author}
                                                    onChange={(e) => handleUpdateBook(book.id, 'author', e.target.value)}
                                                    className="w-full text-[11px] px-2 py-1.5 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-orange-200 rounded"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="text"
                                                    value={book.isbn}
                                                    placeholder="---"
                                                    onChange={(e) => handleUpdateBook(book.id, 'isbn', e.target.value)}
                                                    className="w-full text-[11px] px-2 py-1.5 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-orange-200 rounded font-mono"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="text"
                                                    value={book.asin}
                                                    placeholder="---"
                                                    onChange={(e) => handleUpdateBook(book.id, 'asin', e.target.value)}
                                                    className="w-full text-[11px] px-2 py-1.5 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-orange-200 rounded font-mono"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button
                                onClick={handleAddBook}
                                className="w-full py-2 text-[11px] font-bold text-orange-600 hover:bg-orange-50 border-t border-gray-100 flex items-center justify-center gap-1 transition-colors"
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Book Row
                            </button>
                        </div>

                        <div className="flex-shrink-0 pt-2">
                            <button className="w-full flex-shrink-0 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[12px] font-bold shadow-sm transition-all active:scale-[0.98]">
                                Save Metadata
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
