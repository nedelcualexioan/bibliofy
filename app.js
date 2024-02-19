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

const Message = require(__dirname + "/models/Message.js");
const User = require(__dirname + "/models/User.js");
const Book = require(__dirname + "/models/Book.js");

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

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/account", async (req, res) => {
  if (req.isAuthenticated()) {
    const user = await User.findOne({ _id: req.user._id });
    res.render("account", { user: user });
  } else {
    res.redirect("/api/auth/login");
  }
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

  const transporter = nodemailer.createTransport({
    host: "protonmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Feedback response " + name,
      text: message,
    });
    console.log("Email sent successfully");
    req.flash("details", "Email sent successfully");
  } catch (error) {
    console.error(error);
    req.flash("details", "An unexpected error occurred. Please try again");
  }

  res.redirect("/contact");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
