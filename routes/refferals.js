const express = require("express");
const { User } = require("../models/user");
const { Order } = require("../models/order");
const auth = require("../middleware/auth");

const router = express.Router();

// ✅ Opt-in to the Referral Program
router.post("/opt-in", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.referralCode) {
      return res
        .status(400)
        .json({ message: "You are already in the referral program" });
    }

    user.referralCode = generateReferralCode();
    await user.save();

    res.json({
      message: "You have joined the referral program!",
      referralCode: user.referralCode,
    });
  } catch (error) {
    console.error("Error opting into referral program:", error);
    res.status(500).json({ message: "Failed to opt into referral program" });
  }
});

// ✅ Get Referral Stats
router.get("/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const referredUsers = await User.find({ referredBy: user.referralCode });

    res.json({
      totalReferrals: referredUsers.length,
      totalEarnings: user.referralRewards,
      withdrawableBalance: user.withdrawableBalance,
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    res.status(500).json({ message: "Failed to fetch referral stats" });
  }
});

// ✅ Withdraw Earnings
router.post("/withdraw", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.withdrawableBalance < 500) {
      return res
        .status(400)
        .json({ message: "You need at least KSh 500 to withdraw" });
    }

    user.withdrawableBalance = 0;
    await user.save();

    res.json({
      message: "Withdrawal successful! Funds will be processed soon.",
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({ message: "Failed to process withdrawal" });
  }
});

// ✅ Function to Generate a Unique Referral Code
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // Example: "A1B2C3"
}

module.exports = router;
