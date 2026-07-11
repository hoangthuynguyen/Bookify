const { spawn, execSync } = require('child_process');
const path = require('path');

// =============================================================================
// PDF Generator Service (uses WeasyPrint via Python subprocess)
// WeasyPrint uses ~100MB RAM vs Puppeteer's ~1.5GB - fits Render.com free tier
// =============================================================================

// Check once at startup whether python3 + weasyprint are available
let pythonAvailable = false;
try {
  execSync('which python3', { stdio: 'ignore', timeout: 3000 });
  const pyScript = path.join(__dirname, '../../python/pdf_render.py');
  const fs = require('fs');
  pythonAvailable = fs.existsSync(pyScript);
  if (pythonAvailable) console.log('[PDF] WeasyPrint renderer available');
} catch {
  console.log('[PDF] python3 not found — will use HTML-to-PDF fallback');
}

// Trim size definitions: name -> { width_mm, height_mm, binding[] }
const TRIM_SIZES = {
  '4.25x6.87': { width: 108, height: 174.5, label: '4.25" x 6.87" (Mass-Market)', binding: ['paperback'] },
  '5x8': { width: 127, height: 203, label: '5" x 8"', binding: ['paperback'] },
  '5.06x7.81': { width: 128.5, height: 198.4, label: '5.06" x 7.81" (B-Format)', binding: ['paperback'] },
  '5.25x8': { width: 133.4, height: 203, label: '5.25" x 8"', binding: ['paperback'] },
  '5.5x8.5': { width: 139.7, height: 215.9, label: '5.5" x 8.5" (Digest)', binding: ['paperback', 'spiral'] },
  '6x9': { width: 152.4, height: 228.6, label: '6" x 9" (US Trade)', binding: ['paperback', 'hardcover'] },
  '6.14x9.21': { width: 156, height: 234, label: '6.14" x 9.21" (Royal)', binding: ['paperback', 'hardcover'] },
  '6.69x9.61': { width: 170, height: 244, label: '6.69" x 9.61" (Pinched Crown)', binding: ['paperback'] },
  '7x10': { width: 177.8, height: 254, label: '7" x 10" (Large Format)', binding: ['paperback', 'spiral'] },
  '7.44x9.69': { width: 189, height: 246, label: '7.44" x 9.69" (Crown Quarto)', binding: ['paperback'] },
  '7.5x9.25': { width: 190.5, height: 235, label: '7.5" x 9.25"', binding: ['paperback'] },
  '8x10': { width: 203.2, height: 254, label: '8" x 10" (Picture Book)', binding: ['paperback', 'hardcover'] },
  '8.25x6': { width: 209.6, height: 152.4, label: '8.25" x 6"', binding: ['paperback'] },
  '8.25x11': { width: 209.6, height: 279.4, label: '8.25" x 11" (Coffee Table)', binding: ['hardcover'] },
  '8.25x8.25': { width: 209.6, height: 209.6, label: '8.25" x 8.25"', binding: ['hardcover'] },
  '8.5x8.5': { width: 215.9, height: 215.9, label: '8.5" x 8.5" (Square)', binding: ['hardcover'] },
  '8.5x11': { width: 215.9, height: 279.4, label: '8.5" x 11" (Letter)', binding: ['paperback', 'hardcover', 'spiral'] },
  '8.27x11.69': { width: 210, height: 297, label: 'A4 (8.27" x 11.69")', binding: ['paperback', 'spiral'] },
  '11x8.5': { width: 279.4, height: 215.9, label: '11" x 8.5" (Landscape)', binding: ['spiral'] },
};

/**
 * Generate a print-ready PDF using WeasyPrint (or HTML fallback)
 * @param {string} docContent - HTML content of the book
 * @param {string} trimSize - Trim size key (e.g. '6x9')
 * @param {object} theme - Theme configuration
 * @param {object} settings - { orphanControl, mirrorMargins }
 * @returns {{ buffer: Buffer, filename: string, pageCount: number }}
 */
async function generatePdf(docContent, trimSize, theme, settings) {
  const size = TRIM_SIZES[trimSize] || TRIM_SIZES['6x9'];

  // Skip Python spawn entirely if not available — go straight to fallback
  if (!pythonAvailable) {
    throw new Error('WeasyPrint not available');
  }

  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../python/pdf_render.py');
    let pythonProcess;

    try {
      pythonProcess = spawn('python3', [pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (spawnErr) {
      pythonAvailable = false; // Mark as unavailable for future calls
      reject(new Error(`Failed to start PDF renderer: ${spawnErr.message}`));
      return;
    }

    let stdout = '';
    let stderr = '';
    let timer;
    let settled = false;

    const settle = (fn) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        fn();
      }
    };

    pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

    pythonProcess.on('error', (err) => {
      settle(() => {
        pythonAvailable = false; // Mark as unavailable for future calls
        reject(new Error(`Failed to start PDF renderer: ${err.message}`));
      });
    });

    pythonProcess.on('close', (code) => {
      settle(() => {
        if (code !== 0) {
          console.error('WeasyPrint stderr:', stderr);
          reject(new Error(`PDF render failed (exit code ${code}): ${stderr.substring(0, 500)}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          const buffer = Buffer.from(result.pdf, 'base64');

          const safeTitle = (theme.title || 'book')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);

          resolve({
            buffer,
            filename: `${safeTitle}_${trimSize}.pdf`,
            pageCount: result.page_count || estimatePageCount(buffer.length),
            trimSize: size.label,
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse PDF output: ${parseError.message}`));
        }
      });
    });

    // Send input data to Python process via stdin
    const input = JSON.stringify({
      html: docContent,
      trimSize: { width: `${size.width}mm`, height: `${size.height}mm` },
      theme: {
        fontFamily: theme.fontFamily || 'Georgia',
        headingFont: theme.headingFont || theme.fontFamily || 'Georgia',
        fontSize: theme.fontSize || '11pt',
        lineHeight: theme.lineHeight || 1.6,
        colorAccent: theme.colorAccent || '#333333',
        title: theme.title || '',
        author: theme.author || '',
        margins: theme.margins || {
          top: '1in', bottom: '1in', inner: '1in', outer: '0.75in',
        },
      },
      settings: {
        orphanControl: settings.orphanControl !== false,
        mirrorMargins: settings.mirrorMargins || false,
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
      },
    });

    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();

    // Timeout after 60 seconds (local process shouldn't need more)
    timer = setTimeout(() => {
      settle(() => {
        pythonProcess.kill('SIGTERM');
        reject(new Error('PDF generation timed out after 60 seconds'));
      });
    }, 60000);
  });
}

/**
 * Estimate page count from PDF file size
 */
function estimatePageCount(bytes) {
  // Rough estimate: ~5KB per page for text-heavy PDFs
  return Math.max(1, Math.round(bytes / 5000));
}

/**
 * Get list of available trim sizes
 */
function getTrimSizes() {
  return Object.entries(TRIM_SIZES).map(([key, val]) => ({
    value: key,
    label: val.label,
    width_mm: val.width,
    height_mm: val.height,
  }));
}

module.exports = { generatePdf, getTrimSizes, TRIM_SIZES };
