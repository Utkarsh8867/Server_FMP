


const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  validateAddToCart,
  validateRemoveFromCart,
  cartLimiter,
  sanitizeInputs,
} = require("../middleware/cartM");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const mongoose = require("mongoose");
const Product = require("../model/product");
const Cart = require("../model/cart");

// Add product to cart
router.post(
  "/add-to-cart",
  // authenticateUser,
  // cartLimiter,
  sanitizeInputs,
  validateAddToCart,
  catchAsyncErrors(async (req, res, next) => {
    const { userId, productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return next(new ErrorHandler("Product not found.", 404));

    const productPrice = product.discountPrice || product.originalPrice;
    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity, price: productPrice });
      }

      cart.totalPrice += quantity * productPrice;
      cart.updatedAt = Date.now();
    } else {
      cart = new Cart({
        userId,
        items: [{ productId, quantity, price: productPrice }],
        totalPrice: quantity * productPrice,
      });
    }

    await cart.save();

    res.status(200).json({ success: true, message: "Product added to cart.", cart });
  })
);

// Get cart by user ID
router.get(
  "/cart/:userId",
  // authenticateUser,
  catchAsyncErrors(async (req, res, next) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ErrorHandler("Invalid userId provided.", 400));
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) return next(new ErrorHandler("Cart not found.", 404));

    res.status(200).json({ success: true, cart });
  })
);




router.post(
  "/remove-from-cart",
  sanitizeInputs,
  catchAsyncErrors(async (req, res, next) => {
    const { userId, productId } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) return next(new ErrorHandler("Cart not found.", 404));

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return next(new ErrorHandler("Product not found in cart.", 404));
    }

    cart.items.splice(itemIndex, 1); // Remove product from cart
    cart.totalPrice = cart.items.reduce((acc, item) => acc + item.quantity * item.price, 0); // Recalculate total price

    await cart.save();

    res.status(200).json({ success: true, message: "Product removed from cart.", cart });
  })
);







router.post(
  "/update-quantity",
  sanitizeInputs,
  // validateUpdateQuantity,
  catchAsyncErrors(async (req, res, next) => {
    const { userId, productId, quantity } = req.body;

    if (quantity < 1) return next(new ErrorHandler("Quantity must be at least 1.", 400));

    const product = await Product.findById(productId);
    if (!product) return next(new ErrorHandler("Product not found.", 404));

    const productPrice = product.discountPrice || product.originalPrice;

    let cart = await Cart.findOne({ userId });
    if (!cart) return next(new ErrorHandler("Cart not found.", 404));

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return next(new ErrorHandler("Product not found in cart.", 404));
    }

    const oldQuantity = cart.items[itemIndex].quantity;
    cart.items[itemIndex].quantity = quantity;

    cart.totalPrice = cart.totalPrice - oldQuantity * productPrice + quantity * productPrice;

    cart.updatedAt = Date.now();

    await cart.save();

    res.status(200).json({ success: true, message: "Product quantity updated.", cart });
  })
);


module.exports = router;
