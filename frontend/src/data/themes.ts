export interface ThemePreset {
    id: string;
    name: string;
    genre: string;
    bodyFont: string;
    headingFont: string;
    fontSize: string;
    lineHeight: number;
    colorAccent: string;
    dropCaps: boolean;
    sceneBreakSymbol: string;
}

export const PRESET_THEMES: ThemePreset[] = [
    {
        id: 'theme-1',
        name: 'The Classic',
        genre: 'General Fiction / Literary',
        bodyFont: 'EB Garamond',
        headingFont: 'EB Garamond',
        fontSize: '11pt',
        lineHeight: 1.4,
        colorAccent: '#000000',
        dropCaps: true,
        sceneBreakSymbol: '***'
    },
    {
        id: 'theme-2',
        name: 'Modern Minimalist',
        genre: 'Contemporary / Non-Fiction',
        bodyFont: 'Roboto',
        headingFont: 'Montserrat',
        fontSize: '10.5pt',
        lineHeight: 1.6,
        colorAccent: '#2C3E50',
        dropCaps: false,
        sceneBreakSymbol: '• • •'
    },
    {
        id: 'theme-3',
        name: 'Romance Novel',
        genre: 'Romance / Women\'s Fiction',
        bodyFont: 'Crimson Text',
        headingFont: 'Playfair Display',
        fontSize: '11pt',
        lineHeight: 1.5,
        colorAccent: '#8E44AD',
        dropCaps: true,
        sceneBreakSymbol: '♡ ♡ ♡'
    },
    {
        id: 'theme-4',
        name: 'Sci-Fi Edge',
        genre: 'Science Fiction',
        bodyFont: 'Lato',
        headingFont: 'Roboto Mono',
        fontSize: '10.5pt',
        lineHeight: 1.5,
        colorAccent: '#2980B9',
        dropCaps: false,
        sceneBreakSymbol: '- - -'
    },
    {
        id: 'theme-5',
        name: 'Fantasy Epic',
        genre: 'Fantasy / Adventure',
        bodyFont: 'Lora',
        headingFont: 'Cinzel',
        fontSize: '11pt',
        lineHeight: 1.45,
        colorAccent: '#B9770E',
        dropCaps: true,
        sceneBreakSymbol: '✧ ✧ ✧'
    },
    {
        id: 'theme-6',
        name: 'Authoritative',
        genre: 'Non-Fiction / Business',
        bodyFont: 'PT Serif',
        headingFont: 'Open Sans',
        fontSize: '11pt',
        lineHeight: 1.5,
        colorAccent: '#117A65',
        dropCaps: false,
        sceneBreakSymbol: '■ ■ ■'
    },
    {
        id: 'theme-7',
        name: 'Thriller / Mystery',
        genre: 'Thriller / Mystery',
        bodyFont: 'Cardo',
        headingFont: 'Oswald',
        fontSize: '11pt',
        lineHeight: 1.5,
        colorAccent: '#7B241C',
        dropCaps: false,
        sceneBreakSymbol: '✦ ✦ ✦'
    },
    {
        id: 'theme-8',
        name: 'Historical Drama',
        genre: 'Historical Fiction',
        bodyFont: 'Cormorant Garamond',
        headingFont: 'Cinzel',
        fontSize: '11.5pt',
        lineHeight: 1.4,
        colorAccent: '#512E5F',
        dropCaps: true,
        sceneBreakSymbol: '❦ ❦ ❦'
    },
    {
        id: 'theme-9',
        name: 'Young Adult',
        genre: 'YA / Coming of Age',
        bodyFont: 'Merriweather',
        headingFont: 'Nunito',
        fontSize: '11pt',
        lineHeight: 1.6,
        colorAccent: '#D35400',
        dropCaps: false,
        sceneBreakSymbol: '⋆ ⋆ ⋆'
    },
    {
        id: 'theme-10',
        name: 'Poetry Collection',
        genre: 'Poetry / Prose',
        bodyFont: 'Spectral',
        headingFont: 'Spectral',
        fontSize: '12pt',
        lineHeight: 1.8,
        colorAccent: '#34495E',
        dropCaps: false,
        sceneBreakSymbol: '∼ ∼ ∼'
    },
    {
        id: 'theme-11',
        name: 'Memoirs & Auto',
        genre: 'Biography / Memoir',
        bodyFont: 'Libre Baskerville',
        headingFont: 'Lato',
        fontSize: '11pt',
        lineHeight: 1.55,
        colorAccent: '#1F618D',
        dropCaps: true,
        sceneBreakSymbol: '◦ ◦ ◦'
    },
    {
        id: 'theme-12',
        name: 'Clean & Crisp',
        genre: 'Self-Help / Wellness',
        bodyFont: 'Open Sans',
        headingFont: 'Open Sans',
        fontSize: '10.5pt',
        lineHeight: 1.6,
        colorAccent: '#1ABC9C',
        dropCaps: false,
        sceneBreakSymbol: '— — —'
    },
    {
        id: 'theme-13',
        name: 'Academic',
        genre: 'Textbook / Academic',
        bodyFont: 'Georgia',
        headingFont: 'Arial',
        fontSize: '11pt',
        lineHeight: 1.5,
        colorAccent: '#000000',
        dropCaps: false,
        sceneBreakSymbol: '***'
    },
    {
        id: 'theme-14',
        name: 'Fairytale',
        genre: 'Children / Fairy Tale',
        bodyFont: 'Lora',
        headingFont: 'Amita',
        fontSize: '12pt',
        lineHeight: 1.6,
        colorAccent: '#E74C3C',
        dropCaps: true,
        sceneBreakSymbol: '❀ ❀ ❀'
    },
    {
        id: 'theme-15',
        name: 'Cyberpunk',
        genre: 'Cyberpunk / Tech',
        bodyFont: 'Roboto',
        headingFont: 'Space Mono',
        fontSize: '10.5pt',
        lineHeight: 1.5,
        colorAccent: '#E67E22',
        dropCaps: false,
        sceneBreakSymbol: '// // //'
    },
    {
        id: 'theme-16',
        name: 'Cozy Mystery',
        genre: 'Cozy Mystery',
        bodyFont: 'Gelasio',
        headingFont: 'Pacifico',
        fontSize: '11.5pt',
        lineHeight: 1.5,
        colorAccent: '#16A085',
        dropCaps: true,
        sceneBreakSymbol: '☕ ☕ ☕'
    },
    {
        id: 'theme-17',
        name: 'Tech Manual',
        genre: 'Programming / IT',
        bodyFont: 'Inter',
        headingFont: 'Inter',
        fontSize: '10pt',
        lineHeight: 1.5,
        colorAccent: '#34495E',
        dropCaps: false,
        sceneBreakSymbol: '***'
    }
];
