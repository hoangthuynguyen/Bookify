const express = require('express');
const router = express.Router();
const { generateEpub } = require('../services/epubGenerator');
const { uploadExportFile } = require('../services/r2Client');

// =============================================================================
// Helper: Save to Supabase (optional — won't crash if Supabase is down)
// =============================================================================

async function trySaveHistory(userId, docId, format, fileUrl, fileSize, metadata) {
  try {
    const { saveExportHistory } = require('../services/supabaseClient');
    await saveExportHistory(userId, docId, format, fileUrl, fileSize, metadata);
  } catch (err) {
    console.warn(`[Export] Supabase save skipped: ${err.message}`);
  }
}

// =============================================================================
// POST /export/epub
// =============================================================================

router.post('/epub', async (req, res) => {
  try {
    const { docContent, docId, metadata, theme, settings } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[EPUB] Starting export for doc ${docId} by ${req.user.email}`);

    const result = await generateEpub(
      docContent,
      metadata || {},
      theme || {},
      settings || {}
    );

    // Upload to R2 (or fallback to base64 data URL)
    const { signedUrl, key } = await uploadExportFile(
      result.buffer,
      result.filename,
      'application/epub+zip',
      req.user.id
    );

    // Save to export history (optional)
    await trySaveHistory(
      req.user.id, docId || 'unknown', 'epub', signedUrl,
      result.buffer.length, { ...metadata, chapterCount: result.chapterCount, r2Key: key }
    );

    console.log(`[EPUB] Export complete: ${result.filename} (${result.chapterCount} chapters, ${formatBytes(result.buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename: result.filename,
      size: result.buffer.length,
      sizeFormatted: formatBytes(result.buffer.length),
      chapterCount: result.chapterCount,
    });
  } catch (error) {
    console.error('[EPUB] Export failed:', error);
    res.status(500).json({
      error: 'EPUB export failed',
      code: 'EPUB_EXPORT_FAILED',
      details: error.message,
    });
  }
});

// =============================================================================
// Kindle format exports (AZW3, KFX, AZW, MOBI)
// All Kindle formats generate EPUB internally (Amazon's preferred ingestion format)
// =============================================================================

function createKindleExportHandler(format, suffix) {
  const label = format.toUpperCase();
  return async (req, res) => {
    try {
      const { docContent, docId, metadata, theme, settings } = req.body;

      if (!docContent) {
        return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
      }

      console.log(`[${label}] Starting export for doc ${docId} by ${req.user.email}`);

      const result = await generateEpub(docContent, metadata || {}, theme || {}, settings || {});
      const filename = result.filename.replace('.epub', `_${suffix}.epub`);

      const { signedUrl, key } = await uploadExportFile(
        result.buffer, filename, 'application/epub+zip', req.user.id
      );

      await trySaveHistory(
        req.user.id, docId || 'unknown', format, signedUrl,
        result.buffer.length, { ...metadata, chapterCount: result.chapterCount, r2Key: key }
      );

      console.log(`[${label}] Export complete: ${filename}`);

      res.json({
        downloadUrl: signedUrl,
        filename,
        size: result.buffer.length,
        sizeFormatted: formatBytes(result.buffer.length),
        chapterCount: result.chapterCount,
      });
    } catch (error) {
      console.error(`[${label}] Export failed:`, error);
      res.status(500).json({
        error: `${label} export failed`,
        code: `${label}_EXPORT_FAILED`,
        details: error.message,
      });
    }
  };
}

router.post('/azw3', createKindleExportHandler('azw3', 'Kindle'));
router.post('/kfx', createKindleExportHandler('kfx', 'KFX'));
router.post('/azw', createKindleExportHandler('azw', 'AZW'));
router.post('/mobi', createKindleExportHandler('mobi', 'MOBI'));

// =============================================================================
// POST /export/pdf
// Uses WeasyPrint if available, otherwise falls back to HTML-based PDF
// =============================================================================

router.post('/pdf', async (req, res) => {
  try {
    const { docContent, docId, trimSize, theme, settings } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[PDF] Starting export for doc ${docId} (trim: ${trimSize}) by ${req.user.email}`);

    let result;
    try {
      // Try WeasyPrint (production — requires Python)
      const { generatePdf, getTrimSizes } = require('../services/pdfGenerator');
      result = await generatePdf(
        docContent,
        trimSize || '6x9',
        {
          ...theme,
          title: (req.body.metadata || {}).title || 'book',
          author: (req.body.metadata || {}).author || '',
        },
        settings || {}
      );
    } catch (pdfErr) {
      // Fallback: generate a styled HTML file as "PDF" (works without WeasyPrint)
      console.warn('[PDF] WeasyPrint unavailable, using HTML fallback:', pdfErr.message);
      result = generateHtmlPdfFallback(docContent, trimSize || '6x9', theme || {}, settings || {}, req.body.metadata || {});
    }

    // Upload to R2 (or fallback to base64 data URL)
    const { signedUrl, key } = await uploadExportFile(
      result.buffer,
      result.filename,
      'application/pdf',
      req.user.id
    );

    await trySaveHistory(
      req.user.id, docId || 'unknown', 'pdf', signedUrl,
      result.buffer.length, { trimSize: result.trimSize, pageCount: result.pageCount, r2Key: key }
    );

    console.log(`[PDF] Export complete: ${result.filename} (${result.pageCount} pages, ${formatBytes(result.buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename: result.filename,
      size: result.buffer.length,
      sizeFormatted: formatBytes(result.buffer.length),
      pageCount: result.pageCount,
      trimSize: result.trimSize,
    });
  } catch (error) {
    console.error('[PDF] Export failed:', error);
    res.status(500).json({
      error: 'PDF export failed',
      code: 'PDF_EXPORT_FAILED',
      details: error.message,
    });
  }
});

/**
 * HTML-based PDF fallback when WeasyPrint is not available.
 * Generates a print-styled HTML that can be saved and printed as PDF from browser.
 */
function generateHtmlPdfFallback(docContent, trimSize, theme, settings, metadata) {
  const title = metadata.title || 'Untitled Book';
  const author = metadata.author || '';
  const fontFamily = theme.fontFamily || 'Georgia, serif';
  let fontSize = theme.fontSize || '11pt';
  let lineHeight = theme.lineHeight || 1.6;

  // Large print: enforce 16pt+ base size and taller line height
  if (settings.largePrint) {
    fontSize = `${Math.max(parseFloat(fontSize) || 11, 16)}pt`;
    lineHeight = Math.max(parseFloat(lineHeight) || 1.6, 1.8);
  }

  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: ${trimSize === '6x9' ? '6in 9in' : trimSize === '5.5x8.5' ? '5.5in 8.5in' : '6in 9in'}; margin: 1in 0.75in; }
    @media print { body { margin: 0; } }
    body { font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineHeight}; color: #1a1a1a; max-width: 100%; }
    p { margin: 0 0 0.5em 0; text-indent: 1.5em; text-align: justify; }
    h1 { font-size: 2em; text-align: center; margin: 2em 0 1em; page-break-before: always; }
    h1:first-of-type { page-break-before: avoid; }
    h2 { font-size: 1.5em; margin: 1.5em 0 0.8em; }
    h3 { font-size: 1.2em; margin: 1.2em 0 0.6em; }
    img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
    .callout-box { border: 2px solid #ccc; border-radius: 8px; padding: 1em; margin: 1em 0; }
    .text-msg { padding: 0.6em 1em; border-radius: 1em; max-width: 80%; margin: 0.5em 0; }
    .text-msg-sent { background: #007AFF; color: white; margin-left: auto; }
    .text-msg-received { background: #E9E9EB; color: #1a1a1a; }
  </style>
</head>
<body>
  <div style="text-align: center; margin: 3em 0;">
    <h1 style="page-break-before: avoid; font-size: 2.5em;">${title}</h1>
    ${author ? `<p style="text-indent: 0; font-size: 1.2em; color: #666;">by ${author}</p>` : ''}
  </div>
  ${docContent}
</body>
</html>`;

  const buffer = Buffer.from(htmlDocument, 'utf-8');
  const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);

  return {
    buffer,
    filename: `${safeTitle}_${trimSize}.html`,
    pageCount: Math.max(1, Math.round(docContent.length / 2500)),
    trimSize: trimSize,
  };
}

// =============================================================================
// POST /export/docx
// =============================================================================

router.post('/docx', async (req, res) => {
  try {
    const { docContent, docId, theme } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[DOCX] Starting export for doc ${docId} by ${req.user.email}`);

    const HTMLtoDOCX = require('html-to-docx');
    const fontSizePt = parseFloat((theme || {}).fontSize) || 11;
    const buffer = await HTMLtoDOCX(docContent, null, {
      font: (theme || {}).fontFamily || 'Georgia',
      fontSize: Math.round(fontSizePt * 2),
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    const filename = `export_${Date.now()}.docx`;
    const { signedUrl, key } = await uploadExportFile(
      Buffer.from(buffer),
      filename,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      req.user.id
    );

    await trySaveHistory(req.user.id, docId || 'unknown', 'docx', signedUrl, buffer.length, { r2Key: key });

    console.log(`[DOCX] Export complete: ${filename} (${formatBytes(buffer.length)})`);

    res.json({
      downloadUrl: signedUrl,
      filename,
      size: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
    });
  } catch (error) {
    console.error('[DOCX] Export failed:', error);
    res.status(500).json({
      error: 'DOCX export failed',
      code: 'DOCX_EXPORT_FAILED',
      details: error.message,
    });
  }
});

// =============================================================================
// POST /export/txt
// =============================================================================

router.post('/txt', async (req, res) => {
  try {
    const { docContent, docId, metadata } = req.body;
    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[TXT] Starting export for doc ${docId} by ${req.user.email}`);

    const { convert } = require('html-to-text');
    const textContent = convert(docContent, { wordwrap: 130 });

    const filename = `export_${Date.now()}.txt`;
    const buffer = Buffer.from(textContent, 'utf-8');

    const { signedUrl, key } = await uploadExportFile(buffer, filename, 'text/plain', req.user.id);
    await trySaveHistory(req.user.id, docId || 'unknown', 'txt', signedUrl, buffer.length, { r2Key: key });

    console.log(`[TXT] Export complete: ${filename} (${formatBytes(buffer.length)})`);

    res.json({ downloadUrl: signedUrl, filename, size: buffer.length, sizeFormatted: formatBytes(buffer.length) });
  } catch (error) {
    console.error('[TXT] Export failed:', error);
    res.status(500).json({ error: 'TXT export failed', code: 'TXT_EXPORT_FAILED', details: error.message });
  }
});

// =============================================================================
// POST /export/html
// =============================================================================

router.post('/html', async (req, res) => {
  try {
    const { docContent, docId, metadata, theme } = req.body;
    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[HTML] Starting export for doc ${docId} by ${req.user.email}`);

    const title = (metadata || {}).title || 'Document Export';
    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: ${(theme || {}).fontFamily || 'Georgia, serif'}; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
        h1, h2, h3 { color: #111; }
        img { max-width: 100%; height: auto; }
        .callout-box { padding: 1rem; border-radius: 8px; margin: 1rem 0; }
        .text-msg-container { margin: 1rem 0; }
        .text-msg { padding: 0.75rem 1rem; border-radius: 1rem; max-width: 70%; margin-bottom: 0.5rem; }
        .text-msg-sent { background-color: #dcf8c6; margin-left: auto; border-bottom-right-radius: 0.25rem; }
        .text-msg-received { background-color: #f1f1f1; border-bottom-left-radius: 0.25rem; }
    </style>
</head>
<body>
    ${docContent}
</body>
</html>`;

    const filename = `export_${Date.now()}.html`;
    const buffer = Buffer.from(htmlDocument, 'utf-8');

    const { signedUrl, key } = await uploadExportFile(buffer, filename, 'text/html', req.user.id);
    await trySaveHistory(req.user.id, docId || 'unknown', 'html', signedUrl, buffer.length, { r2Key: key });

    console.log(`[HTML] Export complete: ${filename} (${formatBytes(buffer.length)})`);

    res.json({ downloadUrl: signedUrl, filename, size: buffer.length, sizeFormatted: formatBytes(buffer.length) });
  } catch (error) {
    console.error('[HTML] Export failed:', error);
    res.status(500).json({ error: 'HTML export failed', code: 'HTML_EXPORT_FAILED', details: error.message });
  }
});

// =============================================================================
// POST /export/markdown
// =============================================================================

router.post('/markdown', async (req, res) => {
  try {
    const { docContent, docId, metadata } = req.body;
    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required', code: 'MISSING_CONTENT' });
    }

    console.log(`[MD] Starting export for doc ${docId} by ${req.user.email}`);

    const { convert } = require('html-to-text');
    const mdContent = convert(docContent, {
      wordwrap: false,
      preserveNewlines: true,
      formatters: {
        heading: function (elem, walk, builder, formatOptions) {
          builder.openBlock({ leadingLineBreaks: 2 });
          const level = parseInt(elem.name.charAt(1)) || 1;
          builder.addInline('#'.repeat(level) + ' ');
          walk(elem.children, builder);
          builder.closeBlock({ trailingLineBreaks: 2 });
        },
      },
      selectors: [
        { selector: 'h1', format: 'heading' },
        { selector: 'h2', format: 'heading' },
        { selector: 'h3', format: 'heading' },
        { selector: 'strong', format: 'inline', options: { prefix: '**', suffix: '**' } },
        { selector: 'em', format: 'inline', options: { prefix: '_', suffix: '_' } },
        { selector: 'img', format: 'skip' },
      ],
    });

    const title = (metadata || {}).title || 'Document Export';
    const author = (metadata || {}).author || '';
    const frontMatter = `---\ntitle: "${title}"\n${author ? `author: "${author}"\n` : ''}date: "${new Date().toISOString().split('T')[0]}"\n---\n\n`;
    const fullContent = frontMatter + mdContent;

    const filename = `export_${Date.now()}.md`;
    const buffer = Buffer.from(fullContent, 'utf-8');

    const { signedUrl, key } = await uploadExportFile(buffer, filename, 'text/markdown', req.user.id);
    await trySaveHistory(req.user.id, docId || 'unknown', 'markdown', signedUrl, buffer.length, { r2Key: key });

    console.log(`[MD] Export complete: ${filename} (${formatBytes(buffer.length)})`);

    res.json({ downloadUrl: signedUrl, filename, size: buffer.length, sizeFormatted: formatBytes(buffer.length) });
  } catch (error) {
    console.error('[MD] Export failed:', error);
    res.status(500).json({ error: 'Markdown export failed', code: 'MD_EXPORT_FAILED', details: error.message });
  }
});

// =============================================================================
// GET /export/trim-sizes
// =============================================================================

// =============================================================================
// POST /export/low-content
// Print-ready interiors for journals/planners: lined, graph, dot grid, blank
// =============================================================================

const PAGE_PATTERNS = {
  // College ruled: line every 7.1mm; wide ruled: 8.7mm
  lines: 'repeating-linear-gradient(to bottom, transparent 0, transparent 6.9mm, #b9c3d3 6.9mm, #b9c3d3 7.1mm)',
  'lines-wide': 'repeating-linear-gradient(to bottom, transparent 0, transparent 8.5mm, #b9c3d3 8.5mm, #b9c3d3 8.7mm)',
  grids: 'repeating-linear-gradient(to right, transparent 0, transparent 4.85mm, #ccd4de 4.85mm, #ccd4de 5mm), repeating-linear-gradient(to bottom, transparent 0, transparent 4.85mm, #ccd4de 4.85mm, #ccd4de 5mm)',
  dots: 'radial-gradient(circle, #9aa5b1 0.3mm, transparent 0.45mm)',
  blank: 'none',
};

router.post('/low-content', async (req, res) => {
  try {
    const { pageStyle, pageCount, trimSize } = req.body;
    const pattern = PAGE_PATTERNS[pageStyle];
    if (!pattern) {
      return res.status(400).json({ error: `pageStyle must be one of: ${Object.keys(PAGE_PATTERNS).join(', ')}` });
    }
    const pages = Math.min(800, Math.max(8, parseInt(pageCount) || 120));

    console.log(`[LowContent] ${pageStyle} x${pages} pages (trim: ${trimSize}) by ${req.user.email}`);

    // Absolute sheet height: page content box = trim height minus 0.5in
    // top/bottom margins (paged media can't resolve height:100% reliably)
    const { TRIM_SIZES } = require('../services/pdfGenerator');
    const trim = TRIM_SIZES[trimSize] || TRIM_SIZES['6x9'];
    const sheetHeightMm = (trim.height - 25.4 - 1).toFixed(1);

    const dotSizing = pageStyle === 'dots' ? 'background-size: 5mm 5mm; background-position: 2.5mm 2.5mm;' : '';
    const sheets = new Array(pages).fill('<div class="sheet"></div>').join('\n');
    const html = `<html><head><style>
      body { margin: 0; }
      .sheet {
        page-break-after: always;
        height: ${sheetHeightMm}mm;
        background-image: ${pattern};
        ${dotSizing}
        background-repeat: repeat;
      }
      .sheet:last-child { page-break-after: avoid; }
    </style></head><body>${sheets}</body></html>`;

    const journalTheme = {
      title: `${pageStyle} journal`,
      author: '',
      // Journals use tighter, symmetric margins than book text blocks
      margins: { top: '0.5in', bottom: '0.5in', inner: '0.625in', outer: '0.5in' },
    };

    const { generatePdf } = require('../services/pdfGenerator');
    const result = await generatePdf(html, trimSize || '6x9', journalTheme, {
      orphanControl: false,
      dropCaps: false,
      runningHeader: 'none',
      mirrorMargins: true,
    });

    const filename = `journal_${pageStyle}_${pages}p_${trimSize || '6x9'}.pdf`;
    const { signedUrl, key } = await uploadExportFile(result.buffer, filename, 'application/pdf', req.user.id);
    await trySaveHistory(req.user.id, 'low-content', 'pdf', signedUrl, result.buffer.length,
      { pageStyle, pageCount: pages, trimSize: result.trimSize, r2Key: key });

    console.log(`[LowContent] Complete: ${filename} (${formatBytes(result.buffer.length)})`);
    res.json({
      downloadUrl: signedUrl,
      filename,
      size: result.buffer.length,
      sizeFormatted: formatBytes(result.buffer.length),
      pageCount: result.pageCount || pages,
    });
  } catch (error) {
    console.error('[LowContent] Failed:', error.message);
    res.status(500).json({ error: `Low-content PDF failed: ${error.message}` });
  }
});

router.get('/trim-sizes', (req, res) => {
  try {
    const { getTrimSizes } = require('../services/pdfGenerator');
    res.json({ trimSizes: getTrimSizes() });
  } catch (err) {
    // Fallback trim sizes if pdfGenerator not available
    res.json({
      trimSizes: [
        { value: '5x8', label: '5" x 8"' },
        { value: '5.5x8.5', label: '5.5" x 8.5" (Digest)' },
        { value: '6x9', label: '6" x 9" (US Trade)' },
        { value: '8.5x11', label: '8.5" x 11" (Letter)' },
      ]
    });
  }
});

// =============================================================================
// GET /export/history
// =============================================================================

router.get('/history', async (req, res) => {
  try {
    const { getExportHistory } = require('../services/supabaseClient');
    const history = await getExportHistory(req.user.id, parseInt(req.query.limit) || 20);
    res.json({ exports: history });
  } catch (error) {
    res.json({ exports: [], message: 'Export history not available' });
  }
});

// =============================================================================
// Helpers
// =============================================================================

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

module.exports = router;
