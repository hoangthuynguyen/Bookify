/**
 * Bookify — Main Entry Points
 * Google Workspace Add-on for Google Docs
 * @OnlyCurrentDoc
 */

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  API_BASE_URL: 'https://bookify-ixxa.onrender.com',
  FRONTEND_URL: 'https://bookify-ixxa.onrender.com',
  SIDEBAR_WIDTH: 350,
  SIDEBAR_TITLE: 'Bookify',
};

/**
 * Called when the document is opened.
 * In Workspace Add-on mode, this may be called in a restricted context
 * where DocumentApp.getUi() is NOT available. We wrap in try/catch.
 * The primary entry point is onHomepage() via CardService.
 */
function onOpen(e) {
  try {
    var ui = DocumentApp.getUi();
    var menu = ui.createMenu('Bookify');

    menu.addItem('Open Formatter', 'openSidebar');

    if (!e || e.authMode !== ScriptApp.AuthMode.NONE) {
      menu.addSeparator()
        .addSubMenu(
          ui.createMenu('Quick Export')
            .addItem('Export EPUB', 'quickExportEpub')
            .addItem('Export PDF', 'quickExportPdf')
            .addItem('Export DOCX', 'quickExportDocx')
        )
        .addSeparator()
        .addSubMenu(
          ui.createMenu('Insert')
            .addItem('Chapter Break', 'insertChapterBreak')
            .addItem('Scene Break (***)', 'insertDefaultSceneBreak')
        )
        .addSeparator()
        .addItem('Word Count', 'showWordCount')
        .addItem('Validate for EPUB', 'quickValidate');
    }

    menu.addToUi();
  } catch (err) {
    // In Workspace Add-on context, DocumentApp.getUi() is not available.
    // This is expected — the add-on uses onHomepage() + CardService instead.
    console.log('onOpen skipped (Workspace Add-on context): ' + err.message);
  }
}

/**
 * Called when the add-on is installed.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Homepage trigger for Workspace Add-on — this is the MAIN entry point.
 * Returns a CardService card shown in the Docs side panel.
 * @param {object} e - The homepage event
 * @returns {GoogleAppsScript.Card_Service.Card}
 */
function onHomepage(e) {
  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Bookify')
        .setSubtitle('Professional Book Formatter')
        .setImageStyle(CardService.ImageStyle.CIRCLE)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('Format & export your book directly from Google Docs.\n\nSupports EPUB, PDF, DOCX, Kindle formats and more.')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('📖  Open Bookify Panel')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setBackgroundColor('#3b82f6')
            .setOnClickAction(CardService.newAction().setFunctionName('openSidebar'))
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Quick Actions')
        .addWidget(
          CardService.newTextButton()
            .setText('📊  Word Count')
            .setOnClickAction(CardService.newAction().setFunctionName('cardWordCount'))
        )
        .addWidget(
          CardService.newTextButton()
            .setText('✅  Validate for EPUB')
            .setOnClickAction(CardService.newAction().setFunctionName('cardValidate'))
        )
    )
    .build();

  return card;
}

/**
 * Called when file scope is granted.
 */
function onFileScopeGranted(e) {
  return onHomepage(e);
}

/**
 * Card-compatible word count (returns notification instead of alert).
 */
function cardWordCount(e) {
  try {
    var stats = getWordCount();
    var msg = 'Words: ' + stats.total + ' | Characters: ' + stats.characters +
              ' | Paragraphs: ' + stats.paragraphs + ' | Chapters: ' + stats.chapters;
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(msg))
      .build();
  } catch (err) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Error: ' + err.message))
      .build();
  }
}

/**
 * Card-compatible EPUB validation.
 */
function cardValidate(e) {
  try {
    var content = getDocumentContent();
    var result = callExportAPI('/validate/epub', { docContent: content.html });
    var msg = result.summary || 'Validation complete';
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(msg))
      .build();
  } catch (err) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Error: ' + err.message))
      .build();
  }
}

// =============================================================================
// Sidebar & Modals
// =============================================================================

/**
 * Opens the Bookify sidebar with the React app loaded in an iframe.
 */
function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle(CONFIG.SIDEBAR_TITLE)
    .setWidth(CONFIG.SIDEBAR_WIDTH);
  DocumentApp.getUi().showSidebar(html);
}

/**
 * Opens the Fullscreen Preview device simulator in a Modal Dialog.
 */
function openFullscreenPreview() {
  const html = HtmlService.createHtmlOutputFromFile('PreviewModal')
    .setWidth(900)
    .setHeight(700);
  DocumentApp.getUi().showModalDialog(html, 'Live Device Preview');
}

// =============================================================================
// Quick Actions (Menu items)
// =============================================================================

/**
 * Inserts a chapter break (Heading 1) at the cursor position.
 */
function insertChapterBreak() {
  try {
    const doc = DocumentApp.getActiveDocument();
    const cursor = doc.getCursor();

    if (!cursor) {
      DocumentApp.getUi().alert('Place your cursor where you want the chapter break.');
      return;
    }

    const body = doc.getBody();
    const element = cursor.getElement();
    const offset = cursor.getOffset();

    // Find the paragraph containing the cursor
    let paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    if (!paragraph) {
      DocumentApp.getUi().alert('Could not find a valid position for the chapter break.');
      return;
    }

    // Insert new paragraph after current one
    const parentIndex = body.getChildIndex(paragraph);
    const newPara = body.insertParagraph(parentIndex + 1, 'Chapter Title');
    newPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    newPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    // Move cursor to the new paragraph
    doc.setCursor(doc.newPosition(newPara, 0));

    DocumentApp.getActiveDocument().getUi().alert('Chapter break inserted! Edit the title above.');
  } catch (error) {
    DocumentApp.getUi().alert('Error: ' + error.message);
  }
}

/**
 * Inserts a default scene break (***) at cursor.
 */
function insertDefaultSceneBreak() {
  insertSceneBreak('* * *');
}

/**
 * Shows a quick word count dialog.
 */
function showWordCount() {
  try {
    const stats = getWordCount();
    DocumentApp.getUi().alert(
      'Word Count',
      `Total: ${stats.total.toLocaleString()} words\n` +
      `Characters: ${stats.characters.toLocaleString()}\n` +
      `Paragraphs: ${stats.paragraphs.toLocaleString()}\n` +
      `Chapters (H1): ${stats.chapters}`,
      DocumentApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    DocumentApp.getUi().alert('Error: ' + error.message);
  }
}

/**
 * Quick EPUB validation from menu.
 */
function quickValidate() {
  try {
    const content = getDocumentContent();
    const result = callExportAPI('/validate/epub', { docContent: content.html });

    let message = result.summary + '\n\n';
    if (result.errors && result.errors.length > 0) {
      message += 'ERRORS:\n';
      result.errors.forEach(e => { message += `- ${e.message}\n`; });
    }
    if (result.warnings && result.warnings.length > 0) {
      message += '\nWARNINGS:\n';
      result.warnings.forEach(w => { message += `- ${w.message}\n`; });
    }

    DocumentApp.getUi().alert('EPUB Validation', message, DocumentApp.getUi().ButtonSet.OK);
  } catch (error) {
    DocumentApp.getUi().alert('Validation failed: ' + error.message);
  }
}

// =============================================================================
// Quick Exports (Menu items)
// =============================================================================

function quickExportEpub() {
  try {
    DocumentApp.getUi().alert('Starting EPUB export... This may take 30-60 seconds.');
    const result = exportEpub({ theme: {}, dropCaps: false, sceneBreakSymbol: '* * *' });
    DocumentApp.getUi().alert(
      'EPUB Export Complete',
      `File: ${result.filename}\nSize: ${result.sizeFormatted}\n\nDownload URL has been copied. ` +
      'It will expire in 24 hours.',
      DocumentApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    DocumentApp.getUi().alert('Export failed: ' + error.message);
  }
}

function quickExportPdf() {
  try {
    DocumentApp.getUi().alert('Starting PDF export... This may take 60-120 seconds.');
    const result = exportPdf({
      trimSize: '6x9', theme: {}, orphanControl: true, mirrorMargins: true
    });
    DocumentApp.getUi().alert(
      'PDF Export Complete',
      `File: ${result.filename}\nPages: ${result.pageCount}\nSize: ${result.sizeFormatted}`,
      DocumentApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    DocumentApp.getUi().alert('Export failed: ' + error.message);
  }
}

function quickExportDocx() {
  try {
    const result = exportDocx({ theme: {} });
    DocumentApp.getUi().alert('DOCX Export Complete', `File: ${result.filename}`, DocumentApp.getUi().ButtonSet.OK);
  } catch (error) {
    DocumentApp.getUi().alert('Export failed: ' + error.message);
  }
}
