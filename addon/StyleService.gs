/**
 * StyleService.gs — Document styling, formatting, and design element insertion
 */

// =============================================================================
// Scene Breaks
// =============================================================================

/**
 * Insert a scene break at the cursor position.
 * @param {string} symbol - The scene break symbol (e.g., '* * *', '\u2766')
 */
function insertSceneBreak(symbol) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();

    if (!cursor) {
      throw new Error('Place your cursor where you want the scene break.');
    }

    var body = doc.getBody();
    var element = cursor.getElement();

    // Find parent paragraph
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    if (!paragraph) throw new Error('Could not find a valid position.');

    var parentIndex = body.getChildIndex(paragraph);

    // Insert blank line + scene break + blank line
    body.insertParagraph(parentIndex + 1, '');
    var breakPara = body.insertParagraph(parentIndex + 2, symbol || '* * *');
    breakPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    breakPara.setSpacingBefore(12);
    breakPara.setSpacingAfter(12);

    // Style the break symbol
    var text = breakPara.editAsText();
    text.setFontSize(14);
    text.setForegroundColor('#999999');

    body.insertParagraph(parentIndex + 3, '');

    return { success: true };
  } catch (error) {
    throw new Error('Insert scene break failed: ' + error.message);
  }
}

// =============================================================================
// Drop Caps
// =============================================================================

/**
 * Apply drop cap styling to the first letter of the paragraph at cursor.
 * Note: Google Docs cannot truly render drop caps inline.
 * This applies a named style that the export engine uses.
 * @param {object} options - { fontSize, fontFamily, color }
 */
function applyDropCapStyle(options) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();

    if (!cursor) {
      throw new Error('Place your cursor in the paragraph to apply drop cap.');
    }

    var element = cursor.getElement();
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    if (!paragraph) throw new Error('Not in a paragraph.');

    var text = paragraph.asParagraph().editAsText();
    var content = text.getText();

    if (content.length === 0) throw new Error('Paragraph is empty.');

    // Style the first letter larger
    var fontSize = (options && options.fontSize) || 36;
    var color = (options && options.color) || '#333333';

    text.setFontSize(0, 0, fontSize);
    text.setBold(0, 0, true);
    if (color) text.setForegroundColor(0, 0, color);

    // Mark paragraph with a named style attribute for export
    // (Google Docs doesn't have custom attributes, so we use a convention)
    var props = PropertiesService.getDocumentProperties();
    var dropCaps = JSON.parse(props.getProperty('dropCaps') || '[]');
    dropCaps.push({
      paragraphText: content.substring(0, 20),
      options: options,
    });
    props.setProperty('dropCaps', JSON.stringify(dropCaps));

    return { success: true };
  } catch (error) {
    throw new Error('Drop cap failed: ' + error.message);
  }
}

// =============================================================================
// Image Formatting
// =============================================================================

/**
 * Toggle Full Bleed setting for the currently selected image by appending [FULL_BLEED] to its Alt Title.
 */
function toggleImageFullBleed() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();
    var selection = doc.getSelection();
    
    var image = null;

    if (selection) {
      var elements = selection.getRangeElements();
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i].getElement();
        if (el.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
          image = el.asInlineImage();
          break;
        } else if (el.getType() === DocumentApp.ElementType.TEXT) {
          // Sometimes wrapped inside text? In Docs inline images are separate elements under Paragraph
        }
      }
    } 
    
    if (!image && cursor) {
      var element = cursor.getElement();
      if (element.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
         image = element.asInlineImage();
      } else if (element.getType() === DocumentApp.ElementType.PARAGRAPH) {
         // check siblings
         var para = element.asParagraph();
         for (var j=0; j<para.getNumChildren(); j++) {
            if (para.getChild(j).getType() === DocumentApp.ElementType.INLINE_IMAGE) {
              image = para.getChild(j).asInlineImage();
              break;
            }
         }
      }
    }

    if (!image) throw new Error('Please select an image or place cursor next to it first.');

    var altTitle = image.getAltTitle() || '';
    var isFullBleed = altTitle.indexOf('[FULL_BLEED]') !== -1;

    if (isFullBleed) {
      image.setAltTitle(altTitle.replace('[FULL_BLEED]', '').trim());
      return { success: true, message: 'Full bleed setting removed from image.' };
    } else {
      image.setAltTitle((altTitle + ' [FULL_BLEED]').trim());
      return { success: true, message: 'Image successfully set to Full Bleed mode!' };
    }

  } catch (error) {
    throw new Error('Full bleed failed: ' + error.message);
  }
}

// =============================================================================
// Text Message Bubbles
// =============================================================================

/**
 * Insert formatted text message bubbles.
 * Uses a table to simulate chat bubbles in Google Docs.
 * @param {Array<{sender: string, text: string, isSent: boolean}>} messages
 */
function insertTextMessages(messages) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var cursor = doc.getCursor();

    if (!cursor) throw new Error('Place your cursor where you want the messages.');

    var element = cursor.getElement();
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    var insertIndex = body.getChildIndex(paragraph) + 1;

    messages.forEach(function(msg, i) {
      // Create a 1-column table for each message
      var table = body.insertTable(insertIndex + i);
      var row = table.appendTableRow();
      var cell = row.appendTableCell();

      // Sender name
      if (msg.sender) {
        var senderPara = cell.appendParagraph(msg.sender);
        senderPara.editAsText().setFontSize(9);
        senderPara.editAsText().setForegroundColor('#888888');
        senderPara.editAsText().setBold(true);
      }

      // Message text
      var msgPara = cell.appendParagraph(msg.text);
      msgPara.editAsText().setFontSize(11);

      // Style the table cell
      if (msg.isSent) {
        cell.setBackgroundColor('#DCF8C6'); // WhatsApp green
        table.setAttributes({
          'BORDER_WIDTH': 0,
        });
        // Right-align sent messages
        cell.setPaddingLeft(40);
        cell.setPaddingRight(8);
      } else {
        cell.setBackgroundColor('#FFFFFF');
        cell.setPaddingLeft(8);
        cell.setPaddingRight(40);
      }

      cell.setPaddingTop(6);
      cell.setPaddingBottom(6);

      // Remove the default empty paragraph
      if (cell.getNumChildren() > 2) {
        cell.removeChild(cell.getChild(0));
      }
    });

    return { success: true, count: messages.length };
  } catch (error) {
    throw new Error('Insert text messages failed: ' + error.message);
  }
}

// =============================================================================
// Call-Out Boxes
// =============================================================================

/**
 * Insert a call-out box at the cursor position.
 * @param {object} options - { title, text, bgColor, borderColor, icon }
 */
function insertCalloutBox(options) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var cursor = doc.getCursor();

    if (!cursor) throw new Error('Place your cursor where you want the callout.');

    var element = cursor.getElement();
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    var insertIndex = body.getChildIndex(paragraph) + 1;

    // Create a bordered table as callout box
    var table = body.insertTable(insertIndex);
    var row = table.appendTableRow();
    var cell = row.appendTableCell();

    // Title
    if (options.title) {
      var titlePara = cell.appendParagraph((options.icon || '') + ' ' + options.title);
      titlePara.editAsText().setBold(true);
      titlePara.editAsText().setFontSize(13);
      titlePara.editAsText().setForegroundColor(options.borderColor || '#1E40AF');
    }

    // Content
    var contentPara = cell.appendParagraph(options.text || '');
    contentPara.editAsText().setFontSize(11);

    // Style
    cell.setBackgroundColor(options.bgColor || '#EFF6FF');
    cell.setPaddingTop(12);
    cell.setPaddingBottom(12);
    cell.setPaddingLeft(16);
    cell.setPaddingRight(16);

    // Remove default empty paragraph
    if (cell.getNumChildren() > 2) {
      cell.removeChild(cell.getChild(0));
    }

    return { success: true };
  } catch (error) {
    throw new Error('Insert callout failed: ' + error.message);
  }
}

// =============================================================================
// Chapter Headings
// =============================================================================

/**
 * Insert a chapter heading with an optional subtitle.
 * @param {object} options - { title, subtitle, align }
 */
function insertChapterHeading(options) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var cursor = doc.getCursor();

    if (!cursor) throw new Error('Place your cursor where you want the chapter title.');

    var element = cursor.getElement();
    var paragraph = element;
    while (paragraph && paragraph.getType() !== DocumentApp.ElementType.PARAGRAPH) {
      paragraph = paragraph.getParent();
    }

    var insertIndex = body.getChildIndex(paragraph);

    var align;
    switch(options.align) {
      case 'left': align = DocumentApp.HorizontalAlignment.LEFT; break;
      case 'right': align = DocumentApp.HorizontalAlignment.RIGHT; break;
      default: align = DocumentApp.HorizontalAlignment.CENTER; break;
    }

    // Insert Title
    var titlePara = body.insertParagraph(insertIndex, options.title || 'Chapter 1');
    titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    titlePara.setAlignment(align);
    titlePara.setSpacingBefore(100);

    // Insert Subtitle
    if (options.subtitle) {
      var subPara = body.insertParagraph(insertIndex + 1, options.subtitle);
      subPara.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
      subPara.setAlignment(align);
      subPara.editAsText().setFontSize(16);
      subPara.editAsText().setItalic(true);
      subPara.editAsText().setForegroundColor('#555555');
      subPara.setSpacingAfter(40);
    } else {
      titlePara.setSpacingAfter(40);
    }

    // Clean up empty paragraph if the cursor was on one
    if (paragraph.asParagraph().getText() === '') {
      body.removeChild(paragraph);
    }

    return { success: true };
  } catch (error) {
    throw new Error('Insert chapter heading failed: ' + error.message);
  }
}

// =============================================================================
// Theme Application
// =============================================================================

/**
 * Apply a theme to the entire document.
 * @param {object} themeConfig - Theme configuration object
 */
function applyTheme(themeConfig) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();

    // Body text style
    var bodyStyle = {};
    bodyStyle[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.bodyFont || 'Georgia';
    bodyStyle[DocumentApp.Attribute.FONT_SIZE] = parseInt(themeConfig.fontSize) || 11;
    bodyStyle[DocumentApp.Attribute.LINE_SPACING] = themeConfig.lineHeight || 1.6;
    bodyStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = '#1a1a1a';
    body.setAttributes(bodyStyle);

    // Apply heading styles
    var numChildren = body.getNumChildren();
    for (var i = 0; i < numChildren; i++) {
      var child = body.getChild(i);
      if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
        var para = child.asParagraph();
        var heading = para.getHeading();

        if (heading === DocumentApp.ParagraphHeading.HEADING1) {
          var h1Style = {};
          h1Style[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.headingFont || themeConfig.bodyFont || 'Georgia';
          h1Style[DocumentApp.Attribute.FONT_SIZE] = 24;
          h1Style[DocumentApp.Attribute.BOLD] = true;
          h1Style[DocumentApp.Attribute.FOREGROUND_COLOR] = themeConfig.colorAccent || '#333333';
          para.setAttributes(h1Style);
          para.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        } else if (heading === DocumentApp.ParagraphHeading.HEADING2) {
          var h2Style = {};
          h2Style[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.headingFont || themeConfig.bodyFont || 'Georgia';
          h2Style[DocumentApp.Attribute.FONT_SIZE] = 18;
          h2Style[DocumentApp.Attribute.BOLD] = true;
          para.setAttributes(h2Style);
        } else if (heading === DocumentApp.ParagraphHeading.HEADING3) {
          var h3Style = {};
          h3Style[DocumentApp.Attribute.FONT_FAMILY] = themeConfig.headingFont || themeConfig.bodyFont || 'Georgia';
          h3Style[DocumentApp.Attribute.FONT_SIZE] = 14;
          h3Style[DocumentApp.Attribute.BOLD] = true;
          para.setAttributes(h3Style);
        }
      }
    }

    // Save theme to document properties
    PropertiesService.getDocumentProperties().setProperty(
      'currentTheme',
      JSON.stringify(themeConfig)
    );

    return { success: true, appliedTheme: themeConfig.name || 'Custom' };
  } catch (error) {
    throw new Error('Apply theme failed: ' + error.message);
  }
}

/**
 * Get the currently applied theme.
 * @returns {object|null}
 */
function getCurrentTheme() {
  var themeStr = PropertiesService.getDocumentProperties().getProperty('currentTheme');
  return themeStr ? JSON.parse(themeStr) : null;
}

// =============================================================================
// Front/Back Matter
// =============================================================================

/**
 * Insert front matter or back matter.
 * @param {string} type - 'title-page', 'copyright', 'dedication', 'about-author', 'also-by', 'acknowledgments'
 * @param {object} data - Template data
 * @param {string} position - 'front' or 'back' (default is 'front')
 */
function insertFrontMatter(type, data, position) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();

    // Determine insertion position
    var isFront = position !== 'back';
    
    // For inserting at the beginning (front)
    var insertIndex = 0; 

    // Helper to insert a paragraph based on position
    function addPara(text) {
      if (isFront) {
        var p = body.insertParagraph(insertIndex++, text);
        return p;
      } else {
        var p = body.appendParagraph(text);
        return p;
      }
    }

    // Helper to insert a page break
    function addPageBreak() {
      if (isFront) {
        var p = body.insertParagraph(insertIndex++, '');
        p.setPageBreakBefore(true);
        return p;
      } else {
        var p = body.appendPageBreak();
        return p;
      }
    }

    // Front: page break follows the content. Back: page break precedes the content.
    if (!isFront) {
      addPageBreak(); // Start new page for back matter
    }

    switch (type) {
      case 'title-page':
        var titlePara = addPara(data.title || 'Book Title');
        titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        titlePara.setSpacingBefore(100);

        if (data.subtitle) {
          var subPara = addPara(data.subtitle);
          subPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
          subPara.editAsText().setFontSize(16);
          subPara.editAsText().setItalic(true);
        }

        var authorPara = addPara(data.author || 'Author Name');
        authorPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        authorPara.editAsText().setFontSize(14);
        authorPara.setSpacingBefore(40);
        
        if (isFront) addPageBreak();
        break;

      case 'copyright':
        var cpPara = addPara('Copyright');
        cpPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        cpPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

        var year = data.year || new Date().getFullYear();
        var cpText = 'Copyright \u00A9 ' + year + ' ' + (data.author || 'Author Name') + '\n\n' +
          'All rights reserved. No part of this publication may be reproduced, ' +
          'distributed, or transmitted in any form or by any means without the prior ' +
          'written permission of the publisher.\n\n' +
          (data.isbn ? 'ISBN: ' + data.isbn + '\n\n' : '') +
          (data.publisher ? 'Published by ' + data.publisher + '\n' : '') +
          (data.edition ? data.edition + '\n' : '');

        var bodyPara = addPara(cpText);
        bodyPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        
        if (isFront) addPageBreak();
        break;

      case 'dedication':
        var dedPara = addPara('Dedication');
        dedPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        dedPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

        var dedText = addPara(data.text || 'For...');
        dedText.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        dedText.editAsText().setItalic(true);
        dedText.setSpacingBefore(80);

        if (isFront) addPageBreak();
        break;

      case 'about-author':
        var aboutPara = addPara('About the Author');
        aboutPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        
        var aboutText = addPara(data.text || 'Write about yourself here...');
        
        if (isFront) addPageBreak();
        break;

      case 'also-by':
        var alsoPara = addPara('Also By ' + (data.author || 'This Author'));
        alsoPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        alsoPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        
        var books = data.books ? data.books.split('\\n') : ['Book 1', 'Book 2'];
        for (var i = 0; i < books.length; i++) {
          if (books[i].trim()) {
            var bPara = addPara(books[i].trim());
            bPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
            bPara.editAsText().setItalic(true);
            bPara.setSpacingBefore(10);
          }
        }
        
        if (isFront) addPageBreak();
        break;

      case 'acknowledgments':
        var ackPara = addPara('Acknowledgments');
        ackPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        var ackBody = addPara(data.text || 'I would like to thank...');
        
        if (isFront) addPageBreak();
        break;

      case 'foreword':
        var fwPara = addPara('Foreword');
        fwPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        fwPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

        var fwText = addPara(data.text || 'Foreword text here...');
        fwText.setSpacingBefore(20);

        if (data.author) {
          var fwAuthor = addPara('— ' + data.author);
          fwAuthor.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
          fwAuthor.editAsText().setItalic(true);
          fwAuthor.setSpacingBefore(20);
        }

        if (isFront) addPageBreak();
        break;

      case 'preface':
        var prefPara = addPara('Preface');
        prefPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        prefPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

        var prefText = addPara(data.text || 'Preface text here...');
        prefText.setSpacingBefore(20);

        if (isFront) addPageBreak();
        break;

      case 'epigraph':
        var epPara = addPara('');
        epPara.setSpacingBefore(80);

        var epQuote = addPara(data.quote || '"The only way out is through."');
        epQuote.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        epQuote.editAsText().setItalic(true);
        epQuote.editAsText().setFontSize(13);
        epQuote.setSpacingBefore(40);

        if (data.attribution) {
          var epAttr = addPara(data.attribution);
          epAttr.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
          epAttr.editAsText().setFontSize(11);
          epAttr.editAsText().setForegroundColor('#666666');
          epAttr.setSpacingBefore(10);
        }

        if (isFront) addPageBreak();
        break;

      case 'glossary':
        var glPara = addPara('Glossary');
        glPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        glPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

        var glText = addPara(data.text || 'Term 1: Definition...\nTerm 2: Definition...');
        glText.setSpacingBefore(20);

        if (isFront) addPageBreak();
        break;

      case 'reading-guide':
        var rgPara = addPara('Reading Guide');
        rgPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        rgPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

        var rgSubtitle = addPara('Discussion Questions');
        rgSubtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        rgSubtitle.editAsText().setItalic(true);
        rgSubtitle.editAsText().setFontSize(13);
        rgSubtitle.editAsText().setForegroundColor('#555555');

        var rgText = addPara(data.text || '1. What did you think about...?\n2. How did the main character...?');
        rgText.setSpacingBefore(20);

        if (isFront) addPageBreak();
        break;

      case 'excerpt':
        var exPara = addPara('Sneak Peek');
        exPara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
        exPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

        if (data.bookTitle) {
          var exTitle = addPara('From: ' + data.bookTitle);
          exTitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
          exTitle.editAsText().setItalic(true);
          exTitle.editAsText().setFontSize(14);
          exTitle.setSpacingBefore(10);
        }

        var exText = addPara(data.text || 'Preview excerpt text here...');
        exText.setSpacingBefore(20);

        if (isFront) addPageBreak();
        break;

      default:
        throw new Error('Unknown matter type: ' + type);
    }

    return { success: true, type: type, position: position };
  } catch (error) {
    throw new Error('Insert ' + position + ' matter failed: ' + error.message);
  }
}

// =============================================================================
// Automation & Typesetting
// =============================================================================

/**
 * Apply smart typesetting including orphan/widow control and justification.
 */
function applySmartTypesetting(options) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var paragraphs = body.getParagraphs();
    
    var strictness = options.strictness || 2;
    var controlOrphans = options.controlOrphans !== false;
    var removeRivers = options.removeRivers !== false;
    
    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var text = p.getText().trim();
      
      if (text.length > 0) {
        // Justify text to avoid rivers of white, Docs natively spaces it
        if (removeRivers && p.getHeading() === DocumentApp.ParagraphHeading.NORMAL) {
          p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
        }
        
        // Orphan/Widow control (Keep lines together)
        if (controlOrphans && p.getHeading() === DocumentApp.ParagraphHeading.NORMAL) {
          p.setKeepLinesTogether(true);
        }
        
        // Keep headings with next paragraph
        if (p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL) {
          p.setKeepWithNext(true);
        }
      }
    }
    
    return { success: true, message: 'Smart Typesetting applied successfully.' };
  } catch (error) {
    throw new Error('Smart Typesetting failed: ' + error.message);
  }
}

/**
 * Replace all scene breaks with a new style
 */
function applySceneBreakStyle(styleStr) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    
    // Simple heuristic: paragraphs with length <= 5 that contain *, •, etc.
    var sceneBreakRegex = /^[\*\•\✦\-\~\❁\s]+$/;
    var paragraphs = body.getParagraphs();
    var count = 0;
    
    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var text = p.getText().trim();
      
      if (text.length > 0 && text.length <= 15 && sceneBreakRegex.test(text)) {
        p.setText(styleStr);
        p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        var t = p.editAsText();
        t.setFontSize(14);
        t.setForegroundColor('#999999');
        count++;
      }
    }
    
    return { success: true, count: count };
  } catch(err) {
    throw new Error('Scene break update failed: ' + err.message);
  }
}

/**
 * Global find and replace within the document.
 */
function globalReplaceText(findText, replaceText) {
  try {
    if (!findText) throw new Error("Find text is required");
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    
    // Simple text replacement
    // Escape regex characters just in case it's used as regex
    var escapedRegex = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    body.replaceText(escapedRegex, replaceText);
    
    return { success: true, message: 'Replaced all occurrences of ' + findText + ' with ' + replaceText };
  } catch (err) {
    throw new Error('Replace failed: ' + err.message);
  }
}

// =============================================================================
// Styled Table of Contents
// =============================================================================

/**
 * Insert a styled Table of Contents at the beginning of the document.
 * Creates a visually formatted TOC with dot leaders and indented entries.
 * @returns {{ success: boolean, count: number }}
 */
function insertStyledToC() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var headings = extractHeadings_(body);
    
    if (headings.length === 0) {
      throw new Error('No headings found. Use Heading 1/2/3 styles to define chapters and sections.');
    }
    
    // Insert at the beginning of the document
    var insertIndex = 0;
    
    // Add styled TOC heading
    var tocHeading = body.insertParagraph(insertIndex, 'Contents');
    tocHeading.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tocHeading.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    tocHeading.editAsText().setFontSize(22);
    tocHeading.editAsText().setBold(true);
    tocHeading.editAsText().setForegroundColor('#333333');
    tocHeading.setSpacingBefore(60);
    tocHeading.setSpacingAfter(30);
    insertIndex++;
    
    // Add a decorative separator line
    var separator = body.insertParagraph(insertIndex, '———');
    separator.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    separator.editAsText().setFontSize(10);
    separator.editAsText().setForegroundColor('#cccccc');
    separator.setSpacingAfter(20);
    insertIndex++;
    
    // Insert each heading entry with styling based on level
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var indent = (h.level - 1) * 24;
      
      var entryText = h.text;
      
      var entryPara = body.insertParagraph(insertIndex, entryText);
      
      var entryStyle = entryPara.editAsText();
      
      if (h.level === 1) {
        entryStyle.setFontSize(12);
        entryStyle.setBold(true);
        entryStyle.setForegroundColor('#1a1a1a');
        entryPara.setSpacingBefore(8);
        entryPara.setSpacingAfter(4);
      } else if (h.level === 2) {
        entryStyle.setFontSize(11);
        entryStyle.setBold(false);
        entryStyle.setItalic(false);
        entryStyle.setForegroundColor('#444444');
        entryPara.setSpacingBefore(3);
        entryPara.setSpacingAfter(2);
      } else {
        entryStyle.setFontSize(10);
        entryStyle.setBold(false);
        entryStyle.setItalic(true);
        entryStyle.setForegroundColor('#777777');
        entryPara.setSpacingBefore(2);
        entryPara.setSpacingAfter(2);
      }
      
      entryPara.setIndentStart(indent);
      insertIndex++;
    }
    
    // Add a page break after the TOC
    var breakPara = body.insertParagraph(insertIndex, '');
    breakPara.setPageBreakBefore(true);
    
    return { success: true, count: headings.length };
  } catch (error) {
    throw new Error('Insert styled TOC failed: ' + error.message);
  }
}

// =============================================================================
// Rich Fonts — multiple fonts in a single chapter
// =============================================================================

/**
 * Apply a font family (and optional size) to the currently selected text.
 * Enables mixing multiple fonts within a single chapter without sub-headings.
 * The font carries through to EPUB/PDF exports via inline styling.
 * @param {string} fontFamily - e.g. 'Garamond'
 * @param {number|null} fontSize - optional size in pt; null keeps current size
 * @returns {{ success: boolean, message: string }}
 */
function applyFontToSelection(fontFamily, fontSize) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var selection = doc.getSelection();

    if (!selection) {
      throw new Error('Please select some text first, then click Apply.');
    }

    var elements = selection.getRangeElements();
    var applied = 0;

    for (var i = 0; i < elements.length; i++) {
      var rangeEl = elements[i];
      var el = rangeEl.getElement();
      if (el.editAsText === undefined) continue;

      var text = el.editAsText();
      var start, end;

      if (rangeEl.isPartial()) {
        start = rangeEl.getStartOffset();
        end = rangeEl.getEndOffsetInclusive();
      } else {
        var len = text.getText().length;
        if (len === 0) continue;
        start = 0;
        end = len - 1;
      }

      text.setFontFamily(start, end, fontFamily);
      if (fontSize) {
        text.setFontSize(start, end, fontSize);
      }
      applied++;
    }

    if (applied === 0) {
      throw new Error('No text found in the selection.');
    }

    return {
      success: true,
      message: 'Font "' + fontFamily + '" applied to ' + applied + ' text segment(s).',
    };
  } catch (error) {
    throw new Error('Apply font failed: ' + error.message);
  }
}

// =============================================================================
// Two-Page Image Spread
// =============================================================================

/**
 * Toggle the [TWO_PAGE_SPREAD] tag on the selected image.
 * On PDF export the image is split across two facing pages:
 * left half on the verso page, right half on the recto page.
 * @returns {{ success: boolean, message: string }}
 */
function toggleImageTwoPageSpread() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var cursor = doc.getCursor();
    var selection = doc.getSelection();

    var image = null;

    if (selection) {
      var elements = selection.getRangeElements();
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i].getElement();
        if (el.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
          image = el.asInlineImage();
          break;
        }
      }
    }

    if (!image && cursor) {
      var element = cursor.getElement();
      if (element.getType() === DocumentApp.ElementType.INLINE_IMAGE) {
        image = element.asInlineImage();
      } else if (element.getType() === DocumentApp.ElementType.PARAGRAPH) {
        var para = element.asParagraph();
        for (var j = 0; j < para.getNumChildren(); j++) {
          if (para.getChild(j).getType() === DocumentApp.ElementType.INLINE_IMAGE) {
            image = para.getChild(j).asInlineImage();
            break;
          }
        }
      }
    }

    if (!image) throw new Error('Please select an image or place cursor next to it first.');

    var altTitle = image.getAltTitle() || '';
    var isSpread = altTitle.indexOf('[TWO_PAGE_SPREAD]') !== -1;

    if (isSpread) {
      image.setAltTitle(altTitle.replace('[TWO_PAGE_SPREAD]', '').trim());
      return { success: true, message: 'Two-page spread removed from image.' };
    } else {
      // Two-page spread replaces full-bleed if both were set
      var cleaned = altTitle.replace('[FULL_BLEED]', '').trim();
      image.setAltTitle((cleaned + ' [TWO_PAGE_SPREAD]').trim());
      return { success: true, message: 'Image set to Two-Page Spread! It will span two facing pages in the PDF.' };
    }
  } catch (error) {
    throw new Error('Two-page spread failed: ' + error.message);
  }
}

// =============================================================================
// Image Organizer — inventory + per-image metadata (solves "image chaos")
// =============================================================================

var IMAGE_TAGS = ['[FULL_BLEED]', '[TWO_PAGE_SPREAD]', '[CHAPTER_HEADER]'];

/**
 * List every inline image in the document with size, DPI estimate,
 * accessibility ALT text and current layout tag.
 * @returns {{ total: number, images: Array }}
 */
function getImageInventory() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var images = body.getImages();
    var result = [];

    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var width = img.getWidth();
      var height = img.getHeight();
      var sizeBytes = img.getBlob().getBytes().length;
      var sizeKB = Math.round(sizeBytes / 1024);

      // Same heuristic as validateImageDPI
      var dpiEst = 300;
      if (width > 150 && sizeKB < 50) dpiEst = 72;
      else if (width > 300 && sizeKB < 150) dpiEst = 150;

      var altTitle = img.getAltTitle() || '';
      var tag = 'none';
      if (altTitle.indexOf('[FULL_BLEED]') !== -1) tag = 'full-bleed';
      else if (altTitle.indexOf('[TWO_PAGE_SPREAD]') !== -1) tag = 'spread';
      else if (altTitle.indexOf('[CHAPTER_HEADER]') !== -1) tag = 'chapter-header';

      // Nearest heading above the image, for context
      var context = '';
      try {
        var el = img.getParent();
        while (el && el.getType() !== DocumentApp.ElementType.PARAGRAPH) el = el.getParent();
        var sibling = el ? el.getPreviousSibling() : null;
        var hops = 0;
        while (sibling && hops < 30) {
          if (sibling.getType() === DocumentApp.ElementType.PARAGRAPH) {
            var p = sibling.asParagraph();
            if (p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL && p.getText()) {
              context = p.getText().substring(0, 50);
              break;
            }
          }
          sibling = sibling.getPreviousSibling();
          hops++;
        }
      } catch (e) { /* context is best-effort */ }

      result.push({
        index: i,
        width: Math.round(width),
        height: Math.round(height),
        sizeKB: sizeKB,
        dpiEst: dpiEst,
        alt: img.getAltDescription() || '',
        tag: tag,
        context: context,
      });
    }

    return { total: images.length, images: result };
  } catch (error) {
    throw new Error('Image inventory failed: ' + error.message);
  }
}

/**
 * Update one image's accessibility ALT text and/or layout tag.
 * @param {number} index - position in body.getImages() order
 * @param {string} alt - accessibility description ('' allowed)
 * @param {string} tag - 'none' | 'full-bleed' | 'spread' | 'chapter-header'
 * @returns {{ success: boolean }}
 */
function updateImageMeta(index, alt, tag) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var images = doc.getBody().getImages();
    if (index < 0 || index >= images.length) {
      throw new Error('Image #' + (index + 1) + ' not found (document has ' + images.length + ').');
    }
    var img = images[index];

    if (alt !== null && alt !== undefined) {
      img.setAltDescription(String(alt));
    }

    if (tag !== null && tag !== undefined) {
      var title = img.getAltTitle() || '';
      for (var t = 0; t < IMAGE_TAGS.length; t++) {
        title = title.replace(IMAGE_TAGS[t], '');
      }
      title = title.replace(/\s+/g, ' ').trim();
      var tagToken = tag === 'full-bleed' ? '[FULL_BLEED]'
        : tag === 'spread' ? '[TWO_PAGE_SPREAD]'
        : tag === 'chapter-header' ? '[CHAPTER_HEADER]'
        : '';
      img.setAltTitle((title + ' ' + tagToken).trim());
    }

    return { success: true };
  } catch (error) {
    throw new Error('Update image failed: ' + error.message);
  }
}
