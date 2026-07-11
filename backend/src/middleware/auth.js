const { OAuth2Client } = require('google-auth-library');

let googleClient;
const clientId = process.env.GOOGLE_CLIENT_ID;
if (clientId) {
  googleClient = new OAuth2Client(clientId);
}

/**
 * Verifies Google OAuth token from Apps Script (ScriptApp.getOAuthToken())
 * and attaches user info to req.user.
 * Falls back to a basic user if GOOGLE_CLIENT_ID is not configured.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // If no GOOGLE_CLIENT_ID configured, use dev fallback
    if (!googleClient) {
      console.warn('[Auth] GOOGLE_CLIENT_ID not set — using dev fallback');
      req.user = {
        id: 'dev-user',
        email: authHeader ? 'addon-user@gmail.com' : 'dev@localhost',
        googleToken: 'dev-token',
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token', code: 'AUTH_MISSING' });
    }

    const token = authHeader.split(' ')[1];

    // Verify Google OAuth token
    const tokenInfo = await googleClient.getTokenInfo(token);

    if (!tokenInfo.email) {
      return res.status(401).json({ error: 'Invalid token: no email', code: 'AUTH_INVALID' });
    }

    // Try to get/create user in Supabase, fallback to basic user object
    let user;
    try {
      const { getOrCreateUser } = require('../services/supabaseClient');
      user = await getOrCreateUser(tokenInfo.email, tokenInfo.email.split('@')[0]);
    } catch (dbError) {
      console.warn('[Auth] Supabase unavailable, using fallback user:', dbError.message);
      user = { id: tokenInfo.email, email: tokenInfo.email };
    }

    req.user = {
      id: user.id,
      email: tokenInfo.email,
      googleToken: token,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error.message);

    if (error.message.includes('expired')) {
      return res.status(401).json({ error: 'Token expired', code: 'AUTH_EXPIRED' });
    }

    return res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
  }
}

module.exports = { authMiddleware };
