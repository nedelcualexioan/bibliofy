module.exports = (passport) => {
  const express = require("express");
  const router = express.Router();
  const User = require("../models/User");
  
  router.get("/login", (req, res) => {
    res.render("sign-in", { errors: req.flash("error") });
  });
  
  router.post("/login", async (req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
  
    req.login(user, (err) => {
      if (err) {
        req.flash("error", "Username or password is incorrect.");
        res.redirect("/api/auth/login");
      } else {
        passport.authenticate("local", function (err, user, info) {
          if (err || !user) {
            req.flash("error", "Username or password is incorrect.");
            res.redirect("/api/auth/login");
          } else {
            res.redirect("/");
          }
        })(req, res, function () {
          res.redirect("/");
        });
      }
    });
  });
  
  router.get("/register", (req, res) => {
    res.render("register", { errors: req.flash("error") });
  });
  
  router.post("/register", async (req, res) => {
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
    });
  
    if (req.body.email.length === 0) {
      req.flash("error", "Please enter an email");
      res.redirect("/api/auth/register");
    } else {
      const foundUser = await User.findOne({ email: req.body.email });
  
      if (foundUser === null) {
        User.register(newUser, req.body.password, function (err, user) {
          if (err) {
            req.flash("error", err.message);
            res.redirect("/api/auth/register");
          } else {
            passport.authenticate("local")(req, res, function () {
              res.redirect("/");
            });
          }
        });
      } else {
        req.flash("error", "User with given email already exists");
        res.redirect("/api/auth/register");
      }
    }
  });

  return router;
}