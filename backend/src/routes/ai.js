const express = require('express');
const router = express.Router();

// =============================================================================
// AI Book Designer — BYOK (Bring Your Own Key)
// The user's LLM API key is passed per-request, used once to call the provider,
// and never stored or logged. No key ever touches Supabase/R2/Redis.
// =============================================================================

const ALLOWED_FONTS = [
  'Georgia', 'Garamond', 'Palatino', 'Baskerville', 'Book Antiqua',
  'Times New Roman', 'Crimson Text', 'Lora', 'Merriweather', 'PT Serif',
  'Arial', 'Helvetica', 'Verdana', 'Trebuchet MS', 'Courier New',
  'Caveat', 'Dancing Script', 'Special Elite',
  'EB Garamond', 'Playfair Display', 'Noto Serif', 'Noto Sans',
  'Montserrat', 'Open Sans', 'Roboto', 'Literata', 'Be Vietnam Pro', 'Patrick Hand',
];

// Fonts whose Google Fonts build includes the full Vietnamese subset —
// required for diacritics (ắ ằ ẳ ẵ ặ ...) to render correctly
const VIETNAMESE_SAFE_FONTS = [
  'EB Garamond', 'Playfair Display', 'Noto Serif', 'Noto Sans', 'Lora',
  'Merriweather', 'Montserrat', 'Open Sans', 'Roboto', 'Literata',
  'Be Vietnam Pro', 'Patrick Hand', 'Dancing Script', 'Caveat',
  'Times New Roman', 'Arial', 'Verdana', 'Georgia', 'Courier New',
];
const ALLOWED_TRIM_SIZES = ['4.25x6.87', '5x8', '5.25x8', '5.5x8.5', '6x9', '6.14x9.21', '7x10', '8.5x11', '8.5x8.5'];
const ALLOWED_HEADING_GAPS = ['compact', 'normal', 'spacious', 'dramatic'];
const ALLOWED_POSITIONS = ['top', 'middle', 'bottom'];
const ALLOWED_DROP_STYLES = ['classic', 'accent', 'ornate'];
const ALLOWED_BINDINGS = ['paperback', 'hardcover', 'spiral'];

const DEFAULT_MODELS = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  custom: '',
};

function buildPrompt({ title, author, genre, brief, sample }) {
  return `You are a professional book interior designer (like the designers behind Vellum/Atticus themes).
Design a complete interior layout for the book below. Respond with ONLY a JSON object, no markdown fences, no commentary.

BOOK:
- Title: ${title || 'Unknown'}
- Author: ${author || 'Unknown'}
- Genre: ${genre || 'not specified — infer from the sample'}
${brief ? `- Author's design brief: ${brief}` : ''}
- Opening sample:
"""
${(sample || '').slice(0, 4000)}
"""

IMPORTANT — non-Latin and accented languages: if the book (or the design brief)
is written in Vietnamese or any language with diacritics, you MUST pick
bodyFont and headingFont ONLY from this diacritic-safe list:
${JSON.stringify(VIETNAMESE_SAFE_FONTS)}
(other fonts in the list below render Vietnamese diacritics incorrectly).

Return JSON with EXACTLY these keys and allowed values:
{
  "themeName": "short evocative name for this design",
  "rationale": "2-4 sentences explaining the design choices, written for the author. Reply in the same language as the design brief if provided, otherwise in the language of the book sample.",
  "bodyFont": one of ${JSON.stringify(ALLOWED_FONTS)},
  "headingFont": one of the same list,
  "fontSize": number 10-14 (pt, body text),
  "lineHeight": number 1.2-1.9,
  "colorAccent": hex color string like "#7c3aed" (tasteful, print-safe, dark enough for headings),
  "dropCaps": boolean,
  "dropCapLines": 2, 3 or 4,
  "dropCapStyle": one of ${JSON.stringify(ALLOWED_DROP_STYLES)},
  "sceneBreakSymbol": a short ornament string like "* * *", "❦" or "✦ ✦ ✦",
  "headingGap": one of ${JSON.stringify(ALLOWED_HEADING_GAPS)},
  "chapterStartPosition": one of ${JSON.stringify(ALLOWED_POSITIONS)},
  "trimSize": one of ${JSON.stringify(ALLOWED_TRIM_SIZES)},
  "bindingType": one of ${JSON.stringify(ALLOWED_BINDINGS)},
  "runningHeader": "none", "author_title" or "chapter_title"
}`;
}

// ---------------------------------------------------------------------------
// Provider adapters — each returns the raw text of the model's reply
// ---------------------------------------------------------------------------

async function callAnthropic(apiKey, model, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.anthropic,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Anthropic API error (HTTP ${res.status})`);
  return data.content?.[0]?.text || '';
}

async function callOpenAICompatible(baseUrl, apiKey, model, prompt) {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers = { 'content-type': 'application/json' };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `LLM API error (HTTP ${res.status})`);
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(apiKey, model, prompt) {
  const m = model || DEFAULT_MODELS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Gemini API error (HTTP ${res.status})`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---------------------------------------------------------------------------
// Response parsing & validation
// ---------------------------------------------------------------------------

function parseDesignJson(text) {
  // Strip markdown fences and grab the outermost JSON object
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model did not return JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const clamp = (n, min, max, fallback) => {
  const v = parseFloat(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
};

function sanitizeDesign(raw) {
  return {
    themeName: String(raw.themeName || 'AI Suggested Design').slice(0, 60),
    rationale: String(raw.rationale || '').slice(0, 1200),
    bodyFont: pick(raw.bodyFont, ALLOWED_FONTS, 'Georgia'),
    headingFont: pick(raw.headingFont, ALLOWED_FONTS, 'Georgia'),
    fontSize: clamp(raw.fontSize, 10, 14, 11),
    lineHeight: clamp(raw.lineHeight, 1.2, 1.9, 1.6),
    colorAccent: /^#[0-9a-fA-F]{6}$/.test(raw.colorAccent || '') ? raw.colorAccent : '#333333',
    dropCaps: Boolean(raw.dropCaps),
    dropCapLines: [2, 3, 4].includes(raw.dropCapLines) ? raw.dropCapLines : 3,
    dropCapStyle: pick(raw.dropCapStyle, ALLOWED_DROP_STYLES, 'classic'),
    sceneBreakSymbol: String(raw.sceneBreakSymbol || '* * *').slice(0, 12),
    headingGap: pick(raw.headingGap, ALLOWED_HEADING_GAPS, 'normal'),
    chapterStartPosition: pick(raw.chapterStartPosition, ALLOWED_POSITIONS, 'top'),
    trimSize: pick(raw.trimSize, ALLOWED_TRIM_SIZES, '6x9'),
    bindingType: pick(raw.bindingType, ALLOWED_BINDINGS, 'paperback'),
    runningHeader: pick(raw.runningHeader, ['none', 'author_title', 'chapter_title'], 'none'),
  };
}

// ---------------------------------------------------------------------------
// POST /ai/suggest-design
// ---------------------------------------------------------------------------

router.post('/suggest-design', async (req, res) => {
  try {
    const { provider, apiKey, model, baseUrl, brief, metadata, sample } = req.body || {};

    if (!provider || !['anthropic', 'openai', 'gemini', 'custom'].includes(provider)) {
      return res.status(400).json({ error: 'provider must be anthropic | openai | gemini | custom' });
    }
    if (!apiKey && provider !== 'custom') {
      return res.status(400).json({ error: 'apiKey is required' });
    }
    if (provider === 'custom' && !baseUrl) {
      return res.status(400).json({ error: 'baseUrl is required for custom provider' });
    }
    if (provider === 'custom' && !/^https?:\/\//.test(baseUrl)) {
      return res.status(400).json({ error: 'baseUrl must be an http(s) URL' });
    }
    // SSRF guard: block loopback/private/link-local targets in production.
    // (A hosted backend could never reach a user's local Ollama anyway.)
    if (provider === 'custom' && process.env.NODE_ENV === 'production') {
      const host = new URL(baseUrl).hostname;
      const isPrivate =
        host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') ||
        /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\.|^::1$|^\[?::1\]?$|^172\.(1[6-9]|2\d|3[01])\./.test(host);
      if (isPrivate) {
        return res.status(400).json({ error: 'baseUrl must be a public endpoint (private/internal addresses are not allowed)' });
      }
    }

    const prompt = buildPrompt({
      title: metadata?.title,
      author: metadata?.author,
      genre: metadata?.genre,
      brief,
      sample,
    });

    let text;
    if (provider === 'anthropic') {
      text = await callAnthropic(apiKey, model, prompt);
    } else if (provider === 'openai') {
      text = await callOpenAICompatible('https://api.openai.com/v1', apiKey, model || DEFAULT_MODELS.openai, prompt);
    } else if (provider === 'gemini') {
      text = await callGemini(apiKey, model, prompt);
    } else {
      text = await callOpenAICompatible(baseUrl, apiKey, model || 'default', prompt);
    }

    const design = sanitizeDesign(parseDesignJson(text));
    res.json({ design, provider, model: model || DEFAULT_MODELS[provider] || 'default' });
  } catch (error) {
    // Never echo the request body (it contains the API key)
    console.error('[AI] suggest-design failed:', error.message);
    res.status(502).json({ error: `AI design failed: ${error.message}` });
  }
});

module.exports = router;
