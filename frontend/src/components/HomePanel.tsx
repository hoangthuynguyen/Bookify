import { useState, useEffect } from 'react';
import { callGas } from '../hooks/useGasBridge';
import { useAppStore } from '../store/appStore';

interface Heading { text: string; level: number; index: number }

interface Snapshot {
  title: string;
  words: number;
  chapters: number;
  headings: Heading[];
  imagesTotal: number;
  imagesMissingAlt: number;
}

export function HomePanel() {
  const {
    setActiveTab,
    designApplied,
    typoFixed,
    lastExportUrl,
  } = useAppStore();

  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [content, wc, inv] = await Promise.all([
        callGas<{ headings: Heading[]; metadata: { title?: string } }>('getDocumentContent'),
        callGas<{ total: number; chapters: number }>('getWordCount').catch(() => ({ total: 0, chapters: 0 })),
        callGas<{ total: number; images: { alt: string }[] }>('getImageInventory').catch(() => ({ total: 0, images: [] })),
      ]);
      const headings = content.headings || [];
      setSnap({
        title: content.metadata?.title || 'Cuốn sách của bạn',
        words: wc.total,
        chapters: headings.filter(h => h.level === 1).length,
        headings,
        imagesTotal: inv.total,
        imagesMissingAlt: inv.images.filter(im => !im.alt?.trim()).length,
      });
    } catch { /* offline / no doc — leave snapshot empty */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const hasCopyright = !!snap?.headings.some(h => /bản quyền|copyright/i.test(h.text));

  const checklist = [
    {
      done: (snap?.chapters ?? 0) > 0,
      label: 'Cấu trúc chương (Heading 1)',
      detail: snap ? `${snap.chapters} chương` : '—',
      action: 'structure' as const,
      actionLabel: 'Xem cấu trúc',
    },
    {
      done: designApplied,
      label: 'Áp thiết kế / template',
      detail: designApplied ? 'Đã áp trong phiên này' : 'Chọn 1 trong 29 mẫu hoặc AI',
      action: 'themes' as const,
      actionLabel: 'Chọn mẫu',
    },
    {
      done: hasCopyright,
      label: 'Trang bản quyền',
      detail: hasCopyright ? 'Đã có trong tài liệu' : 'Chưa thấy trang "Bản quyền"',
      action: 'formatting' as const,
      actionLabel: 'Tạo trang',
    },
    {
      done: (snap?.imagesTotal ?? 0) === 0 || (snap?.imagesMissingAlt ?? 0) === 0,
      label: 'ALT text cho hình ảnh',
      detail: snap
        ? snap.imagesTotal === 0
          ? 'Không có ảnh'
          : snap.imagesMissingAlt === 0
            ? `${snap.imagesTotal} ảnh đều có ALT`
            : `${snap.imagesMissingAlt}/${snap.imagesTotal} ảnh thiếu ALT`
        : '—',
      action: 'formatting' as const,
      actionLabel: 'Image Organizer',
    },
    {
      done: typoFixed,
      label: 'Sửa typography (dấu câu, khoảng trắng)',
      detail: typoFixed ? 'Đã quét trong phiên này' : 'Chưa quét trong phiên này',
      action: 'tools' as const,
      actionLabel: 'Quét & sửa',
    },
    {
      done: !!lastExportUrl,
      label: 'Xuất thử EPUB/PDF',
      detail: lastExportUrl ? 'Đã xuất thành công' : 'Kiểm tra thành phẩm trước khi phát hành',
      action: 'export' as const,
      actionLabel: 'Xuất ngay',
    },
  ];

  const doneCount = checklist.filter(c => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="p-3 space-y-4 pb-20 animate-fade-in">
      {/* Book snapshot */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="px-4 py-4 bg-gradient-to-br from-bookify-600 via-bookify-500 to-indigo-500">
          <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Đang biên soạn</p>
          <p className="text-sm font-bold text-white leading-snug mt-0.5">{loading ? 'Đang đọc tài liệu…' : snap?.title}</p>
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-lg font-extrabold text-white leading-none">{snap ? snap.words.toLocaleString() : '–'}</p>
              <p className="text-[9px] text-white/60 font-medium mt-0.5">từ</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white leading-none">{snap?.chapters ?? '–'}</p>
              <p className="text-[9px] text-white/60 font-medium mt-0.5">chương</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-white leading-none">{snap?.imagesTotal ?? '–'}</p>
              <p className="text-[9px] text-white/60 font-medium mt-0.5">hình ảnh</p>
            </div>
            <button onClick={load} disabled={loading} className="ml-auto self-center text-[10px] text-white/70 hover:text-white font-semibold disabled:opacity-50">
              {loading ? '…' : '↻ Làm mới'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setActiveTab('themes')} className="py-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-bookify-200 transition-all text-center">
          <span className="block text-lg">📖</span>
          <span className="block text-[9px] font-bold text-gray-600 mt-1">Templates</span>
        </button>
        <button onClick={() => setActiveTab('design')} className="py-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-violet-200 transition-all text-center">
          <span className="block text-lg">✨</span>
          <span className="block text-[9px] font-bold text-gray-600 mt-1">AI Designer</span>
        </button>
        <button onClick={() => setActiveTab('export')} className="py-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-center">
          <span className="block text-lg">⬇️</span>
          <span className="block text-[9px] font-bold text-gray-600 mt-1">Xuất sách</span>
        </button>
      </div>

      {/* Publish-readiness checklist */}
      <div className="card-section space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-800">📋 Sẵn sàng xuất bản</p>
          <span className={`text-[10px] font-bold ${pct === 100 ? 'text-emerald-600' : 'text-gray-400'}`}>{doneCount}/{checklist.length}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-bookify-500 to-violet-500'}`}
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="text-[10px] text-emerald-600 font-semibold text-center">🎉 Cuốn sách đã sẵn sàng phát hành!</p>
        )}

        <div className="space-y-1.5">
          {checklist.map(item => (
            <div key={item.label} className={`flex items-center gap-2.5 p-2 rounded-lg border ${item.done ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-gray-100'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                ${item.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                {item.done ? '✓' : '○'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-semibold ${item.done ? 'text-gray-500' : 'text-gray-700'}`}>{item.label}</p>
                <p className="text-[9px] text-gray-400">{item.detail}</p>
              </div>
              {!item.done && (
                <button
                  onClick={() => setActiveTab(item.action)}
                  className="text-[9px] font-bold text-bookify-600 bg-bookify-50 px-2 py-1 rounded-md hover:bg-bookify-100 transition-colors shrink-0"
                >
                  {item.actionLabel} ›
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[9px] text-gray-400 text-center leading-relaxed">
        Quy trình gợi ý: Templates → Trang đầu sách → Sửa typo → ALT ảnh → Xuất EPUB/PDF.
        <br />Mục "thiết kế" và "typography" tính theo phiên làm việc hiện tại.
      </p>
    </div>
  );
}
