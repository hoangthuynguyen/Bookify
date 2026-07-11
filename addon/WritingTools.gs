/**
 * WritingTools.gs — Word count, sprint timer data, writing streak, smart quotes
 */

// =============================================================================
// Heading Management (used by Structure Panel)
// =============================================================================

/**
 * Rename a heading in the document.
 * @param {string} oldText - The current text of the heading
 * @param {string} newText - The new text to rename it to
 * @returns {{ success: boolean }}
 */
function renameHeading(oldText, newText) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var numChildren = body.getNumChildren();

    for (var i = 0; i < numChildren; i++) {
      var child = body.getChild(i);
      if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
        var para = child.asParagraph();
        var heading = para.getHeading();
        if (heading !== DocumentApp.ParagraphHeading.NORMAL && para.getText() === oldText) {
          para.setText(newText);
          return { success: true };
        }
      }
    }

    throw new Error('Heading "' + oldText + '" not found in document.');
  } catch (error) {
    throw new Error('Rename heading failed: ' + error.message);
  }
}

// =============================================================================
// Word Count
// =============================================================================

/**
 * Get word count statistics for the document.
 * @returns {{ total: number, characters: number, paragraphs: number, chapters: number }}
 */
function getWordCount() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var text = body.getText();

    var words = text.split(/\s+/).filter(function(w) { return w.length > 0; });
    var characters = text.replace(/\s/g, '').length;

    // Count paragraphs
    var paragraphs = 0;
    var numChildren = body.getNumChildren();
    for (var i = 0; i < numChildren; i++) {
      if (body.getChild(i).getType() === DocumentApp.ElementType.PARAGRAPH) {
        var paraText = body.getChild(i).asParagraph().getText().trim();
        if (paraText.length > 0) paragraphs++;
      }
    }

    // Count chapters (H1 headings)
    var chapters = 0;
    for (var i = 0; i < numChildren; i++) {
      if (body.getChild(i).getType() === DocumentApp.ElementType.PARAGRAPH) {
        if (body.getChild(i).asParagraph().getHeading() === DocumentApp.ParagraphHeading.HEADING1) {
          chapters++;
        }
      }
    }

    return {
      total: words.length,
      characters: characters,
      paragraphs: paragraphs,
      chapters: chapters,
    };
  } catch (error) {
    throw new Error('Word count failed: ' + error.message);
  }
}

/**
 * Get word count for the currently selected text.
 * @returns {{ selected: number }}
 */
function getSelectionWordCount() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var selection = doc.getSelection();

    if (!selection) {
      return { selected: 0, message: 'No text selected' };
    }

    var elements = selection.getRangeElements();
    var totalWords = 0;

    elements.forEach(function(rangeElement) {
      var element = rangeElement.getElement();
      var text;

      if (rangeElement.isPartial()) {
        text = element.asText().getText().substring(
          rangeElement.getStartOffset(),
          rangeElement.getEndOffsetInclusive() + 1
        );
      } else {
        text = element.asText ? element.asText().getText() : '';
      }

      var words = text.split(/\s+/).filter(function(w) { return w.length > 0; });
      totalWords += words.length;
    });

    return { selected: totalWords };
  } catch (error) {
    throw new Error('Selection word count failed: ' + error.message);
  }
}

// =============================================================================
// Daily Writing Stats (stored in UserProperties + Supabase via backend)
// =============================================================================

/**
 * Get today's word count progress.
 * @returns {{ today: number, goal: number, percentage: number }}
 */
function getDailyProgress() {
  try {
    var props = PropertiesService.getUserProperties();
    var today = new Date().toISOString().split('T')[0];

    var dailyData = JSON.parse(props.getProperty('daily_' + today) || '{"words":0}');
    var goal = parseInt(props.getProperty('daily_goal') || '1000');

    return {
      today: dailyData.words,
      goal: goal,
      percentage: Math.min(100, Math.round((dailyData.words / goal) * 100)),
      date: today,
    };
  } catch (error) {
    throw new Error('Get daily progress failed: ' + error.message);
  }
}

/**
 * Update today's word count.
 * Called periodically from the sidebar to track writing progress.
 */
function updateDailyWordCount() {
  try {
    var wordCount = getWordCount();
    var props = PropertiesService.getUserProperties();
    var today = new Date().toISOString().split('T')[0];

    var prevKey = 'doc_wc_' + DocumentApp.getActiveDocument().getId();
    var prevCount = parseInt(props.getProperty(prevKey) || '0');
    var wordsWrittenToday = Math.max(0, wordCount.total - prevCount);

    // Update today's stats
    var dailyData = JSON.parse(props.getProperty('daily_' + today) || '{"words":0}');
    dailyData.words += wordsWrittenToday;
    props.setProperty('daily_' + today, JSON.stringify(dailyData));

    // Update baseline
    props.setProperty(prevKey, String(wordCount.total));

    // Mark today as a writing day for streak calculation
    updateWritingStreak_();

    return {
      wordsToday: dailyData.words,
      wordsJustAdded: wordsWrittenToday,
    };
  } catch (error) {
    throw new Error('Update daily count failed: ' + error.message);
  }
}

/**
 * Set daily word count goal.
 * @param {number} goal - Words per day target
 */
function setDailyGoal(goal) {
  PropertiesService.getUserProperties().setProperty('daily_goal', String(goal));
  return { success: true, goal: goal };
}

// =============================================================================
// Writing Streak
// =============================================================================

/**
 * Get writing streak information.
 * @returns {{ currentStreak: number, longestStreak: number, totalDays: number, last30Days: Array }}
 */
function getWritingStreak() {
  try {
    var props = PropertiesService.getUserProperties();
    var streakData = JSON.parse(props.getProperty('writing_streak') || '{"days":[]}');
    var days = streakData.days || [];

    // Sort descending
    days.sort(function(a, b) { return b.localeCompare(a); });

    // Calculate current streak
    var currentStreak = 0;
    var today = new Date().toISOString().split('T')[0];
    var yesterday = getYesterdayDate_();

    if (days.length > 0 && (days[0] === today || days[0] === yesterday)) {
      currentStreak = 1;
      for (var i = 1; i < days.length; i++) {
        var prev = new Date(days[i - 1]);
        var curr = new Date(days[i]);
        var diff = (prev - curr) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    var longestStreak = days.length > 0 ? 1 : 0;
    var tempStreak = 1;
    for (var i = 1; i < days.length; i++) {
      var prev = new Date(days[i - 1]);
      var curr = new Date(days[i]);
      var diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (Math.round(diff) === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Last 30 days heatmap data
    var last30 = [];
    var d = new Date();
    for (var i = 0; i < 30; i++) {
      var dateStr = d.toISOString().split('T')[0];
      var dailyData = JSON.parse(props.getProperty('daily_' + dateStr) || '{"words":0}');
      last30.push({
        date: dateStr,
        words: dailyData.words,
        wrote: days.indexOf(dateStr) >= 0,
      });
      d.setDate(d.getDate() - 1);
    }

    return {
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      totalDays: days.length,
      last30Days: last30.reverse(),
    };
  } catch (error) {
    throw new Error('Get streak failed: ' + error.message);
  }
}

function updateWritingStreak_() {
  var props = PropertiesService.getUserProperties();
  var streakData = JSON.parse(props.getProperty('writing_streak') || '{"days":[]}');
  var today = new Date().toISOString().split('T')[0];

  if (streakData.days.indexOf(today) === -1) {
    streakData.days.push(today);
    // Keep only last 365 days
    if (streakData.days.length > 365) {
      streakData.days = streakData.days.slice(-365);
    }
    props.setProperty('writing_streak', JSON.stringify(streakData));
  }
}

function getYesterdayDate_() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// =============================================================================
// Smart Quotes Scanner
// =============================================================================

/**
 * Scan document for inconsistent smart quotes.
 * @returns {{ issues: Array, totalIssues: number }}
 */
function scanSmartQuotes() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var text = body.getText();
    var issues = [];

    // Check for straight quotes mixed with curly quotes
    var straightSingle = (text.match(/'/g) || []).length;
    var curlySingleOpen = (text.match(/\u2018/g) || []).length;
    var curlySingleClose = (text.match(/\u2019/g) || []).length;
    var straightDouble = (text.match(/"/g) || []).length;
    var curlyDoubleOpen = (text.match(/\u201C/g) || []).length;
    var curlyDoubleClose = (text.match(/\u201D/g) || []).length;

    if (straightSingle > 0 && (curlySingleOpen > 0 || curlySingleClose > 0)) {
      issues.push({
        type: 'mixed-single',
        message: straightSingle + " straight single quotes found alongside " +
                 (curlySingleOpen + curlySingleClose) + " curly single quotes",
        count: straightSingle,
      });
    }

    if (straightDouble > 0 && (curlyDoubleOpen > 0 || curlyDoubleClose > 0)) {
      issues.push({
        type: 'mixed-double',
        message: straightDouble + " straight double quotes found alongside " +
                 (curlyDoubleOpen + curlyDoubleClose) + " curly double quotes",
        count: straightDouble,
      });
    }

    // Check for unmatched quotes
    if (curlyDoubleOpen !== curlyDoubleClose) {
      issues.push({
        type: 'unmatched-double',
        message: "Unmatched curly double quotes: " + curlyDoubleOpen +
                 " opening vs " + curlyDoubleClose + " closing",
        count: Math.abs(curlyDoubleOpen - curlyDoubleClose),
      });
    }

    return {
      issues: issues,
      totalIssues: issues.reduce(function(sum, i) { return sum + i.count; }, 0),
      stats: {
        straightSingle: straightSingle,
        curlySingle: curlySingleOpen + curlySingleClose,
        straightDouble: straightDouble,
        curlyDouble: curlyDoubleOpen + curlyDoubleClose,
      },
    };
  } catch (error) {
    throw new Error('Smart quotes scan failed: ' + error.message);
  }
}

/**
 * Fix all straight quotes to curly quotes.
 * @returns {{ fixed: number }}
 */
function fixSmartQuotes() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var fixed = 0;

    // Replace straight double quotes
    var searchResult = body.findText('"');
    while (searchResult) {
      var element = searchResult.getElement();
      var start = searchResult.getStartOffset();
      var text = element.asText();
      var content = text.getText();

      // Determine if opening or closing
      var charBefore = start > 0 ? content[start - 1] : ' ';
      var isOpening = charBefore === ' ' || charBefore === '\n' || start === 0;

      text.deleteText(start, start);
      text.insertText(start, isOpening ? '\u201C' : '\u201D');
      fixed++;

      searchResult = body.findText('"', searchResult);
    }

    // Replace straight single quotes (apostrophes)
    searchResult = body.findText("'");
    while (searchResult) {
      var element = searchResult.getElement();
      var start = searchResult.getStartOffset();
      var text = element.asText();
      var content = text.getText();

      var charBefore = start > 0 ? content[start - 1] : ' ';
      var isOpening = charBefore === ' ' || charBefore === '\n' || start === 0;

      text.deleteText(start, start);
      text.insertText(start, isOpening ? '\u2018' : '\u2019');
      fixed++;

      searchResult = body.findText("'", searchResult);
    }

    return { fixed: fixed };
  } catch (error) {
    throw new Error('Fix quotes failed: ' + error.message);
  }
}

// =============================================================================
// Text Analysis (Grammarly/ProWritingAid Lite)
// =============================================================================

/**
 * Analyze text for reading level, cliches, and word frequencies.
 * @returns {object} Analysis results
 */
function analyzeText() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var text = doc.getBody().getText();

    if (!text || text.trim().length === 0) {
      return { 
        readingLevel: 0, 
        sentences: 0,
        words: 0,
        cliches: [], 
        wordFrequencies: [] 
      };
    }

    var sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
    var wordsMatch = text.match(/\b\w+\b/g) || [];
    var numSentences = sentences.length || 1;
    var numWords = wordsMatch.length || 1;

    // --- Syllable counting heuristic ---
    function countSyllables(word) {
      word = word.toLowerCase();
      if (word.length <= 3) return 1;
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      word = word.replace(/^y/, '');
      var sylMatch = word.match(/[aeiouy]{1,2}/g);
      return sylMatch ? sylMatch.length : 1;
    }

    var numSyllables = 0;
    var wordCounts = {};

    // Stopwords for frequency analysis
    var stopWords = ['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us'];

    for (var i = 0; i < wordsMatch.length; i++) {
      var w = wordsMatch[i];
      numSyllables += countSyllables(w);

      var lowerW = w.toLowerCase();
      if (stopWords.indexOf(lowerW) === -1 && lowerW.length > 2) {
        wordCounts[lowerW] = (wordCounts[lowerW] || 0) + 1;
      }
    }

    // Flesch-Kincaid Grade Level
    // FKGL = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
    var fkgl = 0.39 * (numWords / numSentences) + 11.8 * (numSyllables / numWords) - 15.59;
    fkgl = Math.max(0, Math.round(fkgl * 10) / 10);

    // Sort word frequencies
    var sortedFreqs = Object.keys(wordCounts).map(function(key) {
      return { word: key, count: wordCounts[key] };
    }).sort(function(a, b) {
      return b.count - a.count;
    }).slice(0, 10);

    // --- Cliche Finder ---
    var knownCliches = [
      "at the end of the day", "avoid like the plague", "read between the lines",
      "better late than never", "crystal clear", "fit as a fiddle", 
      "in the nick of time", "piece of cake", "tip of the iceberg",
      "elephant in the room", "nip it in the bud", "beat around the bush",
      "actions speak louder than words", "bite the bullet"
    ];

    var clichesFound = [];
    var lowerText = text.toLowerCase();
    
    for (var j = 0; j < knownCliches.length; j++) {
      var cliche = knownCliches[j];
      var count = (lowerText.match(new RegExp("\\b" + cliche + "\\b", "g")) || []).length;
      if (count > 0) {
        clichesFound.push({ phrase: cliche, count: count });
      }
    }

    return {
      readingLevel: fkgl,
      sentences: numSentences,
      words: numWords,
      cliches: clichesFound,
      wordFrequencies: sortedFreqs
    };
  } catch (error) {
    throw new Error('Analysis failed: ' + error.message);
  }
}

// =============================================================================
// Image DPI Validator
// =============================================================================

/**
 * Scan document images to ensure they meet the 300 DPI minimum for Print.
 * @returns {object} { total: number, warnings: Array }
 */
function validateImageDPI() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var images = body.getImages();
    var warnings = [];

    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var width = img.getWidth();   // display width
      var height = img.getHeight(); // display height
      
      var blob = img.getBlob();
      var sizeBytes = blob.getBytes().length;
      var sizeKB = Math.round(sizeBytes / 1024);
      var sizeFormatted = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';

      // Estimate DPI based on file size and display dimensions (rough heuristic)
      var dpiEst = 300;
      var isWarning = false;
      var message = '';

      if (width > 150 && sizeKB < 50) {
        dpiEst = 72;
        isWarning = true;
        message = 'Resolution too low for print. Image may appear blurry.';
      } else if (width > 300 && sizeKB < 150) {
        dpiEst = 150;
        isWarning = true;
        message = 'Moderate resolution. Consider replacing with a higher quality image.';
      }

      if (isWarning) {
        warnings.push({
          index: i + 1,
          width: Math.round(width),
          height: Math.round(height),
          dpiEst: dpiEst,
          size: sizeFormatted,
          message: message
        });
      }
    }

    return {
      total: images.length,
      warnings: warnings
    };
  } catch (error) {
    throw new Error('Image validation failed: ' + error.message);
  }
}

// =============================================================================
// Character / Location Bible
// =============================================================================

/**
 * Get the character bible data.
 * @returns {{ characters: Array, locations: Array }}
 */
function getCharacterBible() {
  try {
    var props = PropertiesService.getUserProperties();
    var data = JSON.parse(props.getProperty('character_bible') || '{"characters":[],"locations":[]}');
    return data;
  } catch (error) {
    throw new Error('Get character bible failed: ' + error.message);
  }
}

/**
 * Save character bible data.
 * @param {object} data - { characters: Array, locations: Array }
 */
function saveCharacterBible(data) {
  try {
    var props = PropertiesService.getUserProperties();
    props.setProperty('character_bible', JSON.stringify(data));
    return { success: true };
  } catch (error) {
    throw new Error('Save character bible failed: ' + error.message);
  }
}

// =============================================================================
// Spine Width Calculator
// =============================================================================

/**
 * Calculate book spine width based on page count and paper type.
 * @param {number} pageCount - Total number of pages
 * @param {string} paperType - 'cream' (0.0025") or 'white' (0.002252")
 * @returns {{ spineWidth: number, spineWidthMm: number, unit: string }}
 */
function calculateSpineWidth(pageCount, paperType) {
  // Industry-standard PPI (pages per inch) values
  var ppiMap = {
    'cream': 0.0025,      // Cream/natural paper (444 PPI → 0.0025 in/page)
    'white': 0.002252,     // White paper (standard 50lb → 0.002252 in/page)
    'groundwood': 0.0035,  // Groundwood (newsprint-like, thicker)
    'heavy': 0.003,        // Heavy cream (used for short books)
  };

  var ppi = ppiMap[paperType] || ppiMap['cream'];
  var coverThickness = 0.06; // ~0.06" for a standard paperback cover (2 sides)
  
  var spineInches = (pageCount * ppi) + coverThickness;
  var spineMm = spineInches * 25.4;
  
  return {
    spineWidth: Math.round(spineInches * 1000) / 1000,
    spineWidthMm: Math.round(spineMm * 10) / 10,
    unit: 'inches',
    pageCount: pageCount,
    paperType: paperType || 'cream',
  };
}

// =============================================================================
// Markdown Export
// =============================================================================

/**
 * Export document as Markdown.
 * @param {object} settings - Export settings
 * @returns {object} { downloadUrl, filename, size }
 */
function exportMarkdown(settings) {
  try {
    var content = getDocumentContent();
    var result = callExportAPI('/export/markdown', {
      docContent: content.html,
      docId: content.metadata.id,
      metadata: Object.assign({}, content.metadata, settings.metadataOverrides || {}),
      theme: settings.theme || {},
    });
    return result;
  } catch (error) {
    throw new Error('Markdown export failed: ' + error.message);
  }
}

// =============================================================================
// Table of Contents Generator
// =============================================================================

/**
 * Generate and insert a Table of Contents at the beginning of the document.
 * @returns {{ success: boolean, count: number }}
 */
function generateTableOfContents() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var body = doc.getBody();
    var headings = extractHeadings_(body);
    
    if (headings.length === 0) {
      throw new Error('No headings found. Use Heading 1/2/3 to define chapters.');
    }
    
    // Find insertion point (after title page if exists, else at top)
    var insertIndex = 0;
    
    // Insert TOC heading
    var tocHeading = body.insertParagraph(insertIndex, 'Table of Contents');
    tocHeading.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    tocHeading.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    tocHeading.setSpacingBefore(40);
    tocHeading.setSpacingAfter(20);
    insertIndex++;
    
    // Insert each heading entry
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var indent = (h.level - 1) * 20; // pixels indent per level
      var prefix = '';
      
      if (h.level === 1) {
        prefix = '';
      } else if (h.level === 2) {
        prefix = '    ';
      } else {
        prefix = '        ';
      }
      
      var entryPara = body.insertParagraph(insertIndex, prefix + h.text);
      entryPara.editAsText().setFontSize(h.level === 1 ? 12 : 11);
      
      if (h.level === 1) {
        entryPara.editAsText().setBold(true);
      } else {
        entryPara.editAsText().setForegroundColor('#555555');
      }
      
      entryPara.setIndentStart(indent);
      entryPara.setSpacingBefore(h.level === 1 ? 8 : 2);
      entryPara.setSpacingAfter(2);
      
      insertIndex++;
    }
    
    // Add a page break after TOC
    var breakPara = body.insertParagraph(insertIndex, '');
    breakPara.setPageBreakBefore(true);
    
    return { success: true, count: headings.length };
  } catch (error) {
    throw new Error('Generate TOC failed: ' + error.message);
  }
}


// =============================================================================
// Pacing Visualizer
// =============================================================================

function getPacingData() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var text = doc.getBody().getText();
    var paragraphs = text.split('\n');
    var data = [];
    
    // Process up to 100 paragraphs to avoid slow response
    for (var i = 0; i < Math.min(paragraphs.length, 100); i++) {
        var p = paragraphs[i].trim();
        if (p.length > 0) {
            var sentences = p.match(/[^\.!\?]+[\.!\?]+/g);
            var numSentences = sentences ? sentences.length : 1;
            var wordsCount = p.split(/\s+/).length || 1;
            var avgSentenceLength = Math.round(wordsCount / numSentences);
            
            data.push({
                index: i + 1,
                avgSentenceLength: avgSentenceLength,
                words: wordsCount
            });
        }
    }
    return data;
  } catch (err) {
    throw new Error('Get pacing data failed: ' + err.message);
  }
}
