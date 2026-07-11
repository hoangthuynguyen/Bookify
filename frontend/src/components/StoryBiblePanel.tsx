import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface Character {
    id: string;
    name: string;
    role: string;
    description: string;
    notes: string;
}

interface Location {
    id: string;
    name: string;
    description: string;
}

interface PlotEvent {
    id: string;
    title: string;
    description: string;
    order: number;
}

interface BibleData {
    characters: Character[];
    locations: Location[];
    events: PlotEvent[];
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function StoryBiblePanel() {
    const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'plot'>('characters');
    const [data, setData] = useState<BibleData>({ characters: [], locations: [], events: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const result = await callGas<BibleData>('getCharacterBible');
            setData(result || { characters: [], locations: [], events: [] });
        } catch {
            // Start fresh
        } finally {
            setLoading(false);
        }
    }

    async function saveData(newData: BibleData) {
        setData(newData);
        setSaving(true);
        try {
            await callGas('saveCharacterBible', newData);
        } catch (e) {
            console.error('Save failed:', e);
        } finally {
            setSaving(false);
        }
    }

    // — Character CRUD —
    function addCharacter() {
        const newChar: Character = { id: generateId(), name: 'New Character', role: '', description: '', notes: '' };
        saveData({ ...data, characters: [...data.characters, newChar] });
    }

    function updateCharacter(id: string, field: keyof Character, value: string) {
        const updated = data.characters.map(c => c.id === id ? { ...c, [field]: value } : c);
        saveData({ ...data, characters: updated });
    }

    function deleteCharacter(id: string) {
        saveData({ ...data, characters: data.characters.filter(c => c.id !== id) });
    }

    // — Location CRUD —
    function addLocation() {
        const newLoc: Location = { id: generateId(), name: 'New Location', description: '' };
        saveData({ ...data, locations: [...data.locations, newLoc] });
    }

    function updateLocation(id: string, field: keyof Location, value: string) {
        const updated = data.locations.map(l => l.id === id ? { ...l, [field]: value } : l);
        saveData({ ...data, locations: updated });
    }

    function deleteLocation(id: string) {
        saveData({ ...data, locations: data.locations.filter(l => l.id !== id) });
    }

    // — Plot Event CRUD —
    function addPlotEvent() {
        const newEvent: PlotEvent = { id: generateId(), title: 'New Event', description: '', order: data.events.length };
        saveData({ ...data, events: [...data.events, newEvent] });
    }

    function updatePlotEvent(id: string, field: keyof PlotEvent, value: string | number) {
        const updated = data.events.map(e => e.id === id ? { ...e, [field]: value } : e);
        saveData({ ...data, events: updated });
    }

    function deletePlotEvent(id: string) {
        saveData({ ...data, events: data.events.filter(e => e.id !== id) });
    }

    // Filter by search
    const filteredChars = data.characters.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase())
    );
    const filteredLocs = data.locations.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase())
    );
    const filteredEvents = data.events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.order - b.order);

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="p-3 space-y-3 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="section-heading">Character Bible</h2>
                    <p className="section-desc">Track characters, locations & world-building</p>
                </div>
                {saving && (
                    <span className="badge bg-bookify-50 text-bookify-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-bookify-500 animate-pulse-soft mr-1" />
                        Saving…
                    </span>
                )}
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
            />

            {/* Tab toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                    onClick={() => setActiveTab('characters')}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
            ${activeTab === 'characters' ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    👤 Characters ({data.characters.length})
                </button>
                <button
                    onClick={() => setActiveTab('locations')}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
            ${activeTab === 'locations' ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📍 World ({data.locations.length})
                </button>
                <button
                    onClick={() => setActiveTab('plot')}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200
            ${activeTab === 'plot' ? 'bg-white text-bookify-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    ⏱️ Plot ({data.events.length})
                </button>
            </div>

            {/* Characters List */}
            {activeTab === 'characters' && (
                <div className="space-y-2 animate-fade-in">
                    {filteredChars.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-2xl mb-2">👤</p>
                            <p className="text-xs font-medium">No characters yet</p>
                            <p className="text-[10px] mt-1">Add characters to track their details</p>
                        </div>
                    )}
                    {filteredChars.map(char => (
                        <CharacterCard
                            key={char.id}
                            character={char}
                            onUpdate={(field, value) => updateCharacter(char.id, field, value)}
                            onDelete={() => deleteCharacter(char.id)}
                        />
                    ))}
                    <button onClick={addCharacter} className="btn-primary mt-2">
                        + Add Character
                    </button>
                </div>
            )}

            {/* Locations List */}
            {activeTab === 'locations' && (
                <div className="space-y-2 animate-fade-in">
                    {filteredLocs.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-2xl mb-2">📍</p>
                            <p className="text-xs font-medium">No locations yet</p>
                            <p className="text-[10px] mt-1">Add locations and items to build your world</p>
                        </div>
                    )}
                    {filteredLocs.map(loc => (
                        <LocationCard
                            key={loc.id}
                            location={loc}
                            onUpdate={(field, value) => updateLocation(loc.id, field, value)}
                            onDelete={() => deleteLocation(loc.id)}
                        />
                    ))}
                    <button onClick={addLocation} className="btn-primary mt-2">
                        + Add World Item
                    </button>
                </div>
            )}

            {/* Plot List */}
            {activeTab === 'plot' && (
                <div className="space-y-2 animate-fade-in relative before:absolute before:left-5 before:top-2 before:bottom-10 before:w-0.5 before:bg-indigo-100">
                    {filteredEvents.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-2xl mb-2">⏱️</p>
                            <p className="text-xs font-medium">No plot events yet</p>
                            <p className="text-[10px] mt-1">Add events to build your timeline</p>
                        </div>
                    )}
                    <div className="relative pl-10 space-y-3">
                        {filteredEvents.map((event, index) => (
                            <PlotEventCard
                                key={event.id}
                                event={event}
                                index={index + 1}
                                onUpdate={(field, value) => updatePlotEvent(event.id, field, value)}
                                onDelete={() => deletePlotEvent(event.id)}
                            />
                        ))}
                    </div>
                    <button onClick={addPlotEvent} className="btn-primary mt-4 w-full">
                        + Add Plot Event
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── Sub-components ─── */

function CharacterCard({ character, onUpdate, onDelete }: {
    character: Character;
    onUpdate: (field: keyof Character, value: string) => void;
    onDelete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const ROLES = ['Protagonist', 'Antagonist', 'Supporting', 'Minor', 'Mentor', 'Love Interest', 'Other'];

    return (
        <div className="card-section group">
            <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bookify-100 to-violet-100 flex items-center justify-center flex-shrink-0 text-sm">
                    {character.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        value={character.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        className="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none w-full p-0 focus:bg-bookify-50 focus:px-1 rounded transition-all"
                    />
                    <select
                        value={character.role}
                        onChange={(e) => onUpdate('role', e.target.value)}
                        className="text-[10px] text-gray-400 bg-transparent border-none outline-none cursor-pointer mt-0.5"
                    >
                        <option value="">Select role…</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setExpanded(!expanded)} className="btn-ghost text-[10px] px-1.5">
                        {expanded ? '▲' : '▼'}
                    </button>
                    <button onClick={onDelete} className="btn-ghost text-rose-400 hover:text-rose-600 text-[10px] px-1.5">✕</button>
                </div>
            </div>

            {expanded && (
                <div className="mt-2 space-y-2 animate-slide-up">
                    <textarea
                        value={character.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="Physical description, personality…"
                        rows={2}
                        className="input-field resize-none text-[11px]"
                    />
                    <textarea
                        value={character.notes}
                        onChange={(e) => onUpdate('notes', e.target.value)}
                        placeholder="Plot notes, relationships, arc…"
                        rows={2}
                        className="input-field resize-none text-[11px]"
                    />
                </div>
            )}
        </div>
    );
}

function LocationCard({ location, onUpdate, onDelete }: {
    location: Location;
    onUpdate: (field: keyof Location, value: string) => void;
    onDelete: () => void;
}) {
    return (
        <div className="card-section group">
            <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0 text-sm">
                    📍
                </div>
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        value={location.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        className="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none w-full p-0 focus:bg-emerald-50 focus:px-1 rounded transition-all"
                    />
                    <textarea
                        value={location.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="Describe this world element…"
                        rows={1}
                        className="w-full text-[10px] text-gray-500 bg-transparent border-none outline-none resize-none mt-0.5 p-0 focus:bg-emerald-50 focus:px-1 rounded transition-all"
                    />
                </div>
                <button onClick={onDelete} className="btn-ghost text-rose-400 hover:text-rose-600 text-[10px] px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
        </div>
    );
}

function PlotEventCard({ event, index, onUpdate, onDelete }: {
    event: PlotEvent;
    index: number;
    onUpdate: (field: keyof PlotEvent, value: string) => void;
    onDelete: () => void;
}) {
    return (
        <div className="relative group bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 hover:border-indigo-200 transition-all">
            {/* Timeline Node */}
            <div className="absolute -left-10 top-3.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-400 flex items-center justify-center z-10 shadow-sm">
                <span className="text-[9px] font-bold text-indigo-600">{index}</span>
            </div>

            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <input
                        type="text"
                        value={event.title}
                        onChange={(e) => onUpdate('title', e.target.value)}
                        placeholder="Event Title..."
                        className="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none w-full p-0 focus:bg-indigo-50 focus:px-1 rounded transition-all"
                    />
                    <textarea
                        value={event.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        placeholder="What happens in this event?..."
                        rows={2}
                        className="w-full text-[10px] text-gray-500 bg-transparent border border-transparent outline-none resize-none p-1 focus:border-indigo-100 focus:bg-indigo-50/30 rounded transition-all"
                    />
                </div>
                <button onClick={onDelete} className="flex-shrink-0 text-rose-400 hover:text-rose-600 text-[10px] px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
        </div>
    );
}
