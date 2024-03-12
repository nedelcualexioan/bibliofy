const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const User = require("../models/User");
const _ = require("lodash");

router.use(async (req, res, next) => {
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

      const user = await User.findOne({ _id: userId });

      const existingProduct = user.cart.products.find((prod) => prod.product.equals(bookId));

      existingProduct
        ? existingProduct.quantity++
        : user.cart.products.push({ product: bookId, quantity: 1 });

      await user.save();
      const cartCount = user.cart.totalProducts;

      res.json({ cartCount });
    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/search", async (req, res) => {
  try {
    const title = req.body.bookTitle;

    const regex = new RegExp(title, 'i');
  
    const books = await Book.find({title: {$regex: regex}});
  
    res.render("books", {books: books, user: req.user});
  }
  catch (err) {
    console.log(err.message);
  }
 
});

router.get("/:category", async (req, res) => {
  const category = _.capitalize(req.params.category);
  const books = await Book.find({ category: category });

  res.render("books", {
    books: books,
    user: req.user,
  });
});

router.post("/filter", async (req, res) => {
  const { year, author, price } = req.body;

  const query = {};

  if (year !== undefined && year.length !== 0) {
    query.year = parseInt(year);
  }
  if (author !== undefined && author.length !== 0) {
    query.author = { $regex: author, $options: "i" };
  }
  if (price !== 0 && price !== undefined) {
    switch (parseInt(req.body.price)) {
      case 1:
        query.price = { $gte: 0, $lte: 10 };
        break;
      case 2:
        query.price = { $gte: 10, $lte: 20 };
        break;
      case 3:
        query.price = { $gte: 20, $lte: 40 };
        break;
      case 4:
        query.price = { $gte: 40 };
        break;
    }
  }
  const books = await Book.find(query);
  res.render("books", {
    books: books,
    user: req.user,
  });
});

router.get("/", async (req, res) => {
  const books = await Book.find({});

  res.render("books", {
    books: books,
    user: req.user,
  });
});

module.exports = router;
