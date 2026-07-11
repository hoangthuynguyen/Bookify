import type { BookDesign } from '../lib/applyDesign';

/**
 * Curated one-click book templates: complete interior designs per topic.
 * Each bundles document theme + every export setting (fonts, drop caps,
 * scene breaks, heading gaps, trim size, binding, running headers).
 */
export interface BookTemplate {
  id: string;
  name: string;
  emoji: string;
  category: 'vietnamese' | 'fiction' | 'nonfiction' | 'special';
  description: string;
  design: BookDesign;
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  // ─── Sách Tiếng Việt ───
  // All fonts below ship a full Vietnamese subset (diacritics render correctly)
  {
    id: 'vn-phat-hoc',
    name: 'Phật học & Thiền',
    emoji: '🪷',
    category: 'vietnamese',
    description: 'Thanh tịnh, khoảng trắng rộng, hoa sen ngắt đoạn — hợp sách tâm linh, thiền, Phật pháp.',
    design: {
      bodyFont: 'EB Garamond', headingFont: 'Playfair Display', fontSize: 12, lineHeight: 1.7,
      colorAccent: '#5d4a7e', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '❀', headingGap: 'spacious', chapterStartPosition: 'middle',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'chapter_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-tieu-thuyet',
    name: 'Tiểu thuyết Việt',
    emoji: '📖',
    category: 'vietnamese',
    description: 'Lora ấm áp có đủ dấu tiếng Việt, drop cap trang nhã, nhịp đọc cổ điển.',
    design: {
      bodyFont: 'Lora', headingFont: 'Playfair Display', fontSize: 11.5, lineHeight: 1.6,
      colorAccent: '#8c3b2e', dropCaps: true, dropCapLines: 3, dropCapStyle: 'accent',
      sceneBreakSymbol: '❧', headingGap: 'normal', chapterStartPosition: 'top',
      trimSize: '5.25x8', bindingType: 'paperback', runningHeader: 'author_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-tan-van',
    name: 'Tản văn & Tùy bút',
    emoji: '🌾',
    category: 'vietnamese',
    description: 'Tiêu đề viết tay bay bổng, thân chữ mềm, nhiều khoảng thở — hợp tản văn, thơ xuôi.',
    design: {
      bodyFont: 'Noto Serif', headingFont: 'Dancing Script', fontSize: 11.5, lineHeight: 1.7,
      colorAccent: '#4a6b4f', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '· · ·', headingGap: 'spacious', chapterStartPosition: 'middle',
      trimSize: '5x8', bindingType: 'paperback', runningHeader: 'none',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-kinh-doanh',
    name: 'Kinh doanh & Kỹ năng',
    emoji: '💼',
    category: 'vietnamese',
    description: 'Montserrat hiện đại cho tiêu đề, bố cục gọn dễ tra cứu — sách self-help, khởi nghiệp.',
    design: {
      bodyFont: 'Noto Serif', headingFont: 'Montserrat', fontSize: 11, lineHeight: 1.55,
      colorAccent: '#14508c', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '— — —', headingGap: 'compact', chapterStartPosition: 'top',
      trimSize: '6x9', bindingType: 'paperback', runningHeader: 'chapter_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-giao-trinh',
    name: 'Giáo trình & Học thuật',
    emoji: '🎓',
    category: 'vietnamese',
    description: 'Times New Roman chuẩn học thuật Việt Nam, khổ lớn 7×10, mật độ chữ hợp lý.',
    design: {
      bodyFont: 'Times New Roman', headingFont: 'Arial', fontSize: 11, lineHeight: 1.45,
      colorAccent: '#1a1a1a', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '§', headingGap: 'compact', chapterStartPosition: 'top',
      trimSize: '7x10', bindingType: 'paperback', runningHeader: 'chapter_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-thieu-nhi',
    name: 'Thiếu nhi Việt',
    emoji: '🧒',
    category: 'vietnamese',
    description: 'Chữ to rõ, tiêu đề nét vẽ tay vui mắt, khổ vuông — truyện tranh chữ, sách kể chuyện.',
    design: {
      bodyFont: 'Verdana', headingFont: 'Patrick Hand', fontSize: 14, lineHeight: 1.7,
      colorAccent: '#e07b39', dropCaps: false, dropCapLines: 2, dropCapStyle: 'accent',
      sceneBreakSymbol: '★ ★ ★', headingGap: 'normal', chapterStartPosition: 'top',
      trimSize: '8.5x8.5', bindingType: 'hardcover', runningHeader: 'none',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-lich-su',
    name: 'Lịch sử & Văn hóa Việt',
    emoji: '🏮',
    category: 'vietnamese',
    description: 'Đỏ son trang trọng, drop cap hoa văn, mở chương bề thế — sử ký, biên khảo, văn hóa.',
    design: {
      bodyFont: 'Literata', headingFont: 'Playfair Display', fontSize: 11.5, lineHeight: 1.6,
      colorAccent: '#8b1e1e', dropCaps: true, dropCapLines: 3, dropCapStyle: 'ornate',
      sceneBreakSymbol: '❖', headingGap: 'dramatic', chapterStartPosition: 'top',
      trimSize: '6x9', bindingType: 'hardcover', runningHeader: 'author_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-kiem-hiep',
    name: 'Kiếm hiệp & Tiên hiệp',
    emoji: '⚔️',
    category: 'vietnamese',
    description: 'Xanh ngọc bích trầm mặc, drop cap 4 dòng khí thế, chương mở giữa trang như khai quyển.',
    design: {
      bodyFont: 'Noto Serif', headingFont: 'Playfair Display', fontSize: 11, lineHeight: 1.55,
      colorAccent: '#14524a', dropCaps: true, dropCapLines: 4, dropCapStyle: 'ornate',
      sceneBreakSymbol: '✦ ✦ ✦', headingGap: 'dramatic', chapterStartPosition: 'middle',
      trimSize: '6x9', bindingType: 'paperback', runningHeader: 'chapter_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-ngon-tinh',
    name: 'Ngôn tình & Lãng mạn',
    emoji: '💌',
    category: 'vietnamese',
    description: 'Hồng đất dịu dàng, tiêu đề chữ viết tay bay bổng, hoa ✿ ngắt cảnh.',
    design: {
      bodyFont: 'Lora', headingFont: 'Dancing Script', fontSize: 11, lineHeight: 1.65,
      colorAccent: '#b23a6a', dropCaps: true, dropCapLines: 3, dropCapStyle: 'accent',
      sceneBreakSymbol: '✿', headingGap: 'spacious', chapterStartPosition: 'top',
      trimSize: '5x8', bindingType: 'paperback', runningHeader: 'author_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-chua-lanh',
    name: 'Chữa lành & Sống chậm',
    emoji: '🌿',
    category: 'vietnamese',
    description: 'Xanh rêu êm dịu, giãn dòng rộng thư thái, chương mở giữa trang — healing, mindfulness.',
    design: {
      bodyFont: 'Noto Serif', headingFont: 'Montserrat', fontSize: 11.5, lineHeight: 1.75,
      colorAccent: '#2f6f5e', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '· ❋ ·', headingGap: 'spacious', chapterStartPosition: 'middle',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'none',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-nuoi-day-con',
    name: 'Nuôi dạy con',
    emoji: '👶',
    category: 'vietnamese',
    description: 'Be Vietnam Pro thân thiện, cam ấm áp, bố cục gọn dễ tra cứu từng mục.',
    design: {
      bodyFont: 'Noto Serif', headingFont: 'Be Vietnam Pro', fontSize: 11.5, lineHeight: 1.6,
      colorAccent: '#d97706', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '❤', headingGap: 'compact', chapterStartPosition: 'top',
      trimSize: '6x9', bindingType: 'paperback', runningHeader: 'chapter_title',
      language: 'vi', tocTitle: 'Mục lục',
    },
  },
  {
    id: 'vn-duong-sinh',
    name: 'Dưỡng sinh & Sức khỏe (Chữ lớn)',
    emoji: '👓',
    category: 'vietnamese',
    description: 'Bản chữ lớn 16pt+ cho người lớn tuổi: giãn dòng 1.8, mực đậm tương phản cao.',
    design: {
      bodyFont: 'Georgia', headingFont: 'Arial', fontSize: 14, lineHeight: 1.8,
      colorAccent: '#084c8d', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '* * *', headingGap: 'normal', chapterStartPosition: 'top',
      trimSize: '6.14x9.21', bindingType: 'paperback', runningHeader: 'chapter_title',
      language: 'vi', tocTitle: 'Mục lục',
      largePrint: true,
    },
  },

  // ─── Fiction ───
  {
    id: 'epic-fantasy',
    name: 'Epic Fantasy',
    emoji: '🐉',
    category: 'fiction',
    description: 'Ornate drop caps, dramatic chapter openings, decorative breaks — built for sagas.',
    design: {
      bodyFont: 'Crimson Text', headingFont: 'Baskerville', fontSize: 11.5, lineHeight: 1.55,
      colorAccent: '#5b3a1e', dropCaps: true, dropCapLines: 4, dropCapStyle: 'ornate',
      sceneBreakSymbol: '❖ ❖ ❖', headingGap: 'dramatic', chapterStartPosition: 'middle',
      trimSize: '6x9', bindingType: 'hardcover', runningHeader: 'author_title',
    },
  },
  {
    id: 'romance',
    name: 'Romance',
    emoji: '❤️',
    category: 'fiction',
    description: 'Soft serif, warm rose accents, elegant script-style drop caps.',
    design: {
      bodyFont: 'Lora', headingFont: 'Dancing Script', fontSize: 11, lineHeight: 1.6,
      colorAccent: '#9d3352', dropCaps: true, dropCapLines: 3, dropCapStyle: 'accent',
      sceneBreakSymbol: '❦', headingGap: 'spacious', chapterStartPosition: 'top',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'author_title',
    },
  },
  {
    id: 'thriller',
    name: 'Thriller / Mystery',
    emoji: '🔎',
    category: 'fiction',
    description: 'Tight spacing, stark black accents, no-nonsense chapters that keep pages turning.',
    design: {
      bodyFont: 'PT Serif', headingFont: 'Helvetica', fontSize: 11, lineHeight: 1.45,
      colorAccent: '#111111', dropCaps: false, dropCapLines: 3, dropCapStyle: 'classic',
      sceneBreakSymbol: '• • •', headingGap: 'compact', chapterStartPosition: 'top',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'chapter_title',
    },
  },
  {
    id: 'scifi',
    name: 'Science Fiction',
    emoji: '🚀',
    category: 'fiction',
    description: 'Clean sans headings, cool blue accents, geometric scene breaks.',
    design: {
      bodyFont: 'Georgia', headingFont: 'Trebuchet MS', fontSize: 11, lineHeight: 1.5,
      colorAccent: '#1e4d8c', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '◆ ◆ ◆', headingGap: 'normal', chapterStartPosition: 'top',
      trimSize: '6x9', bindingType: 'paperback', runningHeader: 'chapter_title',
    },
  },
  {
    id: 'literary',
    name: 'Literary Fiction',
    emoji: '🕊',
    category: 'fiction',
    description: 'Timeless Garamond, generous whitespace, understated elegance.',
    design: {
      bodyFont: 'Garamond', headingFont: 'Garamond', fontSize: 12, lineHeight: 1.65,
      colorAccent: '#333333', dropCaps: true, dropCapLines: 3, dropCapStyle: 'classic',
      sceneBreakSymbol: '~', headingGap: 'spacious', chapterStartPosition: 'middle',
      trimSize: '5.25x8', bindingType: 'paperback', runningHeader: 'author_title',
    },
  },
  {
    id: 'horror',
    name: 'Horror',
    emoji: '🕯',
    category: 'fiction',
    description: 'Distressed typewriter headings, deep red accents, unsettling breaks.',
    design: {
      bodyFont: 'Book Antiqua', headingFont: 'Special Elite', fontSize: 11, lineHeight: 1.5,
      colorAccent: '#7a1010', dropCaps: true, dropCapLines: 3, dropCapStyle: 'accent',
      sceneBreakSymbol: '✠ ✠ ✠', headingGap: 'dramatic', chapterStartPosition: 'bottom',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'none',
    },
  },
  {
    id: 'ya',
    name: 'Young Adult',
    emoji: '⚡',
    category: 'fiction',
    description: 'Friendly modern serif, vivid violet accents, energetic pacing.',
    design: {
      bodyFont: 'Merriweather', headingFont: 'Verdana', fontSize: 11, lineHeight: 1.6,
      colorAccent: '#6d28d9', dropCaps: false, dropCapLines: 2, dropCapStyle: 'accent',
      sceneBreakSymbol: '✦ ✦ ✦', headingGap: 'normal', chapterStartPosition: 'top',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'chapter_title',
    },
  },

  // ─── Non-fiction ───
  {
    id: 'business',
    name: 'Business / Startup',
    emoji: '📈',
    category: 'nonfiction',
    description: 'Crisp sans headings, navy accents, compact structure for skimmable chapters.',
    design: {
      bodyFont: 'PT Serif', headingFont: 'Arial', fontSize: 11, lineHeight: 1.5,
      colorAccent: '#0f3d68', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '— — —', headingGap: 'compact', chapterStartPosition: 'top',
      trimSize: '6x9', bindingType: 'paperback', runningHeader: 'chapter_title',
    },
  },
  {
    id: 'selfhelp',
    name: 'Self-Help',
    emoji: '🌱',
    category: 'nonfiction',
    description: 'Airy layout, calming green accents, welcoming reading rhythm.',
    design: {
      bodyFont: 'Lora', headingFont: 'Trebuchet MS', fontSize: 11.5, lineHeight: 1.7,
      colorAccent: '#1e6b4f', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '❋', headingGap: 'spacious', chapterStartPosition: 'top',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'chapter_title',
    },
  },
  {
    id: 'memoir',
    name: 'Memoir / Biography',
    emoji: '🖋',
    category: 'nonfiction',
    description: 'Classic Palatino, sepia accents, intimate old-book warmth.',
    design: {
      bodyFont: 'Palatino', headingFont: 'Palatino', fontSize: 11.5, lineHeight: 1.6,
      colorAccent: '#6b4f2a', dropCaps: true, dropCapLines: 3, dropCapStyle: 'classic',
      sceneBreakSymbol: '* * *', headingGap: 'spacious', chapterStartPosition: 'middle',
      trimSize: '5.5x8.5', bindingType: 'paperback', runningHeader: 'author_title',
    },
  },
  {
    id: 'academic',
    name: 'Academic / Textbook',
    emoji: '🎓',
    category: 'nonfiction',
    description: 'Dense but readable, numbered-friendly headings, larger workbook trim.',
    design: {
      bodyFont: 'Times New Roman', headingFont: 'Arial', fontSize: 11, lineHeight: 1.4,
      colorAccent: '#1a1a1a', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '§', headingGap: 'compact', chapterStartPosition: 'top',
      trimSize: '7x10', bindingType: 'paperback', runningHeader: 'chapter_title',
    },
  },
  {
    id: 'cookbook',
    name: 'Cookbook / Craft',
    emoji: '🍳',
    category: 'nonfiction',
    description: 'Square-ish workbook trim, warm terracotta accents, image-friendly.',
    design: {
      bodyFont: 'Georgia', headingFont: 'Verdana', fontSize: 10.5, lineHeight: 1.5,
      colorAccent: '#b0522d', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '◦ ◦ ◦', headingGap: 'compact', chapterStartPosition: 'top',
      trimSize: '8.5x8.5', bindingType: 'paperback', runningHeader: 'chapter_title',
    },
  },

  // ─── Special editions ───
  {
    id: 'childrens',
    name: "Children's Book",
    emoji: '🧸',
    category: 'special',
    description: 'Big friendly type, playful handwriting headings, bright colors.',
    design: {
      bodyFont: 'Verdana', headingFont: 'Caveat', fontSize: 14, lineHeight: 1.7,
      colorAccent: '#d97706', dropCaps: false, dropCapLines: 2, dropCapStyle: 'accent',
      sceneBreakSymbol: '★ ★ ★', headingGap: 'normal', chapterStartPosition: 'top',
      trimSize: '8.5x8.5', bindingType: 'hardcover', runningHeader: 'none',
    },
  },
  {
    id: 'large-print',
    name: 'Large Print Edition',
    emoji: '👓',
    category: 'special',
    description: 'Accessibility-first: 16pt+ type, 1.8 line spacing, high-contrast ink.',
    design: {
      bodyFont: 'Georgia', headingFont: 'Arial', fontSize: 14, lineHeight: 1.8,
      colorAccent: '#000000', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '* * *', headingGap: 'normal', chapterStartPosition: 'top',
      trimSize: '6.14x9.21', bindingType: 'paperback', runningHeader: 'chapter_title',
      largePrint: true,
    },
  },
  {
    id: 'poetry',
    name: 'Poetry Collection',
    emoji: '🍂',
    category: 'special',
    description: 'Delicate type, centered breath, minimal ornamentation.',
    design: {
      bodyFont: 'Baskerville', headingFont: 'Baskerville', fontSize: 11.5, lineHeight: 1.75,
      colorAccent: '#4a4a58', dropCaps: false, dropCapLines: 2, dropCapStyle: 'classic',
      sceneBreakSymbol: '·', headingGap: 'dramatic', chapterStartPosition: 'middle',
      trimSize: '5x8', bindingType: 'paperback', runningHeader: 'none',
    },
  },
];

export const TEMPLATE_CATEGORIES: { id: BookTemplate['category']; label: string }[] = [
  { id: 'vietnamese', label: 'Sách Tiếng Việt 🇻🇳' },
  { id: 'fiction', label: 'Fiction' },
  { id: 'nonfiction', label: 'Non-Fiction' },
  { id: 'special', label: 'Special Editions' },
];
