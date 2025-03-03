const users = require("../routes/users");
const products = require("../routes/products");
const orders = require("../routes/orders");
const reviews = require("../routes/reviews");
const distributors = require("../routes/distributors");
const blogPosts = require("../routes/blogPosts");
const subscriptions = require("../routes/subscriptions");

module.exports = function (app) {
  app.use("/users", users);
  app.use("/products", products);
  app.use("/orders", orders);
  app.use("/reviews", reviews);
  app.use("/distributors", distributors);
  app.use("/blog-posts", blogPosts);
  app.use("/subscriptions", subscriptions);
};
