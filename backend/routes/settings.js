// backend/routes/settings.js
//
// Public-facing endpoint for hotel settings that guests' UI needs:
// Wi-Fi credentials, check-in/out times, contact email, bank info, etc.
// Internal/operational fields (autoApprove, emailNotifications, maxAdvanceDays)
// are NOT exposed here. Use the admin endpoint for those.

const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const settingsService = require("../services/settings");

// GET /settings — authenticated guests only.
router.get("/", requireAuth, async (req, res) => {
  try {
    const s = await settingsService.getSettings();
    return res.json(settingsService.toPublic(s));
  } catch (err) {
    console.error("settings/GET error:", err);
    return res.status(500).json({ error: "Failed to load settings." });
  }
});

module.exports = router;
