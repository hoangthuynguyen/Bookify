import { useState, useEffect, useRef } from 'react';
import { callGas } from '../hooks/useGasBridge';

interface WordCountResult {
  total: number;
  characters: number;
  paragraphs: number;
  chapters: number;
}

interface DailyProgress {
  today: number;
  goal: number;
  percentage: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  last30Days: Array<{ date: string; words: number; wrote: boolean }>;
}

type Section = 'wordcount' | 'sprint' | 'pacing' | 'streak' | 'quotes' | 'analyze' | 'dpi';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'wordcount', label: 'Words', icon: '#' },
  { id: 'sprint', label: 'Sprint', icon: '⏱' },
  { id: 'pacing', label: 'Pacing', icon: '📈' },
  { id: 'streak', label: 'Streak', icon: '🔥' },
  { id: 'quotes', label: 'Quotes', icon: '"' },
  { id: 'analyze', label: 'Analyze', icon: '≡' },
  { id: 'dpi', label: 'Images', icon: '🖼' },
];

export function WritingToolsPanel() {
  const [activeSection, setActiveSection] = useState<Section>('wordcount');

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-white">
        <h2 className="section-heading mb-0.5">Writing Tools</h2>
        <p className="section-desc mb-2">Track progress, analyze text, validate quality</p>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              title={s.label}
              className={`flex-1 py-1.5 rounded-md text-center transition-all duration-200
                ${activeSection === s.id
                  ? 'bg-white text-bookify-600 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'}`}
            >
              <span className="block text-[12px]">{s.icon}</span>
              <span className="block text-[8px] font-semibold mt-0.5">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-20">
        <div className="animate-fade-in">
          {activeSection === 'wordcount' && <WordCountSection />}
          {activeSection === 'sprint' && <SprintTimerSection />}
          {activeSection === 'pacing' && <PacingSection />}
          {activeSection === 'streak' && <StreakSection />}
          {activeSection === 'quotes' && <SmartQuotesSection />}
          {activeSection === 'analyze' && <AnalyzeSection />}
          {activeSection === 'dpi' && <DpiValidatorSection />}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Word Count
// =============================================================================

function WordCountSection() {
  const [data, setData] = useState<WordCountResult | null>(null);
  const [daily, setDaily] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [wc, dp] = await Promise.all([
        callGas<WordCountResult>('getWordCount'),
        callGas<DailyProgress>('getDailyProgress'),
      ]);
      setData(wc);
      setDaily(dp);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500">Document statistics</p>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-[11px] text-bookify-600 hover:underline disabled:opacity-50 font-medium"
        >
          {loading ? 'Counting…' : '↻ Refresh'}
        </button>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Words" value={data.total.toLocaleString()} accent />
          <StatCard label="Characters" value={data.characters.toLocaleString()} />
          <StatCard label="Paragraphs" value={data.paragraphs.toLocaleString()} />
          <StatCard label="Chapters" value={String(data.chapters)} />
        </div>
      )}

      {daily && (
        <div className="card-section space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-600 font-medium">Daily Goal</span>
            <span className="text-[11px] font-bold text-gray-800">
              {daily.today.toLocaleString()} / {daily.goal.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${daily.percentage >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-bookify-500 to-violet-500'}`}
              style={{ width: `${Math.min(100, daily.percentage)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400">
            {daily.percentage >= 100
              ? `🎉 Goal reached! ${daily.today - daily.goal} words ahead`
              : `${daily.goal - daily.today} words to go · ${daily.percentage}%`}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border transition-shadow hover:shadow-card-hover ${accent ? 'bg-gradient-to-br from-bookify-50 to-violet-50 border-bookify-100' : 'bg-white border-gray-100'}`}>
      <p className="text-[10px] text-gray-400 mb-0.5 font-medium">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-bookify-700' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

// =============================================================================
// Sprint Timer
// =============================================================================

function SprintTimerSection() {
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const isComplete = remaining === 0;
  const progress = ((duration * 60 - remaining) / (duration * 60)) * 100;

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, remaining]);

  function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  function handleReset() {
    setRunning(false);
    setRemaining(duration * 60);
  }

  return (
    <div className="space-y-4">
      {/* Circular timer display */}
      <div className="flex flex-col items-center py-3">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke={isComplete ? '#22c55e' : '#2563eb'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-bold text-gray-800">{formatTime(remaining)}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              {isComplete ? 'Done!' : running ? 'Writing…' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            disabled={isComplete}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-xs font-semibold
              hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {remaining < duration * 60 ? 'Resume' : 'Start Sprint'}
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors border border-gray-200"
        >
          Reset
        </button>
      </div>

      {/* Duration presets */}
      <div>
        <p className="text-[11px] text-gray-500 mb-1.5">Duration</p>
        <div className="grid grid-cols-7 gap-1">
          {[10, 15, 20, 25, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => { setDuration(m); setRemaining(m * 60); setRunning(false); }}
              className={`py-1.5 rounded-md text-[10px] font-medium transition-colors
                ${duration === m
                  ? 'bg-bookify-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Pacing Visualizer
// =============================================================================

function PacingSection() {
  const [data, setData] = useState<{ index: number; avgSentenceLength: number; words: number }[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPacing() {
    setLoading(true);
    try {
      const res = await callGas<any[]>('getPacingData');
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPacing(); }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">Sentence length across paragraphs. Shorter = faster pace (action), longer = slower (description).</p>

      {!data || data.length === 0 ? (
        <p className="text-[11px] text-gray-400">Pacing data unavailable.</p>
      ) : (
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
          <div className="flex items-end gap-1 h-32 w-full overflow-x-auto hide-scrollbar">
            {data.map((d) => (
              <div
                key={d.index}
                className={`w-4 rounded-t-sm flex-shrink-0 transition-opacity hover:opacity-80
                   ${d.avgSentenceLength < 10 ? 'bg-red-400' : d.avgSentenceLength > 20 ? 'bg-blue-400' : 'bg-green-400'}
                `}
                style={{ height: `${Math.min(100, (d.avgSentenceLength / 30) * 100)}%` }}
                title={`Paragraph ${d.index}: ${d.avgSentenceLength} words/sentence`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-2">
            <span>Start</span>
            <span>End</span>
          </div>
          <div className="flex justify-center gap-3 mt-2 text-[9px] text-gray-500">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-sm"></div> Fast (&lt;10w)</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-400 rounded-sm"></div> Balanced</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-sm"></div> Slow (&gt;20w)</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Writing Streak
// =============================================================================

function StreakSection() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStreak(); }, []);

  async function loadStreak() {
    try {
      const streak = await callGas<StreakData>('getWritingStreak');
      setData(streak);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
      </div>
      <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-8">
      <p className="text-[11px] text-gray-500">Could not load streak data.</p>
      <button onClick={loadStreak} className="mt-2 text-xs text-bookify-600 hover:underline">Retry</button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <StreakCard label="Current" value={data.currentStreak} highlight />
        <StreakCard label="Longest" value={data.longestStreak} />
        <StreakCard label="Total" value={data.totalDays} />
      </div>

      <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
        <p className="text-[11px] text-gray-500 mb-2 font-medium">Last 30 Days</p>
        <div className="grid grid-cols-10 gap-1">
          {data.last30Days.map((day, i) => (
            <div
              key={i}
              className="aspect-square rounded"
              title={`${day.date}: ${day.words} words`}
              style={{
                backgroundColor: day.words > 0
                  ? `rgba(37, 99, 235, ${0.2 + Math.min(0.8, day.words / 1200)})`
                  : '#e2e8f0',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1.5">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

function StreakCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-xl border text-center transition-shadow hover:shadow-card-hover ${highlight ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200' : 'bg-white border-gray-100'}`}>
      <p className={`text-xl font-extrabold ${highlight ? 'text-orange-600' : 'text-gray-800'}`}>{value}</p>
      <p className={`text-[9px] font-medium ${highlight ? 'text-orange-400' : 'text-gray-400'}`}>days</p>
      <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{label}</p>
    </div>
  );
}

// =============================================================================
// Smart Quotes
// =============================================================================

function SmartQuotesSection() {
  const [scanResult, setScanResult] = useState<{
    issues: Array<{ type: string; message: string; count: number }>;
    totalIssues: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setStatus(null);
    try {
      const result = await callGas<typeof scanResult>('scanSmartQuotes');
      setScanResult(result);
    } catch (err) {
      setStatus(`Scan failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleFixAll() {
    setFixing(true);
    try {
      const result = await callGas<{ fixed: number }>('fixSmartQuotes');
      setStatus(`Fixed ${result.fixed} quotes`);
      setScanResult(null);
    } catch (err) {
      setStatus(`Fix failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setFixing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">
        Scan for straight "quotes" and fix them to curly "quotes"
      </p>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full py-2.5 bg-bookify-600 text-white rounded-lg text-xs font-semibold
          hover:bg-bookify-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Scanning…' : 'Scan Document'}
      </button>

      {status && (
        <p className="text-[11px] p-2 bg-green-50 text-green-700 rounded-md border border-green-200">{status}</p>
      )}

      {scanResult && (
        <div className="space-y-2">
          {scanResult.totalIssues === 0 ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-xl mb-1">✓</p>
              <p className="text-xs text-green-700 font-semibold">All quotes are consistent!</p>
            </div>
          ) : (
            <>
              {scanResult.issues.map((issue, i) => (
                <div key={i} className="p-2.5 bg-amber-50 border border-amber-200 rounded-md flex gap-2">
                  <span className="text-amber-500 text-sm flex-shrink-0">⚠</span>
                  <p className="text-[11px] text-amber-800">{issue.message}</p>
                </div>
              ))}
              <button
                onClick={handleFixAll}
                disabled={fixing}
                className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-xs font-semibold
                  hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {fixing ? 'Fixing…' : `Fix All ${scanResult.totalIssues} Issues`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Writing Analysis
// =============================================================================

interface AnalysisResult {
  readingLevel: number;
  sentences: number;
  words: number;
  cliches: Array<{ phrase: string; count: number }>;
  wordFrequencies: Array<{ word: string; count: number }>;
}

function AnalyzeSection() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await callGas<AnalysisResult>('analyzeText');
      setData(res);
    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  const gradeLabel = (g: number) => {
    if (g <= 6) return 'Easy read';
    if (g <= 9) return 'Moderate';
    if (g <= 12) return 'Advanced';
    return 'Expert level';
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">Analyze reading level, clichés, and overused words.</p>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full py-2.5 bg-bookify-600 text-white rounded-lg text-xs font-semibold
          hover:bg-bookify-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Analyzing…' : 'Run Analysis'}
      </button>

      {error && (
        <p className="text-[11px] text-red-600 p-2 bg-red-50 rounded-md border border-red-200">{error}</p>
      )}

      {data && (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Readability</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-bookify-100 flex items-center justify-center flex-shrink-0">
                <span className="text-bookify-700 font-bold">{data.readingLevel}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Grade {data.readingLevel} · {gradeLabel(data.readingLevel)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Flesch-Kincaid score</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Clichés</p>
            {data.cliches.length === 0 ? (
              <p className="text-[11px] text-green-600">No common clichés found.</p>
            ) : (
              <ul className="space-y-1">
                {data.cliches.map((c, i) => (
                  <li key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-700 truncate mr-2">"{c.phrase}"</span>
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium flex-shrink-0">×{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Most Repeated Words</p>
            <div className="space-y-1.5">
              {data.wordFrequencies.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="text-gray-700 w-20 truncate">{w.word}</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-bookify-500 rounded-full"
                      style={{ width: `${(w.count / data.wordFrequencies[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-6 text-right text-[10px]">{w.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Image DPI Validator
// =============================================================================

interface DpiResult {
  total: number;
  warnings: Array<{ index: number; width: number; height: number; dpiEst: number; size: string; message: string }>;
}

function DpiValidatorSection() {
  const [data, setData] = useState<DpiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setError(null);
    try {
      const res = await callGas<DpiResult>('validateImageDPI');
      setData(res);
    } catch (err) {
      setError(`Validation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-gray-500">Scan document images to ensure they meet the 300 DPI minimum for Print.</p>

      <button
        onClick={handleScan}
        disabled={loading}
        className="w-full py-2.5 bg-bookify-600 text-white rounded-lg text-xs font-semibold
          hover:bg-bookify-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Scanning Images…' : 'Validate Print Quality'}
      </button>

      {error && (
        <p className="text-[11px] text-red-600 p-2 bg-red-50 rounded-md border border-red-200">{error}</p>
      )}

      {data && (
        <div className="space-y-3">
          {data.warnings.length === 0 ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-xl mb-1">✓</p>
              <p className="text-xs text-green-700 font-semibold">Perfect!</p>
              <p className="text-[11px] text-green-600 mt-1">All {data.total} images are high quality.</p>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-2">
                Warnings ({data.warnings.length} of {data.total})
              </p>
              <ul className="space-y-2">
                {data.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2 text-[11px] bg-white p-2 border border-red-100 rounded-md">
                    <span className="text-red-500 font-bold mt-0.5">⚠</span>
                    <div>
                      <p className="font-semibold text-gray-800">Image #{w.index}</p>
                      <p className="text-gray-600">Est. {Math.round(w.dpiEst)} DPI ({w.width}x{w.height}px, {w.size})</p>
                      <p className="text-red-600 mt-0.5">{w.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
