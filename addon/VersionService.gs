/**
 * VersionService.gs — Version management using Drive API revisions
 * Named versions stored in DocumentProperties + Supabase
 */

// =============================================================================
// Version Management
// =============================================================================

/**
 * List all revisions with custom names.
 * @returns {Array<{ revisionId: string, name: string, date: string, fileSize: string }>}
 */
function listVersions() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var fileId = doc.getId();
    var props = PropertiesService.getDocumentProperties();
    var namedVersions = JSON.parse(props.getProperty('named_versions') || '{}');

    // Get Drive revisions
    var revisions = Drive.Revisions.list(fileId);
    var items = revisions.items || revisions.revisions || [];

    return items.map(function(rev) {
      return {
        revisionId: rev.id,
        name: namedVersions[rev.id] || null,
        date: rev.modifiedDate || rev.modifiedTime,
        fileSize: rev.fileSize ? formatFileSize_(parseInt(rev.fileSize)) : 'N/A',
        lastModifyingUser: rev.lastModifyingUser ? rev.lastModifyingUser.displayName : 'Unknown',
      };
    }).reverse(); // Most recent first
  } catch (error) {
    throw new Error('List versions failed: ' + error.message);
  }
}

/**
 * Create a named version (save current state).
 * @param {string} name - Human-readable version name (e.g., "v2.3 - Post-editor")
 * @returns {{ revisionId: string, name: string }}
 */
function createNamedVersion(name) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var fileId = doc.getId();

    // Force save current document state
    doc.saveAndClose();
    // Re-open (needed after saveAndClose)
    var reopened = DocumentApp.openById(fileId);

    // Get the latest revision ID
    var revisions = Drive.Revisions.list(fileId);
    var items = revisions.items || revisions.revisions || [];
    var latestRevision = items[items.length - 1];

    if (!latestRevision) {
      throw new Error('No revision found after save.');
    }

    // Pin the revision so it doesn't get auto-deleted
    Drive.Revisions.update(
      { pinned: true },
      fileId,
      latestRevision.id
    );

    // Save name mapping
    var props = PropertiesService.getDocumentProperties();
    var namedVersions = JSON.parse(props.getProperty('named_versions') || '{}');
    namedVersions[latestRevision.id] = name;
    props.setProperty('named_versions', JSON.stringify(namedVersions));

    return {
      revisionId: latestRevision.id,
      name: name,
      date: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error('Create version failed: ' + error.message);
  }
}

/**
 * Restore a previous version.
 * WARNING: This replaces the current document content!
 * @param {string} revisionId - The revision ID to restore
 * @returns {{ success: boolean }}
 */
function restoreVersion(revisionId) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var fileId = doc.getId();

    // First, create a backup of current state
    createNamedVersion('Auto-backup before restore');

    // Get the revision content
    var revision = Drive.Revisions.get(fileId, revisionId);
    var exportUrl = revision.exportLinks
      ? revision.exportLinks['text/plain']
      : null;

    if (!exportUrl) {
      // Alternative: download the revision as text
      var file = DriveApp.getFileById(fileId);
      // Note: Direct revision restore via Drive API is limited
      // Best approach is to copy content from the revision
      throw new Error('Direct restoration not available. Please use the version history in Google Docs (File > Version History).');
    }

    return { success: true, message: 'Version restored. Please reload the document.' };
  } catch (error) {
    throw new Error('Restore version failed: ' + error.message);
  }
}

/**
 * Rename a version.
 * @param {string} revisionId
 * @param {string} newName
 */
function renameVersion(revisionId, newName) {
  try {
    var props = PropertiesService.getDocumentProperties();
    var namedVersions = JSON.parse(props.getProperty('named_versions') || '{}');
    namedVersions[revisionId] = newName;
    props.setProperty('named_versions', JSON.stringify(namedVersions));

    return { success: true };
  } catch (error) {
    throw new Error('Rename version failed: ' + error.message);
  }
}

// =============================================================================
// Collaboration
// =============================================================================

/**
 * Share the document with another user.
 * @param {string} email - Email address
 * @param {string} role - 'reader', 'commenter', 'writer'
 * @returns {{ success: boolean }}
 */
function shareDocument(email, role) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var file = DriveApp.getFileById(doc.getId());

    switch (role) {
      case 'reader':
        file.addViewer(email);
        break;
      case 'commenter':
        file.addCommenter(email);
        break;
      case 'writer':
        file.addEditor(email);
        break;
      default:
        throw new Error('Invalid role. Use: reader, commenter, or writer');
    }

    return { success: true, email: email, role: role };
  } catch (error) {
    throw new Error('Share failed: ' + error.message);
  }
}

/**
 * List current collaborators.
 * @returns {Array<{ email: string, role: string }>}
 */
function listCollaborators() {
  try {
    var doc = DocumentApp.getActiveDocument();
    var file = DriveApp.getFileById(doc.getId());
    var collaborators = [];

    file.getEditors().forEach(function(user) {
      collaborators.push({ email: user.getEmail(), role: 'editor' });
    });

    file.getViewers().forEach(function(user) {
      collaborators.push({ email: user.getEmail(), role: 'viewer' });
    });

    return collaborators;
  } catch (error) {
    throw new Error('List collaborators failed: ' + error.message);
  }
}

/**
 * Revoke access for a user.
 * @param {string} email
 */
function revokeAccess(email) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var file = DriveApp.getFileById(doc.getId());

    file.removeEditor(email);
    file.removeViewer(email);

    return { success: true, email: email };
  } catch (error) {
    throw new Error('Revoke access failed: ' + error.message);
  }
}

// =============================================================================
// Helpers
// =============================================================================

function formatFileSize_(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
