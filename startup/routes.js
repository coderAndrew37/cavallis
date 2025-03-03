const users = require("../routes/users");
const products = require("../routes/products");
const orders = require("../routes/orders");
const reviews = require("../routes/reviews");
const distributors = require("../routes/distributors");
const blogPosts = require("../routes/blogPost");
const subscriptions = require("../routes/subscriptions");
const cart = require("../routes/cart");

module.exports = function (app) {
  app.use("/api/users", users);
  app.use("/api/products", products);
  app.use("/api/orders", orders);
  app.use("/api/reviews", reviews);
  app.use("/api/distributors", distributors);
  app.use("/api/blog-posts", blogPosts);
  app.use("/api/subscriptions", subscriptions);
  app.use("/api/cart", cart);
};
