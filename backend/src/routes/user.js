const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getWritingStats,
  upsertDailyStats,
  getWritingStreak,
} = require('../services/supabaseClient');

/**
 * GET /user/profile
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.id);
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile', details: error.message });
  }
});

/**
 * PATCH /user/profile
 */
router.patch('/profile', async (req, res) => {
  try {
    const { display_name, daily_word_goal } = req.body;
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (daily_word_goal !== undefined) updates.daily_word_goal = parseInt(daily_word_goal);

    const profile = await updateUserProfile(req.user.id, updates);
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

/**
 * GET /user/writing-stats?start=2026-01-01&end=2026-02-28
 */
router.get('/writing-stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end || new Date().toISOString().split('T')[0];

    const stats = await getWritingStats(req.user.id, startDate, endDate);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats', details: error.message });
  }
});

/**
 * POST /user/writing-stats
 * Body: { date, wordCount, sprintMinutes }
 */
router.post('/writing-stats', async (req, res) => {
  try {
    const { date, wordCount, sprintMinutes } = req.body;
    const today = date || new Date().toISOString().split('T')[0];

    const stat = await upsertDailyStats(req.user.id, today, wordCount || 0, sprintMinutes || 0);
    res.json({ stat });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save stats', details: error.message });
  }
});

/**
 * GET /user/streak
 */
router.get('/streak', async (req, res) => {
  try {
    const streak = await getWritingStreak(req.user.id);
    res.json({ streak });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get streak', details: error.message });
  }
});

module.exports = router;
