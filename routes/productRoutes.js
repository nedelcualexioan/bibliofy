const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const User = require("../models/User");

router.use(async function (req, res, next) {
  if (req.isAuthenticated()) {
    try {
      const user = await User.findOne({ _id: req.user._id });
      req.user = user;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    req.user = null;
    next();
  }
});

router.post("/add", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const userId = req.user._id;
      const bookId = req.body.bookId;
      const quantity = parseInt(req.body.quantity);

      const user = await User.findOne({ _id: userId });

      if (!user.cart.products) {
        user.cart.products = [];
      }

      const existingProduct = user.cart.products.find((prod) =>
        prod.product.equals(bookId),
      );

      console.log(quantity);

      existingProduct
        ? (existingProduct.quantity += quantity)
        : user.cart.products.push({ product: bookId, quantity: quantity });

      await user.save();

      const cartCount = user.cart.totalProducts;

      res.json({ cartCount });
    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    const category = await Book.find({
      category: book.category,
      title: { $ne: book.title },
    }).limit(4);
    res.render("product", {
      book: book,
      category: category,
      user: req.user,
    });
  } catch (error) {
    // Handle errors appropriately, e.g., send an error response
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
