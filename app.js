require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const flash = require("express-flash");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { forEach } = require("lodash");

const Message = require(__dirname + "/models/Message.js");
const User = require(__dirname + "/models/User.js");
const Book = require(__dirname + "/models/Book.js");
const Order = require(__dirname + "/models/Order.js");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(express.json());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.vyaefh3.mongodb.net/libraryDB`,
);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const api = require(__dirname + "/routes/index.js")(passport);
app.use("/api", api);

function getSentences(text) {
  const sentenceRegex = /[^.!?]+[.!?]+/g;

  const sentences = text.match(sentenceRegex);

  const firstSentences = sentences.slice(0, 4);

  return firstSentences.join("");
}

app.get("/", async (req, res) => {
  const books = await Book.find({}).limit(7);

  books.forEach((book) => {
    book.description = getSentences(book.description);
  });

  res.render("index", {
    books: books,
  });
});

function formatDate(date) {
  const expirationDate = new Date(date);
  expirationDate.setDate(expirationDate.getDate() + 4);

  const options = { year: "numeric", month: "short", day: "numeric" };
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const formattedDate = formatter.format(expirationDate);

  return formattedDate;
}

app.get("/donate", (req, res) => {
  res.render("service-info");
});

app.post("/account/details", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await User.findOne({ _id: req.user._id });
    user.username = req.body.username;
    user.email = req.body.email;
    user.phone_number = req.body.phone_number;
    user.address = req.body.address;
    user.save();

    req.flash("details", "Account details updated successfully.");

    res.redirect("/account");
  } else {
    res.redirect("/api/auth/login");
  }
});

app.post("/account/password", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id });

    user.changePassword(
      req.body.currentPassword,
      req.body.newPassword,
      function (err) {
        if (err) {
          req.flash("error", "Password is incorrect");
        } else {
          req.flash("success", "Password changed successfully.");
        }
        res.redirect("/account");
      },
    );
  } catch (err) {
    console.log(err);
    req.flash("error", "An unexpected error occurred. Please try again");
    res.redirect("/account");
  }
});

app.get("/account", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await User.findOne({ _id: req.user._id });
    const orders = await Order.find({ user: user._id }).populate(
      "products.product",
    );
    res.render("account", {
      user: user,
      orders: orders,
      formatDate: formatDate,
    });
  } else {
    res.redirect("/api/auth/login");
  }
});

app.post("/account/plan", async (req, res) => {
  const plan = req.body.plan;

  const user = await User.findOne({ _id: req.user._id });

  user.membership = plan;

  await user.save();
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/cart/remove", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await User.findOne({ _id: req.user._id }).populate(
      "cart.products.product",
    );

    const bookId = req.body.bookId;

    user.cart.products.forEach((prod) => {
      if (prod.product._id == bookId) {
        const index = user.cart.products.indexOf(prod);
        user.cart.products.splice(index, 1);
      }
    });

    await user.save();

    const totalPrice = user.cart.totalPrice;
    const totalProducts = user.cart.totalProducts;

    res.json({
      totalPrice,
      totalProducts,
    });
  } else {
    res.sendStatus(401);
  }
});

app.post("/cart/order", async (req, res) => {
  if (req.isAuthenticated()) {
    const selectedOption = parseInt(req.body["options-base"]);
    const user = await User.findOne({ _id: req.user._id });
    const totalCart = user.cart.totalProducts;

    if (totalCart === 0) {
      req.flash("error", "You have no books in your cart");
      res.redirect("/cart");
      return;
    }
    if (user.membership === "Free") {
      if (totalCart > 3) {
        req.flash("error", "Upgrade your membership to borrow more books");
        res.redirect("/cart");
        return;
      } else {
        const orders = await Order.find({ user: user._id });
        let totalProducts = 0;

        for (const order of orders) {
          const currentDate = new Date();
          const timeDifference =
            currentDate.getTime() - order.createdAt.getTime();
          const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
          if (daysDifference < 30) {
            totalProducts += order.totalProducts;
          }
        }

        if (totalProducts + user.cart.totalProducts > 3) {
          req.flash("error", "Upgrade your membership to borrow more books");
          res.redirect("/cart");
          return;
        }

        const { firstName, lastName, address, country, city, zip } = req.body;

        const order = new Order({
          user: user._id,
          firstName: firstName,
          lastName: lastName,
          address: address,
          country: country,
          city: city,
          zip: zip,
          products: user.cart.products,
          pickupPoint: selectedOption,
        });

        await order.save();

        user.cart.products = [];
      }
    } else if (user.membership === "Pro") {
      if (totalCart > 5) {
        req.flash("error", "Upgrade your membership to borrow more books");
        res.redirect("/cart");
        return;
      } else {
        const orders = await Order.find({ user: user._id });
        let totalProducts = 0;

        for (const order of orders) {
          const currentDate = new Date();
          const timeDifference =
            currentDate.getTime() - order.createdAt.getTime();
          const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
          if (daysDifference < 30) {
            totalProducts++;
          }
        }

        if (totalProducts + user.cart.totalProducts > 5) {
          req.flash("error", "Upgrade your membership to borrow more books");
          res.redirect("/cart");
          return;
        }

        const { firstName, lastName, address, country, city, zip } = req.body;

        const order = new Order({
          user: user._id,
          firstName: firstName,
          lastName: lastName,
          address: address,
          country: country,
          city: city,
          zip: zip,
          products: user.cart.products,
        });

        await order.save();
      }
    } else {
      const { firstName, lastName, address, country, city, zip } = req.body;

      const order = new Order({
        user: user._id,
        firstName: firstName,
        lastName: lastName,
        address: address,
        country: country,
        city: city,
        zip: zip,
        products: user.cart.products,
      });

      await order.save();
    }

    user.cart.products = [];
    await user.save();

    res.redirect("/account");
  }
});

app.get("/cart", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await User.findOne({ _id: req.user._id }).populate(
      "cart.products.product",
    );

    res.render("cart", {
      user: user,
    });
  } else {
    res.redirect("/api/auth/login");
  }
});

app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  const msg = new Message({
    name: name,
    email: email,
    message: message,
  });
  await msg.save();

  async function sendEmail(to, subject, body) {
    const transporter = nodemailer.createTransport({
      host: "127.0.0.1",
      port: 1025,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: to,
      subject: subject,
      text:
        `Dear ${name}, \n\nThank you for your message. We gave received it and will get back to you shortly. \n\nBest regards,\nBibliofy\n\n` +
        body,
    });
  }

  sendEmail(email, "Message received", message);

  res.redirect("/contact");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
