// =============================================================================
// Bookify — Print Size, Binding Type & Genre Configuration
// =============================================================================

export type BindingType = 'paperback' | 'hardcover' | 'spiral';
export type MeasurementUnit = 'in' | 'cm';

export interface PrintSize {
    id: string;
    widthIn: number;
    heightIn: number;
    widthCm: number;
    heightCm: number;
    label: string;
    subtitle: string;
    binding: BindingType[];
    category: string; // e.g. "Trade Paperback", "Mass-Market", etc.
    popular?: boolean;
    bestFor?: string;
}

export interface GenreRecommendation {
    genre: string;
    format: 'epub' | 'pdf';
    sizeId: string;
    bindingType: BindingType;
    note: string;
}

// ── Utility: Convert inches ↔ cm ──
export function inToCm(inches: number): number {
    return Math.round(inches * 2.54 * 100) / 100;
}

export function formatDimension(widthIn: number, heightIn: number, unit: MeasurementUnit): string {
    if (unit === 'cm') {
        return `${inToCm(widthIn)} × ${inToCm(heightIn)} cm`;
    }
    return `${widthIn}″ × ${heightIn}″`;
}

// ── All Print Sizes ──
export const PRINT_SIZES: PrintSize[] = [
    // ─── Paperback — Trade ───
    {
        id: '5x8',
        widthIn: 5, heightIn: 8,
        widthCm: 12.7, heightCm: 20.32,
        label: '5″ × 8″',
        subtitle: 'Compact Trade',
        binding: ['paperback'],
        category: 'Trade Paperback',
    },
    {
        id: '5.06x7.81',
        widthIn: 5.06, heightIn: 7.81,
        widthCm: 12.85, heightCm: 19.84,
        label: '5.06″ × 7.81″',
        subtitle: 'B-Format',
        binding: ['paperback'],
        category: 'Trade Paperback',
    },
    {
        id: '5.25x8',
        widthIn: 5.25, heightIn: 8,
        widthCm: 13.34, heightCm: 20.32,
        label: '5.25″ × 8″',
        subtitle: 'Mid-size Trade',
        binding: ['paperback'],
        category: 'Trade Paperback',
    },
    {
        id: '5.5x8.5',
        widthIn: 5.5, heightIn: 8.5,
        widthCm: 13.97, heightCm: 21.59,
        label: '5.5″ × 8.5″',
        subtitle: 'Digest',
        binding: ['paperback', 'spiral'],
        category: 'Trade Paperback',
        popular: true,
        bestFor: 'Shorter novels, memoirs, planners, small cookbooks',
    },
    {
        id: '6x9',
        widthIn: 6, heightIn: 9,
        widthCm: 15.24, heightCm: 22.86,
        label: '6″ × 9″',
        subtitle: '★ US Trade Standard',
        binding: ['paperback', 'hardcover'],
        category: 'Trade Paperback',
        popular: true,
        bestFor: 'Most adult fiction & non-fiction, biographies',
    },
    {
        id: '6.14x9.21',
        widthIn: 6.14, heightIn: 9.21,
        widthCm: 15.6, heightCm: 23.39,
        label: '6.14″ × 9.21″',
        subtitle: 'Royal',
        binding: ['paperback', 'hardcover'],
        category: 'Trade Paperback',
        bestFor: 'Premium editions, literary fiction',
    },
    {
        id: '6.69x9.61',
        widthIn: 6.69, heightIn: 9.61,
        widthCm: 16.99, heightCm: 24.41,
        label: '6.69″ × 9.61″',
        subtitle: 'Pinched Crown',
        binding: ['paperback'],
        category: 'Trade Paperback',
    },

    // ─── Paperback — Mass-Market ───
    {
        id: '4.25x6.87',
        widthIn: 4.25, heightIn: 6.87,
        widthCm: 10.8, heightCm: 17.45,
        label: '4.25″ × 6.87″',
        subtitle: 'Mass-Market Pocket',
        binding: ['paperback'],
        category: 'Mass-Market Paperback',
        popular: true,
        bestFor: 'Romance, thrillers, airport/pocket books — high volume, low cost',
    },

    // ─── Large Format ───
    {
        id: '7x10',
        widthIn: 7, heightIn: 10,
        widthCm: 17.78, heightCm: 25.4,
        label: '7″ × 10″',
        subtitle: 'Professional Large Format',
        binding: ['paperback', 'spiral'],
        category: 'Large Format',
        popular: true,
        bestFor: 'Technical manuals, specialized journals, guides',
    },
    {
        id: '7.44x9.69',
        widthIn: 7.44, heightIn: 9.69,
        widthCm: 18.9, heightCm: 24.61,
        label: '7.44″ × 9.69″',
        subtitle: 'Crown Quarto',
        binding: ['paperback'],
        category: 'Large Format',
    },
    {
        id: '8x10',
        widthIn: 8, heightIn: 10,
        widthCm: 20.32, heightCm: 25.4,
        label: '8″ × 10″',
        subtitle: 'Visual Large Format',
        binding: ['paperback', 'hardcover'],
        category: 'Large Format',
        popular: true,
        bestFor: 'Children\'s picture books, photography, art books',
    },
    {
        id: '8.25x11',
        widthIn: 8.25, heightIn: 11,
        widthCm: 20.96, heightCm: 27.94,
        label: '8.25″ × 11″',
        subtitle: 'Coffee Table / Premium',
        binding: ['hardcover'],
        category: 'Large Format',
        bestFor: 'Coffee table books, premium hardcover art editions',
    },
    {
        id: '8.5x11',
        widthIn: 8.5, heightIn: 11,
        widthCm: 21.59, heightCm: 27.94,
        label: '8.5″ × 11″',
        subtitle: 'US Letter / Workbook',
        binding: ['paperback', 'hardcover', 'spiral'],
        category: 'Workbook Standard',
        popular: true,
        bestFor: 'Workbooks, coloring books, journals, textbooks, sheet music',
    },
    {
        id: '8.27x11.69',
        widthIn: 8.27, heightIn: 11.69,
        widthCm: 21.01, heightCm: 29.69,
        label: '8.27″ × 11.69″',
        subtitle: 'A4 International',
        binding: ['paperback', 'spiral'],
        category: 'Workbook Standard',
    },

    // ─── Square ───
    {
        id: '8.5x8.5',
        widthIn: 8.5, heightIn: 8.5,
        widthCm: 21.59, heightCm: 21.59,
        label: '8.5″ × 8.5″',
        subtitle: 'Square Premium',
        binding: ['hardcover'],
        category: 'Square Format',
        popular: true,
        bestFor: 'Children\'s books, photography books — feels premium in hand',
    },
];

// ── Sizes filtered by binding type ──
export function getSizesByBinding(binding: BindingType): PrintSize[] {
    return PRINT_SIZES.filter(s => s.binding.includes(binding));
}

// ── Get unique categories for a binding type ──
export function getCategoriesForBinding(binding: BindingType): string[] {
    const sizes = getSizesByBinding(binding);
    return [...new Set(sizes.map(s => s.category))];
}

// ── Genre Recommendations ──
export const GENRE_RECOMMENDATIONS: GenreRecommendation[] = [
    {
        genre: 'Novel / Fiction',
        format: 'epub',
        sizeId: '6x9',
        bindingType: 'paperback',
        note: '5.5″×8.5″ or 6″×9″ • EPUB for digital, PDF for print',
    },
    {
        genre: 'Non-Fiction / Memoir',
        format: 'epub',
        sizeId: '6x9',
        bindingType: 'paperback',
        note: '6″×9″ US Trade • EPUB for stores, PDF for print-on-demand',
    },
    {
        genre: 'Romance / Thriller',
        format: 'epub',
        sizeId: '4.25x6.87',
        bindingType: 'paperback',
        note: '4.25″×6.87″ Mass-Market Pocket • high volume, low cost',
    },
    {
        genre: 'Workbook / Manual',
        format: 'pdf',
        sizeId: '8.5x11',
        bindingType: 'spiral',
        note: '8.5″×11″ Spiral • lays flat for hands-on use',
    },
    {
        genre: "Children's Picture Book",
        format: 'pdf',
        sizeId: '8x10',
        bindingType: 'hardcover',
        note: '8″×10″ or 8.5″×8.5″ Square • Hardcover recommended',
    },
    {
        genre: 'Poetry / Short Stories',
        format: 'epub',
        sizeId: '5.5x8.5',
        bindingType: 'paperback',
        note: '5.5″×8.5″ Digest • compact and elegant',
    },
    {
        genre: 'Textbook / Academic',
        format: 'pdf',
        sizeId: '8.5x11',
        bindingType: 'hardcover',
        note: '8.5″×11″ Hardcover • durable for reference use',
    },
    {
        genre: 'Cookbook',
        format: 'pdf',
        sizeId: '7x10',
        bindingType: 'spiral',
        note: '7″×10″ Spiral • lays flat in kitchen',
    },
    {
        genre: 'Photography / Art Book',
        format: 'pdf',
        sizeId: '8.5x8.5',
        bindingType: 'hardcover',
        note: '8.5″×8.5″ Square Hardcover • premium visual showcase',
    },
    {
        genre: 'Journal / Planner',
        format: 'pdf',
        sizeId: '5.5x8.5',
        bindingType: 'spiral',
        note: '5.5″×8.5″ Spiral • portable and practical',
    },
    {
        genre: 'Biography',
        format: 'epub',
        sizeId: '6x9',
        bindingType: 'hardcover',
        note: '6″×9″ Hardcover • classic, dignified format',
    },
    {
        genre: 'Self-Help',
        format: 'epub',
        sizeId: '6x9',
        bindingType: 'paperback',
        note: '6″×9″ Trade Paperback • approachable and standard',
    },
];

// ── Binding type display info ──
export const BINDING_INFO: Record<BindingType, { label: string; icon: string; desc: string }> = {
    paperback: { label: 'Paperback', icon: '📖', desc: 'Trade & Mass-Market' },
    hardcover: { label: 'Hardcover', icon: '📕', desc: 'Rigid boards, premium feel' },
    spiral: { label: 'Spiral', icon: '🔗', desc: 'Lays flat, workbooks & manuals' },
};
