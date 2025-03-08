const express = require("express");
const { User } = require("../models/user");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * ✅ Fetch Notifications for Logged-in User
 * GET /api/notifications
 */
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("notifications");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * ✅ Mark a Notification as Read
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const notification = user.notifications.id(req.params.id);
    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    notification.isRead = true;
    await user.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

/**
 * ✅ Mark All Notifications as Read
 * PATCH /api/notifications/read-all
 */
router.patch("/read-all", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.notifications.forEach((notif) => (notif.isRead = true));
    await user.save();

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

module.exports = router;
