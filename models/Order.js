const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    firstName: String,
    lastName: String,
    address: String,
    country: String,
    city: String,
    zip: String,
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Book'
            },
            quantity: Number
        }
    ],
    pickupPoint: Number,
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        default: 'Processing'
    }
});

orderSchema.virtual("totalProducts").get(function () {
    let totalProducts = 0;

    this.products.forEach((product) => {
        totalProducts += product.quantity;
    });

    return totalProducts;
});

module.exports = mongoose.model('Order', orderSchema);