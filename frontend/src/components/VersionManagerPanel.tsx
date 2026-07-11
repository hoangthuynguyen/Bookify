import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

// =============================================================================
// Types
// =============================================================================

interface Version {
    revisionId: string;
    name: string | null;
    date: string;
    fileSize: string;
    lastModifyingUser: string;
}

interface Collaborator {
    email: string;
    role: string;
}

// =============================================================================
// VersionManagerPanel
// =============================================================================

export function VersionManagerPanel() {
    const [activeSection, setActiveSection] = useState<'versions' | 'collaborate'>('versions');

    return (
        <div className="p-3 space-y-3 animate-fade-in">
            <div>
                <h2 className="section-heading">Versions & Collaborate</h2>
                <p className="section-desc">Track revisions and share with collaborators</p>
            </div>

            {/* Section Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                    onClick={() => setActiveSection('versions')}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
            ${activeSection === 'versions'
                            ? 'bg-white text-bookify-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📋 Versions
                </button>
                <button
                    onClick={() => setActiveSection('collaborate')}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
            ${activeSection === 'collaborate'
                            ? 'bg-white text-bookify-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}`}
                >
                    👥 Collaborate
                </button>
            </div>

            <div className="animate-fade-in">
                {activeSection === 'versions' && <VersionsSection />}
                {activeSection === 'collaborate' && <CollaborateSection />}
            </div>
        </div>
    );
}

// =============================================================================
// Versions Section
// =============================================================================

function VersionsSection() {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newVersionName, setNewVersionName] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        loadVersions();
    }, []);

    // Auto-dismiss messages
    useEffect(() => {
        if (successMsg) {
            const t = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(t);
        }
    }, [successMsg]);

    const loadVersions = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await callGas<Version[]>('listVersions');
            setVersions(result || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load versions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newVersionName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await callGas('createNamedVersion', newVersionName.trim());
            setNewVersionName('');
            setSuccessMsg('Version saved successfully!');
            await loadVersions();
        } catch (e: any) {
            setError(e.message || 'Failed to save version');
        } finally {
            setSaving(false);
        }
    };

    const handleRestore = async (revisionId: string, name: string | null) => {
        const label = name || `revision ${revisionId}`;
        if (!confirm(`Restore "${label}"?\n\nA backup of your current document will be created automatically.`)) return;
        setError(null);
        try {
            await callGas('restoreVersion', revisionId);
            setSuccessMsg('Version restored. Please reload the document.');
        } catch (e: any) {
            setError(e.message || 'Restore failed');
        }
    };

    const handleRename = async (revisionId: string) => {
        if (!renameValue.trim()) return;
        try {
            await callGas('renameVersion', revisionId, renameValue.trim());
            setRenamingId(null);
            setRenameValue('');
            await loadVersions();
        } catch (e: any) {
            setError(e.message || 'Rename failed');
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    const namedVersions = versions.filter((v) => v.name);
    const unnamedVersions = versions.filter((v) => !v.name).slice(0, 10);

    return (
        <div className="space-y-3">
            {/* Create Version */}
            <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
                <label className="text-[11px] font-medium text-gray-700">Save Current Version</label>
                <div className="flex gap-1.5">
                    <input
                        type="text"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder="e.g. v1.0 — First Draft"
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400 focus:border-bookify-400"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={saving || !newVersionName.trim()}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-bookify-600 text-white hover:bg-bookify-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {saving ? '…' : '💾 Save'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 flex items-start gap-1.5">
                    <span>⚠</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold text-xs">✕</button>
                </div>
            )}
            {successMsg && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-[11px] text-green-700 flex items-center gap-1.5">
                    <span>✓</span>
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-bookify-600 rounded-full animate-spin" />
                </div>
            )}

            {/* Named Versions */}
            {!loading && namedVersions.length > 0 && (
                <div className="space-y-1">
                    <h3 className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                        📌 Named Versions
                        <span className="text-gray-400 font-normal">({namedVersions.length})</span>
                    </h3>
                    {namedVersions.map((v) => (
                        <div
                            key={v.revisionId}
                            className="bg-white border border-gray-150 rounded-lg p-2 hover:border-bookify-200 transition-colors"
                        >
                            {renamingId === v.revisionId ? (
                                <div className="flex gap-1 mb-1">
                                    <input
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRename(v.revisionId);
                                            if (e.key === 'Escape') setRenamingId(null);
                                        }}
                                        className="flex-1 px-1.5 py-0.5 border rounded text-[11px] focus:ring-1 focus:ring-bookify-400"
                                        autoFocus
                                    />
                                    <button onClick={() => handleRename(v.revisionId)} className="text-[10px] text-bookify-600 hover:text-bookify-700">✓</button>
                                    <button onClick={() => setRenamingId(null)} className="text-[10px] text-gray-400 hover:text-gray-600">✕</button>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-1">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-800 truncate">{v.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {formatDate(v.date)} · {v.fileSize} · {v.lastModifyingUser}
                                        </p>
                                    </div>
                                    <div className="flex gap-0.5 shrink-0">
                                        <button
                                            onClick={() => { setRenamingId(v.revisionId); setRenameValue(v.name || ''); }}
                                            className="p-1 rounded text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                            title="Rename"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleRestore(v.revisionId, v.name)}
                                            className="p-1 rounded text-[10px] text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                            title="Restore"
                                        >
                                            ↩️
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Unnamed Revisions (recent) */}
            {!loading && unnamedVersions.length > 0 && (
                <div className="space-y-1">
                    <h3 className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        🕐 Recent Auto-Saves
                        <span className="text-gray-400 font-normal">(latest {unnamedVersions.length})</span>
                    </h3>
                    {unnamedVersions.map((v) => (
                        <div
                            key={v.revisionId}
                            className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-gray-600 truncate">{formatDate(v.date)}</p>
                                <p className="text-[10px] text-gray-400">{v.fileSize} · {v.lastModifyingUser}</p>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                                <button
                                    onClick={() => { setRenamingId(v.revisionId); setRenameValue(''); }}
                                    className="p-1 rounded text-[10px] text-gray-400 hover:text-bookify-600 hover:bg-bookify-50"
                                    title="Name this version"
                                >
                                    📌
                                </button>
                                <button
                                    onClick={() => handleRestore(v.revisionId, null)}
                                    className="p-1 rounded text-[10px] text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                    title="Restore"
                                >
                                    ↩️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && versions.length === 0 && !error && (
                <div className="text-center py-8">
                    <p className="text-2xl mb-2">📋</p>
                    <p className="text-xs text-gray-500">No versions found.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Save your first version above to get started.</p>
                </div>
            )}

            {/* Refresh */}
            {!loading && (
                <button
                    onClick={loadVersions}
                    className="w-full py-1.5 text-[11px] text-gray-500 hover:text-bookify-600 hover:bg-gray-50 rounded transition-colors"
                >
                    ↻ Refresh versions
                </button>
            )}
        </div>
    );
}

// =============================================================================
// Collaborate Section
// =============================================================================

function CollaborateSection() {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'reader' | 'commenter' | 'writer'>('commenter');
    const [sharing, setSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        loadCollaborators();
    }, []);

    useEffect(() => {
        if (successMsg) {
            const t = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(t);
        }
    }, [successMsg]);

    const loadCollaborators = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await callGas<Collaborator[]>('listCollaborators');
            setCollaborators(result || []);
        } catch (e: any) {
            setError(e.message || 'Failed to load collaborators');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!email.trim()) return;
        setSharing(true);
        setError(null);
        try {
            await callGas('shareDocument', email.trim(), role);
            setEmail('');
            setSuccessMsg(`Shared with ${email.trim()} as ${role}`);
            await loadCollaborators();
        } catch (e: any) {
            setError(e.message || 'Share failed');
        } finally {
            setSharing(false);
        }
    };

    const handleRevoke = async (targetEmail: string) => {
        if (!confirm(`Remove access for ${targetEmail}?`)) return;
        setError(null);
        try {
            await callGas('revokeAccess', targetEmail);
            setSuccessMsg(`Access revoked for ${targetEmail}`);
            await loadCollaborators();
        } catch (e: any) {
            setError(e.message || 'Revoke failed');
        }
    };

    const roleColors: Record<string, string> = {
        editor: 'bg-blue-100 text-blue-700',
        viewer: 'bg-gray-100 text-gray-600',
        commenter: 'bg-yellow-100 text-yellow-700',
        writer: 'bg-blue-100 text-blue-700',
        reader: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className="space-y-3">
            {/* Share Form */}
            <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
                <label className="text-[11px] font-medium text-gray-700">Share Document</label>
                <div className="flex gap-1.5">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                        placeholder="email@example.com"
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400 focus:border-bookify-400"
                    />
                </div>
                <div className="flex gap-1.5 items-center">
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'reader' | 'commenter' | 'writer')}
                        className="flex-1 px-2 py-1.5 rounded border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-bookify-400 bg-white"
                    >
                        <option value="reader">Can view</option>
                        <option value="commenter">Can comment</option>
                        <option value="writer">Can edit</option>
                    </select>
                    <button
                        onClick={handleShare}
                        disabled={sharing || !email.trim()}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-bookify-600 text-white hover:bg-bookify-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {sharing ? '…' : '📤 Share'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 flex items-start gap-1.5">
                    <span>⚠</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold text-xs">✕</button>
                </div>
            )}
            {successMsg && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-[11px] text-green-700 flex items-center gap-1.5">
                    <span>✓</span>
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-bookify-600 rounded-full animate-spin" />
                </div>
            )}

            {/* Collaborators List */}
            {!loading && collaborators.length > 0 && (
                <div className="space-y-1">
                    <h3 className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                        👥 Collaborators
                        <span className="text-gray-400 font-normal">({collaborators.length})</span>
                    </h3>
                    {collaborators.map((c) => (
                        <div
                            key={c.email}
                            className="flex items-center justify-between px-2 py-1.5 bg-white border border-gray-150 rounded-lg hover:border-bookify-200 transition-colors"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-gray-700 truncate">{c.email}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${roleColors[c.role] || 'bg-gray-100 text-gray-600'}`}>
                                    {c.role}
                                </span>
                                <button
                                    onClick={() => handleRevoke(c.email)}
                                    className="p-0.5 rounded text-[10px] text-gray-300 hover:text-red-500 hover:bg-red-50"
                                    title="Remove access"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && collaborators.length === 0 && !error && (
                <div className="text-center py-6">
                    <p className="text-2xl mb-2">👥</p>
                    <p className="text-xs text-gray-500">No collaborators yet.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Invite someone to collaborate on this book.</p>
                </div>
            )}

            {/* Refresh */}
            {!loading && (
                <button
                    onClick={loadCollaborators}
                    className="w-full py-1.5 text-[11px] text-gray-500 hover:text-bookify-600 hover:bg-gray-50 rounded transition-colors"
                >
                    ↻ Refresh collaborators
                </button>
            )}
        </div>
    );
}
