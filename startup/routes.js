const users = require("../routes/users");
const products = require("../routes/products");
const reviews = require("../routes/reviews");
const distributors = require("../routes/distributors");
const blogPosts = require("../routes/blogPost");
const subscriptions = require("../routes/subscriptions");
const cart = require("../routes/cart");
const userOrders = require("../routes/userOrders");
const adminOrders = require("../routes/adminOrders");
const newsletter = require("../routes/newsletter");
const contact = require("../routes/contact");
const adminUsersRoutes = require("../routes/adminUsers");
const adminAnalyticsRoutes = require("../routes/adminTrends");
const adminContentRoutes = require("../routes/adminContent");
const referral = require("../routes/refferals");
const Chatbot = require("../routes/chatbot");
const search = require("../routes/search");
const notifications = require("../routes/Notifications");
module.exports = function (app) {
  app.use("/api/auth", users);
  app.use("/api/products", products);
  app.use("/api/reviews", reviews);
  app.use("/api/distributors", distributors);
  app.use("/api/blog-posts", blogPosts);
  app.use("/api/subscriptions", subscriptions);
  app.use("/api/cart", cart);
  app.use("/api/user/orders", userOrders);
  app.use("/api/admin/orders", adminOrders);
  app.use("/api/newsletter", newsletter);
  app.use("/api/contact", contact);
  app.use("/api/admin/users", adminUsersRoutes);
  app.use("/api/admin/analytics", adminAnalyticsRoutes);
  app.use("/api/admin/content", adminContentRoutes);
  app.use("/api/refferal", referral);
  app.use("/api/chatbot", Chatbot);
  app.use("/api/search", search);
  app.use("/api/notifications", notifications);
};
