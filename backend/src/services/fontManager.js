const https = require('https');

// =============================================================================
// Font Manager Service - Google Fonts API integration
// =============================================================================

const GOOGLE_FONTS_API = 'https://fonts.googleapis.com/css2';

// 200 book-appropriate fonts curated from Google Fonts
const BOOK_FONTS = {
  serif: [
    'Merriweather', 'Lora', 'Playfair Display', 'Crimson Text', 'Libre Baskerville',
    'EB Garamond', 'Cormorant Garamond', 'Source Serif 4', 'Bitter', 'Vollkorn',
    'Gentium Book Plus', 'Cardo', 'Alegreya', 'Spectral', 'Neuton',
    'Old Standard TT', 'Sorts Mill Goudy', 'Judson', 'Rosarivo', 'GFS Didot',
    'Della Respira', 'Fanwood Text', 'Lusitana', 'Noticia Text', 'Tinos',
    'Amiri', 'Cormorant', 'Crimson Pro', 'DM Serif Display', 'DM Serif Text',
    'Fraunces', 'IBM Plex Serif', 'Literata', 'Newsreader', 'Petrona',
    'Piazzolla', 'Brygada 1918', 'Gelasio', 'Martel', 'Stint Ultra Expanded',
  ],
  'sans-serif': [
    'Inter', 'Open Sans', 'Roboto', 'Lato', 'Nunito',
    'Work Sans', 'Raleway', 'Montserrat', 'Source Sans 3', 'PT Sans',
    'Noto Sans', 'IBM Plex Sans', 'DM Sans', 'Outfit', 'Plus Jakarta Sans',
    'Barlow', 'Rubik', 'Karla', 'Jost', 'Lexend',
    'Urbanist', 'Sora', 'Figtree', 'Onest', 'Geist',
  ],
  display: [
    'Abril Fatface', 'Cinzel', 'Cinzel Decorative', 'Yeseva One', 'Philosopher',
    'Marcellus', 'Cormorant Unicase', 'Poiret One', 'Forum', 'Tenor Sans',
    'Oranienbaum', 'Vidaloka', 'Unna', 'Corben', 'Almendra',
  ],
  handwriting: [
    'Dancing Script', 'Pacifico', 'Great Vibes', 'Sacramento', 'Satisfy',
    'Kalam', 'Caveat', 'Patrick Hand', 'Indie Flower', 'Shadows Into Light',
  ],
};

/**
 * Get list of all book-appropriate fonts organized by category
 */
function getFontList() {
  return Object.entries(BOOK_FONTS).map(([category, fonts]) => ({
    category,
    fonts: fonts.map(name => ({
      name,
      cssUrl: `${GOOGLE_FONTS_API}?family=${encodeURIComponent(name)}:wght@400;700&display=swap`,
    })),
  }));
}

/**
 * Get flat list of all font names
 */
function getAllFontNames() {
  return Object.values(BOOK_FONTS).flat();
}

/**
 * Fetch Google Font CSS for embedding in EPUB/PDF
 * @param {string} fontFamily - Font family name
 * @param {string[]} weights - Font weights to include (default: ['400', '700'])
 * @returns {string} CSS with @font-face declarations
 */
async function fetchFontCSS(fontFamily, weights = ['400', '700']) {
  const weightParam = weights.join(';');
  const url = `${GOOGLE_FONTS_API}?family=${encodeURIComponent(fontFamily)}:wght@${weightParam}&display=swap`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        // Request woff2 format
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Search fonts by name
 * @param {string} query - Search query
 * @returns {Array} Matching fonts
 */
function searchFonts(query) {
  const q = query.toLowerCase();
  const results = [];

  for (const [category, fonts] of Object.entries(BOOK_FONTS)) {
    for (const font of fonts) {
      if (font.toLowerCase().includes(q)) {
        results.push({ name: font, category });
      }
    }
  }

  return results;
}

module.exports = {
  getFontList,
  getAllFontNames,
  fetchFontCSS,
  searchFonts,
  BOOK_FONTS,
};
