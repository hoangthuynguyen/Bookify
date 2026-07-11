import React from 'react';

export interface DeviceProfile {
    id: string;
    name: string;
    icon: string;
    width: number;    // in mm
    height: number;   // in mm
    fontSize: number;  // base font size in px
    eink: boolean;
    category: 'eink' | 'tablet' | 'phone' | 'print' | 'desktop';
    css: React.CSSProperties;
}

export const DEVICES: DeviceProfile[] = [
    // E-Ink readers
    {
        id: 'kindle-pw',
        name: 'Kindle PW',
        icon: '📖',
        width: 90,
        height: 122,
        fontSize: 16,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: 'Bookerly, Georgia, "Times New Roman", serif',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'subpixel-antialiased',
        },
    },
    {
        id: 'kindle-oasis',
        name: 'Kindle Oasis',
        icon: '📖',
        width: 107,
        height: 145,
        fontSize: 16,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: 'Bookerly, Georgia, "Times New Roman", serif',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'subpixel-antialiased',
        },
    },
    {
        id: 'kindle-scribe',
        name: 'Kindle Scribe',
        icon: '📖',
        width: 156,
        height: 210,
        fontSize: 16,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: 'Bookerly, Georgia, "Times New Roman", serif',
            lineHeight: 1.55,
            letterSpacing: '0.01em',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'subpixel-antialiased',
        },
    },
    {
        id: 'kobo-libra',
        name: 'Kobo Libra',
        icon: '📚',
        width: 128,
        height: 161,
        fontSize: 15,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: 'Georgia, "Palatino Linotype", serif',
            lineHeight: 1.55,
            letterSpacing: '0.005em',
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'kobo-clara',
        name: 'Kobo Clara',
        icon: '📚',
        width: 90,
        height: 122,
        fontSize: 15,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: 'Georgia, "Palatino Linotype", serif',
            lineHeight: 1.55,
            letterSpacing: '0.005em',
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'kobo-sage',
        name: 'Kobo Sage',
        icon: '📚',
        width: 152,
        height: 203,
        fontSize: 15,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: 'Georgia, "Palatino Linotype", serif',
            lineHeight: 1.55,
            letterSpacing: '0.005em',
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'nook-glowlight',
        name: 'Nook GlowLight',
        icon: '📗',
        width: 90,
        height: 122,
        fontSize: 15,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: 'Georgia, "Palatino Linotype", serif',
            lineHeight: 1.55,
            letterSpacing: '0.005em',
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'boox-poke',
        name: 'Boox Poke5',
        icon: '📱',
        width: 90,
        height: 122,
        fontSize: 14,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: '"Noto Serif", Georgia, serif',
            lineHeight: 1.5,
            letterSpacing: '0.005em',
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'remarkable2',
        name: 'reMarkable 2',
        icon: '✏️',
        width: 157,
        height: 210,
        fontSize: 15,
        eink: true,
        category: 'eink',
        css: {
            fontFamily: '"Noto Serif", Georgia, serif',
            lineHeight: 1.55,
            letterSpacing: '0.005em',
            textRendering: 'optimizeLegibility',
        },
    },
    // Tablets
    {
        id: 'ipad-mini',
        name: 'iPad Mini',
        icon: '📱',
        width: 134,
        height: 200,
        fontSize: 14,
        eink: false,
        category: 'tablet',
        css: {
            fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
            lineHeight: 1.5,
            WebkitFontSmoothing: 'antialiased',
        },
    },
    {
        id: 'ipad-pro',
        name: 'iPad Pro',
        icon: '🖥️',
        width: 178,
        height: 247,
        fontSize: 16,
        eink: false,
        category: 'tablet',
        css: {
            fontFamily: '"New York", Georgia, serif',
            lineHeight: 1.6,
            WebkitFontSmoothing: 'antialiased',
        },
    },
    {
        id: 'fire-tablet',
        name: 'Fire HD 10',
        icon: '🔥',
        width: 154,
        height: 254,
        fontSize: 15,
        eink: false,
        category: 'tablet',
        css: {
            fontFamily: '"Bookerly", Georgia, serif',
            lineHeight: 1.55,
            WebkitFontSmoothing: 'antialiased',
        },
    },
    {
        id: 'samsung-tab',
        name: 'Galaxy Tab S',
        icon: '📱',
        width: 165,
        height: 254,
        fontSize: 15,
        eink: false,
        category: 'tablet',
        css: {
            fontFamily: '"Roboto", "Noto Sans", system-ui, sans-serif',
            lineHeight: 1.5,
            WebkitFontSmoothing: 'antialiased',
        },
    },
    // Phones
    {
        id: 'iphone',
        name: 'iPhone',
        icon: '📲',
        width: 70,
        height: 144,
        fontSize: 13,
        eink: false,
        category: 'phone',
        css: {
            fontFamily: '-apple-system, "SF Pro Text", "Helvetica Neue", sans-serif',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            WebkitFontSmoothing: 'antialiased',
        },
    },
    {
        id: 'galaxy',
        name: 'Galaxy S',
        icon: '📲',
        width: 68,
        height: 147,
        fontSize: 13,
        eink: false,
        category: 'phone',
        css: {
            fontFamily: '"Roboto", "Noto Sans", system-ui, sans-serif',
            lineHeight: 1.45,
            WebkitFontSmoothing: 'antialiased',
        },
    },
    {
        id: 'pixel',
        name: 'Pixel',
        icon: '📲',
        width: 68,
        height: 147,
        fontSize: 13,
        eink: false,
        category: 'phone',
        css: {
            fontFamily: '"Google Sans Text", "Roboto", system-ui, sans-serif',
            lineHeight: 1.45,
            WebkitFontSmoothing: 'antialiased',
        },
    },
    // Desktop
    {
        id: 'desktop-wide',
        name: 'Desktop Wide',
        icon: '🖥️',
        width: 200,
        height: 130,
        fontSize: 16,
        eink: false,
        category: 'desktop',
        css: {
            fontFamily: 'Georgia, "Times New Roman", serif',
            lineHeight: 1.7,
            letterSpacing: '0.01em',
            WebkitFontSmoothing: 'antialiased',
            maxWidth: '650px',
            margin: '0 auto',
        },
    },
    {
        id: 'desktop-reading',
        name: 'Reading Mode',
        icon: '📖',
        width: 160,
        height: 200,
        fontSize: 17,
        eink: false,
        category: 'desktop',
        css: {
            fontFamily: '"Source Serif Pro", Georgia, serif',
            lineHeight: 1.8,
            letterSpacing: '0.01em',
            WebkitFontSmoothing: 'antialiased',
            maxWidth: '600px',
            margin: '0 auto',
        },
    },
    {
        id: 'desktop-calibre',
        name: 'Calibre Viewer',
        icon: '📚',
        width: 180,
        height: 200,
        fontSize: 15,
        eink: false,
        category: 'desktop',
        css: {
            fontFamily: '"Liberation Serif", Georgia, serif',
            lineHeight: 1.6,
            letterSpacing: '0.005em',
            WebkitFontSmoothing: 'antialiased',
        },
    },
    // Print
    {
        id: 'print-6x9',
        name: '6×9 Trade',
        icon: '🖨️',
        width: 152,
        height: 229,
        fontSize: 11,
        eink: false,
        category: 'print',
        css: {
            fontFamily: '"Garamond", "Times New Roman", "Palatino Linotype", serif',
            lineHeight: 1.5,
            letterSpacing: '0.01em',
            textAlign: 'justify' as const,
            hyphens: 'auto' as const,
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'print-5x8',
        name: '5×8 Digest',
        icon: '📄',
        width: 127,
        height: 203,
        fontSize: 10,
        eink: false,
        category: 'print',
        css: {
            fontFamily: '"Garamond", "Times New Roman", "Palatino Linotype", serif',
            lineHeight: 1.45,
            letterSpacing: '0.01em',
            textAlign: 'justify' as const,
            hyphens: 'auto' as const,
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'print-4.25x6.87',
        name: '4.25×6.87 Pocket',
        icon: '📗',
        width: 108,
        height: 175,
        fontSize: 9,
        eink: false,
        category: 'print',
        css: {
            fontFamily: '"Garamond", "Times New Roman", serif',
            lineHeight: 1.35,
            letterSpacing: '0.005em',
            textAlign: 'justify' as const,
            hyphens: 'auto' as const,
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'print-8.5x8.5',
        name: '8.5×8.5 Square',
        icon: '📕',
        width: 216,
        height: 216,
        fontSize: 12,
        eink: false,
        category: 'print',
        css: {
            fontFamily: '"Georgia", "Palatino Linotype", serif',
            lineHeight: 1.55,
            letterSpacing: '0.01em',
            textAlign: 'left' as const,
            textRendering: 'optimizeLegibility',
        },
    },
    {
        id: 'print-8.5x11',
        name: '8.5×11 Letter',
        icon: '📋',
        width: 216,
        height: 279,
        fontSize: 11,
        eink: false,
        category: 'print',
        css: {
            fontFamily: '"Arial", "Helvetica Neue", system-ui, sans-serif',
            lineHeight: 1.5,
            textAlign: 'left' as const,
            textRendering: 'optimizeLegibility',
        },
    },
];

export const CATEGORY_LABELS: Record<string, string> = {
    eink: 'E-Readers',
    tablet: 'Tablets',
    phone: 'Phones',
    desktop: 'Desktop',
    print: 'Print',
};

// =============================================================================
// Theme profiles for preview
// =============================================================================

export interface ThemePreset {
    id: string;
    name: string;
    bodyBg: string;
    textColor: string;
    headingColor: string;
    headingFont: string;
    bodyFont: string;
    description?: string;
}

export const THEME_PRESETS: ThemePreset[] = [
    { id: 'default', name: 'Default', bodyBg: '#ffffff', textColor: '#1a1a1a', headingColor: '#111', headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif', description: 'Clean white background with classic serif typography. Universal, works for any genre.' },
    { id: 'warm', name: 'Warm Sepia', bodyBg: '#f5f0e8', textColor: '#3d3226', headingColor: '#2a1f14', headingFont: '"Playfair Display", Georgia, serif', bodyFont: '"Crimson Text", Georgia, serif', description: 'Warm parchment tone that reduces eye strain. Great for long reading sessions, literary fiction and memoir.' },
    { id: 'modern', name: 'Modern', bodyBg: '#fafafa', textColor: '#333333', headingColor: '#0f172a', headingFont: '"Inter", system-ui, sans-serif', bodyFont: '"Source Serif Pro", Georgia, serif', description: 'Crisp, contemporary look with sans-serif headings. Ideal for non-fiction, tech, and business books.' },
    { id: 'dark', name: 'Dark Mode', bodyBg: '#1a1a2e', textColor: '#e0e0e0', headingColor: '#ffffff', headingFont: 'system-ui, sans-serif', bodyFont: 'Georgia, serif', description: 'Dark background for comfortable night reading. Reduces blue light exposure for better sleep.' },
    { id: 'literary', name: 'Literary', bodyBg: '#fffef5', textColor: '#2c2c2c', headingColor: '#1a1a1a', headingFont: '"EB Garamond", Garamond, serif', bodyFont: '"EB Garamond", Garamond, serif', description: 'Elegant old-world typesetting with warm cream background. Perfect for literary fiction and poetry.' },
];
