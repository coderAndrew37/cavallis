const express = require("express");
const auth = require("../middleware/auth");
const { User } = require("../models/user");

const router = express.Router();

// ✅ Get Referral Summary
router.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "referralCode referralRewards withdrawableBalance"
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch referral data" });
  }
});

// ✅ Withdraw Request
router.post("/withdraw", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.withdrawableBalance < 1000) {
      return res
        .status(400)
        .json({ message: "Minimum withdrawal is KSh 1000" });
    }

    user.withdrawableBalance = 0; // Reset balance after withdrawal
    await user.save();

    res.json({ message: "Withdrawal request sent!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

module.exports = router;
