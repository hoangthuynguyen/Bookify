import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

// PublishingPanel component
export function PublishingPanel() {
    const [activeSubTab, setActiveSubTab] = useState<'api' | 'preflight' | 'interactive'>('api');

    const [storeSelect, setStoreSelect] = useState('kdp');
    const [preflightData, setPreflightData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handlePreflight = async () => {
        setLoading(true);
        try {
            const res: any = await callGas('runStorePreflight', storeSelect);
            if (res && res.success) {
                setPreflightData(res.checks);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // run initially when preflight tab selected
    useEffect(() => {
        if (activeSubTab === 'preflight') {
            handlePreflight();
        }
    }, [activeSubTab, storeSelect]);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* ── Sub-navigation ── */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex gap-4 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveSubTab('api')}
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeSubTab === 'api' ? 'bg-bookify-100 text-bookify-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    Direct-to-Store API
                </button>
                <button
                    onClick={() => setActiveSubTab('preflight')}
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeSubTab === 'preflight' ? 'bg-bookify-100 text-bookify-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    Store Pre-flight
                </button>
                <button
                    onClick={() => setActiveSubTab('interactive')}
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeSubTab === 'interactive' ? 'bg-bookify-100 text-bookify-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    Interactive Elements
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* ── Direct-to-Store Publishing API ── */}
                {activeSubTab === 'api' && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Direct-to-Store Publishing</h3>
                                <p className="text-xs text-gray-500">Push your book directly to major retailers.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {['Amazon KDP', 'Apple Books', 'Kobo', 'Draft2Digital'].map((store) => (
                                <div key={store} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-500">{store.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{store}</p>
                                            <p className="text-[10px] text-gray-500">Not Connected</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-bookify-50 hover:text-bookify-600 transition-colors">
                                        Connect
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-2.5 mt-4 bg-gradient-to-r from-bookify-600 to-orange-500 text-white rounded-lg text-xs font-bold shadow-sm opacity-50 cursor-not-allowed">
                            Publish to Selected Stores (Requires Connection)
                        </button>
                    </div>
                )}

                {/* ── Store-Specific Pre-flight AI ── */}
                {activeSubTab === 'preflight' && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Store-Specific Pre-flight</h3>
                                <p className="text-xs text-gray-500">Check margins & specs against retailer rules.</p>
                            </div>
                        </div>

                        <div className="p-3 border border-gray-100 rounded-lg mb-4">
                            <label className="text-xs font-semibold text-gray-700 block mb-2">Target Printer / Store</label>
                            <select
                                value={storeSelect}
                                onChange={e => setStoreSelect(e.target.value)}
                                className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-bookify-500"
                            >
                                <option value="kdp">Amazon KDP (Paperback/Hardcover)</option>
                                <option value="ingram">IngramSpark</option>
                                <option value="lulu">Lulu</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            {loading ? (
                                <p className="text-xs text-gray-500 text-center py-4">Scanning document...</p>
                            ) : preflightData.length > 0 ? (
                                preflightData.map((check, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${check.status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : check.status === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {check.status === 'ok' ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            )}
                                        </svg>
                                        <span>{check.text}</span>
                                    </div>
                                ))
                            ) : null}
                        </div>

                        <button onClick={handlePreflight} disabled={loading} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold mt-4 hover:bg-gray-200 transition-colors disabled:opacity-50">
                            {loading ? 'Rescanning...' : 'Re-scan Document'}
                        </button>
                    </div>
                )}

                {/* ── Interactive EBook Elements ── */}
                {activeSubTab === 'interactive' && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Interactive EBook Elements</h3>
                                <p className="text-xs text-gray-500">For EPUB3 / HTML5 formats.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 border border-gray-100 rounded-xl">
                                <h4 className="text-sm font-bold text-gray-800 mb-1">Pop-up Footnotes</h4>
                                <p className="text-[10px] text-gray-500 mb-3">Convert standard footnotes into modern pop-ups (works on Apple Books & Google Play).</p>
                                <div className="flex items-center gap-2">
                                    <button className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition-colors">
                                        Enable Pop-up Footnotes
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 border border-gray-100 rounded-xl">
                                <h4 className="text-sm font-bold text-gray-800 mb-1">Embed Audio / Video</h4>
                                <p className="text-[10px] text-gray-500 mb-3">Add multimedia to your document. This file will be bundled inside the EPUB3 file.</p>

                                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center bg-gray-50">
                                    <div className="mx-auto w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                                        </svg>
                                    </div>
                                    <span className="text-xs text-gray-500 block">Drag MP3 or MP4 here</span>
                                    <button className="mt-2 px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-semibold text-gray-600">
                                        Or browse files
                                    </button>
                                </div>
                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}
