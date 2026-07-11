const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_KEY || 'test-key'
);

// =============================================================================
// User Management
// =============================================================================

async function getOrCreateUser(email, displayName) {
  // Try to find existing user
  const { data: existing, error: findError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('google_email', email)
    .single();

  if (existing) return existing;

  // Create new user
  const { data: created, error: createError } = await supabase
    .from('user_profiles')
    .insert({ google_email: email, display_name: displayName || email.split('@')[0] })
    .select()
    .single();

  if (createError) throw new Error(`Failed to create user: ${createError.message}`);
  return created;
}

async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`User not found: ${error.message}`);
  return data;
}

async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return data;
}

// =============================================================================
// Export History
// =============================================================================

async function saveExportHistory(userId, docId, format, fileUrl, fileSize, metadata) {
  const { data, error } = await supabase
    .from('export_history')
    .insert({
      user_id: userId,
      doc_id: docId,
      format,
      file_url: fileUrl,
      file_size: fileSize,
      metadata,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save export: ${error.message}`);
  return data;
}

async function getExportHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from('export_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to get exports: ${error.message}`);
  return data;
}

// =============================================================================
// Writing Stats
// =============================================================================

async function getWritingStats(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('writing_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw new Error(`Failed to get stats: ${error.message}`);
  return data;
}

async function upsertDailyStats(userId, date, wordCount, sprintMinutes = 0) {
  const { data, error } = await supabase
    .from('writing_stats')
    .upsert(
      { user_id: userId, date, word_count: wordCount, sprint_minutes: sprintMinutes },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save stats: ${error.message}`);
  return data;
}

async function getWritingStreak(userId) {
  const { data, error } = await supabase
    .from('writing_stats')
    .select('date, word_count')
    .eq('user_id', userId)
    .gt('word_count', 0)
    .order('date', { ascending: false })
    .limit(365);

  if (error) throw new Error(`Failed to get streak: ${error.message}`);

  if (!data || data.length === 0) return { currentStreak: 0, longestStreak: 0, totalDays: 0 };

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  const dates = data.map(d => d.date);

  // Check if user wrote today or yesterday
  const startCheck = dates[0] === today || dates[0] === getYesterday();
  if (startCheck) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalDays: data.length,
  };
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// =============================================================================
// Custom Themes
// =============================================================================

async function saveCustomTheme(userId, name, themeConfig) {
  const { data, error } = await supabase
    .from('custom_themes')
    .insert({ user_id: userId, name, theme_config: themeConfig })
    .select()
    .single();

  if (error) throw new Error(`Failed to save theme: ${error.message}`);
  return data;
}

async function getUserThemes(userId) {
  const { data, error } = await supabase
    .from('custom_themes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get themes: ${error.message}`);
  return data;
}

async function deleteCustomTheme(themeId, userId) {
  const { error } = await supabase
    .from('custom_themes')
    .delete()
    .eq('id', themeId)
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to delete theme: ${error.message}`);
}

// =============================================================================
// Named Versions
// =============================================================================

async function saveNamedVersion(userId, docId, revisionId, name) {
  const { data, error } = await supabase
    .from('named_versions')
    .insert({ user_id: userId, doc_id: docId, revision_id: revisionId, name })
    .select()
    .single();

  if (error) throw new Error(`Failed to save version: ${error.message}`);
  return data;
}

async function getNamedVersions(userId, docId) {
  const { data, error } = await supabase
    .from('named_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('doc_id', docId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get versions: ${error.message}`);
  return data;
}

module.exports = {
  supabase,
  getOrCreateUser,
  getUserProfile,
  updateUserProfile,
  saveExportHistory,
  getExportHistory,
  getWritingStats,
  upsertDailyStats,
  getWritingStreak,
  saveCustomTheme,
  getUserThemes,
  deleteCustomTheme,
  saveNamedVersion,
  getNamedVersions,
};
