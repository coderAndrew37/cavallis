require("dotenv").config();
const mongoose = require("mongoose");
//load dotenv config

const { Product } = require("./models/product"); // Adjust the path accordingly

const seedProducts = [
  {
    name: "POWER-BLEND",
    description:
      "Detoxifies the body, improves circulation, enhances libido, and boosts energy.",
    price: 100,
    category: "Detox",
    benefits: [
      "Removes toxins",
      "Improves blood circulation",
      "Enhances sexual health",
      "Boosts energy",
      "Supports reproductive health",
    ],
    ingredients: ["Herbal Extracts", "Essential Nutrients"],
    images: ["power-blend.jpg"],
    stock: 100,
    isBestseller: true,
    discountBadge: "",
  },
  {
    name: "TUMBO-CUT",
    description:
      "Burns stubborn fat, improves digestion, and supports metabolism.",
    price: 300,
    category: "Weight Loss",
    benefits: [
      "Supports weight loss",
      "Speeds up metabolism",
      "Reduces appetite",
      "Boosts energy",
    ],
    ingredients: ["Fat-burning Herbs", "Digestive Enzymes"],
    images: ["tumbo-cut.jpg"],
    stock: 80,
    isBestseller: false,
    discountBadge: "Popular",
  },
  {
    name: "FEMI-BLEND",
    description:
      "Balances hormones, supports fertility, and enhances emotional well-being.",
    price: 130,
    category: "Women’s Health",
    benefits: [
      "Balances hormones",
      "Enhances fertility",
      "Boosts energy",
      "Improves libido",
    ],
    ingredients: ["Natural Herbs", "Vital Nutrients"],
    images: ["femi-blend.jpg"],
    stock: 60,
    isBestseller: true,
    discountBadge: "Best Seller",
  },
  {
    name: "DIABEX",
    description:
      "Regulates blood sugar levels and supports diabetes management.",
    price: 13,
    category: "Other",
    benefits: [
      "Regulates blood sugar",
      "Improves insulin function",
      "Boosts energy",
      "Promotes healthy weight",
    ],
    ingredients: ["Diabetes-friendly Herbs", "Minerals"],
    images: ["diabex.jpg"],
    stock: 50,
    isBestseller: false,
    discountBadge: "",
  },

  {
    name: "Detox Tea",
    description: "A refreshing tea to cleanse your body.",
    price: 1500,
    category: "Detox",
    benefits: ["Cleanses the body", "Boosts energy"],
    ingredients: ["Green tea", "Mint"],
    images: ["detox-tea.jpg"],
    stock: 10,
    isBestseller: true,
    discountBadge: "10% OFF",
  },
  {
    name: "Weight Loss Supplement",
    description: "Helps in burning fat and losing weight.",
    price: 2500,
    category: "Weight Loss",
    benefits: ["Burns fat", "Boosts metabolism"],
    ingredients: ["Garcinia Cambogia", "Green Coffee Extract"],
    images: ["weight-loss-supplement.jpg"],
    stock: 5,
    isBestseller: false,
    discountBadge: "",
  },
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB...");

    await Product.deleteMany({});
    console.log("Existing products removed.");

    await Product.insertMany(seedProducts);
    console.log("New products inserted successfully!");

    mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

seedDB();
