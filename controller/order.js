const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");

const {
  // authenticateUser,
  // validateAddToCart,
  // validateRemoveFromCart,
  // cartLimiter,
  sanitizeInputs,
} = require("../middleware/cartM");




router.post(
  "/create-order",
  sanitizeInputs,
  catchAsyncErrors(async (req, res, next) => {
    const { cart, shippingAddress, user, totalPrice } = req.body;

    const newOrder = new Order({
      cart,
      shippingAddress,
      user,
      totalPrice,
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  })
);


// get all orders of user
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);





router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.params.shopId; // Get the shopId from the URL params

      // Fetch all orders
      const orders = await Order.find().sort({ createdAt: -1 });

      // Filter orders based on matching shopId in any item in the cart
      const filteredOrders = await Promise.all(
        orders.map(async (order) => {
          // Check each item in the order's cart to see if it belongs to the shopId
          const matchingProducts = await Promise.all(
            order.cart.map(async (item) => {
              try {
                // Fetch product details for each item in the cart
                const product = await Product.findById(item.id); // Assume each item in the cart has 'id'
                if (product && product.shopId.toString() === shopId) {
                  return true; // If product's shopId matches, return true
                }
              } catch (error) {
                console.error(`Failed to fetch product with id: ${item.id}`, error);
              }
              return false; // Return false if the product's shopId does not match
            })
          );

          // If any product in the cart matches the shopId, include the order
          if (matchingProducts.includes(true)) {
            return order; // Include the order if at least one product matches
          }

          return null; // Exclude the order if no products match
        })
      );

      // Remove null values (orders that don't match)
      const finalOrders = filteredOrders.filter((order) => order !== null);

      res.status(200).json({
        success: true,
        orders: finalOrders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);





// update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      if (req.body.status === "Transferred to delivery partner") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * .10;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
      });

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock -= qty;
        product.sold_out += qty;

        await product.save({ validateBeforeSave: false });
      }

      async function updateSellerInfo(amount) {
        const seller = await Shop.findById(req.seller.id);
        
        seller.availableBalance = amount;

        await seller.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// give a refund ----- user
router.put(
  "/order-refund/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Order Refund Request successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// accept the refund ---- seller
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save();

      res.status(200).json({
        success: true,
        message: "Order Refund successfull!",
      });

      if (req.body.status === "Refund Success") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock += qty;
        product.sold_out -= qty;

        await product.save({ validateBeforeSave: false });
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all orders --- for admin
router.get(
  "/admin-all-orders",
  // isAuthenticated,
  // isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Add product to cart
router.post("/add-to-cart", async (req, res) => {
  try {
      const { user, product } = req.body;

      // Find an existing order for the user
      let order = await Order.findOne({ "user.id": user.id, status: "Processing" });

      if (!order) {
          // If no order exists, create a new one
          order = new Order({
              cart: [product],
              shippingAddress: {},
              user,
              totalPrice: product.price, // Initial total price
          });
      } else {
          // If an order exists, update the cart and total price
          order.cart.push(product);
          order.totalPrice += product.price;
      }

      await order.save();
      res.status(200).json({ success: true, message: "Product added to cart", order });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});


router.get("/cart/:userId", async (req, res) => {
  try {
      const { userId } = req.params;

      // Find the user's cart
      const order = await Order.findOne({ "user.id": userId, status: "Processing" });

      if (!order) {
          return res.status(404).json({ success: false, message: "Cart not found" });
      }

      res.status(200).json({ success: true, cart: order.cart });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
