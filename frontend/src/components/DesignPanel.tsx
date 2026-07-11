import { useState } from 'react';
import { callGas } from '../hooks/useGasBridge';
import { useAppStore } from '../store/appStore';
import { AIDesignerPanel } from './AIDesignerPanel';

// DesignPanel component

export function DesignPanel() {
    const [activeSubTab, setActiveSubTab] = useState<'headers' | 'typesetting' | 'mockup' | 'ai'>('ai');
    const {
        chapterStartPosition, setChapterStartPosition,
        headingGap, setHeadingGap,
    } = useAppStore();

    const [applying, setApplying] = useState(false);
    const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

    // Typesetting state
    const [controlOrphans, setControlOrphans] = useState(true);
    const [removeRivers, setRemoveRivers] = useState(true);
    const [strictness, setStrictness] = useState(2);

    // Scene Break Builder
    const [sceneBreakStr, setSceneBreakStr] = useState('***');

    const handleApplySceneBreakStyle = async () => {
        setApplying(true);
        setStatus(null);
        try {
            const res: any = await callGas('applySceneBreakStyle', sceneBreakStr);
            if (res.success) setStatus({ text: `Updated ${res.count} scene breaks!`, ok: true });
        } catch (err: any) {
            setStatus({ text: err.message || 'Failed to update', ok: false });
        } finally {
            setApplying(false);
        }
    };

    const handleRunTypesetting = async () => {
        setApplying(true);
        setStatus(null);
        try {
            const res: any = await callGas('applySmartTypesetting', { controlOrphans, removeRivers, strictness });
            if (res.success) setStatus({ text: res.message, ok: true });
        } catch (err: any) {
            setStatus({ text: err.message || 'Failed analysis', ok: false });
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* ── Sub-navigation ── */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex gap-4">
                <button
                    onClick={() => setActiveSubTab('ai')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeSubTab === 'ai' ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    ✨ AI Designer
                </button>
                <button
                    onClick={() => setActiveSubTab('headers')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeSubTab === 'headers' ? 'bg-bookify-100 text-bookify-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    Visual Builder
                </button>
                <button
                    onClick={() => setActiveSubTab('typesetting')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeSubTab === 'typesetting' ? 'bg-bookify-100 text-bookify-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    AI Typesetting
                </button>
                <button
                    onClick={() => setActiveSubTab('mockup')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${activeSubTab === 'mockup' ? 'bg-bookify-100 text-bookify-700' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    Mockups & Ads
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* ── AI Book Designer (BYOK) ── */}
                {activeSubTab === 'ai' && <AIDesignerPanel />}

                {/* ── Visual Chapter Header & Scene Break Builder ── */}
                {activeSubTab === 'headers' && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Visual Chapter Header & Scene Break Builder</h3>
                                <p className="text-xs text-gray-500">Drag & drop layout for headings and scene breaks.</p>
                            </div>
                        </div>

                        {status && (
                            <div className={`p-2 rounded text-[11px] border ${status.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {status.text}
                            </div>
                        )}

                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h4 className="text-sm font-medium text-gray-700">Drag ornaments or backgrounds here</h4>
                            <p className="text-xs text-gray-400 mt-1">Supports PNG, SVG, and Full-Bleed background images.</p>
                            <button className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                                Browse Files
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <h5 className="text-xs font-semibold text-gray-700 mb-2">Scene Break Styles</h5>
                                <div className="flex gap-2 justify-center py-2">
                                    <button onClick={() => setSceneBreakStr('***')} className={`px-2 py-1 rounded ${sceneBreakStr === '***' ? 'bg-bookify-100' : 'hover:bg-gray-100'}`}>***</button>
                                    <button onClick={() => setSceneBreakStr('•••')} className={`px-2 py-1 rounded ${sceneBreakStr === '•••' ? 'bg-bookify-100' : 'hover:bg-gray-100'}`}>•••</button>
                                    <button onClick={() => setSceneBreakStr('❁ ❁ ❁')} className={`px-2 py-1 rounded ${sceneBreakStr === '❁ ❁ ❁' ? 'bg-bookify-100' : 'hover:bg-gray-100'}`}>❁ ❁ ❁</button>
                                </div>
                            </div>
                            <div className="p-3 border border-gray-100 rounded-lg">
                                <h5 className="text-xs font-semibold text-gray-700 mb-2">Chapter Position</h5>
                                <select
                                    value={chapterStartPosition}
                                    onChange={e => setChapterStartPosition(e.target.value as 'top' | 'middle' | 'bottom')}
                                    className="w-full text-xs p-2 border border-gray-200 rounded-md"
                                >
                                    <option value="top">Top Third</option>
                                    <option value="middle">Middle</option>
                                    <option value="bottom">Bottom Third</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-3 border border-gray-100 rounded-lg mt-3">
                            <h5 className="text-xs font-semibold text-gray-700 mb-1">Chapter Heading Gap</h5>
                            <p className="text-[10px] text-gray-400 mb-2">Controls the whitespace above and below chapter titles in PDF &amp; EPUB exports.</p>
                            <div className="grid grid-cols-4 gap-1">
                                {([
                                    { id: 'compact', label: 'Compact' },
                                    { id: 'normal', label: 'Normal' },
                                    { id: 'spacious', label: 'Spacious' },
                                    { id: 'dramatic', label: 'Dramatic' },
                                ] as const).map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setHeadingGap(opt.id)}
                                        className={`py-1.5 rounded-md text-[10px] font-semibold border transition-colors
                                            ${headingGap === opt.id
                                                ? 'bg-bookify-600 text-white border-bookify-600'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleApplySceneBreakStyle}
                            disabled={applying}
                            className="w-full py-2.5 mt-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
                        >
                            {applying ? 'Updating Elements...' : `Apply Scene Break (${sceneBreakStr})`}
                        </button>
                    </div>
                )}

                {/* ── AI Smart Typesetting & Orphan/Widow Control ── */}
                {activeSubTab === 'typesetting' && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">AI Smart Typesetting</h3>
                                <p className="text-xs text-gray-500">InDesign-level justification and spacing.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <div>
                                    <span className="text-sm font-medium text-gray-700 block">AI Orphan & Widow Control</span>
                                    <span className="text-xs text-gray-500">Automatically re-flow paragraphs to prevent single stranded lines.</span>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${controlOrphans ? 'bg-bookify-500' : 'bg-gray-300'}`}>
                                    <input type="checkbox" checked={controlOrphans} onChange={e => setControlOrphans(e.target.checked)} className="hidden" />
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${controlOrphans ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <div>
                                    <span className="text-sm font-medium text-gray-700 block">Remove "Rivers of White"</span>
                                    <span className="text-xs text-gray-500">Subtly adjusts word spacing to fix awkward gaps.</span>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-colors ${removeRivers ? 'bg-bookify-500' : 'bg-gray-300'}`}>
                                    <input type="checkbox" checked={removeRivers} onChange={e => setRemoveRivers(e.target.checked)} className="hidden" />
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${removeRivers ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </label>

                            <div className="p-3 border border-gray-100 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Hyphenation Strictness</span>
                                    <span className="text-xs font-bold text-bookify-600">{strictness === 1 ? 'Mild' : strictness === 2 ? 'Moderate' : 'Strict'}</span>
                                </div>
                                <input type="range" className="w-full accent-bookify-500" min="1" max="3" value={strictness} onChange={e => setStrictness(parseInt(e.target.value))} />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>Fewer Hyphens</span>
                                    <span>Balanced</span>
                                    <span>Better Spacing</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleRunTypesetting}
                            disabled={applying}
                            className="w-full py-2.5 mt-2 bg-gradient-to-r from-bookify-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                        >
                            {applying ? 'Processing Document...' : 'Run AI Typesetting Analysis'}
                        </button>
                    </div>
                )}

                {/* ── Book Mockup / Marketing Asset Generator ── */}
                {activeSubTab === 'mockup' && (
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Mockup & Ad Generator</h3>
                                <p className="text-xs text-gray-500">Create beautiful 3D mockups and social graphics.</p>
                            </div>
                        </div>

                        <div className="p-4 border border-dashed border-gray-300 rounded-xl text-center">
                            <div className="mx-auto w-24 h-32 bg-gray-100 rounded-md shadow-inner flex items-center justify-center mb-3">
                                <span className="text-xs text-gray-400">Upload Cover</span>
                            </div>
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                                Select Cover Image
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Generate Assets</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="px-3 py-4 border border-gray-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-colors text-center group">
                                    <svg className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs font-medium text-gray-700">3D Book Mockups</span>
                                    <span className="block text-[10px] text-gray-400">Standing, iPad, Kindle</span>
                                </div>
                                <div className="px-3 py-4 border border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors text-center group">
                                    <svg className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                    </svg>
                                    <span className="text-xs font-medium text-gray-700">Facebook & IG Ads</span>
                                    <span className="block text-[10px] text-gray-400">1:1, 16:9, 9:16 Ratios</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
