import { useState, useEffect, useMemo } from 'react';
import { callGas } from '../hooks/useGasBridge';
import { BOOK_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/bookTemplates';
import type { BookTemplate } from '../data/bookTemplates';
import { applyBookDesign } from '../lib/applyDesign';
import { PRINT_SIZES } from '../data/printSizes';

const MY_TEMPLATES_KEY = 'bookify_my_templates_v1';

const ACCENT_SWATCHES = [
  '#1a1a1a', '#5d4a7e', '#8b1e1e', '#8c3b2e', '#b23a6a',
  '#14524a', '#2f6f5e', '#14508c', '#6d28d9', '#d97706',
];

const VN_SAMPLE = 'ió thoảng qua triền đê, ánh trăng lặng lẽ ươm vàng bến nước, tiếng mẹ ru khe khẽ giữa trưa hè oi ả. Những trang sách mở ra một thế giới mới, nơi từng con chữ được chăm chút như người thợ kim hoàn giũa từng nét bạc…';
const EN_SAMPLE = 'nce upon a time, in a kingdom by the sea, there lived a storyteller whose words could mend broken hearts and light the darkest nights…';

type CatFilter = 'all' | 'mine' | BookTemplate['category'];

export function TemplateGallery() {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [myTemplates, setMyTemplates] = useState<BookTemplate[]>([]);
  const [preview, setPreview] = useState<BookTemplate | null>(null);
  const [applying, setApplying] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  // Quick-customize state (seeded from the template when the modal opens)
  const [customAccent, setCustomAccent] = useState('#333333');
  const [customFontSize, setCustomFontSize] = useState(11);
  const [customTrim, setCustomTrim] = useState('6x9');
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    try {
      setMyTemplates(JSON.parse(localStorage.getItem(MY_TEMPLATES_KEY) || '[]'));
    } catch { /* corrupt storage */ }
  }, []);

  function openPreview(t: BookTemplate) {
    setPreview(t);
    setCustomAccent(t.design.colorAccent);
    setCustomFontSize(t.design.fontSize);
    setCustomTrim(t.design.trimSize);
    setSaveName('');
  }

  const customizedDesign = preview ? {
    ...preview.design,
    colorAccent: customAccent,
    fontSize: customFontSize,
    trimSize: customTrim,
  } : null;

  const isCustomized = preview && (
    customAccent !== preview.design.colorAccent ||
    customFontSize !== preview.design.fontSize ||
    customTrim !== preview.design.trimSize
  );

  const allTemplates = useMemo(() => [...myTemplates, ...BOOK_TEMPLATES], [myTemplates]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTemplates.filter(t => {
      if (catFilter === 'mine' && !t.id.startsWith('my_')) return false;
      if (catFilter !== 'all' && catFilter !== 'mine' && t.category !== catFilter) return false;
      if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allTemplates, search, catFilter]);

  async function handleApply(t: BookTemplate, design = t.design) {
    setApplying(true);
    setStatus(null);
    try {
      await applyBookDesign(design);
      setAppliedId(t.id);
      setStatus({ text: `Đã áp dụng "${t.name}" — tài liệu đã được style, thiết lập xuất đã điền sẵn!`, ok: true });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : String(err), ok: false });
    } finally {
      setApplying(false);
    }
  }

  function handleSaveMine() {
    if (!preview || !customizedDesign) return;
    const name = saveName.trim() || `${preview.name} (bản của tôi)`;
    const mine: BookTemplate = {
      ...preview,
      id: `my_${Date.now()}`,
      name,
      emoji: '💾',
      description: `Tùy chỉnh từ "${preview.name}" — màu ${customAccent}, ${customFontSize}pt, khổ ${customTrim}.`,
      design: customizedDesign,
    };
    const next = [mine, ...myTemplates];
    setMyTemplates(next);
    localStorage.setItem(MY_TEMPLATES_KEY, JSON.stringify(next));
    setStatus({ text: `Đã lưu "${name}" vào Mẫu của tôi 💾`, ok: true });
    setSaveName('');
  }

  function deleteMine(id: string) {
    const next = myTemplates.filter(t => t.id !== id);
    setMyTemplates(next);
    localStorage.setItem(MY_TEMPLATES_KEY, JSON.stringify(next));
  }

  async function handleStarterPack() {
    setApplying(true);
    try {
      const content = await callGas<{ metadata: { title?: string } }>('getDocumentContent');
      const year = new Date().getFullYear();
      await callGas('insertFrontMatter', 'copyright', { lang: 'vi', year, author: 'Tác giả' }, 'front');
      await callGas('insertFrontMatter', 'title-page', {
        title: content.metadata?.title || 'Tựa Sách',
        author: 'Tác giả',
      }, 'front');
      setStatus({ text: 'Đã tạo Trang tiêu đề + Bản quyền tiếng Việt ở đầu sách — sửa tên tác giả trong tài liệu nhé!', ok: true });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : String(err), ok: false });
    } finally {
      setApplying(false);
    }
  }

  const CAT_CHIPS: { id: CatFilter; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    ...(myTemplates.length > 0 ? [{ id: 'mine' as CatFilter, label: '💾 Của tôi' }] : []),
    ...TEMPLATE_CATEGORIES.map(c => ({ id: c.id as CatFilter, label: c.label })),
  ];

  const trimOptions = PRINT_SIZES.map(s => ({ id: s.id, label: `${s.label}${s.popular ? ' ★' : ''}` }));

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <input
        type="text"
        placeholder="🔍 Tìm mẫu… (vd: phật, romance, chữ lớn)"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field"
      />
      <div className="flex flex-wrap gap-1">
        {CAT_CHIPS.map(c => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            className={`px-2 py-1 rounded-full text-[10px] font-bold border transition-colors
              ${catFilter === c.id
                ? 'bg-bookify-600 text-white border-bookify-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {status && (
        <div className={`p-2 rounded-lg text-[11px] border ${status.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {status.text}
        </div>
      )}

      {visible.length === 0 && (
        <p className="text-[11px] text-gray-400 text-center py-6">Không tìm thấy mẫu phù hợp.</p>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {visible.map(t => (
          <div key={t.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md hover:border-bookify-200 transition-all cursor-pointer"
            onClick={() => openPreview(t)}>
            <div className="px-4 py-3" style={{ background: `${t.design.colorAccent}0d` }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-gray-800">{t.emoji} {t.name}</p>
                <div className="flex items-center gap-1.5">
                  {appliedId === t.id && <span className="text-[9px] font-bold text-emerald-600">✓ đang dùng</span>}
                  <span className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0" style={{ background: t.design.colorAccent }} />
                </div>
              </div>
              <p className="text-center text-[13px] font-bold mb-1" style={{ fontFamily: t.design.headingFont, color: t.design.colorAccent }}>
                {t.category === 'vietnamese' ? 'Chương Một' : 'Chapter One'}
              </p>
              <p className="text-[10px] text-gray-600 leading-snug line-clamp-2" style={{ fontFamily: t.design.bodyFont, lineHeight: t.design.lineHeight }}>
                {t.design.dropCaps && (
                  <span className="float-left mr-0.5 font-bold" style={{
                    fontSize: `${t.design.dropCapLines * 11}px`, lineHeight: 0.8,
                    color: t.design.dropCapStyle === 'classic' ? '#1a1a1a' : t.design.colorAccent,
                    fontFamily: t.design.dropCapStyle === 'ornate' ? t.design.headingFont : t.design.bodyFont,
                  }}>{t.category === 'vietnamese' ? 'G' : 'O'}</span>
                )}
                {(t.category === 'vietnamese' ? (t.design.dropCaps ? VN_SAMPLE : 'G' + VN_SAMPLE) : (t.design.dropCaps ? EN_SAMPLE : 'O' + EN_SAMPLE)).slice(0, 110)}…
              </p>
              <div className="clear-both" />
            </div>
            <div className="px-3 py-2 flex items-center justify-between gap-2 border-t border-gray-50">
              <p className="text-[9px] text-gray-400 leading-snug flex-1 line-clamp-2">{t.description}</p>
              {t.id.startsWith('my_') && (
                <button onClick={(e) => { e.stopPropagation(); deleteMine(t.id); }}
                  className="text-[9px] text-red-300 hover:text-red-500 font-bold shrink-0">Xóa</button>
              )}
              <span className="text-[9px] font-bold text-bookify-500 shrink-0">Xem &amp; Áp dụng ›</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-gray-400 text-center">
        Bấm vào mẫu để xem trước cỡ lớn, tinh chỉnh màu/cỡ chữ/khổ sách và lưu thành mẫu riêng.
      </p>

      {/* ── Preview & Customize Modal ── */}
      {preview && customizedDesign && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setPreview(null)}>
          <div
            className="bg-white w-full max-h-[92%] rounded-t-2xl overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
              <div>
                <p className="text-sm font-bold text-gray-900">{preview.emoji} {preview.name}</p>
                <p className="text-[10px] text-gray-400">{preview.description}</p>
              </div>
              <button onClick={() => setPreview(null)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-sm font-bold hover:bg-gray-200">×</button>
            </div>

            {/* Large page mock */}
            <div className="p-4 bg-gray-100">
              <div className="mx-auto bg-white shadow-lg rounded-sm px-6 py-6 max-w-[240px]" style={{ aspectRatio: '2/3' }}>
                {customizedDesign.runningHeader !== 'none' && (
                  <p className="text-center text-[6px] tracking-[0.2em] text-gray-400 mb-3" style={{ fontFamily: customizedDesign.bodyFont }}>
                    {customizedDesign.runningHeader === 'chapter_title' ? 'CHƯƠNG MỘT' : 'TÁC GIẢ / TỰA SÁCH'}
                  </p>
                )}
                <div style={{ paddingTop: customizedDesign.chapterStartPosition === 'middle' ? '18%' : customizedDesign.chapterStartPosition === 'bottom' ? '32%' : '4%' }}>
                  <p className="text-center font-bold mb-3" style={{
                    fontFamily: customizedDesign.headingFont,
                    color: customAccent,
                    fontSize: '15px',
                    marginBottom: customizedDesign.headingGap === 'compact' ? 6 : customizedDesign.headingGap === 'spacious' ? 16 : customizedDesign.headingGap === 'dramatic' ? 22 : 10,
                  }}>
                    {preview.category === 'vietnamese' ? 'Chương Một' : 'Chapter One'}
                  </p>
                  <p className="text-gray-700" style={{
                    fontFamily: customizedDesign.bodyFont,
                    fontSize: `${Math.max(7, customFontSize * 0.75)}px`,
                    lineHeight: customizedDesign.lineHeight,
                    textAlign: 'justify',
                  }}>
                    {customizedDesign.dropCaps && (
                      <span className="float-left mr-0.5 font-bold" style={{
                        fontSize: `${customizedDesign.dropCapLines * customFontSize * 0.72}px`, lineHeight: 0.8,
                        color: customizedDesign.dropCapStyle === 'classic' ? '#1a1a1a' : customAccent,
                        fontFamily: customizedDesign.dropCapStyle === 'ornate' ? customizedDesign.headingFont : customizedDesign.bodyFont,
                      }}>{preview.category === 'vietnamese' ? 'G' : 'O'}</span>
                    )}
                    {preview.category === 'vietnamese' ? VN_SAMPLE : EN_SAMPLE}
                  </p>
                  <div className="clear-both" />
                  <p className="text-center mt-3" style={{ color: customAccent, letterSpacing: '0.3em', fontSize: '8px' }}>
                    {customizedDesign.sceneBreakSymbol}
                  </p>
                </div>
              </div>
              <p className="text-center text-[9px] text-gray-400 mt-2">
                Khổ {customTrim} · {customFontSize}pt · giãn dòng {customizedDesign.lineHeight}
              </p>
            </div>

            {/* Quick customize */}
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-700">🎨 Tinh chỉnh nhanh</p>

              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Màu nhấn</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ACCENT_SWATCHES.map(c => (
                    <button key={c} onClick={() => setCustomAccent(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${customAccent === c ? 'border-gray-800 scale-110' : 'border-white shadow-sm'}`}
                      style={{ background: c }} />
                  ))}
                  <input type="color" value={customAccent} onChange={e => setCustomAccent(e.target.value)}
                    className="w-8 h-6 rounded cursor-pointer border border-gray-200" title="Chọn màu tùy ý" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Cỡ chữ: <b>{customFontSize}pt</b></label>
                  <input type="range" min={10} max={14} step={0.5} value={customFontSize}
                    onChange={e => setCustomFontSize(Number(e.target.value))} className="w-full accent-bookify-600" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Khổ sách</label>
                  <select value={customTrim} onChange={e => setCustomTrim(e.target.value)} className="select-field !text-[10px]">
                    {trimOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => handleApply(preview, customizedDesign)}
                disabled={applying}
                className="w-full py-2.5 bg-bookify-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-bookify-700 transition-colors"
              >
                {applying ? 'Đang áp dụng…' : appliedId === preview.id ? '↻ Áp dụng lại' : `✓ Áp dụng${isCustomized ? ' (đã tinh chỉnh)' : ''}`}
              </button>

              {appliedId === preview.id && preview.category === 'vietnamese' && (
                <button
                  onClick={handleStarterPack}
                  disabled={applying}
                  className="w-full py-2 rounded-xl text-[10px] font-bold border-2 border-bookify-200 text-bookify-700 bg-bookify-50 hover:bg-bookify-100 transition-colors disabled:opacity-50"
                >
                  {applying ? 'Đang tạo…' : '📄 Tạo trang đầu sách (Tiêu đề + Bản quyền VN)'}
                </button>
              )}

              <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="Tên mẫu của bạn…"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  className="input-field flex-1 !text-[10px]"
                />
                <button
                  onClick={handleSaveMine}
                  className="px-3 py-2 bg-gray-800 text-white rounded-lg text-[10px] font-bold hover:bg-gray-900 transition-colors shrink-0"
                >
                  💾 Lưu mẫu
                </button>
              </div>
              <p className="text-[9px] text-gray-400">Mẫu đã lưu xuất hiện trong bộ lọc "💾 Của tôi" (lưu trên trình duyệt này).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
