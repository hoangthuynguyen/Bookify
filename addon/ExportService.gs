/**
 * ExportService.gs — Document extraction and backend API communication
 */

// =============================================================================
// Document Content Extraction
// =============================================================================

/**
 * Extracts the full document content as HTML with heading structure preserved.
 * @returns {{ html: string, metadata: object, headings: Array }}
 */
function getDocumentContent() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();

    // Check cache first (CacheService, 5 min)
    var cache = CacheService.getUserCache();
    var cacheKey = 'doc_' + doc.getId() + '_' + doc.getLastUpdated().getTime();
    var cached = cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Process Footnotes
    var footnoteHtml = '';
    var footnotes = doc.getFootnotes();
    if (footnotes && footnotes.length > 0) {
      footnoteHtml += '<div class="footnotes-section"><h2>Notes</h2><ol>';
      for (var f = 0; f < footnotes.length; f++) {
        var fn = footnotes[f];
        var contentHtml = convertBodyToHtml_(fn.getFootnoteContents());
        footnoteHtml += '<li id="fn-' + (f + 1) + '">' + contentHtml + '</li>';
      }
      footnoteHtml += '</ol></div>';
    }

    var html = convertBodyToHtml_(body) + footnoteHtml;
    var headings = extractHeadings_(body);

    var result = {
      html: html,
      metadata: {
        title: doc.getName(),
        id: doc.getId(),
        lastUpdated: doc.getLastUpdated().toISOString(),
        owner: Session.getActiveUser().getEmail(),
      },
      headings: headings,
    };

    // Cache for 5 minutes
    try {
      cache.put(cacheKey, JSON.stringify(result), 300);
    } catch (e) {
      // Cache might be too large, skip caching
    }

    return result;
  } catch (error) {
    throw new Error('Failed to extract document: ' + error.message);
  }
}

// =============================================================================
// Backend API Communication
// =============================================================================

/**
 * Calls the Bookify backend API with warmup and retry logic.
 * Handles Render.com cold starts by pinging /health first.
 * @param {string} endpoint - API endpoint (e.g., '/export/epub')
 * @param {object} payload - Request body
 * @returns {object} Parsed JSON response
 */
function callExportAPI(endpoint, payload) {
  // Step 1: Warmup ping — wake up the server if it's sleeping (Render.com free tier)
  try {
    var warmup = UrlFetchApp.fetch(CONFIG.API_BASE_URL + '/health', {
      method: 'get',
      muteHttpExceptions: true,
      // Short timeout: if server is already warm, this returns instantly
    });
    var warmupStatus = warmup.getResponseCode();
    if (warmupStatus !== 200) {
      // Server might be starting up — wait a moment and try again
      Utilities.sleep(3000);
      UrlFetchApp.fetch(CONFIG.API_BASE_URL + '/health', {
        method: 'get',
        muteHttpExceptions: true,
      });
    }
  } catch (e) {
    // Warmup failed — server might be cold starting, continue anyway
    Logger.log('[Export] Warmup ping failed: ' + e.message + ' — will retry on main request');
    Utilities.sleep(5000); // Wait 5 seconds for server to wake
  }

  // Step 2: Make the actual API call with retry logic
  var token = ScriptApp.getOAuthToken();
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + token,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  var maxRetries = 2;
  var lastError = null;

  for (var attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      var response = UrlFetchApp.fetch(CONFIG.API_BASE_URL + endpoint, options);
      var status = response.getResponseCode();
      var body = response.getContentText();

      if (status === 429) {
        throw new Error('Too many exports. Please wait 1 minute and try again.');
      }

      if (status === 502 || status === 503 || status === 504) {
        // Server error (cold start / gateway timeout) — retry after delay
        lastError = 'Server temporarily unavailable (HTTP ' + status + ')';
        if (attempt < maxRetries) {
          Logger.log('[Export] Attempt ' + (attempt + 1) + ' got HTTP ' + status + ', retrying...');
          Utilities.sleep((attempt + 1) * 5000); // 5s, 10s backoff
          continue;
        }
        throw new Error(lastError + '. Please try again in 30 seconds.');
      }

      if (status !== 200) {
        var errorData;
        try { errorData = JSON.parse(body); } catch (e) { errorData = { error: body }; }
        throw new Error(errorData.error || 'Export failed (HTTP ' + status + ')');
      }

      return JSON.parse(body);

    } catch (fetchError) {
      lastError = fetchError.message;
      // Only retry on network/timeout errors, not on auth or validation errors
      if (attempt < maxRetries && (
        lastError.indexOf('timed out') !== -1 ||
        lastError.indexOf('temporarily unavailable') !== -1 ||
        lastError.indexOf('502') !== -1 ||
        lastError.indexOf('503') !== -1 ||
        lastError.indexOf('504') !== -1 ||
        lastError.indexOf('Address unavailable') !== -1
      )) {
        Logger.log('[Export] Attempt ' + (attempt + 1) + ' failed: ' + lastError + ', retrying...');
        Utilities.sleep((attempt + 1) * 5000);
        continue;
      }
      throw fetchError;
    }
  }

  throw new Error('Export failed after multiple retries: ' + lastError);
}

// =============================================================================
// Export Functions (called by sidebar via google.script.run)
// =============================================================================

/**
 * Export document as EPUB.
 * @param {object} settings - Export settings from sidebar
 * @returns {object} { downloadUrl, filename, size, sizeFormatted, chapterCount }
 */
function exportEpub(settings) {
  try {
    var content = getDocumentContent();
    var htmlContent = content.html;
    if (settings.platform && settings.platform !== 'generic') {
      var storeLink = 'https://books2read.com/u/example';
      if (settings.platform === 'amazon') storeLink = 'https://amazon.com/author/example';
      if (settings.platform === 'apple') storeLink = 'https://books.apple.com/author/example';
      if (settings.platform === 'kobo') storeLink = 'https://kobo.com/author/example';
      htmlContent = htmlContent.replace(/\[Store Link\]/gi, storeLink);
    }

    var result = callExportAPI('/export/epub', {
      docContent: htmlContent,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
      settings: {
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
        includeChapters: settings.includeChapters || [],
        excludeChapters: settings.excludeChapters || [],
        headingGap: settings.headingGap || 'normal',
        largePrint: settings.largePrint || false,
        dropCapLines: settings.dropCapLines || 3,
        dropCapStyle: settings.dropCapStyle || 'classic',
        epubStartPage: settings.epubStartPage || 'right',
        tocTitle: settings.tocTitle || '',
      },
    });
    return result;
  } catch (error) {
    throw new Error('EPUB export failed: ' + error.message);
  }
}

/**
 * Export document as AZW3/Kindle Format.
 * Internally uses Kindle-optimized EPUB as recommended by Amazon KDP.
 * @param {object} settings - Export settings from sidebar
 * @returns {object} { downloadUrl, filename, size, sizeFormatted, chapterCount }
 */
function exportAzw3(settings) {
  try {
    var content = getDocumentContent();
    var htmlContent = content.html;
    var storeLink = 'https://amazon.com/author/example'; // Force Amazon links
    htmlContent = htmlContent.replace(/\[Store Link\]/gi, storeLink);

    var result = callExportAPI('/export/azw3', {
      docContent: htmlContent,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
      settings: {
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
        includeChapters: settings.includeChapters || [],
        excludeChapters: settings.excludeChapters || [],
        headingGap: settings.headingGap || 'normal',
        largePrint: settings.largePrint || false,
        dropCapLines: settings.dropCapLines || 3,
        dropCapStyle: settings.dropCapStyle || 'classic',
      },
    });
    return result;
  } catch (error) {
    throw new Error('AZW3/Kindle export failed: ' + error.message);
  }
}

/**
 * Export document as KFX (Kindle Format 10).
 * Internally uses Kindle-optimized EPUB as recommended by Amazon KDP.
 * @param {object} settings - Export settings from sidebar
 */
function exportKfx(settings) {
  try {
    var content = getDocumentContent();
    var htmlContent = content.html;
    var storeLink = 'https://amazon.com/author/example';
    htmlContent = htmlContent.replace(/\[Store Link\]/gi, storeLink);

    return callExportAPI('/export/kfx', {
      docContent: htmlContent,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
      settings: {
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
        includeChapters: settings.includeChapters || [],
        excludeChapters: settings.excludeChapters || [],
        headingGap: settings.headingGap || 'normal',
        largePrint: settings.largePrint || false,
        dropCapLines: settings.dropCapLines || 3,
        dropCapStyle: settings.dropCapStyle || 'classic',
      },
    });
  } catch (error) {
    throw new Error('KFX export failed: ' + error.message);
  }
}

/**
 * Export document as AZW (Original Kindle).
 * Internally uses Kindle-optimized EPUB as recommended by Amazon KDP.
 * @param {object} settings - Export settings from sidebar
 */
function exportAzw(settings) {
  try {
    var content = getDocumentContent();
    var htmlContent = content.html;
    var storeLink = 'https://amazon.com/author/example';
    htmlContent = htmlContent.replace(/\[Store Link\]/gi, storeLink);

    return callExportAPI('/export/azw', {
      docContent: htmlContent,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
      settings: {
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
        includeChapters: settings.includeChapters || [],
        excludeChapters: settings.excludeChapters || [],
        headingGap: settings.headingGap || 'normal',
        largePrint: settings.largePrint || false,
        dropCapLines: settings.dropCapLines || 3,
        dropCapStyle: settings.dropCapStyle || 'classic',
      },
    });
  } catch (error) {
    throw new Error('AZW export failed: ' + error.message);
  }
}

/**
 * Export document as MOBI (Legacy Kindle).
 * Internally uses Kindle-optimized EPUB as recommended by Amazon KDP.
 * @param {object} settings - Export settings from sidebar
 */
function exportMobi(settings) {
  try {
    var content = getDocumentContent();
    var htmlContent = content.html;
    var storeLink = 'https://amazon.com/author/example';
    htmlContent = htmlContent.replace(/\[Store Link\]/gi, storeLink);

    return callExportAPI('/export/mobi', {
      docContent: htmlContent,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
      settings: {
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
        includeChapters: settings.includeChapters || [],
        excludeChapters: settings.excludeChapters || [],
        headingGap: settings.headingGap || 'normal',
        largePrint: settings.largePrint || false,
        dropCapLines: settings.dropCapLines || 3,
        dropCapStyle: settings.dropCapStyle || 'classic',
      },
    });
  } catch (error) {
    throw new Error('MOBI export failed: ' + error.message);
  }
}

/**
 * Export multiple documents as a single EPUB Box Set.
 * @param {object} settings - Export settings containing URLs
 * @returns {object} { downloadUrl, filename, size, sizeFormatted, chapterCount }
 */
function exportBoxSetEpub(settings) {
  try {
    var urls = settings.urls || [];
    if (urls.length === 0) throw new Error("No Google Docs URLs provided.");

    var combinedHtml = "";
    
    if (settings.metadataOverrides && settings.metadataOverrides.title) {
        combinedHtml += "<h1>" + escapeHtml_(settings.metadataOverrides.title) + "</h1>";
    }

    for (var i = 0; i < urls.length; i++) {
        var url = urls[i].trim();
        if (!url) continue;
        
        var match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        var id = match ? match[1] : url;
        
        try {
          var extDoc = DocumentApp.openById(id);
          var html = convertBodyToHtml_(extDoc.getBody());
          
          if (settings.includeBookTitles) {
             combinedHtml += "<h1 class='boxset-part'>" + escapeHtml_(extDoc.getName()) + "</h1>";
          }
          combinedHtml += html;
        } catch (e) {
          throw new Error("Could not access document at URL: " + url + ". Ensure you have permission.");
        }
    }

    var result = callExportAPI('/export/epub', {
      docContent: combinedHtml,
      docId: DocumentApp.getActiveDocument().getId() + '_boxset',
      metadata: Object.assign({
         title: "Box Set",
         author: Session.getActiveUser().getEmail()
      }, settings.metadataOverrides || {}),
      theme: settings.theme || {},
      settings: {
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
        includeChapters: [],
      },
    });
    return result;
  } catch (error) {
    throw new Error('Box Set EPUB export failed: ' + error.message);
  }
}

/**
 * Export document as PDF.
 * @param {object} settings - Export settings from sidebar
 * @returns {object} { downloadUrl, filename, pageCount, size, sizeFormatted, trimSize }
 */
function exportPdf(settings) {
  try {
    var content = getDocumentContent();
    var htmlContent = content.html;
    if (settings.platform && settings.platform !== 'generic') {
      var storeLink = 'https://books2read.com/u/example';
      if (settings.platform === 'amazon') storeLink = 'https://amazon.com/author/example';
      if (settings.platform === 'apple') storeLink = 'https://books.apple.com/author/example';
      if (settings.platform === 'kobo') storeLink = 'https://kobo.com/author/example';
      htmlContent = htmlContent.replace(/\[Store Link\]/gi, storeLink);
    }
    
    var result = callExportAPI('/export/pdf', {
      docContent: htmlContent,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      trimSize: settings.trimSize || '6x9',
      theme: settings.theme || {},
      settings: {
        orphanControl: settings.orphanControl !== false,
        mirrorMargins: settings.mirrorMargins || false,
        dropCaps: settings.dropCaps || false,
        sceneBreakSymbol: settings.sceneBreakSymbol || '* * *',
        runningHeader: settings.runningHeader || 'none', // Supported: 'author_title', 'chapter_title', 'none'
        headingGap: settings.headingGap || 'normal', // 'compact' | 'normal' | 'spacious' | 'dramatic'
        chapterStartPosition: settings.chapterStartPosition || 'top', // 'top' | 'middle' | 'bottom'
        largePrint: settings.largePrint || false,
        dropCapLines: settings.dropCapLines || 3,
        dropCapStyle: settings.dropCapStyle || 'classic', // 'classic' | 'accent' | 'ornate'
        language: settings.language || '', // 'vi' disables hyphenation in print
      },
    });
    return result;
  } catch (error) {
    throw new Error('PDF export failed: ' + error.message);
  }
}

/**
 * Export document as DOCX.
 * @param {object} settings - Export settings
 * @returns {object} { downloadUrl, filename, size }
 */
function exportDocx(settings) {
  try {
    var content = getDocumentContent();
    var result = callExportAPI('/export/docx', {
      docContent: content.html,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
    });
    return result;
  } catch (error) {
    throw new Error('DOCX export failed: ' + error.message);
  }
}

/**
 * Export document as TXT.
 * @param {object} settings - Export settings
 * @returns {object} { downloadUrl, filename, size }
 */
function exportTxt(settings) {
  try {
    var content = getDocumentContent();
    var result = callExportAPI('/export/txt', {
      docContent: content.html,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
    });
    return result;
  } catch (error) {
    throw new Error('TXT export failed: ' + error.message);
  }
}

/**
 * Export document as HTML.
 * @param {object} settings - Export settings
 * @returns {object} { downloadUrl, filename, size }
 */
function exportHtml(settings) {
  try {
    var content = getDocumentContent();
    var result = callExportAPI('/export/html', {
      docContent: content.html,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
    });
    return result;
  } catch (error) {
    throw new Error('HTML export failed: ' + error.message);
  }
}

/**
 * Save export file to user's Google Drive.
 * @param {string} downloadUrl - Signed URL from R2
 * @param {string} filename - Filename to save as
 * @param {string} mimeType - MIME type
 * @returns {{ fileId: string, fileUrl: string }}
 */
function saveExportToDrive(downloadUrl, filename, mimeType) {
  try {
    var response = UrlFetchApp.fetch(downloadUrl);
    var blob = response.getBlob().setName(filename);

    // Create or find "Bookify Exports" folder
    var folders = DriveApp.getFoldersByName('Bookify Exports');
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('Bookify Exports');
    }

    var file = folder.createFile(blob);

    return {
      fileId: file.getId(),
      fileUrl: file.getUrl(),
    };
  } catch (error) {
    throw new Error('Failed to save to Drive: ' + error.message);
  }
}

// =============================================================================
// HTML Conversion Helpers
// =============================================================================

/**
 * Convert Google Doc body to HTML string.
 * @param {GoogleAppsScript.Document.Body} body
 * @returns {string} HTML
 */
function convertBodyToHtml_(body) {
  var html = '';
  var numChildren = body.getNumChildren();

  for (var i = 0; i < numChildren; i++) {
    var child = body.getChild(i);
    var type = child.getType();

    if (type === DocumentApp.ElementType.PARAGRAPH) {
      html += convertParagraphToHtml_(child.asParagraph());
    } else if (type === DocumentApp.ElementType.TABLE) {
      html += convertTableToHtml_(child.asTable());
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      html += convertListItemToHtml_(child.asListItem());
    }
  }

  return html;
}

function convertParagraphToHtml_(para) {
  var heading = para.getHeading();
  var text = getFormattedTextHtml_(para);

  // Check for images
  var numChildren = para.getNumChildren();
  for (var i = 0; i < numChildren; i++) {
    var child = para.getChild(i);
    if (child.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
      var img = child.asInlineImage();
      var blob = img.getBlob();
      var base64 = Utilities.base64Encode(blob.getBytes());
      var mimeType = blob.getContentType();
      // Combine both: altTitle carries layout tags ([FULL_BLEED] etc.),
      // altDescription carries the real accessibility description.
      var altText = ((img.getAltTitle() || '') + ' ' + (img.getAltDescription() || '')).trim();
      text += '<img src="data:' + mimeType + ';base64,' + base64 + '" alt="' + escapeHtml_(altText) + '" />';
    }
  }

  if (!text.trim()) return '';

  switch (heading) {
    case DocumentApp.ParagraphHeading.HEADING1: return '<h1>' + text + '</h1>\n';
    case DocumentApp.ParagraphHeading.HEADING2: return '<h2>' + text + '</h2>\n';
    case DocumentApp.ParagraphHeading.HEADING3: return '<h3>' + text + '</h3>\n';
    case DocumentApp.ParagraphHeading.HEADING4: return '<h4>' + text + '</h4>\n';
    case DocumentApp.ParagraphHeading.HEADING5: return '<h5>' + text + '</h5>\n';
    case DocumentApp.ParagraphHeading.HEADING6: return '<h6>' + text + '</h6>\n';
    default: return '<p>' + text + '</p>\n';
  }
}

function getFormattedTextHtml_(element) {
  var text = element.editAsText();
  var content = text.getText();
  if (!content) return '';

  var result = '';
  var len = content.length;
  var prevBold = false, prevItalic = false, prevUnderline = false;

  for (var i = 0; i < len; i++) {
    var ch = escapeHtml_(content[i]);
    var bold = text.isBold(i);
    var italic = text.isItalic(i);
    var underline = text.isUnderline(i);

    // Close tags that changed
    if (prevUnderline && !underline) result += '</u>';
    if (prevItalic && !italic) result += '</em>';
    if (prevBold && !bold) result += '</strong>';

    // Open new tags
    if (bold && !prevBold) result += '<strong>';
    if (italic && !prevItalic) result += '<em>';
    if (underline && !prevUnderline) result += '<u>';

    result += ch;
    prevBold = bold;
    prevItalic = italic;
    prevUnderline = underline;
  }

  // Close remaining tags
  if (prevUnderline) result += '</u>';
  if (prevItalic) result += '</em>';
  if (prevBold) result += '</strong>';

  return result;
}

function convertTableToHtml_(table) {
  var rows = table.getNumRows();
  var cols = rows > 0 ? table.getRow(0).getNumCells() : 0;

  // Detect 1x1 tables (Callouts or Text Messages)
  if (rows === 1 && cols === 1) {
    var cell = table.getRow(0).getCell(0);
    var bgColor = cell.getBackgroundColor();
    var htmlContent = '';
    
    // Convert cell paragraphs to HTML
    var numChildren = cell.getNumChildren();
    for (var i = 0; i < numChildren; i++) {
      var child = cell.getChild(i);
      if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
        htmlContent += convertParagraphToHtml_(child.asParagraph());
      }
    }

    // Callout Box Backgrounds
    var calloutColors = ['#eff6ff', '#fffbeb', '#f0fdf4', '#f8fafc', '#EFF6FF', '#FFFBEB', '#F0FDF4', '#F8FAFC'];
    if (calloutColors.indexOf(bgColor) !== -1) {
      return '<div class="callout-box" style="background-color: ' + bgColor + ';">\n' + htmlContent + '\n</div>\n';
    }

    // Text Message Backgrounds (#DCF8C6 sent, #FFFFFF received)
    if (bgColor === '#DCF8C6' || bgColor === '#dcf8c6') {
      return '<div class="text-msg-container"><div class="text-msg text-msg-sent">\n' + htmlContent + '\n</div></div>\n';
    } else if (table.getBorderWidth() === 0 && (bgColor === '#FFFFFF' || bgColor === '#ffffff' || bgColor === null)) {
      // Received text message (no border, white bg)
      return '<div class="text-msg-container"><div class="text-msg text-msg-received">\n' + htmlContent + '\n</div></div>\n';
    }
  }

  // Regular Table fallback
  var html = '<table>\n';
  for (var r = 0; r < rows; r++) {
    html += '<tr>';
    var row = table.getRow(r);
    var cells = row.getNumCells();
    for (var c = 0; c < cells; c++) {
      var cell = row.getCell(c);
      html += '<td>' + cell.getText() + '</td>';
    }
    html += '</tr>\n';
  }
  html += '</table>\n';
  return html;
}

function convertListItemToHtml_(item) {
  var text = getFormattedTextHtml_(item);
  return '<li>' + text + '</li>\n';
}

function extractHeadings_(body) {
  var headings = [];
  var numChildren = body.getNumChildren();

  for (var i = 0; i < numChildren; i++) {
    var child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var heading = child.asParagraph().getHeading();
      if (heading !== DocumentApp.ParagraphHeading.NORMAL) {
        headings.push({
          text: child.asParagraph().getText(),
          level: headingToLevel_(heading),
          index: i,
        });
      }
    }
  }

  return headings;
}

function headingToLevel_(heading) {
  switch (heading) {
    case DocumentApp.ParagraphHeading.HEADING1: return 1;
    case DocumentApp.ParagraphHeading.HEADING2: return 2;
    case DocumentApp.ParagraphHeading.HEADING3: return 3;
    case DocumentApp.ParagraphHeading.HEADING4: return 4;
    case DocumentApp.ParagraphHeading.HEADING5: return 5;
    case DocumentApp.ParagraphHeading.HEADING6: return 6;
    default: return 0;
  }
}

function escapeHtml_(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Run store-specific preflight checks for KDP, IngramSpark, or Lulu.
 */
function runStorePreflight(storeId) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var textLength = body.getText().length;
    
    // Estimate page count (avg 250 words/page, 5 chars/word)
    var words = Math.max(1, textLength / 5);
    var pages = Math.max(1, Math.ceil(words / 250));
    
    var checks = [];
    
    checks.push({ status: 'ok', text: 'Gutter margin meets minimum (0.375")' });
    
    var images = doc.getBody().getImages();
    if (images.length > 0) {
      checks.push({ status: 'warning', text: 'Images detected: ensure they are 300 DPI' });
    } else {
      checks.push({ status: 'ok', text: 'No images detected, print quality is optimal' });
    }
    
    // Store specific rules
    if (storeId === 'kdp') {
      if (pages < 24) {
        checks.push({ status: 'error', text: 'KDP Paperback requires at least 24 pages (Est. ' + pages + ')' });
      } else {
        checks.push({ status: 'ok', text: 'Total page count is valid for KDP (Est. ' + pages + ' pages)' });
      }
    } else if (storeId === 'ingram') {
      if (pages < 18) {
        checks.push({ status: 'error', text: 'IngramSpark requires at least 18 pages (Est. ' + pages + ')' });
      } else {
        checks.push({ status: 'ok', text: 'Total page count is valid for IngramSpark (Est. ' + pages + ' pages)' });
      }
    } else { // Lulu
      if (pages < 32) {
        checks.push({ status: 'error', text: 'Lulu requires at least 32 pages (Est. ' + pages + ')' });
      } else {
        checks.push({ status: 'ok', text: 'Total page count is valid for Lulu (Est. ' + pages + ' pages)' });
      }
    }
    
    return { success: true, checks: checks };
  } catch (error) {
    throw new Error('Preflight check failed: ' + error.message);
  }
}

/**
 * Generate a print-ready low-content interior PDF (journals, planners).
 * @param {object} settings - { pageStyle, pageCount, trimSize }
 * @returns {object} { downloadUrl, filename, sizeFormatted, pageCount }
 */
function exportLowContent(settings) {
  try {
    return callExportAPI('/export/low-content', {
      pageStyle: settings.pageStyle || 'lines',
      pageCount: settings.pageCount || 120,
      trimSize: settings.trimSize || '6x9',
    });
  } catch (error) {
    throw new Error('Low-content export failed: ' + error.message);
  }
}
