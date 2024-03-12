const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  books: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  cart: {
    products: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
          },
          quantity: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
  },
  phone_number: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  membership: {
    type: String,
    default: "Free"
  }
});

userSchema.virtual("cart.totalProducts").get(function () {
  let totalBooks = 0;

  this.cart.products.forEach((product) => {
    totalBooks += product.quantity;
  });

  return totalBooks;
});

userSchema.virtual("cart.totalPrice").get(function () {
  if (this.cart == undefined || this.cart.products.length == 0) {
    return 0;
  }

  let totalPrice = 0;

  this.cart.products.forEach((product) => {
    totalPrice += product.product.price * product.quantity;
  });

  return totalPrice;
});

userSchema.plugin(passportLocalMongoose, {
  selectFields: "username email",
  errorMessages: {
    MissingPasswordError: "Please enter a password",
    MissingUsernameError: "Please enter a username",
  },
});

module.exports = mongoose.model("User", userSchema);
