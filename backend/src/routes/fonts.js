const express = require('express');
const router = express.Router();
const { getFontList, searchFonts, fetchFontCSS } = require('../services/fontManager');

/**
 * GET /fonts/list
 * Returns all book-appropriate fonts organized by category
 */
router.get('/list', (req, res) => {
  const fonts = getFontList();
  res.json({ fonts });
});

/**
 * GET /fonts/search?q=garamond
 * Search fonts by name
 */
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }
  const results = searchFonts(q);
  res.json({ results });
});

/**
 * GET /fonts/css?family=Merriweather&weights=400,700
 * Get font CSS for embedding
 */
router.get('/css', async (req, res) => {
  try {
    const { family, weights } = req.query;
    if (!family) {
      return res.status(400).json({ error: 'family parameter required' });
    }
    const weightList = weights ? weights.split(',') : ['400', '700'];
    const css = await fetchFontCSS(family, weightList);
    res.type('text/css').send(css);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch font CSS', details: error.message });
  }
});

module.exports = router;
