const express = require('express');
const router = express.Router();

/**
 * POST /validate/epub
 * Comprehensive EPUB structure and content validation
 * Checks: structure, accessibility, formatting, metadata, performance
 */
router.post('/epub', async (req, res) => {
  try {
    const { docContent, metadata } = req.body;

    if (!docContent) {
      return res.status(400).json({ error: 'docContent is required' });
    }

    const warnings = [];
    const errors = [];
    const suggestions = [];

    // =========================================================================
    // Structure Checks
    // =========================================================================

    // Check for H1 headings (chapters)
    const h1Count = (docContent.match(/<h1/gi) || []).length;
    if (h1Count === 0) {
      errors.push({
        type: 'structure',
        severity: 'error',
        message: 'No chapter headings (H1) found. EPUB requires at least one chapter.',
        fix: 'Add Heading 1 style to your chapter titles in Google Docs.',
      });
    }

    // Check for heading hierarchy (H1 > H2 > H3)
    const h2Count = (docContent.match(/<h2/gi) || []).length;
    const h3Count = (docContent.match(/<h3/gi) || []).length;
    if (h3Count > 0 && h2Count === 0) {
      warnings.push({
        type: 'structure',
        severity: 'warning',
        message: 'H3 headings found without H2 headings. Heading hierarchy should be sequential.',
        fix: 'Consider using H2 before H3 for proper document structure.',
      });
    }

    // Check for very short or very long chapters
    if (h1Count > 0) {
      const chapters = docContent.split(/<h1/gi);
      const shortChapters = [];
      const longChapters = [];
      chapters.forEach((ch, i) => {
        if (i === 0) return; // Skip content before first H1
        const textOnly = ch.replace(/<[^>]*>/g, '').trim();
        const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
        if (wordCount < 50) shortChapters.push(i);
        if (wordCount > 15000) longChapters.push(i);
      });
      if (shortChapters.length > 0) {
        warnings.push({
          type: 'structure',
          severity: 'warning',
          message: `${shortChapters.length} chapter(s) have fewer than 50 words. Very short chapters may appear empty on e-readers.`,
          fix: 'Review short chapters and add content or merge with adjacent chapters.',
        });
      }
      if (longChapters.length > 0) {
        suggestions.push({
          type: 'performance',
          severity: 'info',
          message: `${longChapters.length} chapter(s) exceed 15,000 words. Long chapters may load slowly on older e-readers.`,
          fix: 'Consider splitting very long chapters for better performance.',
        });
      }
    }

    // =========================================================================
    // Accessibility Checks
    // =========================================================================

    // Check for images without alt text
    const imgNoAlt = (docContent.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    if (imgNoAlt > 0) {
      warnings.push({
        type: 'accessibility',
        severity: 'warning',
        message: `${imgNoAlt} image(s) missing alt text. This affects accessibility and may fail KDP/Apple Books validation.`,
        fix: 'Add alt text to all images in Google Docs (right-click image → Alt text).',
      });
    }

    // Check for tables (limited support in many e-readers)
    const tableCount = (docContent.match(/<table/gi) || []).length;
    if (tableCount > 0) {
      warnings.push({
        type: 'accessibility',
        severity: 'warning',
        message: `${tableCount} table(s) found. Tables have limited support on many e-readers and may not display correctly.`,
        fix: 'Consider converting tables to lists or simple text for better e-reader compatibility.',
      });
    }

    // =========================================================================
    // Formatting Checks
    // =========================================================================

    // Check for very large images
    const imgCount = (docContent.match(/<img/gi) || []).length;
    if (imgCount > 50) {
      warnings.push({
        type: 'performance',
        severity: 'warning',
        message: `${imgCount} images found. Large number of images may cause slow loading on e-readers.`,
        fix: 'Consider compressing images or reducing count for ebook version.',
      });
    }

    // Check for empty paragraphs (common formatting issue)
    const emptyParas = (docContent.match(/<p>\s*<\/p>/gi) || []).length;
    if (emptyParas > 10) {
      warnings.push({
        type: 'formatting',
        severity: 'warning',
        message: `${emptyParas} empty paragraphs found. These create inconsistent spacing in ebooks.`,
        fix: 'Use Scene Breaks instead of empty paragraphs for section spacing.',
      });
    } else if (emptyParas > 3) {
      suggestions.push({
        type: 'formatting',
        severity: 'info',
        message: `${emptyParas} empty paragraphs found. Consider using scene breaks for spacing.`,
        fix: 'Use the Scene Break inserter in the Formatting panel for consistent spacing.',
      });
    }

    // Check for inline styles (should use CSS classes)
    const inlineStyles = (docContent.match(/style="/gi) || []).length;
    if (inlineStyles > 20) {
      warnings.push({
        type: 'formatting',
        severity: 'warning',
        message: `${inlineStyles} inline styles detected. Inline styles may not render consistently across e-readers.`,
        fix: 'Use paragraph styles in Google Docs instead of manual formatting.',
      });
    }

    // Check for font declarations that e-readers may not support
    const fontFaces = (docContent.match(/font-family\s*:/gi) || []).length;
    if (fontFaces > 5) {
      suggestions.push({
        type: 'formatting',
        severity: 'info',
        message: `Multiple font declarations found (${fontFaces}). Most e-readers support limited fonts.`,
        fix: 'Apply a consistent theme to use 1-2 fonts throughout your book.',
      });
    }

    // Check for color text (may not render on e-ink)
    const colorDeclarations = (docContent.match(/color\s*:\s*(?!#1a1a1a|#000|black|inherit)/gi) || []).length;
    if (colorDeclarations > 5) {
      suggestions.push({
        type: 'formatting',
        severity: 'info',
        message: `${colorDeclarations} color declarations found. Colors will be invisible on E-Ink readers.`,
        fix: 'Avoid relying on color alone to convey meaning. Use bold or italics for emphasis.',
      });
    }

    // =========================================================================
    // Metadata Checks
    // =========================================================================

    if (metadata) {
      if (!metadata.title || metadata.title.trim() === '' || metadata.title === 'Untitled') {
        warnings.push({
          type: 'metadata',
          severity: 'warning',
          message: 'Book title is missing or set to "Untitled".',
          fix: 'Set a proper title in the Export panel before exporting.',
        });
      }
      if (!metadata.author || metadata.author.trim() === '') {
        warnings.push({
          type: 'metadata',
          severity: 'warning',
          message: 'Author name is missing.',
          fix: 'Enter the author name in the Export panel metadata section.',
        });
      }
      if (metadata.isbn && !/^(978|979)\d{10}$/.test(metadata.isbn.replace(/-/g, ''))) {
        warnings.push({
          type: 'metadata',
          severity: 'warning',
          message: 'ISBN format appears invalid. Should be 13 digits starting with 978 or 979.',
          fix: 'Double-check your ISBN in the Export panel.',
        });
      }
    } else {
      suggestions.push({
        type: 'metadata',
        severity: 'info',
        message: 'No metadata provided. Title and author are recommended for published EPUBs.',
        fix: 'Fill in book metadata in the Export panel.',
      });
    }

    // =========================================================================
    // Content Quality Checks
    // =========================================================================

    const textContent = docContent.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;

    // Check for very short content
    if (wordCount < 500) {
      suggestions.push({
        type: 'content',
        severity: 'info',
        message: `Document is only ${wordCount} words. This may be too short for a standalone ebook.`,
        fix: 'Most published ebooks are at least 10,000 words.',
      });
    }

    // Check for non-breaking spaces
    const nbspCount = (docContent.match(/&nbsp;/gi) || []).length;
    if (nbspCount > 50) {
      suggestions.push({
        type: 'formatting',
        severity: 'info',
        message: `${nbspCount} non-breaking spaces found. These may cause formatting issues.`,
        fix: 'Non-breaking spaces are usually caused by copy-pasting. Clean up in Google Docs.',
      });
    }

    // =========================================================================
    // Platform-Specific Checks
    // =========================================================================

    const platformChecks = {
      kindle: { compatible: true, issues: [] },
      apple: { compatible: true, issues: [] },
      kobo: { compatible: true, issues: [] },
    };

    if (tableCount > 0) {
      platformChecks.kindle.issues.push('Tables may render poorly on Kindle');
    }
    if (imgNoAlt > 0) {
      platformChecks.apple.compatible = false;
      platformChecks.apple.issues.push('Apple Books requires alt text on all images');
    }
    if (imgCount > 100) {
      platformChecks.kindle.issues.push('High image count may trigger Kindle delivery fee');
    }

    // =========================================================================
    // Summary
    // =========================================================================

    const totalIssues = errors.length + warnings.length;
    let summary;
    if (errors.length > 0) {
      summary = `Found ${errors.length} error(s) and ${warnings.length} warning(s). Fix errors before exporting.`;
    } else if (warnings.length > 0) {
      summary = `${h1Count} chapters, ${wordCount.toLocaleString()} words. ${warnings.length} warning(s) to review.`;
    } else {
      summary = `Document looks great! ${h1Count} chapters, ${wordCount.toLocaleString()} words. Ready to export.`;
    }

    res.json({
      valid: errors.length === 0,
      score: Math.max(0, 100 - (errors.length * 25) - (warnings.length * 5) - (suggestions.length * 1)),
      wordCount,
      chapterCount: h1Count,
      imageCount: imgCount,
      errors,
      warnings,
      suggestions,
      platforms: platformChecks,
      summary,
    });
  } catch (error) {
    res.status(500).json({ error: 'Validation failed', details: error.message });
  }
});

module.exports = router;
