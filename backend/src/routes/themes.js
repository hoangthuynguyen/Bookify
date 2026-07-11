const express = require('express');
const router = express.Router();
const { saveCustomTheme, getUserThemes, deleteCustomTheme } = require('../services/supabaseClient');

/**
 * GET /themes/presets
 * Returns all preset themes
 */
router.get('/presets', (req, res) => {
  res.json({ themes: PRESET_THEMES });
});

/**
 * GET /themes/custom
 * Returns user's custom themes
 */
router.get('/custom', async (req, res) => {
  try {
    const themes = await getUserThemes(req.user.id);
    res.json({ themes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get themes', details: error.message });
  }
});

/**
 * POST /themes/custom
 * Save a new custom theme
 */
router.post('/custom', async (req, res) => {
  try {
    const { name, themeConfig } = req.body;
    if (!name || !themeConfig) {
      return res.status(400).json({ error: 'name and themeConfig are required' });
    }
    const theme = await saveCustomTheme(req.user.id, name, themeConfig);
    res.json({ theme });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save theme', details: error.message });
  }
});

/**
 * DELETE /themes/custom/:id
 */
router.delete('/custom/:id', async (req, res) => {
  try {
    await deleteCustomTheme(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete theme', details: error.message });
  }
});

// =============================================================================
// Preset Themes
// =============================================================================

const PRESET_THEMES = [
  {
    id: 'lonely-planet-travel',
    name: 'Lonely Planet (Travel Guide)',
    genre: 'Travel / Guidebook',
    bodyFont: 'Open Sans',
    headingFont: 'Montserrat',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    margins: { top: '0.75in', bottom: '0.75in', inner: '0.85in', outer: '0.65in' },
    dropCaps: false,
    sceneBreakSymbol: '\u25CF \u25CF \u25CF', // 3 bullets
    chapterHeadingStyle: 'sans-bold-left',
    colorAccent: '#0054A6', // Lonely Planet Blue
    cssVars: { '--chapter-transform': 'uppercase', '--chapter-spacing': '2em' },
  },
  {
    id: 'dk-travel-visual',
    name: 'DK Travel (Visual Guide)',
    genre: 'Travel / Photography',
    bodyFont: 'Lato',
    headingFont: 'Oswald',
    fontSize: '11pt',
    lineHeight: 1.6,
    margins: { top: '0.5in', bottom: '0.5in', inner: '0.5in', outer: '0.5in' }, // Smaller margins for images
    dropCaps: false,
    sceneBreakSymbol: '\u25A0 \u25A0 \u25A0', // 3 squares
    chapterHeadingStyle: 'modern-box',
    colorAccent: '#D32F2F', // Deep Red
    cssVars: { '--image-padding': '0', '--text-align': 'left' },
  },
  {
    id: 'bookify-austen',
    name: 'The Austen (Romance)',
    genre: 'Romance / Historical',
    bodyFont: 'EB Garamond',
    headingFont: 'Great Vibes',
    fontSize: '11pt',
    lineHeight: 1.6,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '0.75in' },
    dropCaps: true,
    sceneBreakSymbol: '\u2766',
    chapterHeadingStyle: 'script-centered',
    colorAccent: '#D81B60',
    cssVars: {},
  },
  {
    id: 'vellum-meridian',
    name: 'Meridian (Classic)',
    genre: 'Literary Fiction',
    bodyFont: 'Lora',
    headingFont: 'Cinzel',
    fontSize: '11pt',
    lineHeight: 1.55,
    margins: { top: '0.9in', bottom: '0.9in', inner: '0.9in', outer: '0.7in' },
    dropCaps: true,
    sceneBreakSymbol: '\u2022 \u2022 \u2022',
    chapterHeadingStyle: 'centered-caps',
    colorAccent: '#1C2833',
    cssVars: {},
  },
  {
    id: 'bookify-king',
    name: 'The King (Thriller)',
    genre: 'Thriller / Mystery',
    bodyFont: 'Merriweather',
    headingFont: 'Oswald',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    margins: { top: '0.85in', bottom: '0.85in', inner: '0.85in', outer: '0.65in' },
    dropCaps: false,
    sceneBreakSymbol: '\u2014 \u2020 \u2014',
    chapterHeadingStyle: 'bold-left',
    colorAccent: '#8B0000',
    cssVars: { '--chapter-transform': 'uppercase' },
  },
  {
    id: 'vellum-trace',
    name: 'Trace (Modern)',
    genre: 'Non-Fiction / Sci-Fi',
    bodyFont: 'Open Sans',
    headingFont: 'Montserrat',
    fontSize: '10.5pt',
    lineHeight: 1.6,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '1in' },
    dropCaps: false,
    sceneBreakSymbol: '\u25C6 \u25C6 \u25C6',
    chapterHeadingStyle: 'sans-minimal',
    colorAccent: '#2980B9',
    cssVars: { '--letter-spacing': '0.05em' },
  },
  {
    id: 'classic-literary',
    name: 'Classic Literary',
    genre: 'Literary Fiction',
    bodyFont: 'EB Garamond',
    headingFont: 'Cinzel',
    fontSize: '11pt',
    lineHeight: 1.6,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '0.75in' },
    dropCaps: true,
    sceneBreakSymbol: '\u2022 \u2022 \u2022',
    chapterHeadingStyle: 'centered-caps',
    colorAccent: '#2C1810',
    cssVars: { '--chapter-spacing': '4em', '--para-indent': '1.5em' },
  },
  {
    id: 'contemporary-fiction',
    name: 'Contemporary Fiction',
    genre: 'Contemporary',
    bodyFont: 'Lora',
    headingFont: 'Playfair Display',
    fontSize: '11pt',
    lineHeight: 1.55,
    margins: { top: '0.9in', bottom: '0.9in', inner: '0.9in', outer: '0.7in' },
    dropCaps: false,
    sceneBreakSymbol: '* * *',
    chapterHeadingStyle: 'left-aligned',
    colorAccent: '#333333',
    cssVars: {},
  },
  {
    id: 'mystery-thriller',
    name: 'Mystery / Thriller',
    genre: 'Mystery',
    bodyFont: 'Source Serif 4',
    headingFont: 'DM Serif Display',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    margins: { top: '0.85in', bottom: '0.85in', inner: '0.85in', outer: '0.65in' },
    dropCaps: false,
    sceneBreakSymbol: '\u2014',
    chapterHeadingStyle: 'bold-number',
    colorAccent: '#1a1a1a',
    cssVars: { '--chapter-transform': 'uppercase' },
  },
  {
    id: 'romance',
    name: 'Romance',
    genre: 'Romance',
    bodyFont: 'Crimson Text',
    headingFont: 'Great Vibes',
    fontSize: '11pt',
    lineHeight: 1.6,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '0.8in' },
    dropCaps: true,
    sceneBreakSymbol: '\u2766',
    chapterHeadingStyle: 'script-centered',
    colorAccent: '#8B2252',
    cssVars: {},
  },
  {
    id: 'fantasy-epic',
    name: 'Fantasy / Epic',
    genre: 'Fantasy',
    bodyFont: 'Gentium Book Plus',
    headingFont: 'Cinzel Decorative',
    fontSize: '11pt',
    lineHeight: 1.6,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '0.8in' },
    dropCaps: true,
    sceneBreakSymbol: '\u2726',
    chapterHeadingStyle: 'ornate-centered',
    colorAccent: '#4A2F1D',
    cssVars: { '--drop-cap-size': '4em' },
  },
  {
    id: 'sci-fi',
    name: 'Science Fiction',
    genre: 'Sci-Fi',
    bodyFont: 'IBM Plex Serif',
    headingFont: 'IBM Plex Sans',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    margins: { top: '0.85in', bottom: '0.85in', inner: '0.85in', outer: '0.65in' },
    dropCaps: false,
    sceneBreakSymbol: '\u25C6',
    chapterHeadingStyle: 'sans-minimal',
    colorAccent: '#0066CC',
    cssVars: {},
  },
  {
    id: 'horror',
    name: 'Horror',
    genre: 'Horror',
    bodyFont: 'Vollkorn',
    headingFont: 'Old Standard TT',
    fontSize: '11pt',
    lineHeight: 1.55,
    margins: { top: '0.9in', bottom: '0.9in', inner: '0.9in', outer: '0.7in' },
    dropCaps: true,
    sceneBreakSymbol: '\u2620',
    chapterHeadingStyle: 'dark-centered',
    colorAccent: '#1a0000',
    cssVars: {},
  },
  {
    id: 'childrens',
    name: "Children's Book",
    genre: "Children's",
    bodyFont: 'Nunito',
    headingFont: 'Fredoka',
    fontSize: '14pt',
    lineHeight: 1.8,
    margins: { top: '1.2in', bottom: '1.2in', inner: '1.2in', outer: '1in' },
    dropCaps: false,
    sceneBreakSymbol: '\u2605',
    chapterHeadingStyle: 'playful-centered',
    colorAccent: '#FF6B35',
    cssVars: {},
  },
  {
    id: 'young-adult',
    name: 'Young Adult',
    genre: 'YA',
    bodyFont: 'Literata',
    headingFont: 'DM Sans',
    fontSize: '11.5pt',
    lineHeight: 1.6,
    margins: { top: '0.9in', bottom: '0.9in', inner: '0.9in', outer: '0.7in' },
    dropCaps: false,
    sceneBreakSymbol: '\u2022 \u2022 \u2022',
    chapterHeadingStyle: 'modern-left',
    colorAccent: '#5B21B6',
    cssVars: {},
  },
  {
    id: 'nonfiction-business',
    name: 'Non-Fiction Business',
    genre: 'Business',
    bodyFont: 'Source Serif 4',
    headingFont: 'Inter',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    margins: { top: '0.85in', bottom: '0.85in', inner: '0.85in', outer: '0.65in' },
    dropCaps: false,
    sceneBreakSymbol: '\u2014\u2014\u2014',
    chapterHeadingStyle: 'professional-left',
    colorAccent: '#1E40AF',
    cssVars: {},
  },
  {
    id: 'academic',
    name: 'Academic / Textbook',
    genre: 'Academic',
    bodyFont: 'Noto Serif',
    headingFont: 'Noto Sans',
    fontSize: '10pt',
    lineHeight: 1.45,
    margins: { top: '1in', bottom: '1in', inner: '1.25in', outer: '0.75in' },
    dropCaps: false,
    sceneBreakSymbol: '',
    chapterHeadingStyle: 'numbered-formal',
    colorAccent: '#374151',
    cssVars: {},
  },
  {
    id: 'self-help',
    name: 'Self-Help',
    genre: 'Self-Help',
    bodyFont: 'Merriweather',
    headingFont: 'Raleway',
    fontSize: '11pt',
    lineHeight: 1.6,
    margins: { top: '0.9in', bottom: '0.9in', inner: '0.9in', outer: '0.7in' },
    dropCaps: false,
    sceneBreakSymbol: '\u2014',
    chapterHeadingStyle: 'motivational',
    colorAccent: '#059669',
    cssVars: {},
  },
  {
    id: 'memoir',
    name: 'Memoir',
    genre: 'Memoir',
    bodyFont: 'Alegreya',
    headingFont: 'Cormorant Garamond',
    fontSize: '11pt',
    lineHeight: 1.6,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '0.8in' },
    dropCaps: true,
    sceneBreakSymbol: '\u273B',
    chapterHeadingStyle: 'italic-centered',
    colorAccent: '#78350F',
    cssVars: {},
  },
  {
    id: 'poetry',
    name: 'Poetry Collection',
    genre: 'Poetry',
    bodyFont: 'Spectral',
    headingFont: 'Cormorant',
    fontSize: '11pt',
    lineHeight: 1.8,
    margins: { top: '1.2in', bottom: '1.2in', inner: '1.2in', outer: '1in' },
    dropCaps: false,
    sceneBreakSymbol: '',
    chapterHeadingStyle: 'minimal-centered',
    colorAccent: '#4B5563',
    cssVars: { '--text-align': 'left', '--para-indent': '0' },
  },
  {
    id: 'short-stories',
    name: 'Short Story Collection',
    genre: 'Short Stories',
    bodyFont: 'Libre Baskerville',
    headingFont: 'Playfair Display',
    fontSize: '11pt',
    lineHeight: 1.55,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '0.8in' },
    dropCaps: true,
    sceneBreakSymbol: '\u2042',
    chapterHeadingStyle: 'story-title',
    colorAccent: '#1F2937',
    cssVars: {},
  },
  {
    id: 'large-print',
    name: 'Large Print',
    genre: 'Accessibility',
    bodyFont: 'Lexend',
    headingFont: 'Lexend',
    fontSize: '18pt',
    lineHeight: 2.0,
    margins: { top: '1in', bottom: '1in', inner: '1in', outer: '0.8in' },
    dropCaps: false,
    sceneBreakSymbol: '* * *',
    chapterHeadingStyle: 'large-bold',
    colorAccent: '#000000',
    cssVars: {},
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    genre: 'Any',
    bodyFont: 'Inter',
    headingFont: 'Inter',
    fontSize: '10.5pt',
    lineHeight: 1.5,
    margins: { top: '1.2in', bottom: '1.2in', inner: '1.2in', outer: '1in' },
    dropCaps: false,
    sceneBreakSymbol: '',
    chapterHeadingStyle: 'minimal-sans',
    colorAccent: '#6B7280',
    cssVars: { '--letter-spacing': '0.02em' },
  },
];

module.exports = router;
