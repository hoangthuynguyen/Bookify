const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// =============================================================================
// Cloudflare R2 Client (S3-compatible, zero egress fees)
// Falls back to base64 data URLs when R2 is not configured
// =============================================================================

const R2_CONFIGURED = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);

let r2;
if (R2_CONFIGURED) {
  r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

const BUCKET = process.env.R2_BUCKET_NAME || 'bookify-exports';
const SIGNED_URL_EXPIRY = parseInt(process.env.SIGNED_URL_EXPIRY_HOURS || '24') * 3600;

/**
 * Upload an export file to R2 and return a signed download URL.
 * Falls back to base64 data URL when R2 is not configured.
 */
async function uploadExportFile(buffer, filename, contentType, userId = 'anonymous') {
  // Fallback: return base64 data URL when R2 is not configured
  if (!R2_CONFIGURED) {
    console.log(`[R2-Fallback] R2 not configured — returning data URL for ${filename}`);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;
    return {
      key: `local/${filename}`,
      signedUrl: dataUrl,
      size: buffer.length,
    };
  }

  const timestamp = Date.now();
  const key = `exports/${userId}/${timestamp}-${sanitizeFilename(filename)}`;

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentDisposition: `attachment; filename="${filename}"`,
    Metadata: {
      'uploaded-at': new Date().toISOString(),
      'user-id': userId,
    },
  }));

  const signedUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: SIGNED_URL_EXPIRY }
  );

  return {
    key,
    signedUrl,
    size: buffer.length,
  };
}

/**
 * Delete an export file from R2
 */
async function deleteExportFile(key) {
  if (!R2_CONFIGURED) return;
  await r2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

/**
 * Get a fresh signed URL for an existing file
 */
async function getSignedDownloadUrl(key) {
  if (!R2_CONFIGURED) return null;
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: SIGNED_URL_EXPIRY }
  );
}

/**
 * Sanitize filename for safe storage
 */
function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

module.exports = {
  uploadExportFile,
  deleteExportFile,
  getSignedDownloadUrl,
  R2_CONFIGURED,
};
